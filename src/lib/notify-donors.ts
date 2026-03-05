import { prisma } from '@/lib/prisma'
import { sendProjectUpdateEmail } from '@/lib/email'

/**
 * Find all donors for a project and send them an update email.
 */
export async function notifyDonors(
  projectId: string,
  projectName: string,
  update: { title: string; message: string; tenderID?: string }
) {
  const donations = await prisma.donation.findMany({
    where: {
      projectId,
      status: { in: ['FORWARDED', 'COMPLETED'] },
    },
    select: { donorName: true, donorEmail: true },
    distinct: ['donorEmail'],
  })

  if (donations.length === 0) {
    console.log(`[notify-donors] No donors to notify for project ${projectId}`)
    return
  }

  console.log(`[notify-donors] Notifying ${donations.length} donor(s) for "${projectName}"`)

  for (const donor of donations) {
    try {
      await sendProjectUpdateEmail({
        donorName: donor.donorName,
        donorEmail: donor.donorEmail,
        projectName,
        projectId,
        updateTitle: update.title,
        updateMessage: update.message,
        tenderID: update.tenderID,
      })
    } catch (err) {
      console.error(`[notify-donors] Failed to email ${donor.donorEmail}:`, err)
    }
  }
}
