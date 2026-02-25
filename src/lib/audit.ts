import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type TransactionType = 'DONATION' | 'WIRE_TRANSFER'

export const TransactionAction = {
  // Donation lifecycle
  DONATION_CREATED: 'DONATION_CREATED',
  DONATION_STATUS_CHANGED: 'DONATION_STATUS_CHANGED',
  DONATION_AMOUNT_UPDATED: 'DONATION_AMOUNT_UPDATED',
  DONATION_ALLOCATED: 'DONATION_ALLOCATED',       // Assigned to wire transfer batch
  DONATION_FORWARDED: 'DONATION_FORWARDED',       // Wire sent to Ukraine, receipt generated
  DONATION_NOTE_ADDED: 'DONATION_NOTE_ADDED',

  // Wire transfer lifecycle
  WIRE_CREATED: 'WIRE_CREATED',
  WIRE_STATUS_CHANGED: 'WIRE_STATUS_CHANGED',
  WIRE_NOTE_ADDED: 'WIRE_NOTE_ADDED',
} as const

export type TransactionActionType = (typeof TransactionAction)[keyof typeof TransactionAction]

interface TransactionEventInput {
  transactionType: TransactionType
  transactionId: string
  action: string
  previousStatus?: string
  newStatus?: string
  amount?: number | Prisma.Decimal
  currency?: string
  paymentMethod?: string
  referenceNumber?: string
  actorId?: string
  actorRole?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
}

/**
 * Log a financial transaction event to the append-only audit trail.
 * Non-blocking — catches errors and logs to console to avoid breaking requests.
 */
export async function logTransactionEvent(params: TransactionEventInput): Promise<void> {
  try {
    await prisma.transactionEvent.create({
      data: {
        transactionType: params.transactionType,
        transactionId: params.transactionId,
        action: params.action,
        previousStatus: params.previousStatus ?? null,
        newStatus: params.newStatus ?? null,
        amount: params.amount != null ? new Prisma.Decimal(params.amount.toString()) : null,
        currency: params.currency ?? 'USD',
        paymentMethod: params.paymentMethod ?? null,
        referenceNumber: params.referenceNumber ?? null,
        actorId: params.actorId ?? null,
        actorRole: params.actorRole ?? null,
        ipAddress: params.ipAddress ?? null,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    })
  } catch (error) {
    console.error('[AUDIT] Failed to log transaction event:', error)
  }
}

/**
 * Build a Prisma transaction event create operation for use inside $transaction.
 * Use this when the audit log must be atomic with a status change.
 *
 * Example:
 *   await prisma.$transaction([
 *     prisma.donation.update({ where: { id }, data: { status: 'RECEIVED' } }),
 *     buildTransactionEventCreate({ ... }),
 *   ])
 */
export function buildTransactionEventCreate(params: TransactionEventInput) {
  return prisma.transactionEvent.create({
    data: {
      transactionType: params.transactionType,
      transactionId: params.transactionId,
      action: params.action,
      previousStatus: params.previousStatus ?? null,
      newStatus: params.newStatus ?? null,
      amount: params.amount != null ? new Prisma.Decimal(params.amount.toString()) : null,
      currency: params.currency ?? 'USD',
      paymentMethod: params.paymentMethod ?? null,
      referenceNumber: params.referenceNumber ?? null,
      actorId: params.actorId ?? null,
      actorRole: params.actorRole ?? null,
      ipAddress: params.ipAddress ?? null,
      metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })
}
