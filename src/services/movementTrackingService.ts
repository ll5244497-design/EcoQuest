// Real-Time User Movement Tracking & Dynamic Activity Coaching
// Tracks if user is at rest or moving, calculates speed, distance, steps, and generates movement tasks

export type MovementState = 'AT_REST' | 'MOVING';

export interface MovementTelemetry {
  state: MovementState;
  speedMps: number;
  speedKmh: number;
  distanceCoveredMeters: number;
  stepCount: number;
  headingDegrees: number;
  timeAtRestSeconds: number;
  timeMovingSeconds: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  isGpsActive: boolean;
  isSimulating?: boolean;
  breadcrumbs?: Array<{ lat: number; lng: number }>;
  localityName?: string;
  activeMovementTask: string | null;
  lastStateChange: number;
}

type MovementListener = (telemetry: MovementTelemetry) => void;
type VerbalPromptTrigger = (promptText: string, reason: 'RESTING_NUDGE' | 'PACE_CONFIRMATION' | 'TASK_ASSIGNED') => void;

class MovementTrackingService {
  private watchId: number | null = null;
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null;
  private intervalTimer: any = null;
  private listeners: Set<MovementListener> = new Set();
  private verbalPromptTriggers: Set<VerbalPromptTrigger> = new Set();

  private lastLat: number | null = null;
  private lastLng: number | null = null;
  private lastTimestamp: number = Date.now();
  private stationaryTicks: number = 0;
  private movingTicks: number = 0;
  private lastVerbalNudgeTime: number = 0;

  private isExpeditionActive: boolean = false;
  private isSimulating: boolean = false;
  private simSpeedMps: number = 1.4;
  private simTargetLat: number | null = null;
  private simTargetLng: number | null = null;
  private simHeading: number = 45;
  private breadcrumbs: Array<{ lat: number; lng: number }> = [];

  private telemetry: MovementTelemetry = {
    state: 'AT_REST',
    speedMps: 0,
    speedKmh: 0,
    distanceCoveredMeters: 0,
    stepCount: 0,
    headingDegrees: 0,
    timeAtRestSeconds: 0,
    timeMovingSeconds: 0,
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
    isGpsActive: false,
    isSimulating: false,
    breadcrumbs: [],
    activeMovementTask: 'Put phone in pocket and take 20 paces forward to begin tracking.',
    lastStateChange: Date.now(),
  };

  constructor() {
    this.startTracking();
  }

  public getTelemetry(): MovementTelemetry {
    return { ...this.telemetry };
  }

  public subscribe(listener: MovementListener): () => void {
    this.listeners.add(listener);
    listener(this.getTelemetry());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onVerbalPrompt(trigger: VerbalPromptTrigger): () => void {
    this.verbalPromptTriggers.add(trigger);
    return () => {
      this.verbalPromptTriggers.delete(trigger);
    };
  }

  private notify() {
    const data = this.getTelemetry();
    this.listeners.forEach((l) => l(data));
  }

  private triggerVerbalNudge(prompt: string, reason: 'RESTING_NUDGE' | 'PACE_CONFIRMATION' | 'TASK_ASSIGNED') {
    this.verbalPromptTriggers.forEach((cb) => cb(prompt, reason));
  }

  public startTracking() {
    if (typeof window === 'undefined') return;

    // Immediately trigger high-accuracy location request to prompt user permission and get exact position
    this.requestCurrentLocation().catch((err) => {
      console.warn('Initial location request notice:', err);
    });

    // 1. Geolocation Watch Position
    if ('geolocation' in navigator) {
      try {
        this.watchId = navigator.geolocation.watchPosition(
          (pos) => this.handleGpsUpdate(pos),
          (err) => {
            console.warn('Geolocation watch notice:', err.message);
            this.telemetry.isGpsActive = false;
            this.notify();
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
          }
        );
      } catch (e) {
        console.warn('Failed to start geolocation watch:', e);
      }
    }

    // 2. Accelerometer Device Motion for Step/Rest Detection
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      let lastMag = 9.8;
      this.motionHandler = (event: DeviceMotionEvent) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
        const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
        const delta = Math.abs(mag - lastMag);
        lastMag = mag;

        // Step peak threshold
        if (delta > 2.2) {
          this.telemetry.stepCount += 1;
        }
      };

      try {
        window.addEventListener('devicemotion', this.motionHandler, { passive: true });
      } catch (_) {}
    }

