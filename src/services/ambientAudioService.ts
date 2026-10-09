// High-Fidelity Background Game Soundtrack & Soundscape Engine for EcoQuest
// Provides real recorded ambient game soundtracks (Gymnopédie No. 1 & 2, Clair de Lune)
// alongside relaxing procedural nature soundscapes with volume control, track switching,
// and auto-looping.

export interface SoundtrackTrack {
  id: string;
  title: string;
  artist: string;
  mood: string;
  src: string; // URL to audio file
  isProcedural?: boolean;
}

export const SOUNDTRACK_PLAYLIST: SoundtrackTrack[] = [
  {
    id: 'gymnopedie-1',
    title: 'Gymnopédie No. 1',
    artist: 'Erik Satie (Kevin MacLeod)',
    mood: 'Peaceful Forest Piano',
    src: '/audio/gymnopedie_peaceful.mp3',
  },
  {
    id: 'gymnopedie-2',
    title: 'Gymnopédie No. 2',
    artist: 'Erik Satie (Kevin MacLeod)',
    mood: 'Canopy Reflection',
    src: '/audio/gymnopedie_no2.mp3',
  },
  {
    id: 'clair-de-lune',
    title: 'Clair de Lune',
    artist: 'Claude Debussy',
    mood: 'Starlit Evening Forest',
    src: '/audio/clair_de_lune.ogg',
  },
  {
    id: 'nature-zen',
    title: 'Woodland Wind & Chimes',
    artist: 'EcoQuest Ambient Studio',
    mood: 'Organic Pentatonic Breeze',
    src: 'procedural',
    isProcedural: true,
  },
];

export interface AudioEngineState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number; // 0.0 to 1.0
  currentTrackIndex: number;
  currentTrack: SoundtrackTrack;
}

class AmbientAudioService {
  private audioElement: HTMLAudioElement | null = null;
  private isPlaying: boolean = false;
  private currentVolume: number = 0.65;
  private isMuted: boolean = false;
  private currentTrackIndex: number = 0;

  // Web Audio procedural backup
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private padGain: GainNode | null = null;
  private chimesGain: GainNode | null = null;
  private chimeTimer: any = null;
  private padOscs: OscillatorNode[] = [];

  private listeners: Set<(state: AudioEngineState) => void> = new Set();

  constructor() {
    try {
      const savedVol = localStorage.getItem('ecoquest_audio_volume');
      if (savedVol) this.currentVolume = parseFloat(savedVol);
      const savedMute = localStorage.getItem('ecoquest_audio_muted');
      if (savedMute) this.isMuted = savedMute === 'true';
      const savedTrack = localStorage.getItem('ecoquest_audio_track');
      if (savedTrack) {
        const idx = parseInt(savedTrack, 10);
        if (!isNaN(idx) && idx >= 0 && idx < SOUNDTRACK_PLAYLIST.length) {
          this.currentTrackIndex = idx;
        }
      }
    } catch {}

    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audioElement) return;
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.loop = true;
    this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;

    const track = SOUNDTRACK_PLAYLIST[this.currentTrackIndex];
    if (!track.isProcedural) {
      this.audioElement.src = track.src;
    }

    this.audioElement.addEventListener('ended', () => {
      this.nextTrack();
    });

