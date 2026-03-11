/**
 * Tests for src/lib/calendly.ts
 */

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('calendly', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    process.env = { ...originalEnv, CALENDLY_API_TOKEN: 'test-token' }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getCalendlyUser', () => {
    it('throws if CALENDLY_API_TOKEN not set', async () => {
      delete process.env.CALENDLY_API_TOKEN
      const { getCalendlyUser } = require('@/lib/calendly')
      await expect(getCalendlyUser()).rejects.toThrow('CALENDLY_API_TOKEN not configured')
    })

    it('returns mapped user data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          resource: {
            uri: 'https://api.calendly.com/users/abc',
            name: 'Tom Protzman',
            email: 'tom@hromada.org',
            current_organization: 'https://api.calendly.com/organizations/xyz',
          },
        }),
      })

      const { getCalendlyUser } = require('@/lib/calendly')
      const user = await getCalendlyUser()

      expect(user).toEqual({
        uri: 'https://api.calendly.com/users/abc',
        name: 'Tom Protzman',
        email: 'tom@hromada.org',
        currentOrganization: 'https://api.calendly.com/organizations/xyz',
      })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.calendly.com/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('throws on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      })

      const { getCalendlyUser } = require('@/lib/calendly')
      await expect(getCalendlyUser()).rejects.toThrow('Calendly API 401: Unauthorized')
    })
  })

  describe('getScheduledEvents', () => {
    it('fetches events with correct params', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          collection: [
            {
              uri: 'https://api.calendly.com/scheduled_events/evt1',
              name: 'Meeting',
              status: 'active',
              start_time: '2026-03-10T10:00:00Z',
              end_time: '2026-03-10T10:30:00Z',
              created_at: '2026-03-09T12:00:00Z',
            },
          ],
          pagination: { next_page_token: null },
        }),
      })

      const { getScheduledEvents } = require('@/lib/calendly')
      const events = await getScheduledEvents(
        'https://api.calendly.com/users/abc',
        '2026-03-01T00:00:00Z'
      )

      expect(events).toHaveLength(1)
      expect(events[0]).toEqual({
        uri: 'https://api.calendly.com/scheduled_events/evt1',
        name: 'Meeting',
        status: 'active',
        startTime: '2026-03-10T10:00:00Z',
        endTime: '2026-03-10T10:30:00Z',
        createdAt: '2026-03-09T12:00:00Z',
      })
    })

    it('paginates through multiple pages', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            collection: [{
              uri: 'evt1', name: 'Meeting 1', status: 'active',
              start_time: '2026-03-10T10:00:00Z', end_time: '2026-03-10T10:30:00Z',
              created_at: '2026-03-09T12:00:00Z',
            }],
            pagination: { next_page_token: 'page2' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            collection: [{
              uri: 'evt2', name: 'Meeting 2', status: 'active',
              start_time: '2026-03-11T10:00:00Z', end_time: '2026-03-11T10:30:00Z',
              created_at: '2026-03-10T12:00:00Z',
            }],
            pagination: { next_page_token: null },
          }),
        })

      const { getScheduledEvents } = require('@/lib/calendly')
      const events = await getScheduledEvents('https://api.calendly.com/users/abc', '2026-03-01T00:00:00Z')

      expect(events).toHaveLength(2)
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('getEventInvitees', () => {
    it('fetches invitees with Q&A data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          collection: [{
            uri: 'inv1',
            email: 'donor@example.com',
            name: 'Jane Doe',
            status: 'active',
            created_at: '2026-03-09T12:00:00Z',
            questions_and_answers: [
              { question: 'Which project?', answer: 'Solar panels', position: 0 },
            ],
          }],
          pagination: { next_page_token: null },
        }),
      })

      const { getEventInvitees } = require('@/lib/calendly')
      const invitees = await getEventInvitees('https://api.calendly.com/scheduled_events/evt1')

      expect(invitees).toHaveLength(1)
      expect(invitees[0]).toEqual({
        uri: 'inv1',
        email: 'donor@example.com',
        name: 'Jane Doe',
        status: 'active',
        createdAt: '2026-03-09T12:00:00Z',
        questionsAndAnswers: [{ question: 'Which project?', answer: 'Solar panels', position: 0 }],
      })
    })

    it('handles missing questions_and_answers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          collection: [{
            uri: 'inv1', email: 'donor@example.com', name: 'Jane',
            status: 'active', created_at: '2026-03-09T12:00:00Z',
            // no questions_and_answers field
          }],
          pagination: { next_page_token: null },
        }),
      })

      const { getEventInvitees } = require('@/lib/calendly')
      const invitees = await getEventInvitees('https://api.calendly.com/scheduled_events/evt1')

      expect(invitees[0].questionsAndAnswers).toEqual([])
    })

    it('paginates through invitee pages', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            collection: [{
              uri: 'inv1', email: 'a@a.com', name: 'A', status: 'active',
              created_at: '2026-03-09T12:00:00Z', questions_and_answers: [],
            }],
            pagination: { next_page_token: 'next' },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            collection: [{
              uri: 'inv2', email: 'b@b.com', name: 'B', status: 'active',
              created_at: '2026-03-09T12:00:00Z', questions_and_answers: [],
            }],
            pagination: { next_page_token: null },
          }),
        })

      const { getEventInvitees } = require('@/lib/calendly')
      const invitees = await getEventInvitees('https://api.calendly.com/scheduled_events/evt1')

      expect(invitees).toHaveLength(2)
    })

    it('throws on API error with body text', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      })

      const { getEventInvitees } = require('@/lib/calendly')
      await expect(
        getEventInvitees('https://api.calendly.com/scheduled_events/evt1')
      ).rejects.toThrow('Calendly API 500')
    })
  })
})
