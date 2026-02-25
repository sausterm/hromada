const CALENDLY_BASE = 'https://api.calendly.com'
const PAGE_DELAY_MS = 300

function getToken(): string {
  const token = process.env.CALENDLY_API_TOKEN
  if (!token) throw new Error('CALENDLY_API_TOKEN not configured')
  return token
}

function headers(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  }
}

async function calendlyFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Calendly API ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────────────────

export interface CalendlyUser {
  uri: string
  name: string
  email: string
  currentOrganization: string
}

export interface CalendlyEvent {
  uri: string
  name: string
  status: string
  startTime: string
  endTime: string
  createdAt: string
}

export interface CalendlyInvitee {
  uri: string
  email: string
  name: string
  status: string
  createdAt: string
  questionsAndAnswers: Array<{
    question: string
    answer: string
    position: number
  }>
}

interface CalendlyPagination {
  next_page_token: string | null
}

// ── API Calls ──────────────────────────────────────────────────────

export async function getCalendlyUser(): Promise<CalendlyUser> {
  const data = await calendlyFetch<{
    resource: {
      uri: string
      name: string
      email: string
      current_organization: string
    }
  }>(`${CALENDLY_BASE}/users/me`)

  return {
    uri: data.resource.uri,
    name: data.resource.name,
    email: data.resource.email,
    currentOrganization: data.resource.current_organization,
  }
}

export async function getScheduledEvents(
  userUri: string,
  minStartTime: string
): Promise<CalendlyEvent[]> {
  const events: CalendlyEvent[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      user: userUri,
      min_start_time: minStartTime,
      count: '100',
      status: 'active',
      sort: 'start_time:asc',
    })
    if (pageToken) params.set('page_token', pageToken)

    const data = await calendlyFetch<{
      collection: Array<{
        uri: string
        name: string
        status: string
        start_time: string
        end_time: string
        created_at: string
      }>
      pagination: CalendlyPagination
    }>(`${CALENDLY_BASE}/scheduled_events?${params}`)

    for (const e of data.collection) {
      events.push({
        uri: e.uri,
        name: e.name,
        status: e.status,
        startTime: e.start_time,
        endTime: e.end_time,
        createdAt: e.created_at,
      })
    }

    pageToken = data.pagination.next_page_token ?? undefined
    if (pageToken) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS))
    }
  } while (pageToken)

  return events
}

export async function getEventInvitees(
  eventUri: string
): Promise<CalendlyInvitee[]> {
  const invitees: CalendlyInvitee[] = []
  let pageToken: string | undefined

  do {
    const params = new URLSearchParams({
      count: '100',
      status: 'active',
    })
    if (pageToken) params.set('page_token', pageToken)

    const data = await calendlyFetch<{
      collection: Array<{
        uri: string
        email: string
        name: string
        status: string
        created_at: string
        questions_and_answers: Array<{
          question: string
          answer: string
          position: number
        }>
      }>
      pagination: CalendlyPagination
    }>(`${eventUri}/invitees?${params}`)

    for (const inv of data.collection) {
      invitees.push({
        uri: inv.uri,
        email: inv.email,
        name: inv.name,
        status: inv.status,
        createdAt: inv.created_at,
        questionsAndAnswers: inv.questions_and_answers ?? [],
      })
    }

    pageToken = data.pagination.next_page_token ?? undefined
    if (pageToken) {
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS))
    }
  } while (pageToken)

  return invitees
}
