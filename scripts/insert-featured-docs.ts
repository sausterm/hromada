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

const allDocs = [
  // ============================================================
  // Children's Center "Radist" — NGO Ecoaction, Novohrodivka, Donetsk
  // ============================================================
  {
    projectId: 'cmkx2rzr3001dv9rqjgekryxt',
    url: 'https://example.com/fake/radist-cost-estimate.pdf',
    filename: 'Radist_Childrens_Center_Cost_Estimate_2024.pdf',
    documentType: 'COST_ESTIMATE' as const,
    label: 'Cost Estimate — Ecoaction',
    labelUk: 'Кошторис — Екодія',
    extractionStatus: 'translated',
    fileSize: 1_870_000,
    originalTextUk: 'Кошторис на встановлення сонячної електростанції для дитячого центру «Радість», м. Новогродівка, Донецька область.\n\nЗагальна вартість робіт: $15,000 USD\n\n1. Закупівля сонячних панелей (12 шт., 450 Вт кожна) — $5,400\n2. Інвертор та система зберігання енергії — $4,200\n3. Монтажні конструкції та кріплення — $1,800\n4. Електромонтажні роботи та підключення — $2,100\n5. Проектна документація та дозволи — $1,500\n\nВсі ціни включають ПДВ та транспортні витрати.\n\nПідготовлено: NGO Ecoaction\nДата: грудень 2024',
    translatedTextEn: 'Cost estimate for installation of a solar power system at the Children\'s Center "Radist", Novohrodivka, Donetsk Oblast.\n\nTotal cost of works: $15,000 USD\n\n1. Purchase of solar panels (12 units, 450W each) — $5,400\n2. Inverter and energy storage system — $4,200\n3. Mounting structures and fasteners — $1,800\n4. Electrical installation and grid connection — $2,100\n5. Design documentation and permits — $1,500\n\nAll prices include VAT and transportation costs.\n\nPrepared by: NGO Ecoaction\nDate: December 2024',
  },
  {
    projectId: 'cmkx2rzr3001dv9rqjgekryxt',
    url: 'https://example.com/fake/radist-engineering-assessment.pdf',
    filename: 'Radist_Engineering_Assessment_Report.pdf',
    documentType: 'ENGINEERING_ASSESSMENT' as const,
    label: 'Engineering Assessment',
    labelUk: 'Інженерна оцінка',
    extractionStatus: 'translated',
    fileSize: 1_540_000,
    originalTextUk: 'Інженерний звіт про стан енергопостачання дитячого центру «Радість».\n\nОб\'єкт: Дитячий центр «Радість», м. Новогродівка, Донецька область\nДата обстеження: листопад 2024\n\nВисновки:\n— Об\'єкт залежить від централізованого електропостачання, яке регулярно переривається через бойові дії\n— Дах будівлі має достатню площу та орієнтацію для встановлення сонячних панелей (54 м²)\n— Річне споживання електроенергії складає приблизно 8,500 кВт·год\n— Запропонована сонячна система потужністю 5.4 кВт забезпечить до 70% потреб центру\n— Система зберігання енергії забезпечить автономну роботу протягом 8 годин\n\nОбстеження проведено сертифікованим інженером.\nПідготовлено для: Hromada / POCACITO Network',
    translatedTextEn: 'Engineering report on the power supply condition at the Children\'s Center "Radist".\n\nFacility: Children\'s Center "Radist", Novohrodivka, Donetsk Oblast\nInspection date: November 2024\n\nFindings:\n— The facility depends on centralized power supply, which is regularly disrupted due to hostilities\n— The building roof has sufficient area and orientation for solar panel installation (54 m²)\n— Annual electricity consumption is approximately 8,500 kWh\n— The proposed 5.4 kW solar system would cover up to 70% of the center\'s needs\n— The energy storage system would provide autonomous operation for up to 8 hours\n\nInspection conducted by a certified engineer.\nPrepared for: Hromada / POCACITO Network',
  },
  {
    projectId: 'cmkx2rzr3001dv9rqjgekryxt',
    url: 'https://example.com/fake/radist-site-photos.pdf',
    filename: 'Site_Survey_Photos_Radist.pdf',
    documentType: 'SITE_SURVEY' as const,
    label: 'Site Survey with Photos',
    labelUk: 'Обстеження об\'єкта з фотографіями',
    extractionStatus: 'translated',
    fileSize: 4_100_000,
  },

  // ============================================================
  // Municipal Enterprise Lutskteplo — NGO Ecoclub, Lutsk, Volyn
  // ============================================================
  {
    projectId: 'cmkx2spy5001pv9rqtj76tfg6',
    url: 'https://example.com/fake/lutskteplo-cost-estimate.pdf',
    filename: 'Lutskteplo_Cost_Estimate_2024.pdf',
    documentType: 'COST_ESTIMATE' as const,
    label: 'Cost Estimate — Ecoclub',
    labelUk: 'Кошторис — Екоклуб',
    extractionStatus: 'translated',
    fileSize: 3_200_000,
    originalTextUk: 'Кошторис на модернізацію теплопостачання КП «Луцьктепло», м. Луцьк, Волинська область.\n\nЗагальна вартість робіт: $345,000 USD\n\n1. Заміна газових котлів на теплові насоси (3 одиниці) — $135,000\n2. Модернізація теплових мереж (4.2 км) — $87,000\n3. Встановлення системи автоматичного управління — $42,000\n4. Теплоізоляція магістральних трубопроводів — $38,000\n5. Монтаж індивідуальних теплових пунктів (8 шт.) — $28,000\n6. Проектно-кошторисна документація — $15,000\n\nВсі ціни включають ПДВ та транспортні витрати.\n\nПідготовлено: NGO Ecoclub\nДата: жовтень 2024',
    translatedTextEn: 'Cost estimate for heating system modernization at Municipal Enterprise Lutskteplo, Lutsk, Volyn Oblast.\n\nTotal cost of works: $345,000 USD\n\n1. Replacement of gas boilers with heat pumps (3 units) — $135,000\n2. Modernization of heating networks (4.2 km) — $87,000\n3. Installation of automated control system — $42,000\n4. Thermal insulation of main pipelines — $38,000\n5. Installation of individual heating substations (8 units) — $28,000\n6. Design and estimate documentation — $15,000\n\nAll prices include VAT and transportation costs.\n\nPrepared by: NGO Ecoclub\nDate: October 2024',
  },
  {
    projectId: 'cmkx2spy5001pv9rqtj76tfg6',
    url: 'https://example.com/fake/lutskteplo-engineering-assessment.pdf',
    filename: 'Lutskteplo_Engineering_Assessment_Report.pdf',
    documentType: 'ENGINEERING_ASSESSMENT' as const,
    label: 'Engineering Assessment',
    labelUk: 'Інженерна оцінка',
    extractionStatus: 'translated',
    fileSize: 2_700_000,
    originalTextUk: 'Інженерний звіт про стан теплопостачання КП «Луцьктепло».\n\nОб\'єкт: КП «Луцьктепло», м. Луцьк, Волинська область\nДата обстеження: вересень 2024\n\nВисновки:\n— Три газові котельні обслуговують 12,000 мешканців та 4 соціальні об\'єкти\n— Поточне обладнання зношене на 75%, ККД котлів складає лише 62%\n— Теплові втрати у мережах сягають 35% через застарілу ізоляцію\n— Перехід на теплові насоси зменшить залежність від газу на 80%\n— Очікувана економія на опаленні — $120,000 на рік\n— Окупність проєкту — 2.9 року\n\nОбстеження проведено сертифікованим інженером-теплотехніком.\nПідготовлено для: Hromada / POCACITO Network',
    translatedTextEn: 'Engineering report on the heating system condition at Municipal Enterprise Lutskteplo.\n\nFacility: Municipal Enterprise Lutskteplo, Lutsk, Volyn Oblast\nInspection date: September 2024\n\nFindings:\n— Three gas boiler houses serve 12,000 residents and 4 social facilities\n— Current equipment is 75% worn, with boiler efficiency at only 62%\n— Heat losses in networks reach 35% due to outdated insulation\n— Transition to heat pumps would reduce gas dependency by 80%\n— Expected annual heating savings — $120,000 per year\n— Project payback period — 2.9 years\n\nInspection conducted by a certified heating engineer.\nPrepared for: Hromada / POCACITO Network',
  },
  {
    projectId: 'cmkx2spy5001pv9rqtj76tfg6',
    url: 'https://example.com/fake/lutskteplo-site-photos.pdf',
    filename: 'Site_Survey_Photos_Lutskteplo.pdf',
    documentType: 'SITE_SURVEY' as const,
    label: 'Site Survey with Photos',
    labelUk: 'Обстеження об\'єкта з фотографіями',
    extractionStatus: 'translated',
    fileSize: 6_300_000,
  },

  // ============================================================
  // Prylymanskyi Lyceum — Energy Act For Ukraine, Odesa Oblast
  // ============================================================
  {
    projectId: 'cmkx2tplw0001n8rqd8677tkn',
    url: 'https://example.com/fake/prylymanskyi-cost-estimate.pdf',
    filename: 'Prylymanskyi_Lyceum_Cost_Estimate_2024.pdf',
    documentType: 'COST_ESTIMATE' as const,
    label: 'Cost Estimate — Energy Act For Ukraine',
    labelUk: 'Кошторис — Energy Act For Ukraine',
    extractionStatus: 'translated',
    fileSize: 1_650_000,
    originalTextUk: 'Кошторис на встановлення сонячної електростанції для Прилиманського ліцею, Авангардівська сільська громада, Одеська область.\n\nЗагальна вартість робіт: $18,000 USD\n\n1. Закупівля сонячних панелей (16 шт., 500 Вт кожна) — $7,200\n2. Мережевий інвертор (8 кВт) — $2,800\n3. Монтажні конструкції та кріплення на дах — $2,400\n4. Електромонтажні роботи та підключення до мережі — $3,200\n5. Проектна документація та погодження — $2,400\n\nВсі ціни включають ПДВ та транспортні витрати.\n\nПідготовлено: Energy Act For Ukraine\nДата: листопад 2024',
    translatedTextEn: 'Cost estimate for installation of a solar power system at Prylymanskyi Lyceum, Avanhardivska village community, Odesa Oblast.\n\nTotal cost of works: $18,000 USD\n\n1. Purchase of solar panels (16 units, 500W each) — $7,200\n2. Grid-tied inverter (8 kW) — $2,800\n3. Roof mounting structures and fasteners — $2,400\n4. Electrical installation and grid connection — $3,200\n5. Design documentation and approvals — $2,400\n\nAll prices include VAT and transportation costs.\n\nPrepared by: Energy Act For Ukraine\nDate: November 2024',
  },
  {
    projectId: 'cmkx2tplw0001n8rqd8677tkn',
    url: 'https://example.com/fake/prylymanskyi-engineering-assessment.pdf',
    filename: 'Prylymanskyi_Engineering_Assessment_Report.pdf',
    documentType: 'ENGINEERING_ASSESSMENT' as const,
    label: 'Engineering Assessment',
    labelUk: 'Інженерна оцінка',
    extractionStatus: 'translated',
    fileSize: 1_420_000,
    originalTextUk: 'Інженерний звіт про стан енергопостачання Прилиманського ліцею.\n\nОб\'єкт: Прилиманський ліцей, Авангардівська сільська громада, Одеська область\nДата обстеження: жовтень 2024\n\nВисновки:\n— Ліцей обслуговує 340 учнів та 45 працівників\n— Річне споживання електроенергії складає 14,200 кВт·год\n— Дах будівлі (південна сторона) має площу 120 м², придатну для встановлення панелей\n— Конструкція даху витримає додаткове навантаження від панелей\n— Запропонована система потужністю 8 кВт покриє до 65% потреб ліцею\n— Надлишок електроенергії у літній період можна продавати в мережу за зеленим тарифом\n\nОбстеження проведено сертифікованим інженером.\nПідготовлено для: Hromada / POCACITO Network',
    translatedTextEn: 'Engineering report on the power supply condition at Prylymanskyi Lyceum.\n\nFacility: Prylymanskyi Lyceum, Avanhardivska village community, Odesa Oblast\nInspection date: October 2024\n\nFindings:\n— The lyceum serves 340 students and 45 staff\n— Annual electricity consumption is 14,200 kWh\n— The building roof (south-facing) has 120 m² suitable for panel installation\n— The roof structure can support the additional load from solar panels\n— The proposed 8 kW system would cover up to 65% of the lyceum\'s needs\n— Excess electricity during summer can be sold to the grid under the green tariff\n\nInspection conducted by a certified engineer.\nPrepared for: Hromada / POCACITO Network',
  },
  {
    projectId: 'cmkx2tplw0001n8rqd8677tkn',
    url: 'https://example.com/fake/prylymanskyi-site-photos.pdf',
    filename: 'Site_Survey_Photos_Prylymanskyi.pdf',
    documentType: 'SITE_SURVEY' as const,
    label: 'Site Survey with Photos',
    labelUk: 'Обстеження об\'єкта з фотографіями',
    extractionStatus: 'translated',
    fileSize: 3_800_000,
  },
]

async function main() {
  const projectIds = [...new Set(allDocs.map(d => d.projectId))]

  for (const pid of projectIds) {
    await prisma.projectDocument.deleteMany({ where: { projectId: pid } })
    console.log(`Cleared existing docs for ${pid}`)
  }

  for (const doc of allDocs) {
    await prisma.projectDocument.create({ data: doc })
    console.log(`Created: ${doc.label} (${doc.projectId.slice(-8)})`)
  }

  console.log(`\nDone! ${allDocs.length} documents added to 3 featured projects`)
  await prisma.$disconnect()
  await pool.end()
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
