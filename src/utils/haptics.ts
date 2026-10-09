/**
 * Tactile Haptic & Vibration Engine for EcoQuest
 * Provides physical tactile feedback via the Web Vibration API (navigator.vibrate)
 * when supported by mobile browsers and devices.
 */

export const isVibrationSupported = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    typeof navigator.vibrate === 'function'
  );
};

export const triggerVibration = (pattern: number | number[] = 25): boolean => {
  if (isVibrationSupported()) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
};

export const hapticFeedback = {
  /**
   * Heavy mechanical click-through for the "Start Playing" actuator
   * 3-stage mechanical actuator pulse: initial contact, detent, bottom-out
   */
  startPlaying: (): boolean => {
    return triggerVibration([45, 35, 95]);
  },

  /**
   * Celebratory triumphant haptic pattern for completing a field mission & craft verification
   */
  missionCompleted: (): boolean => {
    return triggerVibration([70, 40, 110, 50, 160]);
  },

  /**
   * Crisp double-pulse when completing/logging a Daily Nature Challenge
   */
  challengeCompleted: (): boolean => {
    return triggerVibration([35, 30, 65]);
  },

  /**
   * Snappy click for tactile button switches
   */
  tactileClick: (): boolean => {
    return triggerVibration(22);
  },

  /**
   * Standard mechanical button press
   */
  buttonPress: (): boolean => {
    return triggerVibration(30);
  },

  /**
   * Spatial acoustic radar pulse wave
   */
  radarPulse: (): boolean => {
    return triggerVibration([40, 30, 70]);
  },

  /**
   * Alias for missionCompleted
   */
  missionComplete: (): boolean => {
    return triggerVibration([70, 40, 110, 50, 160]);
  },

  /**
   * Gentle micro-tap
   */
  subtleTap: (): boolean => {
    return triggerVibration(12);
  },
};
