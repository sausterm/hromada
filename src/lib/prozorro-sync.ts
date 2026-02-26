/**
 * Prozorro procurement sync logic.
 *
 * Two-phase daily sync:
 * 1. discoverTenders() — scan the Prozorro feed for new tenders matching
 *    watched EDRPOUs and notify the admin for manual review/linking.
 * 2. pollLinkedTenders() — check already-linked tenders for status changes.
 */

import { prisma } from '@/lib/prisma'
import {
  getProzorroTender,
  getProzorroFeed,
  getStatusMessage,
  getProzorroUrl,
} from '@/lib/prozorro'
import { sendProjectUpdateEmail, sendProzorroMatchEmail } from '@/lib/email'

// ---------------------------------------------------------------------------
// Discover new tenders for funded projects (notify admin, no auto-linking)
// ---------------------------------------------------------------------------

const CRON_STATE_KEY = 'prozorro-discovery'
const MAX_PAGES = 500 // Safety cap: ~50K items per run
const ACTIVE_TENDER_STATUSES = new Set([
  'active.enquiries',
  'active.tendering',
  'active.auction',
  'active.qualification',
  'active.awarded',
])

export interface DiscoveryResult {
  pagesScanned: number
  feedItemsProcessed: number
  matchesFound: number
  errors: string[]
}

/**
 * Scan the Prozorro feed for new tenders matching funded projects' EDRPOUs.
 * Does NOT auto-link — creates an internal ProjectUpdate and emails the admin
 * so they can review on Prozorro and manually link the correct tender.
 */
