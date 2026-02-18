import { config } from 'dotenv'
config({ path: '.env.local' })
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL || ''
const isRemoteDb = connectionString.includes('supabase.co')
let poolConfig: any = { connectionString }
if (isRemoteDb && process.env.DB_HOST) {
  poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  }
} else if (isRemoteDb) {
  poolConfig.ssl = { rejectUnauthorized: false }
}

const pool = new Pool(poolConfig)
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const projectId = 'cmkx21qkx0000fqrqx5q1iezv' // Nizhyn Maternity Hospital

  // Delete any existing docs first
  await prisma.projectDocument.deleteMany({ where: { projectId } })
  console.log('Cleared existing documents')

  const docs = [
    {
      projectId,
      url: 'https://example.com/fake/nizhyn-cost-estimate.pdf',
      filename: 'Nizhyn_Maternity_Hospital_Cost_Estimate_2024.pdf',
      documentType: 'COST_ESTIMATE' as const,
      label: 'Cost Estimate — Ecoclub',
      labelUk: 'Кошторис — Екоклуб',
      extractionStatus: 'translated',
      fileSize: 2_450_000,
      originalTextUk: 'Кошторис на капітальний ремонт теплопостачання Ніжинського пологового будинку.\n\nЗагальна вартість робіт: $47,500 USD\n\n1. Демонтаж старої системи опалення — $4,200\n2. Закупівля та монтаж нових радіаторів (32 шт.) — $12,800\n3. Заміна теплоізоляції трубопроводів — $6,500\n4. Встановлення теплового насосу — $18,000\n5. Пусконалагоджувальні роботи — $3,500\n6. Проектна документація — $2,500\n\nВсі ціни включають ПДВ та транспортні витрати.\n\nПідготовлено: NGO Ecoclub\nДата: листопад 2024',
      translatedTextEn: 'Cost estimate for capital repair of the heating system at Nizhyn Maternity Hospital.\n\nTotal cost of works: $47,500 USD\n\n1. Dismantling of old heating system — $4,200\n2. Purchase and installation of new radiators (32 units) — $12,800\n3. Replacement of pipe thermal insulation — $6,500\n4. Installation of heat pump — $18,000\n5. Commissioning works — $3,500\n6. Design documentation — $2,500\n\nAll prices include VAT and transportation costs.\n\nPrepared by: NGO Ecoclub\nDate: November 2024',
    },
    {
      projectId,
      url: 'https://example.com/fake/nizhyn-engineering-assessment.pdf',
      filename: 'Nizhyn_Engineering_Assessment_Report.pdf',
      documentType: 'ENGINEERING_ASSESSMENT' as const,
      label: 'Engineering Assessment',
      labelUk: 'Інженерна оцінка',
      extractionStatus: 'translated',
      fileSize: 1_830_000,
      originalTextUk: 'Інженерний звіт про стан теплопостачання Ніжинського пологового будинку.\n\nОб\'єкт: Пологовий будинок, м. Ніжин, Чернігівська область\nДата обстеження: жовтень 2024\n\nВисновки:\n— Існуюча система опалення зношена на 85% та потребує повної заміни\n— Теплові втрати через застарілу ізоляцію складають до 40%\n— Рекомендовано встановлення теплового насосу для зменшення залежності від газу\n— Після модернізації очікуване зменшення витрат на опалення на 60%\n\nОбстеження проведено сертифікованим інженером.\nПідготовлено для: Hromada / POCACITO Network',
      translatedTextEn: 'Engineering report on the heating system condition at Nizhyn Maternity Hospital.\n\nFacility: Maternity Hospital, Nizhyn, Chernihiv Oblast\nInspection date: October 2024\n\nFindings:\n— The existing heating system is 85% worn and requires complete replacement\n— Heat losses through outdated insulation amount to up to 40%\n— Recommended installation of a heat pump to reduce gas dependency\n— After modernization, expected reduction in heating costs by 60%\n\nInspection conducted by a certified engineer.\nPrepared for: Hromada / POCACITO Network',
    },
    {
      projectId,
      url: 'https://example.com/fake/nizhyn-site-photos.pdf',
      filename: 'Site_Survey_Photos_Nizhyn.pdf',
      documentType: 'SITE_SURVEY' as const,
      label: 'Site Survey with Photos',
      labelUk: 'Обстеження об\'єкта з фотографіями',
      extractionStatus: 'translated',
      fileSize: 5_200_000,
    },
  ]

  for (const doc of docs) {
    await prisma.projectDocument.create({ data: doc })
    console.log(`Created: ${doc.label}`)
  }

  console.log('\nDone! 3 fake documents added to Nizhyn Maternity Hospital')
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
