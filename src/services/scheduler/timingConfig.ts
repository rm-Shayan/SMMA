export type SocialPlatform = 'LINKEDIN' | 'INSTAGRAM' | 'TWITTER' | 'FACEBOOK';

export interface PeakTimeWindow {
  hour: number;
  minute: number;
}

/**
 * Platform-Specific Peak Engagement Windows (Local Time)
 */
export const PEAK_HOURS: Record<SocialPlatform, PeakTimeWindow[]> = {
  LINKEDIN: [
    { hour: 8, minute: 30 },  // Morning commute / desk arrival
    { hour: 13, minute: 0 },  // Lunchtime professional catch-up
  ],
  INSTAGRAM: [
    { hour: 13, minute: 0 },  // Lunchtime browse
    { hour: 19, minute: 30 }, // Evening leisure prime-time
  ],
  TWITTER: [
    { hour: 9, minute: 0 },   // Morning news & tech discussions
    { hour: 17, minute: 0 },  // Evening work wind-down
  ],
  FACEBOOK: [
    { hour: 14, minute: 0 },  // Mid-afternoon community engagement
  ],
};

/**
 * Calculates the next optimal peak posting timestamp for a platform
 */
export function getNextOptimalSlot(platform: SocialPlatform, fromDate = new Date()): Date {
  const windows = PEAK_HOURS[platform] || [{ hour: 12, minute: 0 }];
  const currentHour = fromDate.getHours();
  const currentMinute = fromDate.getMinutes();

  // Find a slot later today
  for (const win of windows) {
    if (win.hour > currentHour || (win.hour === currentHour && win.minute > currentMinute)) {
      const slot = new Date(fromDate);
      slot.setHours(win.hour, win.minute, 0, 0);
      return slot;
    }
  }

  // Otherwise, schedule for the first slot tomorrow
  const tomorrow = new Date(fromDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(windows[0].hour, windows[0].minute, 0, 0);
  return tomorrow;
}

