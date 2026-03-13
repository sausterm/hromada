/**
 * Swap demo projects for 8 real Ecoaction municipal projects.
 *
 * 1. Delete all demo projects (preserving donations — projectId is nullable)
 * 2. Upload cropped photos from /tmp/project-photos/ to Supabase Storage
 * 3. Create 8 real projects with photos and Ukrainian translations
 * 4. Set featured project slots
 *
 * Run with: npx tsx scripts/swap-projects.ts
 */

import { config } from 'dotenv'
import { PrismaClient, Category, ProjectType, Urgency, CofinancingStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, basename } from 'path'

config({ path: '.env.local' })

// ── Database ──
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Supabase Storage ──
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)
const BUCKET = 'project-images'

// ── Contact for all Ecoaction projects ──
const CONTACT = {
  name: 'Kostiantyn Krynytskyi',
  email: 'kostiantyn@ecoaction.org',
}

const PHOTOS_DIR = '/tmp/project-photos'

// ── Photo upload helper ──
async function uploadPhoto(filename: string): Promise<string> {
  const filepath = join(PHOTOS_DIR, filename)
  if (!existsSync(filepath)) {
    throw new Error(`Photo not found: ${filepath}`)
  }
  const buffer = readFileSync(filepath)
  const storagePath = `ecoaction/${filename}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw new Error(`Upload failed for ${filename}: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

// ── Project definitions ──
interface ProjectDef {
  municipalityName: string
  municipalityNameUk: string
  facilityName: string
  facilityNameUk: string
  category: Category
  projectType: ProjectType
  briefDescription: string
  briefDescriptionUk: string
  fullDescription: string
  fullDescriptionUk: string
  estimatedCostUsd: number
  technicalPowerKw?: number
  numberOfPanels?: number
  region: string
  cofinancingAvailable: CofinancingStatus
  cofinancingDetails?: string
  urgency: Urgency
  cityLatitude: number
  cityLongitude: number
  photos: { filename: string; altText: string }[]
  featured?: number // slot number (1-4) if featured
}

const PROJECTS: ProjectDef[] = [
  // ── 1. Novovolynsk Sports School ──
  {
    municipalityName: 'Novovolynsk',
    municipalityNameUk: 'Нововолинськ',
    facilityName: 'Children and Youth Sports School',
    facilityNameUk: 'Дитяча та юнацька спортивна школа',
    category: 'SCHOOL',
    projectType: 'SOLAR_PV',
    briefDescription: 'Solar 23kW rooftop installation and comprehensive roof modernization for the Novovolynsk Children and Youth Sports School',
    briefDescriptionUk: 'Встановлення сонячної електростанції потужністю 23 кВт та комплексна модернізація даху для Нововолинської ДЮСШ',
    fullDescription: `The Novovolynsk Children and Youth Sports School serves hundreds of young athletes across the community. This project will install a 23 kW hybrid solar power plant on the facility's roof, combined with comprehensive roof modernization.

The project aims to achieve energy independence for the sports school, reduce the community's carbon footprint, and generate cost savings on energy bills. Design and cost documentation has been developed by KP "VOLYNPROEKT" for both the roof renovation and solar installation.

Expected outcomes include at least a 10% increase in the level of sports activity within the community through improved facility conditions, and significant long-term energy cost reductions.`,
    fullDescriptionUk: `Нововолинська дитяча та юнацька спортивна школа обслуговує сотні молодих спортсменів громади. Проєкт передбачає встановлення гібридної сонячної електростанції потужністю 23 кВт на даху закладу у поєднанні з комплексною модернізацією покрівлі.

Мета проєкту — досягнення енергетичної незалежності спортивної школи, зменшення вуглецевого сліду громади та економія на рахунках за електроенергію. Проєктно-кошторисну документацію розроблено КП «ВОЛИНЬПРОЕКТ».

Очікувані результати: щонайменше 10% зростання рівня спортивної активності в громаді завдяки покращенню стану закладу, а також значне довгострокове зменшення витрат на електроенергію.`,
    estimatedCostUsd: 108000,
    technicalPowerKw: 23,
    region: 'Volyn Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 50.7293,
    cityLongitude: 24.1647,
    photos: [
      { filename: 'novovolynsk-building.jpg', altText: 'Novovolynsk Children and Youth Sports School building exterior with Ukrainian flag' },
      { filename: 'novovolynsk-aerial.jpg', altText: 'Aerial view of the Novovolynsk Sports School complex' },
    ],
  },

  // ── 2. Sheptytskyi Solar for Disability Services ──
  {
    municipalityName: 'Sheptytskyi',
    municipalityNameUk: 'Шептицький',
    facilityName: 'Municipal Enterprise "Teploenerhoemeritsia" & NGO "Nika"',
    facilityNameUk: 'Комунальне підприємство «Теплоенергоемеріція» та ГО «Ніка»',
    category: 'ENERGY',
    projectType: 'SOLAR_PV',
    briefDescription: 'Solar 12kW installation providing energy independence for disability services in Sheptytskyi',
    briefDescriptionUk: 'Встановлення сонячної електростанції потужністю 12 кВт для енергонезалежності служб підтримки людей з інвалідністю у Шептицькому',
    fullDescription: `This project provides stable, affordable, and self-generated electricity for the Municipal Enterprise "Teploenerhoemeritsia" and the NGO for Youth with Disabilities "Nika" in Sheptytskyi.

The 12 kW solar installation will support disability services and community operations. The project will reduce budget expenditure on electricity costs, increase energy independence, and develop green energy capacity in the community.

The budget includes a DEYE 12 kW 3-phase hybrid inverter, Longi Solar 610W panels, mounting system for flat-roof installation, electrical cable, and an Energy Box 5 kW battery storage system. An Action Plan for the Just Transition of the Chervonohrad City Territorial Community has been developed for the period up to 2030.`,
    fullDescriptionUk: `Цей проєкт забезпечить стабільну, доступну та власну електроенергію для Комунального підприємства «Теплоенергоемеріція» та ГО для молоді з інвалідністю «Ніка» у Шептицькому.

Сонячна електростанція потужністю 12 кВт підтримуватиме служби для людей з інвалідністю та діяльність громади. Проєкт зменшить бюджетні витрати на електроенергію, підвищить енергонезалежність та розвине потенціал зеленої енергетики в громаді.

Бюджет включає гібридний інвертор DEYE 12 кВт, сонячні панелі Longi Solar 610W, монтажну систему для плоского даху та систему накопичення енергії Energy Box 5 кВт.`,
    estimatedCostUsd: 11269,
    technicalPowerKw: 12,
    region: 'Lviv Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 49.4500,
    cityLongitude: 24.4333,
    photos: [
      { filename: 'sheptytskyi-building.jpg', altText: 'Municipal enterprise building in Sheptytskyi with solar panels' },
      { filename: 'sheptytskyi-solar.jpg', altText: 'Solar panel installation at Sheptytskyi' },
    ],
    featured: 4,
  },

  // ── 3. Nadvirna Children's Hospital Solar ──
  {
    municipalityName: 'Nadvirna',
    municipalityNameUk: 'Надвірна',
    facilityName: "Nadvirna Children's Hospital",
    facilityNameUk: 'Надвірнянська дитяча лікарня',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: "Rooftop solar power plant for the Nadvirna Children's Hospital to ensure reliable electricity for pediatric care",
    briefDescriptionUk: 'Дахова сонячна електростанція для Надвірнянської дитячої лікарні для забезпечення надійного електропостачання',
    fullDescription: `Installation of a rooftop solar power plant on the Nadvirna Children's Hospital to meet the facility's own electricity needs and ensure reliable power for pediatric care.

This project will provide an environmentally friendly and low-cost source of electricity, reduce CO₂ emissions, lower dependence on the central power grid, and reduce risks of power supply interruptions that affect patient care.

The City Council partners with NGOs in the energy sector, Ukrainian and international funds, donors, and financial institutions. A Community Development Strategy until 2030 and a pre-feasibility study have been completed.

According to the preliminary feasibility study, the turnkey project cost is estimated at 1,697,500 UAH.`,
    fullDescriptionUk: `Встановлення дахової сонячної електростанції на Надвірнянській дитячій лікарні для забезпечення власних потреб закладу в електроенергії та надійного електропостачання для педіатричної допомоги.

Проєкт забезпечить екологічно чисте та дешеве джерело електроенергії, зменшить викиди CO₂, знизить залежність від централізованої електромережі та зменшить ризики перебоїв в електропостачанні.

Міська рада співпрацює з НГО в енергетичному секторі, українськими та міжнародними фондами. Розроблено Стратегію розвитку громади до 2030 року та попереднє техніко-економічне обґрунтування.

Орієнтовна вартість проєкту «під ключ» — 1 697 500 грн.`,
    estimatedCostUsd: 41000,
    region: 'Ivano-Frankivsk Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 48.6339,
    cityLongitude: 24.5778,
    photos: [
      { filename: 'nadvirna-children-hospital.jpg', altText: "Nadvirna Children's Hospital building" },
      { filename: 'nadvirna-children-solar.jpg', altText: 'Solar panel field planned for the hospital rooftop' },
    ],
    featured: 1,
  },

  // ── 4. Nadvirna Central Hospital Thermo-Modernization ──
  {
    municipalityName: 'Nadvirna',
    municipalityNameUk: 'Надвірна',
    facilityName: 'Nadvirna Central District Hospital (Inpatient Building)',
    facilityNameUk: 'Надвірнянська центральна районна лікарня (стаціонарний корпус)',
    category: 'HOSPITAL',
    projectType: 'THERMO_MODERNIZATION',
    briefDescription: 'Comprehensive thermo-modernization of the hospital inpatient building — 43% projected reduction in heat energy',
    briefDescriptionUk: 'Комплексна термомодернізація стаціонарного корпусу лікарні — прогнозоване зменшення теплоспоживання на 43%',
    fullDescription: `Comprehensive thermo-modernization of the main inpatient building of the Nadvirna Central District Hospital, including installation of an individual heat substation, insulation of the façade and plinth, insulation of the roof and the ceiling above the basement, balancing of the heating system, and other related measures.

This project will ensure a 43% reduction in heat energy consumption, reduction of CO₂ emissions, improved indoor microclimate for patients and staff, and increased energy efficiency of the building to Class C.

The City Council partners with NGOs in the energy sector, Ukrainian and international funds, donors, financial institutions, energy auditors, and design engineers. Available documentation includes a Community Development Strategy until 2030, an energy audit, and an energy certificate.

According to the energy audit, the project cost is estimated at 11,506,532 UAH, plus design and cost documentation development: 5.5%, author supervision: 3%, technical supervision: 1.5% of the total project cost.`,
    fullDescriptionUk: `Комплексна термомодернізація стаціонарного корпусу Надвірнянської центральної районної лікарні, включаючи встановлення індивідуального теплового пункту, утеплення фасаду та цоколю, утеплення даху та перекриття над підвалом, балансування системи опалення.

Проєкт забезпечить зменшення споживання теплової енергії на 43%, зменшення викидів CO₂, покращення мікроклімату приміщень та підвищення енергоефективності будівлі до класу C.

Міська рада співпрацює з НГО в енергетичному секторі, українськими та міжнародними фондами, енергоаудиторами та проєктувальниками.

Орієнтовна вартість проєкту за результатами енергоаудиту — 11 506 532 грн, плюс розробка проєктно-кошторисної документації.`,
    estimatedCostUsd: 280000,
    region: 'Ivano-Frankivsk Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 48.6339,
    cityLongitude: 24.5778,
    photos: [
      { filename: 'nadvirna-central-hospital.jpg', altText: 'Nadvirna Central District Hospital inpatient building' },
    ],
  },

  // ── 5. Velyki Mosty Water Treatment ──
  {
    municipalityName: 'Velyki Mosty',
    municipalityNameUk: 'Великі Мости',
    facilityName: 'Second-Lift Pumping Station & Water Treatment Facility',
    facilityNameUk: 'Насосна станція другого підйому та водоочисний комплекс',
    category: 'WATER',
    projectType: 'WATER_TREATMENT',
    briefDescription: 'Technical modernization of the water disinfection system and pumping station to ensure safe drinking water',
    briefDescriptionUk: 'Технічна модернізація системи знезараження води та насосної станції для забезпечення безпечної питної води',
    fullDescription: `Reconstruction of the second-lift pumping station and the water intake site with technical modernization of the disinfection system and technological water treatment in Velyki Mosty.

The project objective is to meet the needs of the population for high-quality water supply services by ensuring a continuous supply of water of appropriate quality, preventing emergency situations, and increasing the reliability of the water supply systems.

Expected results include improved quality of drinking water and wastewater treatment, improved sanitary and environmental conditions, protection of drinking water sources, introduction of modern technologies and equipment, reduction of drinking water losses, and ensured round-the-clock supply of high-quality drinking water.

Existing project design and cost documentation (PDC) has been prepared. The Velyki Mosty City Council is the project partner.`,
    fullDescriptionUk: `Реконструкція насосної станції другого підйому та водозабору з технічною модернізацією системи знезараження та технологічної водопідготовки у Великих Мостах.

Мета проєкту — забезпечення потреб населення у якісному водопостачанні шляхом безперебійного постачання води належної якості, запобігання аварійним ситуаціям та підвищення надійності систем водопостачання.

Очікувані результати: покращення якості питної води та очистки стічних вод, покращення санітарних та екологічних умов, захист джерел питної води, впровадження сучасних технологій та обладнання, зменшення втрат питної води.

Розроблено проєктно-кошторисну документацію. Великомостівська міська рада є партнером проєкту.`,
    estimatedCostUsd: 388000,
    region: 'Lviv Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 50.2333,
    cityLongitude: 24.3167,
    photos: [
      { filename: 'velyki-mosty-pumping.jpg', altText: 'Interior of the second-lift pumping station in Velyki Mosty' },
      { filename: 'velyki-mosty-water.jpg', altText: 'Water treatment facility equipment in Velyki Mosty' },
    ],
    featured: 3,
  },

  // ── 6. Ladyzhyn Rehabilitation Center Solar ──
  {
    municipalityName: 'Ladyzhyn',
    municipalityNameUk: 'Ладижин',
    facilityName: 'Ladyzhyn Rehabilitation Center',
    facilityNameUk: 'Ладижинський реабілітаційний центр',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: '500kW rooftop solar plant for the rehabilitation center, ensuring uninterrupted patient services',
    briefDescriptionUk: 'Дахова сонячна електростанція потужністю 500 кВт для реабілітаційного центру',
    fullDescription: `Installation of a 500 kW rooftop solar power plant on the rehabilitation center building (roof area: 1,315 m²) to ensure uninterrupted provision of rehabilitation services to patients.

Ladyzhyn is a coal plant transition town seeking energy independence through renewable energy. This project will generate savings through solar energy, ensuring uninterrupted rehabilitation services for patients even during power outages.

An assessment of the building's solar potential has been developed with the support of Ecodia and RePower Ukraine. The project aligns with the Ladyzhyn Community Development Strategy until 2027 and the Action Plan for its implementation for 2025–2027.

Ladyzhyn City Council, the Haisiyn District of Vinnytsia Region, and the Municipal Enterprise "Ladyzhyn City Hospital" are partners. The community is open to partnerships with donor organizations and investment funds.`,
    fullDescriptionUk: `Встановлення дахової сонячної електростанції потужністю 500 кВт на будівлі реабілітаційного центру (площа даху: 1 315 м²) для забезпечення безперебійного надання реабілітаційних послуг пацієнтам.

Ладижин — місто переходу від вугільної енергетики, яке шукає енергонезалежність через відновлювані джерела енергії. Проєкт забезпечить економію коштів та безперебійні реабілітаційні послуги навіть під час відключень електроенергії.

Оцінку сонячного потенціалу будівлі розроблено за підтримки Ecodia та RePower Ukraine. Проєкт відповідає Стратегії розвитку Ладижинської громади до 2027 року.

Партнери: Ладижинська міська рада, КП «Ладижинська міська лікарня». Громада відкрита до партнерства з донорськими організаціями.`,
    estimatedCostUsd: 607000,
    technicalPowerKw: 500,
    region: 'Vinnytsia Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 48.6833,
    cityLongitude: 29.2333,
    photos: [
      { filename: 'ladyzhyn-render.jpg', altText: 'Rooftop solar power plant modeling for Ladyzhyn Rehabilitation Center' },
      { filename: 'ladyzhyn-shading.jpg', altText: 'Roof shading analysis model for solar installation' },
      { filename: 'ladyzhyn-aerial.jpg', altText: 'Aerial render of Ladyzhyn Rehabilitation Center with solar panels' },
    ],
  },

  // ── 7. Samar Hospital Solar (Frontline) ──
  {
    municipalityName: 'Samar',
    municipalityNameUk: 'Самар',
    facilityName: 'Surgical Building, Samar Central Municipal Hospital',
    facilityNameUk: 'Хірургічний корпус, Самарська центральна міська лікарня',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: '150kW rooftop solar for the surgical building — uninterrupted power for operating rooms near the front line',
    briefDescriptionUk: 'Дахова сонячна електростанція 150 кВт для хірургічного корпусу — безперебійне живлення операційних',
    fullDescription: `Installation of a 150 kW rooftop solar power plant on the surgical building of the Samar Central Municipal Hospital, a frontline community in Dnipropetrovsk Oblast.

This project will replace a significant share of grid electricity consumption with on-site solar generation, achieving substantial annual savings for the community budget. The reliability of power supply for operating rooms and intensive care units will increase, particularly during emergency outages of the external grid — a critical concern for this frontline community.

The community has full engineering documentation including an assessment of solar potential and technical specifications prepared by the Center for Environmental Initiatives "Ecodia." The municipality is committed to 10% cofinancing of the project.

The community is open to partnerships and ready to engage interested stakeholders in project implementation.`,
    fullDescriptionUk: `Встановлення дахової сонячної електростанції потужністю 150 кВт на хірургічному корпусі Самарської центральної міської лікарні — прифронтовій громаді Дніпропетровської області.

Проєкт замінить значну частину споживання електроенергії з мережі власною сонячною генерацією, забезпечивши суттєву річну економію для бюджету громади. Надійність електропостачання операційних та реанімаційних відділень зросте, особливо під час аварійних відключень — критично важливе питання для прифронтової громади.

Громада має повну інженерну документацію, включаючи оцінку сонячного потенціалу від ЦЕІ «Екодія». Муніципалітет зобов'язується забезпечити 10% співфінансування проєкту.

Громада відкрита до партнерства та готова залучати зацікавлених учасників до реалізації проєкту.`,
    estimatedCostUsd: 568690,
    technicalPowerKw: 150,
    region: 'Dnipropetrovsk Oblast',
    cofinancingAvailable: 'YES',
    cofinancingDetails: '10% municipal cofinancing',
    urgency: 'HIGH',
    cityLatitude: 48.4500,
    cityLongitude: 35.0667,
    photos: [
      { filename: 'samar-hospital-aerial.jpg', altText: 'Aerial view of the Samar Central Hospital surgical building' },
      { filename: 'samar-solar-closeup.jpg', altText: 'Close-up of solar panels planned for the hospital roof' },
      { filename: 'samar-rooftop.jpg', altText: 'Rooftop solar installation view at Samar Hospital' },
    ],
    featured: 2,
  },

  // ── 8. Samar Primary Health Care Facade (Frontline) ──
  {
    municipalityName: 'Samar',
    municipalityNameUk: 'Самар',
    facilityName: 'City Center of Primary Health Care',
    facilityNameUk: 'Міський центр первинної медико-санітарної допомоги',
    category: 'HOSPITAL',
    projectType: 'THERMO_MODERNIZATION',
    briefDescription: 'Facade insulation for the primary health care center — reducing heating costs for patients and staff',
    briefDescriptionUk: 'Утеплення фасаду центру первинної медичної допомоги — зменшення витрат на опалення',
    fullDescription: `Facade insulation of the City Center of Primary Health Care in Samar, a frontline community in Dnipropetrovsk Oblast.

This project will improve the building's energy efficiency, reducing heating costs and improving conditions for patients and medical staff. Expected outcomes include improved accessibility and quality of primary medical care, enhanced energy efficiency resulting in reduced budget expenditures and a lower environmental footprint, and higher patient satisfaction and staff motivation.

Available documentation includes the Municipal Energy Plan of the Samar Territorial Community until 2030, the Strategy for Energy Saving, Energy Efficiency, and Development of Renewable Energy of Dnipropetrovsk Region (2018–2035), and design and cost documentation for the working project: "Capital repair (facade insulation) of the building of the City Center of Primary Health Care, 40 Hidnosti Street, Samar, Dnipropetrovsk Region" — updated version.

The community is actively seeking partners and is open to cooperation with donor organizations and investment funds.`,
    fullDescriptionUk: `Утеплення фасаду Міського центру первинної медико-санітарної допомоги в Самарі — прифронтовій громаді Дніпропетровської області.

Проєкт покращить енергоефективність будівлі, зменшить витрати на опалення та покращить умови для пацієнтів і медичного персоналу.

Очікувані результати: покращення доступності та якості первинної медичної допомоги, підвищення енергоефективності будівлі з відповідним зменшенням бюджетних витрат та екологічного сліду.

Наявна документація: Муніципальний енергетичний план Самарської ТГ до 2030 року, Стратегія енергозбереження Дніпропетровської області (2018–2035), проєктно-кошторисна документація.

Громада активно шукає партнерів та відкрита до співпраці з донорськими організаціями.`,
    estimatedCostUsd: 835000,
    region: 'Dnipropetrovsk Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'HIGH',
    cityLatitude: 48.4500,
    cityLongitude: 35.0667,
    photos: [
      { filename: 'samar-healthcare-facade.jpg', altText: 'City Center of Primary Health Care building in Samar' },
    ],
  },
]

async function main() {
  console.log('=== PROJECT SWAP: Demo → Real Ecoaction Projects ===\n')

  // ── Step 1: Delete demo projects ──
  console.log('Step 1: Deleting demo projects...')

  // Delete in dependency order (children first)
  const featuredDeleted = await prisma.featuredProject.deleteMany()
  console.log(`  Featured slots: ${featuredDeleted.count} deleted`)

  const imagesDeleted = await prisma.projectImage.deleteMany()
  console.log(`  Project images: ${imagesDeleted.count} deleted`)

  const docsDeleted = await prisma.projectDocument.deleteMany()
  console.log(`  Project documents: ${docsDeleted.count} deleted`)

  const updatesDeleted = await prisma.projectUpdate.deleteMany()
  console.log(`  Project updates: ${updatesDeleted.count} deleted`)

  const submissionsDeleted = await prisma.contactSubmission.deleteMany()
  console.log(`  Contact submissions: ${submissionsDeleted.count} deleted`)

  const projectsDeleted = await prisma.project.deleteMany()
  console.log(`  Projects: ${projectsDeleted.count} deleted`)

  console.log('')

  // ── Step 2: Upload photos & create projects ──
  console.log('Step 2: Uploading photos and creating projects...\n')

  const featuredSlots: { projectId: string; slot: number }[] = []

  for (const def of PROJECTS) {
    console.log(`  Creating: ${def.municipalityName} — ${def.facilityName}`)

    // Upload photos
    const photoUrls: { url: string; altText: string; sortOrder: number }[] = []
    for (let i = 0; i < def.photos.length; i++) {
      const photo = def.photos[i]
      try {
        const url = await uploadPhoto(photo.filename)
        photoUrls.push({ url, altText: photo.altText, sortOrder: i })
        console.log(`    Photo ${i + 1}/${def.photos.length}: uploaded`)
      } catch (err) {
        console.error(`    Photo ${i + 1}/${def.photos.length}: FAILED — ${err}`)
      }
    }

    // Create project with photos
    const project = await prisma.project.create({
      data: {
        municipalityName: def.municipalityName,
        municipalityNameUk: def.municipalityNameUk,
        facilityName: def.facilityName,
        facilityNameUk: def.facilityNameUk,
        category: def.category,
        projectType: def.projectType,
        briefDescription: def.briefDescription,
        briefDescriptionUk: def.briefDescriptionUk,
        fullDescription: def.fullDescription,
        fullDescriptionUk: def.fullDescriptionUk,
        estimatedCostUsd: def.estimatedCostUsd,
        technicalPowerKw: def.technicalPowerKw ?? null,
        numberOfPanels: def.numberOfPanels ?? null,
        region: def.region,
        partnerOrganization: 'NGO Ecoaction',
        cofinancingAvailable: def.cofinancingAvailable,
        cofinancingDetails: def.cofinancingDetails ?? null,
        urgency: def.urgency,
        status: 'OPEN',
        cityLatitude: def.cityLatitude,
        cityLongitude: def.cityLongitude,
        contactName: CONTACT.name,
        contactEmail: CONTACT.email,
        photos: {
          create: photoUrls,
        },
      },
    })

    console.log(`    Created: ${project.id}`)

    if (def.featured) {
      featuredSlots.push({ projectId: project.id, slot: def.featured })
    }
  }

  // ── Step 3: Set featured slots ──
  console.log('\nStep 3: Setting featured project slots...')

  for (const { projectId, slot } of featuredSlots) {
    await prisma.featuredProject.create({
      data: { projectId, slot },
    })
    console.log(`  Slot ${slot}: ${projectId}`)
  }

  // ── Summary ──
  const finalCount = await prisma.project.count()
  const finalFeatured = await prisma.featuredProject.count()
  const finalPhotos = await prisma.projectImage.count()

  console.log('\n=== SWAP COMPLETE ===')
  console.log(`  Projects: ${finalCount}`)
  console.log(`  Featured: ${finalFeatured}`)
  console.log(`  Photos: ${finalPhotos}`)
}

main()
  .catch((e) => {
    console.error('\nSwap failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