    // 3. Periodic cadence timer (evaluates rest vs moving state every second)
    this.intervalTimer = setInterval(() => {
      this.tickMovementState();
    }, 1000);
  }

  private handleGpsUpdate(pos: GeolocationPosition) {
    const { latitude, longitude, speed, heading, accuracy } = pos.coords;
    const now = pos.timestamp || Date.now();

    this.telemetry.latitude = latitude;
    this.telemetry.longitude = longitude;
    this.telemetry.accuracy = accuracy;
    this.telemetry.isGpsActive = true;

    if (heading !== null && !isNaN(heading)) {
      this.telemetry.headingDegrees = Math.round(heading);
    }

    // Calculate distance and speed delta
    if (this.lastLat !== null && this.lastLng !== null) {
      const dist = this.calculateHaversineDistance(
        this.lastLat,
        this.lastLng,
        latitude,
        longitude
      );

      const timeDeltaSeconds = Math.max(0.5, (now - this.lastTimestamp) / 1000);

      // If moved reasonably (filter out GPS jitter below 1.2m if accuracy is low)
      if (dist > 1.2 && dist < 100) {
        this.telemetry.distanceCoveredMeters += Math.round(dist);
      }

      let calculatedSpeed = dist / timeDeltaSeconds;
      if (speed !== null && !isNaN(speed) && speed >= 0) {
        calculatedSpeed = speed;
      }

      // Smooth speed
      const smoothedSpeed = Math.round(calculatedSpeed * 10) / 10;
      this.telemetry.speedMps = smoothedSpeed;
      this.telemetry.speedKmh = Math.round(smoothedSpeed * 3.6 * 10) / 10;
    }

    this.lastLat = latitude;
    this.lastLng = longitude;
    this.lastTimestamp = now;

    // Asynchronously resolve human readable locality if not set yet
    if (!this.telemetry.localityName) {
      this.fetchLocalityName(latitude, longitude);
    }

    this.notify();
  }

  /**
   * Prompts user and forces an immediate high-accuracy GPS fix
   */
  public async requestCurrentLocation(): Promise<{ lat: number; lng: number }> {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return { lat: this.telemetry.latitude, lng: this.telemetry.longitude };
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy, heading } = pos.coords;
          this.telemetry.latitude = latitude;
          this.telemetry.longitude = longitude;
          this.telemetry.accuracy = accuracy || 5;
          this.telemetry.isGpsActive = true;
          if (heading !== null && !isNaN(heading)) {
            this.telemetry.headingDegrees = Math.round(heading);
          }
          this.lastLat = latitude;
          this.lastLng = longitude;
          this.lastTimestamp = Date.now();

          await this.fetchLocalityName(latitude, longitude);
          this.notify();
          resolve({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.warn('Manual location request error:', err.message);
          resolve({ lat: this.telemetry.latitude, lng: this.telemetry.longitude });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Reverse geocodes coordinates to formatted address / locality name via server proxy
   */
  public async fetchLocalityName(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(`/api/maps/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.locality || data.formattedAddress) {
          const name = data.locality || data.formattedAddress;
          this.telemetry.localityName = name;
          this.notify();
          return name;
        }
      }
    } catch (e) {
      console.warn('Locality fetch error:', e);
    }
    const fallback = `${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`;
    if (!this.telemetry.localityName) {
      this.telemetry.localityName = fallback;
    }
    return fallback;
  }

  public setExpeditionActive(active: boolean) {
    this.isExpeditionActive = active;
    if (active) {
      this.lastVerbalNudgeTime = Date.now();
    }
  }

  private tickMovementState() {
    if (this.isSimulating) {
      // Advance coordinates along simulated trail
      let headingRad = (this.simHeading * Math.PI) / 180;
      if (this.simTargetLat !== null && this.simTargetLng !== null) {
        // Calculate bearing towards target
        const dLng = (this.simTargetLng - this.telemetry.longitude) * Math.PI / 180;
        const y = Math.sin(dLng) * Math.cos(this.simTargetLat * Math.PI / 180);
        const x = Math.cos(this.telemetry.latitude * Math.PI / 180) * Math.sin(this.simTargetLat * Math.PI / 180) -
                  Math.sin(this.telemetry.latitude * Math.PI / 180) * Math.cos(this.simTargetLat * Math.PI / 180) * Math.cos(dLng);
        const targetBearingDeg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        this.simHeading = targetBearingDeg;
        headingRad = (this.simHeading * Math.PI) / 180;

        const distToTarget = this.calculateHaversineDistance(
          this.telemetry.latitude,
          this.telemetry.longitude,
          this.simTargetLat,
          this.simTargetLng
        );
        if (distToTarget < 6) {
          this.simTargetLat = null;
          this.simTargetLng = null;
        }
      } else {
        // Natural wandering curve along a trail (+/- 2 degrees per sec)
        this.simHeading = (this.simHeading + (Math.sin(Date.now() / 8000) * 3) + 360) % 360;
        headingRad = (this.simHeading * Math.PI) / 180;
      }

      const metersPerSec = this.simSpeedMps;
      const metersToLat = 1 / 111111;
      const metersToLng = 1 / (111111 * Math.cos((this.telemetry.latitude * Math.PI) / 180));

      const dLat = Math.cos(headingRad) * metersPerSec * metersToLat;
      const dLng = Math.sin(headingRad) * metersPerSec * metersToLng;

      this.telemetry.latitude += dLat;
      this.telemetry.longitude += dLng;
      this.telemetry.headingDegrees = Math.round(this.simHeading);
      this.telemetry.speedMps = this.simSpeedMps;
      this.telemetry.speedKmh = Math.round(this.simSpeedMps * 3.6 * 10) / 10;
      this.telemetry.distanceCoveredMeters += Math.round(metersPerSec);
      this.telemetry.stepCount += Math.max(1, Math.round(metersPerSec * 1.3));
      this.telemetry.isSimulating = true;
      this.telemetry.state = 'MOVING';

      // Keep recent breadcrumbs trail for map visualization
      const currentPt = { lat: this.telemetry.latitude, lng: this.telemetry.longitude };
      this.breadcrumbs.push(currentPt);
      if (this.breadcrumbs.length > 250) {
        this.breadcrumbs.shift();
      }
      this.telemetry.breadcrumbs = [...this.breadcrumbs];
    }

    const isMoving = this.telemetry.speedMps >= 0.5;
    const previousState = this.telemetry.state;

    if (isMoving) {
      this.movingTicks += 1;
      this.stationaryTicks = 0;
      this.telemetry.timeMovingSeconds += 1;
      this.telemetry.state = 'MOVING';
    } else {
      this.stationaryTicks += 1;
      this.movingTicks = 0;
      this.telemetry.timeAtRestSeconds += 1;
      this.telemetry.state = 'AT_REST';
    }

    const now = Date.now();

    // State transition events - only trigger verbal audio nudges if expedition is active
    if (this.isExpeditionActive && previousState !== this.telemetry.state) {
      this.telemetry.lastStateChange = now;

      if (this.telemetry.state === 'MOVING') {
        // Transitioned to moving!
        if (now - this.lastVerbalNudgeTime > 45000) {
          this.lastVerbalNudgeTime = now;
          this.triggerVerbalNudge(
            `Good pace Scout! You are moving at ${this.telemetry.speedMps} meters per second. Maintain heading toward your objective.`,
            'PACE_CONFIRMATION'
          );
        }
      } else {
        // Transitioned to resting
        this.telemetry.activeMovementTask = this.getRandomMovementTask();
      }
    }

    // Rest alert: Only during an active expedition, after 60s at rest, and at most once every 90s
    if (
      this.isExpeditionActive &&
      this.telemetry.state === 'AT_REST' &&
      this.stationaryTicks >= 60 &&
      now - this.lastVerbalNudgeTime > 90000
    ) {
      this.lastVerbalNudgeTime = now;
      const task = this.getRandomMovementTask();
      this.telemetry.activeMovementTask = task;
      this.triggerVerbalNudge(
        `Explorer, you are paused at rest. Whenever you are ready, ${task.toLowerCase()}`,
        'RESTING_NUDGE'
      );
    }

    this.notify();
  }

  /**
   * Generates dynamic physical movement tasks
   */
  public getRandomMovementTask(): string {
    const tasks = [
      'Take 20 paces forward to scout the ground ahead.',
      'Walk 35 meters along the path toward the nearest tree canopy.',
      'Maintain an active stride for 30 seconds to reach the next coordinates.',
      'Head slightly to your left and walk 15 paces to inspect the foliage.',
      'Pick up your walking pace for 20 strides toward the open trail.',
      'Take 25 steps forward and listen for local bird calls in the canopy.',
    ];
    return tasks[Math.floor(Math.random() * tasks.length)];
  }

  public startSimulation(speedMps: number = 1.4) {
    this.isSimulating = true;
    this.simSpeedMps = speedMps;
    this.telemetry.isSimulating = true;
    this.telemetry.state = 'MOVING';
    this.telemetry.speedMps = speedMps;
    this.telemetry.speedKmh = Math.round(speedMps * 3.6 * 10) / 10;
    if (this.breadcrumbs.length === 0) {
      this.breadcrumbs.push({ lat: this.telemetry.latitude, lng: this.telemetry.longitude });
      this.telemetry.breadcrumbs = [...this.breadcrumbs];
    }
    this.notify();
  }

  public stopSimulation() {
    this.isSimulating = false;
    this.telemetry.isSimulating = false;
    this.telemetry.state = 'AT_REST';
    this.telemetry.speedMps = 0;
    this.telemetry.speedKmh = 0;
    this.notify();
  }

  public toggleSimulation(speedMps: number = 1.4): boolean {
    if (this.isSimulating) {
      this.stopSimulation();
      return false;
    } else {
      this.startSimulation(speedMps);
      return true;
    }
  }

  public isSimulatingWalk(): boolean {
    return this.isSimulating;
  }

  public setSimSpeed(speedMps: number) {
    this.simSpeedMps = Math.max(0.5, speedMps);
    if (this.isSimulating) {
      this.telemetry.speedMps = this.simSpeedMps;
      this.telemetry.speedKmh = Math.round(this.simSpeedMps * 3.6 * 10) / 10;
      this.notify();
    }
  }

  public teleportTo(lat: number, lng: number, localityName?: string) {
    this.telemetry.latitude = lat;
    this.telemetry.longitude = lng;
    if (localityName) {
      this.telemetry.localityName = localityName;
    } else {
      this.fetchLocalityName(lat, lng);
    }
    this.breadcrumbs.push({ lat, lng });
    if (this.breadcrumbs.length > 250) this.breadcrumbs.shift();
    this.telemetry.breadcrumbs = [...this.breadcrumbs];
    this.notify();
  }

  public walkTowards(targetLat: number, targetLng: number, speedMps: number = 1.4) {
    this.simTargetLat = targetLat;
    this.simTargetLng = targetLng;
    this.startSimulation(speedMps);
  }

  public simulateWalking() {
    this.toggleSimulation(1.4);
  }

  public simulateRest() {
    this.stopSimulation();
  }

  public assignNewMovementTask(): string {
    const newTask = this.getRandomMovementTask();
    this.telemetry.activeMovementTask = newTask;
    this.notify();
    this.triggerVerbalNudge(
      `New exploration task: ${newTask}`,
      'TASK_ASSIGNED'
    );
    return newTask;
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  public stopTracking() {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }
}

export const movementTrackingService = new MovementTrackingService();
