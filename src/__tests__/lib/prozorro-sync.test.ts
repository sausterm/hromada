// Must declare mocks before jest.mock calls due to hoisting

jest.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    donation: {
      findMany: jest.fn(),
    },
    projectUpdate: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    cronState: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

jest.mock('@/lib/prozorro', () => ({
  getProzorroTender: jest.fn(),
  getProzorroFeed: jest.fn(),
  getStatusMessage: jest.fn((s: string) => `Status: ${s}`),
  getProzorroUrl: jest.fn((id: string) => `https://prozorro.gov.ua/tender/${id}`),
}))

jest.mock('@/lib/email', () => ({
  sendProjectUpdateEmail: jest.fn().mockResolvedValue({ success: true }),
  sendProzorroMatchEmail: jest.fn().mockResolvedValue({ success: true }),
}))

import { discoverTenders, pollLinkedTenders, notifyDonors } from '@/lib/prozorro-sync'
import { prisma } from '@/lib/prisma'
import { getProzorroTender, getProzorroFeed } from '@/lib/prozorro'
import { sendProjectUpdateEmail, sendProzorroMatchEmail } from '@/lib/email'

// Cast to jest.Mock for type safety
const mockPrisma = prisma as unknown as {
  project: { findMany: jest.Mock; update: jest.Mock }
  donation: { findMany: jest.Mock }
  projectUpdate: { findFirst: jest.Mock; create: jest.Mock }
  cronState: { findUnique: jest.Mock; upsert: jest.Mock }
}
const mockGetProzorroTender = getProzorroTender as jest.Mock
const mockGetProzorroFeed = getProzorroFeed as jest.Mock
const mockSendProjectUpdateEmail = sendProjectUpdateEmail as jest.Mock
const mockSendProzorroMatchEmail = sendProzorroMatchEmail as jest.Mock

