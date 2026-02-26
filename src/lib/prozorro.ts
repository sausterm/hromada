/**
 * Prozorro public procurement API client.
 * Docs: https://public-api.prozorro.gov.ua/
 *
 * No authentication required for reads.
 */

const BASE_URL = 'https://public-api.prozorro.gov.ua/api/2.5'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProzorroIdentifier {
  scheme: string   // "UA-EDR"
  id: string       // EDRPOU (8-digit)
  legalName: string
}

export interface ProzorroProcuringEntity {
  name: string
  identifier: ProzorroIdentifier
  kind?: string
}

export interface ProzorroItem {
  id: string
  description: string
  classification?: {
    scheme: string
    id: string
    description: string
  }
}

export interface ProzorroTender {
  id: string             // Internal UUID
  tenderID: string       // Human-readable, e.g. "UA-2026-03-15-000581-a"
  status: string
  title?: string
  description?: string
  procuringEntity: ProzorroProcuringEntity
  items?: ProzorroItem[]
  dateModified: string
  dateCreated?: string
  value?: {
    amount: number
    currency: string
  }
}

export interface ProzorroFeedItem {
  id: string            // UUID
  dateModified: string
  tenderID?: string
  status?: string
  procuringEntity?: ProzorroProcuringEntity
}

export interface ProzorroFeedResponse {
  data: ProzorroFeedItem[]
  next_page: {
    offset: string
    path: string
    uri: string
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * Fetch full tender details by UUID.
 */
export async function getProzorroTender(uuid: string): Promise<ProzorroTender> {
  const res = await fetch(`${BASE_URL}/tenders/${uuid}`, {
    headers: { 'Accept': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Prozorro API error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  return json.data as ProzorroTender
}

/**
 * Paginate through the Prozorro tender feed.
 * Returns newest first when descending=true.
 */
export async function getProzorroFeed(opts: {
  offset?: string
  limit?: number
  descending?: boolean
  optFields?: string[]
}): Promise<ProzorroFeedResponse> {
  const params = new URLSearchParams()
  if (opts.offset) params.set('offset', opts.offset)
  params.set('limit', String(opts.limit ?? 100))
  if (opts.descending) params.set('descending', '1')
  if (opts.optFields?.length) params.set('opt_fields', opts.optFields.join(','))

  const res = await fetch(`${BASE_URL}/tenders?${params}`, {
    headers: { 'Accept': 'application/json' },
  })

  if (!res.ok) {
    throw new Error(`Prozorro feed error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<ProzorroFeedResponse>
}

// ---------------------------------------------------------------------------
// Human-readable status mapping
// ---------------------------------------------------------------------------

export const PROZORRO_STATUS_MESSAGES: Record<string, string> = {
  'active.enquiries': 'The municipality has posted the procurement. Contractors can ask questions.',
  'active.tendering': 'Contractors are now submitting bids.',
  'active.auction': 'The auction is underway — contractors are competing on price.',
  'active.qualification': 'A winning bid is being verified.',
  'active.awarded': 'A contractor has been selected. Contract is being finalized.',
  'complete': 'The procurement is complete. The contractor has been hired and work can begin.',
  'unsuccessful': 'No qualified bids were received. The municipality may re-post.',
  'cancelled': 'The procurement was cancelled by the municipality.',
}

/**
 * Get a donor-friendly message for a Prozorro status.
 */
export function getStatusMessage(status: string): string {
  return PROZORRO_STATUS_MESSAGES[status] ?? `Procurement status: ${status}`
}

/**
 * Get the public Prozorro URL for a tender.
 */
export function getProzorroUrl(tenderID: string): string {
  return `https://prozorro.gov.ua/tender/${tenderID}`
}

