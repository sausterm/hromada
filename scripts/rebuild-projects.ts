/**
 * Rebuild project list: keep only documented projects (Samar Hospital Solar),
 * add Lychkove Water Tower, upload real PDF documentation, remove fake slide docs.
 *
 * Run with: npx tsx scripts/rebuild-projects.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'

config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)
const BUCKET = 'project-images'

const KOSTIA_USER_ID = 'cml9ginja0003h4uvf9e2wb9h'

// ── PDF documentation to upload ──
interface DocUpload {
  localPath: string
  storagePath: string
  filename: string
  documentType: 'COST_ESTIMATE' | 'ENGINEERING_ASSESSMENT' | 'SITE_SURVEY' | 'ITEMIZED_BUDGET' | 'OTHER'
  label: string
  labelUk: string
}

const SAMAR_DOCS: DocUpload[] = [
  {
    localPath: 'Samar/Технічний звіт даху Самари.pdf',
    storagePath: 'documents/ecoaction/samar-technical-report.pdf',
    filename: 'Технічний звіт даху Самари.pdf',
    documentType: 'ENGINEERING_ASSESSMENT',
    label: 'Technical Roof Assessment Report',
    labelUk: 'Технічний звіт обстеження даху',
  },
  {
    localPath: 'Samar/Кошторис СЕС дах Самар.pdf',
    storagePath: 'documents/ecoaction/samar-cost-estimate.pdf',
    filename: 'Кошторис СЕС дах Самар.pdf',
    documentType: 'COST_ESTIMATE',
    label: 'Solar Installation Cost Estimate',
    labelUk: 'Кошторис сонячної електростанції',
  },
  {
    localPath: 'Samar/РП СЕС дах Самар.pdf',
    storagePath: 'documents/ecoaction/samar-engineering-drawings.pdf',
    filename: 'РП СЕС дах Самар.pdf',
    documentType: 'ENGINEERING_ASSESSMENT',
    label: 'Engineering Design & Drawings',
    labelUk: 'Робочий проєкт сонячної електростанції',
  },
]

const LYCHKOVE_DOCS: DocUpload[] = [
  {
    localPath: 'Lychkove/Кошторис вихід.pdf',
    storagePath: 'documents/ecoaction/lychkove-cost-estimate.pdf',
    filename: 'Кошторис вихід.pdf',
    documentType: 'COST_ESTIMATE',
    label: 'Solar Installation Cost Estimate',
    labelUk: 'Кошторис сонячної електростанції',
  },
  {
    localPath: 'Lychkove/РП СЕС Личкове .pdf',
    storagePath: 'documents/ecoaction/lychkove-engineering-drawings.pdf',
    filename: 'РП СЕС Личкове.pdf',
    documentType: 'ENGINEERING_ASSESSMENT',
    label: 'Engineering Design & Drawings',
    labelUk: 'Робочий проєкт сонячної електростанції',
  },
]

// ── Upload PDF to Supabase ──
async function uploadPdf(doc: DocUpload): Promise<string> {
  const fullPath = `/Users/thomasprotzmann/hromada/${doc.localPath}`
  if (!existsSync(fullPath)) throw new Error(`File not found: ${fullPath}`)

  const buffer = readFileSync(fullPath)
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(1)
  console.log(`  Uploading ${doc.filename} (${sizeMB}MB)...`)

  // Remove existing file if any
  await supabase.storage.from(BUCKET).remove([doc.storagePath])

  const { error } = await supabase.storage.from(BUCKET).upload(doc.storagePath, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })
  if (error) throw new Error(`Upload failed for ${doc.filename}: ${error.message}`)

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(doc.storagePath)
  return urlData.publicUrl
}

async function main() {
  // ── 1. Find Samar Hospital Solar project (the one we keep) ──
  const samarProject = await prisma.project.findFirst({
    where: {
      municipalityName: 'Samar',
      facilityName: { contains: 'Surgical' },
    },
  })
  if (!samarProject) throw new Error('Samar Hospital Solar project not found')
  console.log(`✓ Found Samar project: ${samarProject.id}`)

  // ── 2. Delete all OTHER projects and their relations ──
  const allProjects = await prisma.project.findMany({ select: { id: true, facilityName: true } })
  const toDelete = allProjects.filter((p) => p.id !== samarProject.id)

  console.log(`\nDeleting ${toDelete.length} undocumented projects...`)
  for (const p of toDelete) {
    console.log(`  Removing: ${p.facilityName}`)
  }

  const deleteIds = toDelete.map((p) => p.id)

  // Delete in dependency order
  await prisma.featuredProject.deleteMany({ where: { projectId: { in: deleteIds } } })
  await prisma.projectImage.deleteMany({ where: { projectId: { in: deleteIds } } })
  await prisma.projectDocument.deleteMany({ where: { projectId: { in: deleteIds } } })
  await prisma.projectUpdate.deleteMany({ where: { projectId: { in: deleteIds } } })
  await prisma.contactSubmission.deleteMany({ where: { projectId: { in: deleteIds } } })

  // Delete submissions for these projects
  const projectNames = toDelete.map((p) => p.facilityName)
  // ProjectSubmission doesn't have projectId — find by facility name
  for (const p of toDelete) {
    await prisma.projectSubmission.deleteMany({ where: { facilityName: p.facilityName } })
  }

  await prisma.project.deleteMany({ where: { id: { in: deleteIds } } })
  console.log(`✓ Deleted ${toDelete.length} projects`)

  // ── 3. Remove fake slide-screenshot doc from Samar ──
  const samarFakeDocs = await prisma.projectDocument.findMany({
    where: { projectId: samarProject.id },
  })
  if (samarFakeDocs.length > 0) {
    console.log(`\nRemoving ${samarFakeDocs.length} fake slide doc(s) from Samar...`)
    await prisma.projectDocument.deleteMany({ where: { projectId: samarProject.id } })
    console.log('✓ Removed fake docs')
  }

  // ── 4. Upload real Samar PDFs ──
  console.log('\nUploading Samar documentation...')
  for (const doc of SAMAR_DOCS) {
    try {
      const url = await uploadPdf(doc)
      const buffer = readFileSync(`/Users/thomasprotzmann/hromada/${doc.localPath}`)
      await prisma.projectDocument.create({
        data: {
          projectId: samarProject.id,
          url,
          filename: doc.filename,
          documentType: doc.documentType,
          label: doc.label,
          labelUk: doc.labelUk,
          extractionStatus: 'pending',
          fileSize: buffer.length,
        },
      })
      console.log(`  ✓ ${doc.label}`)
    } catch (e) {
      console.error(`  ✗ Failed: ${doc.filename}:`, (e as Error).message)
    }
  }

  // ── 5. Create Lychkove project ──
  console.log('\nCreating Lychkove Water Tower project...')
  const lychkove = await prisma.project.create({
    data: {
      municipalityName: 'Lychkove',
      municipalityNameUk: 'Личкове',
      facilityName: 'Rozhnovskyi Water Tower — Municipal Utility Enterprise',
      facilityNameUk: 'Рожновський водонапірний резервуар — Комунальне підприємство',
      category: 'WATER',
      projectType: 'SOLAR_PV',
      briefDescription: 'Solar 10kW installation on the municipal water tower to ensure reliable water supply through energy independence',
      briefDescriptionUk: 'Встановлення сонячної електростанції потужністю 10 кВт на водонапірному резервуарі для забезпечення надійного водопостачання через енергонезалежність',
      fullDescription: `Installation of a 10 kW solar power system on the Rozhnovskyi Water Tower operated by the Municipal Utility Enterprise in Lychkove, Dnipropetrovsk Oblast.

The solar installation will provide reliable, self-generated electricity for the water pumping station, reducing dependence on the central power grid and ensuring uninterrupted water supply for the community during power outages.

The system includes a 10 kW inverter with 9.84 kW of installed PV modules. Full engineering design and itemized cost documentation have been completed.`,
      fullDescriptionUk: `Встановлення сонячної електростанції потужністю 10 кВт на Рожновському водонапірному резервуарі Комунального підприємства в Личковому, Дніпропетровська область.

Сонячна електростанція забезпечить надійну електроенергію для насосної станції, зменшить залежність від централізованої електромережі та гарантує безперебійне водопостачання громади під час відключень.

Система включає інвертор потужністю 10 кВт з встановленими PV-модулями на 9,84 кВт. Розроблено повний робочий проєкт та кошторисну документацію.`,
      estimatedCostUsd: 33550,
      technicalPowerKw: 10,
      region: 'Dnipropetrovsk Oblast',
      partnerOrganization: 'NGO Ecoaction',
      cofinancingAvailable: 'NO',
      urgency: 'MEDIUM',
      status: 'OPEN',
      address: 'Lychkove, Samar district',
      cityLatitude: 48.50,
      cityLongitude: 35.20,
      contactName: 'Kostiantyn Krynytskyi',
      contactEmail: 'kostiantyn@ecoaction.org',
    },
  })
  console.log(`✓ Created Lychkove project: ${lychkove.id}`)

  // ── 6. Upload Lychkove PDFs ──
  console.log('\nUploading Lychkove documentation...')
  for (const doc of LYCHKOVE_DOCS) {
    try {
      const url = await uploadPdf(doc)
      const buffer = readFileSync(`/Users/thomasprotzmann/hromada/${doc.localPath}`)
      await prisma.projectDocument.create({
        data: {
          projectId: lychkove.id,
          url,
          filename: doc.filename,
          documentType: doc.documentType,
          label: doc.label,
          labelUk: doc.labelUk,
          extractionStatus: 'pending',
          fileSize: buffer.length,
        },
      })
      console.log(`  ✓ ${doc.label}`)
    } catch (e) {
      console.error(`  ✗ Failed: ${doc.filename}:`, (e as Error).message)
    }
  }

  // ── 7. Create ProjectSubmission for Lychkove (Kostia's account) ──
  await prisma.projectSubmission.create({
    data: {
      municipalityName: 'Lychkove',
      municipalityEmail: 'kk@ecoaction.org.ua',
      region: 'Dnipropetrovsk Oblast',
      facilityName: 'Rozhnovskyi Water Tower — Municipal Utility Enterprise',
      category: 'WATER',
      projectType: 'SOLAR_PV',
      briefDescription: 'Solar 10kW installation on the municipal water tower to ensure reliable water supply through energy independence',
      fullDescription: 'Installation of a 10 kW solar power system on the Rozhnovskyi Water Tower.',
      urgency: 'MEDIUM',
      estimatedCostUsd: 33550,
      technicalPowerKw: 10,
      cofinancingAvailable: 'NO',
      cityName: 'Lychkove',
      address: 'Lychkove, Samar district',
      cityLatitude: 48.50,
      cityLongitude: 35.20,
      contactName: 'Kostiantyn Krynytskyi',
      contactEmail: 'kostiantyn@ecoaction.org',
      partnerOrganization: 'NGO Ecoaction',
      status: 'APPROVED',
      approvedProjectId: lychkove.id,
      reviewedAt: new Date(),
      submittedByUserId: KOSTIA_USER_ID,
    },
  })
  console.log('✓ Created Lychkove submission under Kostia')

  // ── 8. Set featured projects (just 2 now) ──
  console.log('\nSetting featured projects...')
  await prisma.featuredProject.deleteMany()
  await prisma.featuredProject.create({
    data: { slot: 1, projectId: samarProject.id },
  })
  await prisma.featuredProject.create({
    data: { slot: 2, projectId: lychkove.id },
  })
  console.log('✓ Featured: Slot 1 = Samar Hospital Solar, Slot 2 = Lychkove Water Tower')

  // ── Summary ──
  const remaining = await prisma.project.count()
  const docs = await prisma.projectDocument.count()
  console.log(`\n═══ Done ═══`)
  console.log(`Projects on site: ${remaining}`)
  console.log(`Total documents: ${docs}`)
  console.log(`Note: Lychkove has no photos — need facility images from Kostia`)

  await pool.end()
}

main().catch((e) => {
  console.error(e)
  pool.end()
  process.exit(1)
})