describe('prozorro-sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
    // Reset default resolved values
    mockSendProjectUpdateEmail.mockResolvedValue({ success: true })
    mockSendProzorroMatchEmail.mockResolvedValue({ success: true })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // -----------------------------------------------------------------------
  // discoverTenders
  // -----------------------------------------------------------------------

  describe('discoverTenders', () => {
    it('returns early when no funded projects with EDRPOUs exist', async () => {
      mockPrisma.project.findMany.mockResolvedValue([])
      mockPrisma.donation.findMany.mockResolvedValue([])

      const result = await discoverTenders()

      expect(result).toEqual({
        pagesScanned: 0,
        feedItemsProcessed: 0,
        matchesFound: 0,
        errors: [],
      })
      expect(mockGetProzorroFeed).not.toHaveBeenCalled()
    })

    it('returns early when candidate projects have no funded donations', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'School', edrpou: '12345678' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([])

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(0)
      expect(mockGetProzorroFeed).not.toHaveBeenCalled()
    })

    it('scans feed and finds matches', async () => {
      // Setup: one funded project
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([
        { projectId: 'p1' },
      ])

      // No existing CronState
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      // Feed returns one matching item, then empty
      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [
            {
              id: 'tender-uuid-1',
              tenderID: 'UA-2026-01-01-000001-a',
              status: 'active.tendering',
              procuringEntity: {
                name: 'Kyiv Council',
                identifier: { id: '11111111' },
              },
            },
          ],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({
          data: [],
          next_page: { offset: 'offset-2' },
        })

      // No existing notification
      mockPrisma.projectUpdate.findFirst.mockResolvedValue(null)
      mockPrisma.projectUpdate.create.mockResolvedValue({})
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.pagesScanned).toBe(2)
      expect(result.matchesFound).toBe(1)
      expect(result.errors).toEqual([])
      expect(mockPrisma.projectUpdate.create).toHaveBeenCalledTimes(1)
      expect(mockSendProzorroMatchEmail).toHaveBeenCalledTimes(1)
      expect(mockPrisma.cronState.upsert).toHaveBeenCalled()
    })

    it('skips feed items with non-matching EDRPOU', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [
            {
              id: 'tender-other',
              status: 'active.tendering',
              procuringEntity: {
                name: 'Other Entity',
                identifier: { id: '99999999' },
              },
            },
          ],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(0)
      expect(mockPrisma.projectUpdate.create).not.toHaveBeenCalled()
    })

    it('skips feed items with non-active status', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [
            {
              id: 'tender-cancelled',
              status: 'cancelled',
              procuringEntity: {
                name: 'Entity',
                identifier: { id: '11111111' },
              },
            },
          ],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(0)
    })

    it('skips feed items without procuringEntity EDRPOU', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [
            {
              id: 'tender-no-edrpou',
              status: 'active.tendering',
              procuringEntity: { name: 'Entity' },
            },
          ],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(0)
    })

    it('deduplicates: skips already-notified tenders', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [
            {
              id: 'tender-uuid-dup',
              tenderID: 'UA-dup',
              status: 'active.tendering',
              procuringEntity: { name: 'Entity', identifier: { id: '11111111' } },
            },
          ],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      // Already notified
      mockPrisma.projectUpdate.findFirst.mockResolvedValue({ id: 'existing-update' })
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(0)
      expect(mockPrisma.projectUpdate.create).not.toHaveBeenCalled()
    })

    it('resumes from saved CronState offset', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue({
        id: 'prozorro-discovery',
        value: JSON.stringify({ offset: '2026-03-01T00:00:00Z' }),
      })

      mockGetProzorroFeed.mockResolvedValueOnce({ data: [], next_page: { offset: '2026-03-01T00:00:00Z' } })
      mockPrisma.cronState.upsert.mockResolvedValue({})

      await discoverTenders()

      expect(mockGetProzorroFeed).toHaveBeenCalledWith(
        expect.objectContaining({ offset: '2026-03-01T00:00:00Z' })
      )
    })

    it('stops after 3 consecutive same-offset pages', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      // Return data but same offset each time
      const sameOffsetResponse = {
        data: [{ id: 'item', status: 'cancelled', procuringEntity: { name: 'X', identifier: { id: '99999999' } } }],
        next_page: { offset: 'stuck-offset' },
      }

      mockGetProzorroFeed
        .mockResolvedValueOnce(sameOffsetResponse)
        .mockResolvedValueOnce(sameOffsetResponse)
        .mockResolvedValueOnce(sameOffsetResponse)
        .mockResolvedValueOnce(sameOffsetResponse)

      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      // Should stop after 3 empty (same-offset) pages, so 4 pages total (initial + 3 stuck)
      expect(result.pagesScanned).toBeLessThanOrEqual(4)
    })

    it('handles feed page errors gracefully', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed.mockRejectedValue(new Error('Network error'))
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.errors).toContain('Feed error: Network error')
      expect(result.pagesScanned).toBe(0)
    })

    it('handles per-project notification errors gracefully', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Solar Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [{
            id: 'tender-err',
            tenderID: 'UA-err',
            status: 'active.tendering',
            procuringEntity: { name: 'Entity', identifier: { id: '11111111' } },
          }],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      mockPrisma.projectUpdate.findFirst.mockResolvedValue(null)
      mockPrisma.projectUpdate.create.mockRejectedValue(new Error('DB write failed'))
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.errors.length).toBe(1)
      expect(result.errors[0]).toContain('Notify error')
      expect(result.errors[0]).toContain('DB write failed')
    })

    it('handles projects with null edrpou in watchlist building', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'No EDRPOU', edrpou: null },
        { id: 'p2', facilityName: 'Has EDRPOU', edrpou: '22222222' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([
        { projectId: 'p1' },
        { projectId: 'p2' },
      ])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)
      mockGetProzorroFeed.mockResolvedValueOnce({ data: [], next_page: { offset: 'x' } })
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      // Should still proceed (p2 has edrpou)
      expect(result.pagesScanned).toBe(1)
    })

    it('handles feed items without tenderID, falling back to id', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [{
            id: 'uuid-no-tenderid',
            // no tenderID field
            status: 'active.enquiries',
            procuringEntity: { name: 'Entity', identifier: { id: '11111111' } },
          }],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      mockPrisma.projectUpdate.findFirst.mockResolvedValue(null)
      mockPrisma.projectUpdate.create.mockResolvedValue({})
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(1)
      // tenderDisplayId should fall back to item.id
      expect(mockSendProzorroMatchEmail).toHaveBeenCalledWith(
        expect.objectContaining({ tenderID: 'uuid-no-tenderid' })
      )
    })

    it('handles feed items without procuringEntity name, falling back to EDRPOU', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Farm', edrpou: '11111111' },
      ])
      mockPrisma.donation.findMany.mockResolvedValue([{ projectId: 'p1' }])
      mockPrisma.cronState.findUnique.mockResolvedValue(null)

      mockGetProzorroFeed
        .mockResolvedValueOnce({
          data: [{
            id: 'uuid-no-name',
            tenderID: 'UA-test',
            status: 'active.auction',
            procuringEntity: { identifier: { id: '11111111' } },
          }],
          next_page: { offset: 'offset-2' },
        })
        .mockResolvedValueOnce({ data: [], next_page: { offset: 'offset-2' } })

      mockPrisma.projectUpdate.findFirst.mockResolvedValue(null)
      mockPrisma.projectUpdate.create.mockResolvedValue({})
      mockPrisma.cronState.upsert.mockResolvedValue({})

      const result = await discoverTenders()

      expect(result.matchesFound).toBe(1)
      // entityName should fall back to EDRPOU
      expect(mockSendProzorroMatchEmail).toHaveBeenCalledWith(
        expect.objectContaining({ entityName: '11111111' })
      )
    })
  })

  // -----------------------------------------------------------------------
  // pollLinkedTenders
  // -----------------------------------------------------------------------

  describe('pollLinkedTenders', () => {
    it('returns early when no linked tenders exist', async () => {
      mockPrisma.project.findMany.mockResolvedValue([])

      const result = await pollLinkedTenders()

      expect(result).toEqual({ tendersPolled: 0, statusChanges: 0, errors: [] })
      expect(mockGetProzorroTender).not.toHaveBeenCalled()
    })

    it('skips projects with null prozorroTenderUuid or prozorroTenderId', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        { id: 'p1', facilityName: 'Farm', prozorroTenderUuid: null, prozorroTenderId: 'UA-1', prozorroStatus: 'active.tendering' },
        { id: 'p2', facilityName: 'School', prozorroTenderUuid: 'uuid-2', prozorroTenderId: null, prozorroStatus: 'active.tendering' },
      ])

      const result = await pollLinkedTenders()

      expect(result.tendersPolled).toBe(0)
      expect(mockGetProzorroTender).not.toHaveBeenCalled()
    })

    it('detects status change and notifies donors', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'p1',
          facilityName: 'Solar Farm',
          prozorroTenderUuid: 'uuid-1',
          prozorroTenderId: 'UA-2026-01-15-000123-a',
          prozorroStatus: 'active.tendering',
        },
      ])

      mockGetProzorroTender.mockResolvedValue({ status: 'active.auction' })
      mockPrisma.project.update.mockResolvedValue({})
      mockPrisma.projectUpdate.create.mockResolvedValue({})

      // notifyDonors internals
      mockPrisma.donation.findMany.mockResolvedValue([
        { donorName: 'Alice', donorEmail: 'alice@test.com' },
      ])

      const result = await pollLinkedTenders()

      expect(result.tendersPolled).toBe(1)
      expect(result.statusChanges).toBe(1)
      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ prozorroStatus: 'active.auction' }),
        })
      )
      expect(mockPrisma.projectUpdate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isPublic: true }),
        })
      )
    })

    it('updates sync timestamp when status has not changed', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'p1',
          facilityName: 'Solar Farm',
          prozorroTenderUuid: 'uuid-1',
          prozorroTenderId: 'UA-1',
          prozorroStatus: 'active.tendering',
        },
      ])

      mockGetProzorroTender.mockResolvedValue({ status: 'active.tendering' })
      mockPrisma.project.update.mockResolvedValue({})

      const result = await pollLinkedTenders()

      expect(result.statusChanges).toBe(0)
      expect(mockPrisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ prozorroLastSync: expect.any(Date) }),
        })
      )
      expect(mockPrisma.projectUpdate.create).not.toHaveBeenCalled()
    })

    it('handles API error for a single tender gracefully', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'p1',
          facilityName: 'Solar Farm',
          prozorroTenderUuid: 'uuid-1',
          prozorroTenderId: 'UA-1',
          prozorroStatus: 'active.tendering',
        },
      ])

      mockGetProzorroTender.mockRejectedValue(new Error('API 500'))

      const result = await pollLinkedTenders()

      expect(result.tendersPolled).toBe(1)
      expect(result.statusChanges).toBe(0)
      expect(result.errors).toContain('API 500')
    })

    it('handles non-Error exceptions in poll loop', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'p1',
          facilityName: 'Solar Farm',
          prozorroTenderUuid: 'uuid-1',
          prozorroTenderId: 'UA-1',
          prozorroStatus: 'active.tendering',
        },
      ])

      mockGetProzorroTender.mockRejectedValue('string error')

      const result = await pollLinkedTenders()

      expect(result.errors).toContain('string error')
    })

    it('polls multiple projects and handles mixed results', async () => {
      mockPrisma.project.findMany.mockResolvedValue([
        {
          id: 'p1',
          facilityName: 'Farm A',
          prozorroTenderUuid: 'uuid-1',
          prozorroTenderId: 'UA-1',
          prozorroStatus: 'active.tendering',
        },
        {
          id: 'p2',
          facilityName: 'Farm B',
          prozorroTenderUuid: 'uuid-2',
          prozorroTenderId: 'UA-2',
          prozorroStatus: 'active.qualification',
        },
      ])

      mockGetProzorroTender
        .mockResolvedValueOnce({ status: 'active.auction' }) // changed
        .mockRejectedValueOnce(new Error('Timeout')) // error

      mockPrisma.project.update.mockResolvedValue({})
      mockPrisma.projectUpdate.create.mockResolvedValue({})
      mockPrisma.donation.findMany.mockResolvedValue([])

      const result = await pollLinkedTenders()

      expect(result.tendersPolled).toBe(2)
      expect(result.statusChanges).toBe(1)
      expect(result.errors).toContain('Timeout')
    })
  })

  // -----------------------------------------------------------------------
  // notifyDonors
  // -----------------------------------------------------------------------

  describe('notifyDonors', () => {
    it('does nothing when no donors found', async () => {
      mockPrisma.donation.findMany.mockResolvedValue([])

      await notifyDonors('p1', 'Solar Farm', {
        title: 'Update',
        message: 'Status changed',
        tenderID: 'UA-1',
      })

      expect(mockSendProjectUpdateEmail).not.toHaveBeenCalled()
    })

    it('sends emails to all unique donors', async () => {
      mockPrisma.donation.findMany.mockResolvedValue([
        { donorName: 'Alice', donorEmail: 'alice@test.com' },
        { donorName: 'Bob', donorEmail: 'bob@test.com' },
      ])

      await notifyDonors('p1', 'Solar Farm', {
        title: 'Procurement update',
        message: 'Bids open',
        tenderID: 'UA-1',
      })

      expect(mockSendProjectUpdateEmail).toHaveBeenCalledTimes(2)
      expect(mockSendProjectUpdateEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          donorName: 'Alice',
          donorEmail: 'alice@test.com',
          projectName: 'Solar Farm',
          projectId: 'p1',
          updateTitle: 'Procurement update',
          updateMessage: 'Bids open',
          tenderID: 'UA-1',
        })
      )
    })

    it('handles email send failure for one donor without stopping others', async () => {
      mockPrisma.donation.findMany.mockResolvedValue([
        { donorName: 'Alice', donorEmail: 'alice@test.com' },
        { donorName: 'Bob', donorEmail: 'bob@test.com' },
      ])

      mockSendProjectUpdateEmail
        .mockRejectedValueOnce(new Error('Bad email'))
        .mockResolvedValueOnce({ success: true })

      await notifyDonors('p1', 'Solar Farm', {
        title: 'Update',
        message: 'Message',
        tenderID: 'UA-1',
      })

      // Both should have been attempted
      expect(mockSendProjectUpdateEmail).toHaveBeenCalledTimes(2)
    })
  })
})
