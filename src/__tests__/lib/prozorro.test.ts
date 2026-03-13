/**
 * Tests for src/lib/prozorro.ts
 */

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

import {
  getProzorroTender,
  getProzorroFeed,
  getStatusMessage,
  getProzorroUrl,
  PROZORRO_STATUS_MESSAGES,
} from '@/lib/prozorro'

describe('prozorro', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getProzorroTender', () => {
    it('fetches and returns tender data', async () => {
      const tenderData = {
        id: 'uuid-123',
        tenderID: 'UA-2026-03-15-000581-a',
        status: 'active.tendering',
        title: 'Solar panels procurement',
        procuringEntity: {
          name: 'Lychkove Municipality',
          identifier: { scheme: 'UA-EDR', id: '12345678', legalName: 'Lychkove' },
        },
        dateModified: '2026-03-10T00:00:00Z',
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: tenderData }),
      })

      const result = await getProzorroTender('uuid-123')

      expect(result).toEqual(tenderData)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://public-api.prozorro.gov.ua/api/2.5/tenders/uuid-123',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(getProzorroTender('bad-uuid')).rejects.toThrow(
        'Prozorro API error: 404 Not Found'
      )
    })
  })

  describe('getProzorroFeed', () => {
    it('fetches feed with default options', async () => {
      const feedData = {
        data: [{ id: 'uuid-1', dateModified: '2026-03-10T00:00:00Z' }],
        next_page: { offset: 'abc', path: '/api/2.5/tenders', uri: 'https://...' },
      }

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(feedData),
      })

      const result = await getProzorroFeed({})

      expect(result).toEqual(feedData)
      // Default limit is 100
      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('limit=100')
    })

    it('passes all options as query params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: [], next_page: { offset: '', path: '', uri: '' } }),
      })

      await getProzorroFeed({
        offset: 'cursor-abc',
        limit: 50,
        descending: true,
        optFields: ['tenderID', 'status'],
      })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('offset=cursor-abc')
      expect(calledUrl).toContain('limit=50')
      expect(calledUrl).toContain('descending=1')
      expect(calledUrl).toContain('opt_fields=tenderID%2Cstatus')
    })

    it('omits offset when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: [], next_page: { offset: '', path: '', uri: '' } }),
      })

      await getProzorroFeed({ limit: 10 })

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).not.toContain('offset=')
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(getProzorroFeed({})).rejects.toThrow(
        'Prozorro feed error: 500 Internal Server Error'
      )
    })
  })

  describe('getStatusMessage', () => {
    it('returns message for known statuses', () => {
      expect(getStatusMessage('active.tendering')).toBe(
        'Contractors are now submitting bids.'
      )
      expect(getStatusMessage('complete')).toContain('complete')
      expect(getStatusMessage('cancelled')).toContain('cancelled')
    })

    it('returns fallback for unknown status', () => {
      expect(getStatusMessage('some.unknown.status')).toBe(
        'Procurement status: some.unknown.status'
      )
    })

    it('covers all defined status messages', () => {
      const statuses = Object.keys(PROZORRO_STATUS_MESSAGES)
      expect(statuses.length).toBeGreaterThanOrEqual(8)

      for (const status of statuses) {
        const msg = getStatusMessage(status)
        expect(msg).toBeTruthy()
        expect(msg).not.toContain('Procurement status:')
      }
    })
  })

  describe('getProzorroUrl', () => {
    it('returns correct public URL for tender', () => {
      const url = getProzorroUrl('UA-2026-03-15-000581-a')
      expect(url).toBe('https://prozorro.gov.ua/tender/UA-2026-03-15-000581-a')
    })
  })
})