export async function discoverTenders(): Promise<DiscoveryResult> {
  const result: DiscoveryResult = {
    pagesScanned: 0,
    feedItemsProcessed: 0,
    matchesFound: 0,
    errors: [],
  }

  // 1. Build watchlist: funded projects with EDRPOU but no linked tender
  //    Project doesn't have a direct donations relation, so query in two steps.
  const candidateProjects = await prisma.project.findMany({
    where: {
      edrpou: { not: null },
      prozorroTenderId: null,
    },
    select: {
      id: true,
      facilityName: true,
      edrpou: true,
    },
  })

  // Filter to only projects with at least one forwarded/completed donation
  const fundedProjectIds = new Set(
    (
      await prisma.donation.findMany({
        where: {
          projectId: { in: candidateProjects.map((p) => p.id) },
          status: { in: ['FORWARDED', 'COMPLETED'] },
        },
        select: { projectId: true },
        distinct: ['projectId'],
      })
    ).map((d) => d.projectId)
  )

  const watchedProjects = candidateProjects.filter((p) => fundedProjectIds.has(p.id))

  if (watchedProjects.length === 0) {
    console.log('[prozorro-discover] No funded projects with EDRPOUs to watch')
    return result
  }

  // Build map: EDRPOU → projects
  const watchlist = new Map<string, typeof watchedProjects>()
  for (const project of watchedProjects) {
    if (!project.edrpou) continue
    const existing = watchlist.get(project.edrpou) ?? []
    existing.push(project)
    watchlist.set(project.edrpou, existing)
  }

  console.log(
    `[prozorro-discover] Watching ${watchlist.size} EDRPOU(s) across ${watchedProjects.length} project(s)`
  )

  // 2. Read last offset from CronState
  let offset: string | undefined
  const cronState = await prisma.cronState.findUnique({
    where: { id: CRON_STATE_KEY },
  })
  if (cronState) {
    offset = JSON.parse(cronState.value).offset
    console.log(`[prozorro-discover] Resuming from offset: ${offset}`)
  } else {
    // First run: start from 2 weeks ago
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    offset = twoWeeksAgo.toISOString()
    console.log(`[prozorro-discover] First run, starting from: ${offset}`)
  }

  // 3. Page through Prozorro feed (ascending from offset)
  let lastOffset = offset
  let emptyPages = 0

  for (let page = 0; page < MAX_PAGES; page++) {
    try {
      const feed = await getProzorroFeed({
        offset: lastOffset,
        limit: 100,
        descending: false,
        optFields: ['procuringEntity', 'status', 'tenderID'],
      })

      result.pagesScanned++

      if (feed.data.length === 0) {
        break
      }

      result.feedItemsProcessed += feed.data.length

      for (const item of feed.data) {
        const edrpou = item.procuringEntity?.identifier?.id
        if (!edrpou || !watchlist.has(edrpou)) continue
        if (!item.status || !ACTIVE_TENDER_STATUSES.has(item.status)) continue

        const projects = watchlist.get(edrpou)!
        const tenderDisplayId = item.tenderID ?? item.id
        const entityName = item.procuringEntity?.name ?? edrpou

        // Notify admin for each matching project
        for (const project of projects) {
          try {
            // Dedup: check if we already notified about this tender for this project
            const existing = await prisma.projectUpdate.findFirst({
              where: {
                projectId: project.id,
                type: 'PROZORRO_STATUS',
                metadata: {
                  path: ['tenderUuid'],
                  equals: item.id,
                },
              },
            })

            if (existing) continue

            console.log(
              `[prozorro-discover] Match: tender ${tenderDisplayId} from "${entityName}" ` +
              `→ project "${project.facilityName}" (EDRPOU ${edrpou})`
            )

            // Create internal project update (not visible to donors)
            await prisma.projectUpdate.create({
              data: {
                projectId: project.id,
                type: 'PROZORRO_STATUS',
                isPublic: false,
                title: 'Potential Prozorro match',
                message: `Tender ${tenderDisplayId} from ${entityName} may be related to this project. Admin review required.`,
                metadata: {
                  tenderUuid: item.id,
                  tenderID: tenderDisplayId,
                  entityName,
                  status: item.status,
                  prozorroUrl: getProzorroUrl(tenderDisplayId),
                  pendingReview: true,
                },
              },
            })

            // Email admin
            await sendProzorroMatchEmail({
              facilityName: project.facilityName,
              edrpou,
              tenderID: tenderDisplayId,
              entityName,
              tenderStatus: item.status,
              prozorroUrl: getProzorroUrl(tenderDisplayId),
            })

            result.matchesFound++
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            console.error(
              `[prozorro-discover] Error notifying match for "${project.facilityName}": ${msg}`
            )
            result.errors.push(`Notify error (${project.facilityName}): ${msg}`)
          }
        }
      }

      // Advance offset
      const newOffset = feed.next_page?.offset
      if (!newOffset || newOffset === lastOffset) {
        emptyPages++
        if (emptyPages >= 3) break // Stuck at same offset — stop
      } else {
        emptyPages = 0
        lastOffset = newOffset
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[prozorro-discover] Feed page error: ${msg}`)
      result.errors.push(`Feed error: ${msg}`)
      break // Don't continue on feed errors — save progress
    }
  }

  // 4. Save final offset to CronState
  if (lastOffset) {
    await prisma.cronState.upsert({
      where: { id: CRON_STATE_KEY },
      create: {
        id: CRON_STATE_KEY,
        value: JSON.stringify({ offset: lastOffset }),
      },
      update: {
        value: JSON.stringify({ offset: lastOffset }),
      },
    })
    console.log(`[prozorro-discover] Saved offset: ${lastOffset}`)
  }

  console.log(
    `[prozorro-discover] Done: ${result.pagesScanned} pages, ` +
    `${result.feedItemsProcessed} items, ${result.matchesFound} matches notified`
  )

  return result
}

// ---------------------------------------------------------------------------
// Poll status changes on linked tenders
// ---------------------------------------------------------------------------

export interface PollResult {
  tendersPolled: number
  statusChanges: number
  errors: string[]
}

const TERMINAL_STATUSES = new Set(['complete', 'cancelled', 'unsuccessful'])

/**
 * Check linked Prozorro tenders for status changes.
 * Creates ProjectUpdate records and emails donors on changes.
 */
export async function pollLinkedTenders(): Promise<PollResult> {
  const result: PollResult = { tendersPolled: 0, statusChanges: 0, errors: [] }

  const projects = await prisma.project.findMany({
    where: {
      prozorroTenderUuid: { not: null },
      prozorroStatus: { notIn: [...TERMINAL_STATUSES] },
    },
  })

  if (projects.length === 0) {
    console.log('[prozorro-poll] No linked tenders to poll')
    return result
  }

  console.log(`[prozorro-poll] Polling ${projects.length} linked tenders`)

  for (const project of projects) {
    if (!project.prozorroTenderUuid || !project.prozorroTenderId) continue
    result.tendersPolled++

    try {
      const tender = await getProzorroTender(project.prozorroTenderUuid)

      if (tender.status !== project.prozorroStatus) {
        const oldStatus = project.prozorroStatus
        const newStatus = tender.status

        console.log(
          `[prozorro-poll] Status change for "${project.facilityName}": ${oldStatus} → ${newStatus}`
        )

        // Update project
        await prisma.project.update({
          where: { id: project.id },
          data: {
            prozorroStatus: newStatus,
            prozorroLastSync: new Date(),
          },
        })

        // Create project update
        await prisma.projectUpdate.create({
          data: {
            projectId: project.id,
            type: 'PROZORRO_STATUS',
            title: `Procurement update: ${newStatus}`,
            message: getStatusMessage(newStatus),
            metadata: {
              tenderID: project.prozorroTenderId,
              oldStatus,
              newStatus,
              prozorroUrl: getProzorroUrl(project.prozorroTenderId),
            },
          },
        })

        // Email donors
        await notifyDonors(project.id, project.facilityName, {
          title: `Procurement update: ${newStatus}`,
          message: getStatusMessage(newStatus),
          tenderID: project.prozorroTenderId,
        })

        result.statusChanges++
      } else {
        // No change, just update sync timestamp
        await prisma.project.update({
          where: { id: project.id },
          data: { prozorroLastSync: new Date() },
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[prozorro-poll] Error polling tender for "${project.facilityName}": ${msg}`)
      result.errors.push(msg)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Find all donors for a project and send them an update email.
 */
export async function notifyDonors(
  projectId: string,
  projectName: string,
  update: { title: string; message: string; tenderID: string }
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
    console.log(`[prozorro-notify] No donors to notify for project ${projectId}`)
    return
  }

  console.log(`[prozorro-notify] Notifying ${donations.length} donor(s) for "${projectName}"`)

  for (const donor of donations) {
    try {
      await sendProjectUpdateEmail({
        donorName: donor.donorName,
        donorEmail: donor.donorEmail,
        projectName,
        updateTitle: update.title,
        updateMessage: update.message,
        tenderID: update.tenderID,
      })
    } catch (err) {
      console.error(`[prozorro-notify] Failed to email ${donor.donorEmail}:`, err)
    }
  }
}
