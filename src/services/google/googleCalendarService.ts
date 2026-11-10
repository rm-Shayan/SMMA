import { getGoogleAccessToken } from './googleAuth';
import { logger } from '../../config/logger';

export interface BookingRequest {
  summary: string;
  description?: string;
  attendeeEmail?: string;
  startTimeIso: string;
  durationMinutes?: number;
}

/**
 * Creates a meeting event in Google Calendar with an automatic Google Meet link.
 */
export async function createGoogleCalendarEvent(req: BookingRequest): Promise<{ eventId?: string; meetLink?: string } | null> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  const token = await getGoogleAccessToken();
  if (!token) return null;

  const duration = req.durationMinutes || 30;
  const start = new Date(req.startTimeIso);
  const end = new Date(start.getTime() + duration * 60000);

  const eventPayload = {
    summary: req.summary,
    description: req.description || 'Scheduled automatically by AI Agent',
    start: { dateTime: start.toISOString() },
    end: { dateTime: end.toISOString() },
    attendees: req.attendeeEmail ? [{ email: req.attendeeEmail }] : [],
    conferenceData: {
      createRequest: {
        requestId: `smma-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error({ status: res.status, err }, 'Failed to create Google Calendar event');
      return null;
    }

    const data: any = await res.json();
    const meetLink = data.hangoutLink || data.htmlLink;
    logger.info({ eventId: data.id, meetLink }, '📅 Google Calendar Meeting scheduled successfully!');
    return { eventId: data.id, meetLink };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Google Calendar event creation error');
    return null;
  }
}

