import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/ses'
import { emailLayout } from '@/lib/email-template'
import type { DripTrigger, EnrollmentStatus } from '@prisma/client'

/**
 * Enroll an email address in all active drip sequences for a given trigger.
 * Skips if already enrolled in that sequence.
 */
export async function enrollInDrip(
  email: string,
  trigger: DripTrigger
): Promise<{ enrolled: number }> {
  const sequences = await prisma.dripSequence.findMany({
    where: { trigger, active: true },
    include: {
      steps: { orderBy: { stepOrder: 'asc' }, take: 1 },
    },
  })

  let enrolled = 0

  for (const sequence of sequences) {
    // Skip if no steps defined
    if (sequence.steps.length === 0) continue

    const firstStep = sequence.steps[0]
    const nextSendAt = new Date()
    nextSendAt.setDate(nextSendAt.getDate() + firstStep.delayDays)

    try {
      await prisma.dripEnrollment.create({
        data: {
          sequenceId: sequence.id,
          email,
          currentStep: 0,
          status: 'ACTIVE',
          nextSendAt,
        },
      })
      enrolled++
    } catch {
      // Unique constraint violation — already enrolled, skip
    }
  }

  return { enrolled }
}

/**
 * Process all drip enrollments that are due.
 * Finds enrollments where nextSendAt <= now, sends the next step email,
 * and advances the enrollment.
 */
export async function processDueSteps(): Promise<{
  processed: number
  sent: number
  failed: number
  completed: number
}> {
  const now = new Date()

  const dueEnrollments = await prisma.dripEnrollment.findMany({
    where: {
      status: 'ACTIVE',
      nextSendAt: { lte: now },
    },
    include: {
      sequence: {
        include: {
          steps: { orderBy: { stepOrder: 'asc' } },
        },
      },
    },
  })

  let processed = 0
  let sent = 0
  let failed = 0
  let completed = 0

  for (const enrollment of dueEnrollments) {
    processed++

    const nextStepOrder = enrollment.currentStep + 1
    const step = enrollment.sequence.steps.find(
      (s) => s.stepOrder === nextStepOrder
    )

    if (!step) {
      // No more steps — mark completed
      await prisma.dripEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'COMPLETED' as EnrollmentStatus,
          completedAt: new Date(),
          nextSendAt: null,
        },
      })
      completed++
      continue
    }

    // Send the email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const htmlWithFooter = emailLayout(step.htmlContent, {
      unsubscribeUrl: `${appUrl}/unsubscribe`,
    })

    const result = await sendEmail({
      to: enrollment.email,
      subject: step.subject,
      html: htmlWithFooter,
    })

    if (result.success) {
      sent++

      // Find next step to calculate nextSendAt
      const followingStep = enrollment.sequence.steps.find(
        (s) => s.stepOrder === nextStepOrder + 1
      )

      if (followingStep) {
        const nextSendAt = new Date()
        nextSendAt.setDate(nextSendAt.getDate() + followingStep.delayDays)

        await prisma.dripEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepOrder,
            nextSendAt,
          },
        })
      } else {
        // This was the last step
        await prisma.dripEnrollment.update({
          where: { id: enrollment.id },
          data: {
            currentStep: nextStepOrder,
            status: 'COMPLETED' as EnrollmentStatus,
            completedAt: new Date(),
            nextSendAt: null,
          },
        })
        completed++
      }
    } else {
      failed++
      console.error(`Drip send failed for ${enrollment.email}:`, result.error)
    }
  }

  return { processed, sent, failed, completed }
}

/**
 * Cancel a drip enrollment for a specific email and sequence.
 */
export async function cancelEnrollment(
  email: string,
  sequenceId: string
): Promise<boolean> {
  try {
    await prisma.dripEnrollment.update({
      where: { sequenceId_email: { sequenceId, email } },
      data: {
        status: 'CANCELLED' as EnrollmentStatus,
        cancelledAt: new Date(),
        nextSendAt: null,
      },
    })
    return true
  } catch {
    return false
  }
}

/**
 * Cancel all active drip enrollments for an email address.
 * Useful when a user unsubscribes entirely.
 */
export async function cancelAllEnrollments(email: string): Promise<number> {
  const result = await prisma.dripEnrollment.updateMany({
    where: { email, status: 'ACTIVE' },
    data: {
      status: 'CANCELLED' as EnrollmentStatus,
      cancelledAt: new Date(),
      nextSendAt: null,
    },
  })
  return result.count
}
