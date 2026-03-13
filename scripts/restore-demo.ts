/**
 * Restore demo projects from prisma/demo-data.json
 * Use on dev branches to get demo data back after swap-projects.ts.
 *
 * This will DELETE all current projects and replace them with demo data.
 *
 * Run with: npx tsx scripts/restore-demo.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const DATA_PATH = join(__dirname, '..', 'prisma', 'demo-data.json')

async function main() {
  if (!existsSync(DATA_PATH)) {
    console.error(`Demo data file not found: ${DATA_PATH}`)
    console.error('Run scripts/export-projects.ts first to generate it.')
    process.exit(1)
  }

  const raw = readFileSync(DATA_PATH, 'utf-8')
  const projects = JSON.parse(raw)

  console.log(`Restoring ${projects.length} demo projects from ${DATA_PATH}\n`)

  // ── Delete existing projects ──
  console.log('Clearing existing data...')
  await prisma.featuredProject.deleteMany()
  await prisma.projectImage.deleteMany()
  await prisma.projectDocument.deleteMany()
  await prisma.projectUpdate.deleteMany()
  await prisma.contactSubmission.deleteMany()
  await prisma.project.deleteMany()
  console.log('  Done\n')

  // ── Restore projects ──
  let created = 0
  let errors = 0

  for (const p of projects) {
    try {
      // Separate out relations
      const { photos, documents, updates, contactSubmissions, featuredSlot, ...projectData } = p

      // Remove auto-generated fields that Prisma will handle
      delete projectData.createdAt
      delete projectData.updatedAt

      // Create project
      await prisma.project.create({
        data: {
          ...projectData,
          // Convert decimal strings back to numbers
          estimatedCostUsd: projectData.estimatedCostUsd ? Number(projectData.estimatedCostUsd) : null,
          technicalPowerKw: projectData.technicalPowerKw ? Number(projectData.technicalPowerKw) : null,
          // Recreate relations
          photos: {
            create: (photos || []).map((img: any) => ({
              id: img.id,
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder,
            })),
          },
          documents: {
            create: (documents || []).map((doc: any) => ({
              id: doc.id,
              url: doc.url,
              filename: doc.filename,
              documentType: doc.documentType,
              label: doc.label,
              labelUk: doc.labelUk,
              originalTextUk: doc.originalTextUk,
              translatedTextEn: doc.translatedTextEn,
              extractionStatus: doc.extractionStatus,
              fileSize: doc.fileSize,
            })),
          },
        },
      })

      // Restore featured slot if present
      if (featuredSlot) {
        await prisma.featuredProject.create({
          data: {
            projectId: p.id,
            slot: featuredSlot.slot,
          },
        })
      }

      created++
    } catch (err) {
      console.error(`  Failed to restore ${p.municipalityName} — ${p.facilityName}:`, err)
      errors++
    }
  }

  console.log(`\nRestored ${created} projects (${errors} errors)`)

  const totalPhotos = await prisma.projectImage.count()
  const totalDocs = await prisma.projectDocument.count()
  const totalFeatured = await prisma.featuredProject.count()
  console.log(`  Photos: ${totalPhotos}`)
  console.log(`  Documents: ${totalDocs}`)
  console.log(`  Featured: ${totalFeatured}`)
}

main()
  .catch((e) => {
    console.error('Restore failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
