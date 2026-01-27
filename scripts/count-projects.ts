import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const total = await prisma.project.count()
  const byType = await prisma.project.groupBy({
    by: ['projectType'],
    _count: { id: true }
  })
  const byCategory = await prisma.project.groupBy({
    by: ['category'],
    _count: { id: true }
  })

  console.log(`\n📊 Project Statistics:`)
  console.log(`   Total projects: ${total}`)
  console.log(`\n   By Project Type:`)
  byType.forEach(t => console.log(`   - ${t.projectType || 'None'}: ${t._count.id}`))
  console.log(`\n   By Category:`)
  byCategory.forEach(c => console.log(`   - ${c.category}: ${c._count.id}`))

  // Show a few sample projects
  const samples = await prisma.project.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { municipalityName: true, facilityName: true, projectType: true, estimatedCostUsd: true }
  })
  console.log(`\n   Recent projects:`)
  samples.forEach(p => console.log(`   - ${p.municipalityName}: ${p.facilityName} ($${p.estimatedCostUsd?.toLocaleString() || 'TBD'})`))
}

main()
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
