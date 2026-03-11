/**
 * Tests for src/lib/calendly-sync.ts
 */

jest.mock('@/lib/calendly', () => ({
  getCalendlyUser: jest.fn(),
  getScheduledEvents: jest.fn(),
  getEventInvitees: jest.fn(),
}))

jest.mock('@/lib/email', () => ({
  sendCalendlyWelcomeEmail: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    cronState: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    newsletterSubscriber: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { syncCalendlyInvitees } from '@/lib/calendly-sync'
import { getCalendlyUser, getScheduledEvents, getEventInvitees } from '@/lib/calendly'
import { sendCalendlyWelcomeEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'

const mockGetUser = getCalendlyUser as jest.MockedFunction<typeof getCalendlyUser>
const mockGetEvents = getScheduledEvents as jest.MockedFunction<typeof getScheduledEvents>
const mockGetInvitees = getEventInvitees as jest.MockedFunction<typeof getEventInvitees>
const mockSendEmail = sendCalendlyWelcomeEmail as jest.MockedFunction<typeof sendCalendlyWelcomeEmail>
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('syncCalendlyInvitees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    mockGetUser.mockResolvedValue({
      uri: 'https://api.calendly.com/users/abc',
      name: 'Tom',
      email: 'tom@hromada.org',
      currentOrganization: 'https://api.calendly.com/organizations/xyz',
    })
    ;(mockPrisma.cronState.upsert as jest.Mock).mockResolvedValue({})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uses lookback period when no previous poll state', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([])

    const result = await syncCalendlyInvitees()

    expect(result).toEqual({ eventsChecked: 0, newSubscribers: 0, skipped: 0 })
    expect(mockGetEvents).toHaveBeenCalledWith(
      'https://api.calendly.com/users/abc',
      expect.any(String)
    )
  })

  it('uses last poll timestamp from cron state', async () => {
    const lastPoll = '2026-03-09T00:00:00.000Z'
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue({
      id: 'calendly-sync',
      value: JSON.stringify({ lastPoll }),
    })
    mockGetEvents.mockResolvedValue([])

    await syncCalendlyInvitees()

    expect(mockGetEvents).toHaveBeenCalledWith(
      'https://api.calendly.com/users/abc',
      lastPoll
    )
  })

  it('creates new subscriber and sends welcome email', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([{
      uri: 'https://api.calendly.com/scheduled_events/evt1',
      name: 'Meeting',
      status: 'active',
      startTime: '2026-03-10T10:00:00Z',
      endTime: '2026-03-10T10:30:00Z',
      createdAt: '2026-03-09T12:00:00Z',
    }])
    mockGetInvitees.mockResolvedValue([{
      uri: 'inv1',
      email: 'Donor@Example.com',
      name: 'Jane Doe',
      status: 'active',
      createdAt: '2026-03-09T12:00:00Z',
      questionsAndAnswers: [{ question: 'Project?', answer: 'Solar panels', position: 0 }],
    }])
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.newsletterSubscriber.create as jest.Mock).mockResolvedValue({
      email: 'donor@example.com',
      unsubscribeToken: 'token-123',
    })
    mockSendEmail.mockResolvedValue({ success: true })

    const result = await syncCalendlyInvitees()

    expect(result.newSubscribers).toBe(1)
    expect(mockPrisma.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: {
        email: 'donor@example.com',
        name: 'Jane Doe',
        source: 'calendly',
      },
    })
    expect(mockSendEmail).toHaveBeenCalledWith(
      'donor@example.com',
      'Jane Doe',
      'token-123',
      'Solar panels'
    )
  })

  it('skips existing subscriber', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([{
      uri: 'evt1', name: 'Meeting', status: 'active',
      startTime: '2026-03-10T10:00:00Z', endTime: '2026-03-10T10:30:00Z',
      createdAt: '2026-03-09T12:00:00Z',
    }])
    mockGetInvitees.mockResolvedValue([{
      uri: 'inv1', email: 'existing@example.com', name: 'Existing',
      status: 'active', createdAt: '2026-03-09T12:00:00Z', questionsAndAnswers: [],
    }])
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue({
      email: 'existing@example.com', name: 'Existing',
    })

    const result = await syncCalendlyInvitees()

    expect(result.skipped).toBe(1)
    expect(result.newSubscribers).toBe(0)
    expect(mockPrisma.newsletterSubscriber.create).not.toHaveBeenCalled()
  })

  it('updates name for existing subscriber without name', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([{
      uri: 'evt1', name: 'Meeting', status: 'active',
      startTime: '2026-03-10T10:00:00Z', endTime: '2026-03-10T10:30:00Z',
      createdAt: '2026-03-09T12:00:00Z',
    }])
    mockGetInvitees.mockResolvedValue([{
      uri: 'inv1', email: 'noname@example.com', name: 'Jane Doe',
      status: 'active', createdAt: '2026-03-09T12:00:00Z', questionsAndAnswers: [],
    }])
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue({
      email: 'noname@example.com', name: null,
    })
    ;(mockPrisma.newsletterSubscriber.update as jest.Mock).mockResolvedValue({})

    const result = await syncCalendlyInvitees()

    expect(mockPrisma.newsletterSubscriber.update).toHaveBeenCalledWith({
      where: { email: 'noname@example.com' },
      data: { name: 'Jane Doe' },
    })
    expect(result.skipped).toBe(1)
  })

  it('skips invitee with empty email', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([{
      uri: 'evt1', name: 'Meeting', status: 'active',
      startTime: '2026-03-10T10:00:00Z', endTime: '2026-03-10T10:30:00Z',
      createdAt: '2026-03-09T12:00:00Z',
    }])
    mockGetInvitees.mockResolvedValue([{
      uri: 'inv1', email: '  ', name: 'No Email',
      status: 'active', createdAt: '2026-03-09T12:00:00Z', questionsAndAnswers: [],
    }])

    const result = await syncCalendlyInvitees()

    // Note: " ".trim() is empty but " ".toLowerCase().trim() is empty too
    // The code checks !email after trim which would be falsy for empty string
    // But actually the code does email.toLowerCase().trim() first, then checks !email
    // An email of "  " becomes "" which is falsy, so it should be skipped
    expect(result.skipped).toBe(1)
    expect(mockPrisma.newsletterSubscriber.findUnique).not.toHaveBeenCalled()
  })

  it('updates cron state after sync', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([])

    await syncCalendlyInvitees()

    expect(mockPrisma.cronState.upsert).toHaveBeenCalledWith({
      where: { id: 'calendly-sync' },
      update: { value: expect.stringContaining('lastPoll') },
      create: {
        id: 'calendly-sync',
        value: expect.stringContaining('lastPoll'),
      },
    })
  })

  it('handles failed welcome email gracefully', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([{
      uri: 'evt1', name: 'Meeting', status: 'active',
      startTime: '2026-03-10T10:00:00Z', endTime: '2026-03-10T10:30:00Z',
      createdAt: '2026-03-09T12:00:00Z',
    }])
    mockGetInvitees.mockResolvedValue([{
      uri: 'inv1', email: 'new@example.com', name: 'New Donor',
      status: 'active', createdAt: '2026-03-09T12:00:00Z',
      questionsAndAnswers: [],
    }])
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.newsletterSubscriber.create as jest.Mock).mockResolvedValue({
      email: 'new@example.com', unsubscribeToken: 'tok',
    })
    mockSendEmail.mockResolvedValue({ success: false, error: 'SES error' })

    const result = await syncCalendlyInvitees()

    // Should still count as new subscriber even though email failed
    expect(result.newSubscribers).toBe(1)
    expect(console.error).toHaveBeenCalled()
  })

  it('processes multiple events and invitees', async () => {
    ;(mockPrisma.cronState.findUnique as jest.Mock).mockResolvedValue(null)
    mockGetEvents.mockResolvedValue([
      { uri: 'evt1', name: 'M1', status: 'active', startTime: '2026-03-10T10:00:00Z', endTime: '2026-03-10T10:30:00Z', createdAt: '2026-03-09T12:00:00Z' },
      { uri: 'evt2', name: 'M2', status: 'active', startTime: '2026-03-11T10:00:00Z', endTime: '2026-03-11T10:30:00Z', createdAt: '2026-03-10T12:00:00Z' },
    ])
    mockGetInvitees
      .mockResolvedValueOnce([{
        uri: 'inv1', email: 'a@a.com', name: 'A', status: 'active',
        createdAt: '2026-03-09T12:00:00Z', questionsAndAnswers: [],
      }])
      .mockResolvedValueOnce([{
        uri: 'inv2', email: 'b@b.com', name: 'B', status: 'active',
        createdAt: '2026-03-10T12:00:00Z', questionsAndAnswers: [],
      }])
    ;(mockPrisma.newsletterSubscriber.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockPrisma.newsletterSubscriber.create as jest.Mock)
      .mockResolvedValueOnce({ email: 'a@a.com', unsubscribeToken: 'tok-a' })
      .mockResolvedValueOnce({ email: 'b@b.com', unsubscribeToken: 'tok-b' })
    mockSendEmail.mockResolvedValue({ success: true })

    const result = await syncCalendlyInvitees()

    expect(result.eventsChecked).toBe(2)
    expect(result.newSubscribers).toBe(2)
  })
})
