const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

export async function createGoogleCalendarEvent(accessToken, event) {
  if (!accessToken) return null

  try {
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description || '',
        location: event.location || '',
        start: { dateTime: event.start_at, timeZone: 'America/Recife' },
        end: { dateTime: event.end_at, timeZone: 'America/Recife' },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.warn('Google Calendar sync failed:', err?.error?.message)
      return null
    }

    const data = await res.json()
    return data.id
  } catch (err) {
    console.warn('Google Calendar sync error:', err)
    return null
  }
}
