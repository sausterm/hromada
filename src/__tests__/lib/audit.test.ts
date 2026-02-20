/**
 * @jest-environment node
 */

jest.mock('@/lib/prisma', () => ({
  prisma: {
    transactionEvent: {
      create: jest.fn(),
    },
  },
}))

import { logTransactionEvent, buildTransactionEventCreate, TransactionAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

describe('audit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('logTransactionEvent', () => {
    it('creates a transaction event record', async () => {
      ;(prisma.transactionEvent.create as jest.Mock).mockResolvedValue({})

      await logTransactionEvent({
        transactionType: 'DONATION',
        transactionId: 'don-1',
        action: TransactionAction.DONATION_CREATED,
        amount: 50000,
        currency: 'USD',
        paymentMethod: 'wire',
      })

      expect(prisma.transactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionType: 'DONATION',
          transactionId: 'don-1',
          action: 'DONATION_CREATED',
          currency: 'USD',
          paymentMethod: 'wire',
        }),
      })
    })

    it('handles optional fields with defaults', async () => {
      ;(prisma.transactionEvent.create as jest.Mock).mockResolvedValue({})

      await logTransactionEvent({
        transactionType: 'WIRE_TRANSFER',
        transactionId: 'wt-1',
        action: TransactionAction.WIRE_CREATED,
      })

      expect(prisma.transactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionType: 'WIRE_TRANSFER',
          transactionId: 'wt-1',
          currency: 'USD',
          previousStatus: null,
          newStatus: null,
          actorId: null,
        }),
      })
    })

    it('does not throw on database error', async () => {
      ;(prisma.transactionEvent.create as jest.Mock).mockRejectedValue(new Error('DB error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      await expect(
        logTransactionEvent({
          transactionType: 'DONATION',
          transactionId: 'don-1',
          action: TransactionAction.DONATION_CREATED,
        })
      ).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT]'),
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('logs status changes', async () => {
      ;(prisma.transactionEvent.create as jest.Mock).mockResolvedValue({})

      await logTransactionEvent({
        transactionType: 'DONATION',
        transactionId: 'don-1',
        action: TransactionAction.DONATION_STATUS_CHANGED,
        previousStatus: 'PENDING_CONFIRMATION',
        newStatus: 'RECEIVED',
        actorId: 'admin-1',
        actorRole: 'ADMIN',
      })

      expect(prisma.transactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          previousStatus: 'PENDING_CONFIRMATION',
          newStatus: 'RECEIVED',
          actorId: 'admin-1',
          actorRole: 'ADMIN',
        }),
      })
    })

    it('handles metadata', async () => {
      ;(prisma.transactionEvent.create as jest.Mock).mockResolvedValue({})

      await logTransactionEvent({
        transactionType: 'DONATION',
        transactionId: 'don-1',
        action: TransactionAction.DONATION_NOTE_ADDED,
        metadata: { note: 'Test note', source: 'admin' },
      })

      expect(prisma.transactionEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { note: 'Test note', source: 'admin' },
        }),
      })
    })
  })

  describe('buildTransactionEventCreate', () => {
    it('returns a Prisma create operation', () => {
      const result = buildTransactionEventCreate({
        transactionType: 'DONATION',
        transactionId: 'don-1',
        action: TransactionAction.DONATION_CREATED,
      })

      expect(prisma.transactionEvent.create).toHaveBeenCalled()
    })
  })

  describe('TransactionAction', () => {
    it('exports expected action constants', () => {
      expect(TransactionAction.DONATION_CREATED).toBe('DONATION_CREATED')
      expect(TransactionAction.DONATION_STATUS_CHANGED).toBe('DONATION_STATUS_CHANGED')
      expect(TransactionAction.WIRE_CREATED).toBe('WIRE_CREATED')
      expect(TransactionAction.WIRE_STATUS_CHANGED).toBe('WIRE_STATUS_CHANGED')
    })
  })
})
