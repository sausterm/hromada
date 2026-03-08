/**
 * Export all demo projects (with relations) to prisma/demo-data.json
 * Run with: npx tsx scripts/export-projects.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { writeFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Exporting all projects with relations...\n')

  const projects = await prisma.project.findMany({
    include: {
      photos: true,
      documents: true,
      updates: true,
      contactSubmissions: true,
      featuredSlot: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Found ${projects.length} projects`)

  // Serialize Decimal fields to strings for JSON compatibility
  const serialized = JSON.parse(
    JSON.stringify(projects, (_key, value) =>
      typeof value === 'object' && value !== null && 'toFixed' in value
        ? value.toString()
        : value
    )
  )

  const outPath = join(__dirname, '..', 'prisma', 'demo-data.json')
  writeFileSync(outPath, JSON.stringify(serialized, null, 2))
  console.log(`\nExported ${projects.length} projects to ${outPath}`)

  // Summary
  const totalPhotos = projects.reduce((n, p) => n + p.photos.length, 0)
  const totalDocs = projects.reduce((n, p) => n + p.documents.length, 0)
  const totalUpdates = projects.reduce((n, p) => n + p.updates.length, 0)
  const totalSubmissions = projects.reduce((n, p) => n + p.contactSubmissions.length, 0)
  const totalFeatured = projects.filter(p => p.featuredSlot).length

  console.log(`  Photos: ${totalPhotos}`)
  console.log(`  Documents: ${totalDocs}`)
  console.log(`  Updates: ${totalUpdates}`)
  console.log(`  Contact submissions: ${totalSubmissions}`)
  console.log(`  Featured slots: ${totalFeatured}`)
}

main()
  .catch((e) => {
    console.error('Export failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
