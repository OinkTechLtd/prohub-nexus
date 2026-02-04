import { useCallback, useRef } from "react";

// Create notification sound using Web Audio API
const createNotificationSound = (): AudioContext | null => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.warn("Web Audio API not supported");
    return null;
  }
};

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastPlayedRef = useRef<number>(0);

  const playNotificationSound = useCallback(() => {
    // Prevent rapid repeated sounds (min 500ms between plays)
    const now = Date.now();
    if (now - lastPlayedRef.current < 500) return;
    lastPlayedRef.current = now;

    try {
      // Create or resume audio context
      if (!audioContextRef.current) {
        audioContextRef.current = createNotificationSound();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      // Resume if suspended (required by browsers after user interaction)
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      // Create oscillator for "Tun Tun" sound (two-tone notification)
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Envelope: quick attack, sustain, quick release
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
        gainNode.gain.setValueAtTime(0.3, startTime + duration - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now_ = audioContext.currentTime;

      // "Tun" - first tone (higher pitch)
      playTone(880, now_, 0.12); // A5

      // "Tun" - second tone (same pitch, slight delay)
      playTone(880, now_ + 0.15, 0.12); // A5

    } catch (error) {
      console.warn("Error playing notification sound:", error);
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createNotificationSound();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.setValueAtTime(0.2, startTime + duration - 0.03);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now_ = audioContext.currentTime;

      // Rising tones for success
      playTone(523.25, now_, 0.1); // C5
      playTone(659.25, now_ + 0.1, 0.1); // E5
      playTone(783.99, now_ + 0.2, 0.15); // G5

    } catch (error) {
      console.warn("Error playing success sound:", error);
    }
  }, []);

  const playErrorSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createNotificationSound();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn("Error playing error sound:", error);
    }
  }, []);

  return {
    playNotificationSound,
    playSuccessSound,
    playErrorSound,
  };
};

export default useNotificationSound;