    this.audioElement.addEventListener('error', (e) => {
      console.warn('Audio playback notice, falling back smoothly:', e);
      // Fallback to next track or procedural
      if (!this.isPlaying) return;
      this.startProceduralZen();
    });
  }

  public subscribe(cb: (state: AudioEngineState) => void) {
    this.listeners.add(cb);
    cb(this.getState());
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach((cb) => cb(s));
  }

  public getState(): AudioEngineState {
    return {
      isPlaying: this.isPlaying,
      isMuted: this.isMuted,
      volume: this.currentVolume,
      currentTrackIndex: this.currentTrackIndex,
      currentTrack: SOUNDTRACK_PLAYLIST[this.currentTrackIndex] || SOUNDTRACK_PLAYLIST[0],
    };
  }

  public async start(): Promise<void> {
    this.initAudioElement();
    const track = SOUNDTRACK_PLAYLIST[this.currentTrackIndex];

    if (track.isProcedural) {
      this.stopHtmlAudio();
      this.startProceduralZen();
      this.isPlaying = true;
      this.notify();
      return;
    }

    if (this.audioElement) {
      this.stopProceduralZen();
      if (!this.audioElement.src || !this.audioElement.src.includes(track.src)) {
        this.audioElement.src = track.src;
      }
      this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;
      try {
        await this.audioElement.play();
        this.isPlaying = true;
        this.notify();
      } catch (err) {
        console.warn('Audio play restricted by browser user gesture, standby:', err);
        // Fallback to Web Audio which handles user interaction well
        this.startProceduralZen();
        this.isPlaying = true;
        this.notify();
      }
    }
  }

  public stop(): void {
    this.stopHtmlAudio();
    this.stopProceduralZen();
    this.isPlaying = false;
    this.notify();
  }

  private stopHtmlAudio() {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch {}
    }
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  public setVolume(vol: number): void {
    this.currentVolume = Math.min(1, Math.max(0, vol));
    try {
      localStorage.setItem('ecoquest_audio_volume', String(this.currentVolume));
    } catch {}

    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(
        this.isMuted ? 0.0001 : Math.max(0.0001, this.currentVolume * 0.4),
        now + 0.1
      );
    }
    this.notify();
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('ecoquest_audio_muted', String(this.isMuted));
    } catch {}

    if (this.audioElement) {
      this.audioElement.volume = this.isMuted ? 0 : this.currentVolume;
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      const target = this.isMuted ? 0.0001 : Math.max(0.0001, this.currentVolume * 0.4);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(target, now + 0.2);
    }
    this.notify();
  }

  public selectTrack(index: number): void {
    if (index < 0 || index >= SOUNDTRACK_PLAYLIST.length) return;
    this.currentTrackIndex = index;
    try {
      localStorage.setItem('ecoquest_audio_track', String(index));
    } catch {}

    const wasPlaying = this.isPlaying;
    this.stop();

    const track = SOUNDTRACK_PLAYLIST[index];
    if (this.audioElement && !track.isProcedural) {
      this.audioElement.src = track.src;
    }

    if (wasPlaying) {
      this.start();
    } else {
      this.notify();
    }
  }

  public nextTrack(): void {
    const nextIdx = (this.currentTrackIndex + 1) % SOUNDTRACK_PLAYLIST.length;
    this.selectTrack(nextIdx);
  }

  public prevTrack(): void {
    const prevIdx =
      (this.currentTrackIndex - 1 + SOUNDTRACK_PLAYLIST.length) % SOUNDTRACK_PLAYLIST.length;
    this.selectTrack(prevIdx);
  }

  // Fallback Procedural Relaxing Nature Chimes
  private startProceduralZen() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      const target = this.isMuted ? 0.0001 : Math.max(0.0001, this.currentVolume * 0.35);
      this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(target, this.ctx.currentTime + 1.5);
      this.masterGain.connect(this.ctx.destination);

      // Warm analog chord pad
      this.padGain = this.ctx.createGain();
      this.padGain.gain.value = 0.25;
      this.padGain.connect(this.masterGain);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;
      filter.connect(this.padGain);

      [138.59, 185.0, 220.0, 277.18].forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(filter);
        osc.start();
        this.padOscs.push(osc);
      });

      // Ambient pentatonic bell notes
      this.chimesGain = this.ctx.createGain();
      this.chimesGain.gain.value = 0.2;
      this.chimesGain.connect(this.masterGain);

      const notes = [369.99, 415.3, 466.16, 554.37, 622.25];
      const playChime = () => {
        if (!this.ctx || !this.chimesGain) return;
        const note = notes[Math.floor(Math.random() * notes.length)];
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        osc.connect(g);
        g.connect(this.chimesGain);
        osc.start(now);
        osc.stop(now + 2.1);
        this.chimeTimer = setTimeout(playChime, 2500 + Math.random() * 2500);
      };
      this.chimeTimer = setTimeout(playChime, 1500);
    } catch (e) {
      console.warn('Procedural audio fallback notice:', e);
    }
  }

  private stopProceduralZen() {
    if (this.chimeTimer) {
      clearTimeout(this.chimeTimer);
      this.chimeTimer = null;
    }
    this.padOscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {}
    });
    this.padOscs = [];
  }
}

export const ambientAudioService = new AmbientAudioService();
