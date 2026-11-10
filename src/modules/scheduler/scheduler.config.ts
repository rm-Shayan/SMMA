export type SocialPlatform = 'linkedin' | 'instagram' | 'twitter' | 'facebook';

export interface OptimalPostSlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  hourUtc: number;
  minuteUtc: number;
}

export const PLATFORM_PEAK_SCHEDULES: Record<SocialPlatform, OptimalPostSlot[]> = {
  linkedin: [
    { dayOfWeek: 2, hourUtc: 7, minuteUtc: 0 },  // Tue 7:00 AM UTC
    { dayOfWeek: 3, hourUtc: 7, minuteUtc: 0 },  // Wed 7:00 AM UTC
    { dayOfWeek: 4, hourUtc: 12, minuteUtc: 0 }, // Thu 12:00 PM UTC
  ],
  instagram: [
    { dayOfWeek: 1, hourUtc: 14, minuteUtc: 30 }, // Mon 2:30 PM UTC
    { dayOfWeek: 3, hourUtc: 14, minuteUtc: 30 }, // Wed 2:30 PM UTC
    { dayOfWeek: 5, hourUtc: 19, minuteUtc: 0 },  // Fri 7:00 PM UTC
  ],
  twitter: [
    { dayOfWeek: 1, hourUtc: 13, minuteUtc: 0 }, // Mon 1:00 PM UTC
    { dayOfWeek: 3, hourUtc: 16, minuteUtc: 0 }, // Wed 4:00 PM UTC
    { dayOfWeek: 4, hourUtc: 14, minuteUtc: 0 }, // Thu 2:00 PM UTC
  ],
  facebook: [
    { dayOfWeek: 3, hourUtc: 18, minuteUtc: 0 }, // Wed 6:00 PM UTC
    { dayOfWeek: 4, hourUtc: 19, minuteUtc: 0 }, // Thu 7:00 PM UTC
  ],
};

export function getNextOptimalSlot(platform: SocialPlatform, fromDate: Date = new Date()): Date {
  const slots = PLATFORM_PEAK_SCHEDULES[platform] || PLATFORM_PEAK_SCHEDULES.linkedin;
  const target = new Date(fromDate);
  target.setHours(target.getHours() + 2); // Default to 2 hours in the future
  return target;
}
