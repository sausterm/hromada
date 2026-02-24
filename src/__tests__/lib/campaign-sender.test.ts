/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    emailCampaign: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    newsletterSubscriber: {
      findMany: jest.fn(),
    },
    emailSend: {
      createMany: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

// Mock SES
const mockSendEmail = jest.fn()
jest.mock('@/lib/ses', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import { sendCampaign } from '@/lib/campaign-sender'
import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  emailCampaign: {
    findUnique: jest.Mock
    update: jest.Mock
  }
  newsletterSubscriber: {
    findMany: jest.Mock
  }
  emailSend: {
    createMany: jest.Mock
    updateMany: jest.Mock
  }
}

describe('campaign-sender', () => {
  const mockCampaign = {
    id: 'camp-1',
    subject: 'Test Campaign',
    htmlContent: '<p>Campaign body</p>',
    status: 'DRAFT',
  }

  const mockSubscribers = [
    { email: 'alice@example.com', unsubscribeToken: 'token-alice' },
    { email: 'bob@example.com', unsubscribeToken: 'token-bob' },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrisma.emailCampaign.findUnique.mockResolvedValue(mockCampaign)
    mockPrisma.emailCampaign.update.mockResolvedValue({})
    mockPrisma.newsletterSubscriber.findMany.mockResolvedValue(mockSubscribers)
    mockPrisma.emailSend.createMany.mockResolvedValue({ count: 2 })
    mockPrisma.emailSend.updateMany.mockResolvedValue({ count: 1 })
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'msg-123' })
  })

  it('updates campaign status DRAFT → SENDING → COMPLETED', async () => {
    await sendCampaign('camp-1')

    const updateCalls = mockPrisma.emailCampaign.update.mock.calls

    // First update: SENDING
    expect(updateCalls[0][0]).toEqual(
      expect.objectContaining({
        where: { id: 'camp-1' },
        data: expect.objectContaining({ status: 'SENDING' }),
      })
    )

    // Last update: COMPLETED
    const lastCall = updateCalls[updateCalls.length - 1][0]
    expect(lastCall.data.status).toBe('COMPLETED')
    expect(lastCall.data.completedAt).toBeInstanceOf(Date)
  })

  it('sends to all active subscribers via sendEmail', async () => {
    await sendCampaign('camp-1')

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        subject: 'Test Campaign',
      })
    )
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'bob@example.com',
        subject: 'Test Campaign',
      })
    )
  })

  it('creates EmailSend records per batch', async () => {
    await sendCampaign('camp-1')

    expect(mockPrisma.emailSend.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ campaignId: 'camp-1', recipientEmail: 'alice@example.com', status: 'QUEUED' }),
        expect.objectContaining({ campaignId: 'camp-1', recipientEmail: 'bob@example.com', status: 'QUEUED' }),
      ]),
    })
  })

  it('updates sentCount and failedCount on completion', async () => {
    const result = await sendCampaign('camp-1')

    expect(result).toEqual({ success: true, sent: 2, failed: 0 })

    const lastUpdate = mockPrisma.emailCampaign.update.mock.calls.at(-1)![0]
    expect(lastUpdate.data.sentCount).toBe(2)
    expect(lastUpdate.data.failedCount).toBe(0)
  })

  it('handles campaign not found', async () => {
    mockPrisma.emailCampaign.findUnique.mockResolvedValue(null)

    const result = await sendCampaign('nonexistent')

    expect(result).toEqual({ success: false, sent: 0, failed: 0, error: 'Campaign not found' })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('handles campaign not in DRAFT status', async () => {
    mockPrisma.emailCampaign.findUnique.mockResolvedValue({
      ...mockCampaign,
      status: 'COMPLETED',
    })

    const result = await sendCampaign('camp-1')

    expect(result).toEqual({
      success: false,
      sent: 0,
      failed: 0,
      error: 'Campaign status is COMPLETED, expected DRAFT or SCHEDULED',
    })
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('allows SCHEDULED campaigns', async () => {
    mockPrisma.emailCampaign.findUnique.mockResolvedValue({
      ...mockCampaign,
      status: 'SCHEDULED',
    })

    const result = await sendCampaign('camp-1')

    expect(result.success).toBe(true)
  })

  it('handles send failure for individual recipients and continues', async () => {
    mockSendEmail
      .mockResolvedValueOnce({ success: true, messageId: 'msg-1' })
      .mockResolvedValueOnce({ success: false, error: 'Bounce' })

    const result = await sendCampaign('camp-1')

    expect(result.sent).toBe(1)
    expect(result.failed).toBe(1)

    // EmailSend record updated as FAILED for bounced recipient
    expect(mockPrisma.emailSend.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recipientEmail: 'bob@example.com' }),
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    )
  })
})
