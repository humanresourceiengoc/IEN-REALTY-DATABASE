import { DeadlineAlert, UrgencySeverity } from '../types';

class NotificationService {
  private hasRequested = false;

  public async requestPermission(): Promise<NotificationPermission> {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'denied';
      }
      const permission = await Notification.requestPermission();
      this.hasRequested = true;
      return permission;
    } catch (error) {
      console.warn('Notification permission request not permitted or denied in iframe:', error);
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
      return Notification.permission;
    } catch {
      return 'denied';
    }
  }

  public sendPushNotification(title: string, options?: NotificationOptions): boolean {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) return false;

      if (Notification.permission === 'granted') {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
        return true;
      }
    } catch (err) {
      console.warn('Failed to trigger push notification (blocked in iframe):', err);
      return false;
    }
    return false;
  }

  public playAlertChime(type: 'urgent' | 'warning' | 'info' = 'info') {
    try {
      if (typeof window === 'undefined') return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'urgent') {
        // High pitch double-chime for urgent/expired
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.frequency.setValueAtTime(1174.66, now + 0.12); // D6
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'warning') {
        // Moderate pleasant reminder chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else {
        // Soft confirmation chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio chime could not play:', e);
    }
  }
}

export const notificationService = new NotificationService();
