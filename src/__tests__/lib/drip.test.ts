/**
 * @jest-environment node
 */

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    dripSequence: {
      findMany: jest.fn(),
    },
    dripEnrollment: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}))

// Mock SES
const mockSendEmail = jest.fn()
jest.mock('@/lib/ses', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import {
  enrollInDrip,
  processDueSteps,
  cancelEnrollment,
  cancelAllEnrollments,
} from '@/lib/drip'
import { prisma } from '@/lib/prisma'

const mockPrisma = prisma as unknown as {
  dripSequence: { findMany: jest.Mock }
  dripEnrollment: {
    create: jest.Mock
    findMany: jest.Mock
    update: jest.Mock
    updateMany: jest.Mock
  }
}

describe('drip module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('enrollInDrip', () => {
    it('creates enrollment for matching active sequences', async () => {
      mockPrisma.dripSequence.findMany.mockResolvedValue([
        {
          id: 'seq-1',
          trigger: 'NEWSLETTER_SIGNUP',
          active: true,
          steps: [{ id: 'step-1', stepOrder: 1, delayDays: 3 }],
        },
      ])
      mockPrisma.dripEnrollment.create.mockResolvedValue({ id: 'enr-1' })

      const result = await enrollInDrip('user@example.com', 'NEWSLETTER_SIGNUP' as never)

      expect(result).toEqual({ enrolled: 1 })
      expect(mockPrisma.dripEnrollment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sequenceId: 'seq-1',
          email: 'user@example.com',
          currentStep: 0,
          status: 'ACTIVE',
          nextSendAt: expect.any(Date),
        }),
      })
    })

    it('skips if already enrolled (unique constraint violation)', async () => {
      mockPrisma.dripSequence.findMany.mockResolvedValue([
        {
          id: 'seq-1',
          trigger: 'NEWSLETTER_SIGNUP',
          active: true,
          steps: [{ id: 'step-1', stepOrder: 1, delayDays: 1 }],
        },
      ])
      mockPrisma.dripEnrollment.create.mockRejectedValue(
        new Error('Unique constraint failed')
      )

      const result = await enrollInDrip('user@example.com', 'NEWSLETTER_SIGNUP' as never)

      expect(result).toEqual({ enrolled: 0 })
    })

    it('handles no active sequences for trigger', async () => {
      mockPrisma.dripSequence.findMany.mockResolvedValue([])

      const result = await enrollInDrip('user@example.com', 'NEWSLETTER_SIGNUP' as never)

      expect(result).toEqual({ enrolled: 0 })
      expect(mockPrisma.dripEnrollment.create).not.toHaveBeenCalled()
    })

    it('skips sequences with no steps defined', async () => {
      mockPrisma.dripSequence.findMany.mockResolvedValue([
        { id: 'seq-1', trigger: 'NEWSLETTER_SIGNUP', active: true, steps: [] },
      ])

      const result = await enrollInDrip('user@example.com', 'NEWSLETTER_SIGNUP' as never)

      expect(result).toEqual({ enrolled: 0 })
      expect(mockPrisma.dripEnrollment.create).not.toHaveBeenCalled()
    })
  })

  describe('processDueSteps', () => {
    it('sends email for due steps and advances currentStep', async () => {
      mockPrisma.dripEnrollment.findMany.mockResolvedValue([
        {
          id: 'enr-1',
          email: 'user@example.com',
          currentStep: 0,
          status: 'ACTIVE',
          sequence: {
            steps: [
              { stepOrder: 1, subject: 'Step 1', htmlContent: '<p>Step 1</p>', delayDays: 1 },
              { stepOrder: 2, subject: 'Step 2', htmlContent: '<p>Step 2</p>', delayDays: 3 },
            ],
          },
        },
      ])
      mockSendEmail.mockResolvedValue({ success: true })
      mockPrisma.dripEnrollment.update.mockResolvedValue({})

      const result = await processDueSteps()

      expect(result).toEqual({ processed: 1, sent: 1, failed: 0, completed: 0 })
      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Step 1',
        })
      )
      expect(mockPrisma.dripEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: expect.objectContaining({ currentStep: 1, nextSendAt: expect.any(Date) }),
      })
    })

    it('marks enrollment COMPLETED when last step is sent', async () => {
      mockPrisma.dripEnrollment.findMany.mockResolvedValue([
        {
          id: 'enr-1',
          email: 'user@example.com',
          currentStep: 1, // Already sent step 1
          status: 'ACTIVE',
          sequence: {
            steps: [
              { stepOrder: 1, subject: 'Step 1', htmlContent: '<p>1</p>', delayDays: 1 },
              { stepOrder: 2, subject: 'Step 2', htmlContent: '<p>2</p>', delayDays: 3 },
            ],
          },
        },
      ])
      mockSendEmail.mockResolvedValue({ success: true })
      mockPrisma.dripEnrollment.update.mockResolvedValue({})

      const result = await processDueSteps()

      expect(result.completed).toBe(1)
      expect(result.sent).toBe(1)
      expect(mockPrisma.dripEnrollment.update).toHaveBeenCalledWith({
        where: { id: 'enr-1' },
        data: expect.objectContaining({
          currentStep: 2,
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          nextSendAt: null,
        }),
      })
    })

    it('marks enrollment COMPLETED when no more steps exist', async () => {
      mockPrisma.dripEnrollment.findMany.mockResolvedValue([
        {
          id: 'enr-1',
          email: 'user@example.com',
          currentStep: 2, // Already past all steps
          status: 'ACTIVE',
          sequence: {
            steps: [
              { stepOrder: 1, subject: 'Step 1', htmlContent: '<p>1</p>', delayDays: 1 },
            ],
          },
        },
      ])
      mockPrisma.dripEnrollment.update.mockResolvedValue({})

      const result = await processDueSteps()

      expect(result.completed).toBe(1)
      expect(result.sent).toBe(0)
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('handles send failure gracefully (does not advance step)', async () => {
      mockPrisma.dripEnrollment.findMany.mockResolvedValue([
        {
          id: 'enr-1',
          email: 'user@example.com',
          currentStep: 0,
          status: 'ACTIVE',
          sequence: {
            steps: [
              { stepOrder: 1, subject: 'Step 1', htmlContent: '<p>1</p>', delayDays: 1 },
            ],
          },
        },
      ])
      mockSendEmail.mockResolvedValue({ success: false, error: 'Bounce' })
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await processDueSteps()

      expect(result.failed).toBe(1)
      expect(result.sent).toBe(0)
      expect(mockPrisma.dripEnrollment.update).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('handles no due enrollments', async () => {
      mockPrisma.dripEnrollment.findMany.mockResolvedValue([])

      const result = await processDueSteps()

      expect(result).toEqual({ processed: 0, sent: 0, failed: 0, completed: 0 })
    })
  })

  describe('cancelEnrollment', () => {
    it('marks enrollment as CANCELLED', async () => {
      mockPrisma.dripEnrollment.update.mockResolvedValue({})

      const result = await cancelEnrollment('user@example.com', 'seq-1')

      expect(result).toBe(true)
      expect(mockPrisma.dripEnrollment.update).toHaveBeenCalledWith({
        where: { sequenceId_email: { sequenceId: 'seq-1', email: 'user@example.com' } },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          nextSendAt: null,
        }),
      })
    })

    it('returns false if enrollment not found', async () => {
      mockPrisma.dripEnrollment.update.mockRejectedValue(new Error('Not found'))

      const result = await cancelEnrollment('unknown@example.com', 'seq-1')

      expect(result).toBe(false)
    })
  })

  describe('cancelAllEnrollments', () => {
    it('cancels all active enrollments for email', async () => {
      mockPrisma.dripEnrollment.updateMany.mockResolvedValue({ count: 3 })

      const result = await cancelAllEnrollments('user@example.com')

      expect(result).toBe(3)
      expect(mockPrisma.dripEnrollment.updateMany).toHaveBeenCalledWith({
        where: { email: 'user@example.com', status: 'ACTIVE' },
        data: expect.objectContaining({
          status: 'CANCELLED',
          cancelledAt: expect.any(Date),
          nextSendAt: null,
        }),
      })
    })

    it('returns 0 when no active enrollments exist', async () => {
      mockPrisma.dripEnrollment.updateMany.mockResolvedValue({ count: 0 })

      const result = await cancelAllEnrollments('nobody@example.com')

      expect(result).toBe(0)
    })
  })
})
