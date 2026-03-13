/**
 * Add 12 Ecoaction Tier 2 projects (no documentation yet — Kostia will send PDFs later).
 *
 * 1. Upload cropped photos from /tmp/project-photos-batch2/ to Supabase Storage
 * 2. Create 12 projects with photos and Ukrainian translations
 * 3. Create APPROVED ProjectSubmission records under Kostia's account
 * 4. Update featured project slots (4 from all 14 projects)
 *
 * Run with: npx tsx scripts/add-batch2-projects.ts
 */

import { config } from 'dotenv'
import { PrismaClient, Category, ProjectType, Urgency, CofinancingStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

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

const KOSTIA_USER_ID = 'cml9ginja0003h4uvf9e2wb9h'
const PHOTOS_DIR = '/tmp/project-photos-batch2'

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
  region?: string
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

  // ── 2. Novovolynsk Lyceum Pool ──
  {
    municipalityName: 'Novovolynsk',
    municipalityNameUk: 'Нововолинськ',
    facilityName: 'Novovolynsk Lyceum No. 6 Social Swimming Pool',
    facilityNameUk: 'Соціальний басейн Нововолинського ліцею №6',
    category: 'SCHOOL',
    projectType: 'HEAT_PUMP',
    briefDescription: 'Energy-efficient 140kW heat pump system for the social swimming pool at Novovolynsk Lyceum No. 6',
    briefDescriptionUk: 'Енергоефективна теплонасосна система потужністю 140 кВт для соціального басейну Нововолинського ліцею №6',
    fullDescription: `This project ensures year-round operation of the social swimming pool at Novovolynsk Lyceum No. 6 by implementing energy-efficient technologies and renewable energy solutions to reduce operating costs and increase energy independence.

The installation of a 140 kW heat pump system will provide efficient heating for the pool facility, significantly reducing energy consumption and CO₂ emissions by approximately 100 tons per year. The project aims to increase the daily visitor capacity to 150 people per day.

A feasibility study for the installation of renewable energy technologies at Novovolynsk Lyceum No. 6 has been completed in partnership with NGO Ecoaction. The community is actively seeking partners for project implementation.`,
    fullDescriptionUk: `Проєкт забезпечує цілорічну роботу соціального басейну Нововолинського ліцею №6 шляхом впровадження енергоефективних технологій та рішень відновлюваної енергетики для зменшення експлуатаційних витрат та підвищення енергонезалежності.

Встановлення теплонасосної системи потужністю 140 кВт забезпечить ефективне опалення басейну, значно зменшивши споживання енергії та викиди CO₂ приблизно на 100 тонн на рік. Проєкт спрямований на збільшення щоденної пропускної здатності до 150 відвідувачів на день.

Техніко-економічне обґрунтування розроблено у партнерстві з ГО «Екодія». Громада активно шукає партнерів для реалізації проєкту.`,
    estimatedCostUsd: 355000,
    technicalPowerKw: 140,
    region: 'Volyn Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 50.7293,
    cityLongitude: 24.1647,
    photos: [
      { filename: 'novovolynsk-pool-heatpump.jpg', altText: 'Heat pump equipment for the Novovolynsk Lyceum swimming pool' },
      { filename: 'novovolynsk-pool.jpg', altText: 'Social swimming pool at Novovolynsk Lyceum No. 6' },
    ],
  },

  // ── 3. Sheptytskyi Disability Services Solar ──
  {
    municipalityName: 'Sheptytskyi',
    municipalityNameUk: 'Шептицький',
    facilityName: 'Municipal Enterprise "Teploenerhoemeritsia" & NGO "Nika"',
    facilityNameUk: 'Комунальне підприємство «Теплоенергоемеріція» та ГО «Ніка»',
    category: 'ENERGY',
    projectType: 'SOLAR_PV',
    briefDescription: 'Solar 12kW installation providing energy independence for disability services in Sheptytskyi',
    briefDescriptionUk: 'Встановлення сонячної електростанції потужністю 12 кВт для енергонезалежності служб підтримки людей з інвалідністю',
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
      { filename: 'sheptytskyi-building.jpg', altText: 'Municipal enterprise building in Sheptytskyi' },
      { filename: 'sheptytskyi-solar.jpg', altText: 'Solar panel installation at Sheptytskyi' },
    ],
  },

  // ── 4. Nadvirna Children's Hospital Solar ──
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
      { filename: 'nadvirna-children-solar.jpg', altText: 'Solar panels planned for the hospital rooftop' },
    ],
    featured: 3,
  },

  // ── 5. Nadvirna Central Hospital Thermo-Modernization ──
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

  // ── 7. Samar Dental Clinic Solar ──
  {
    municipalityName: 'Samar',
    municipalityNameUk: 'Самар',
    facilityName: 'Samar City Dental Clinic',
    facilityNameUk: 'Самарська міська стоматологічна поліклініка',
    category: 'HOSPITAL',
    projectType: 'SOLAR_PV',
    briefDescription: 'Solar 30kW hybrid rooftop installation ensuring uninterrupted power for dental care at Samar Dental Clinic',
    briefDescriptionUk: 'Гібридна сонячна електростанція 30 кВт для безперебійного електропостачання Самарської стоматологічної поліклініки',
    fullDescription: `Installation of a 30 kW hybrid rooftop solar power plant on the Samar City Dental Clinic to provide a stable, energy-saving electricity source using alternative solar energy.

The project ensures stable electricity supply during the provision of dental care, including dental surgeries. Solar power based on sustainable and renewable resources will create safe conditions for medical procedures through guaranteed power supply for critical medical equipment and communication systems.

Expected outcomes include increased energy efficiency of the clinic building and savings of 15–20% on heating costs, up to 100,000 UAH per year. The project aligns with the Municipal Energy Plan of the Samar Territorial Community until 2030.

The community is open to new partnerships with donor organizations and investment funds.`,
    fullDescriptionUk: `Встановлення гібридної дахової сонячної електростанції потужністю 30 кВт на Самарській міській стоматологічній поліклініці для забезпечення стабільного, енергозберігаючого джерела електроенергії.

Проєкт забезпечить стабільне електропостачання під час надання стоматологічної допомоги, включаючи хірургічні втручання. Сонячна енергія створить безпечні умови для медичних процедур завдяки гарантованому живленню критичного медичного обладнання та систем зв'язку.

Очікувані результати: підвищення енергоефективності будівлі та економія 15–20% на опаленні, до 100 000 грн на рік. Проєкт відповідає Муніципальному енергетичному плану Самарської ТГ до 2030 року.

Громада відкрита до партнерства з донорськими організаціями та інвестиційними фондами.`,
    estimatedCostUsd: 290000,
    technicalPowerKw: 30,
    region: 'Dnipropetrovsk Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 48.4500,
    cityLongitude: 35.0667,
    photos: [
      { filename: 'samar-dental-aerial.jpg', altText: 'Aerial view showing planned solar panel layout on Samar Dental Clinic' },
      { filename: 'samar-dental-clinic.jpg', altText: 'Samar City Dental Clinic building entrance' },
    ],
  },

  // ── 8. Samar Dental Clinic Thermo-Modernization ──
  {
    municipalityName: 'Samar',
    municipalityNameUk: 'Самар',
    facilityName: 'Samar City Dental Clinic (Thermo-Modernization)',
    facilityNameUk: 'Самарська міська стоматологічна поліклініка (термомодернізація)',
    category: 'HOSPITAL',
    projectType: 'THERMO_MODERNIZATION',
    briefDescription: 'Facade insulation and window replacement for the Samar City Dental Clinic to improve energy efficiency',
    briefDescriptionUk: 'Утеплення фасаду та заміна вікон Самарської стоматологічної поліклініки для підвищення енергоефективності',
    fullDescription: `Thermo-modernization of the Samar City Dental Clinic building, including facade insulation and window replacement, to improve energy efficiency and ensure comfortable conditions for patients and medical staff.

The project will reduce heat losses, positively affecting the microclimate in treatment rooms and waiting areas. Stable temperatures will enhance the overall quality of dental services and ensure appropriate sanitary and hygienic conditions.

Significant savings in thermal and other energy resources are expected, enabling more rational use of the facility's budget. The project aligns with the Municipal Energy Plan of the Samar Territorial Community until 2030.

The community is open to new partnerships with donor organizations and investment funds.`,
    fullDescriptionUk: `Термомодернізація будівлі Самарської міської стоматологічної поліклініки, включаючи утеплення фасаду та заміну вікон, для підвищення енергоефективності та забезпечення комфортних умов для пацієнтів та медичного персоналу.

Проєкт зменшить тепловтрати, позитивно впливаючи на мікроклімат у лікувальних кабінетах та зонах очікування. Стабільна температура підвищить загальну якість стоматологічних послуг та забезпечить належні санітарно-гігієнічні умови.

Очікується значна економія теплової та іншої енергії, що дозволить раціональніше використовувати бюджет закладу. Проєкт відповідає Муніципальному енергетичному плану Самарської ТГ до 2030 року.

Громада відкрита до партнерства з донорськими організаціями та інвестиційними фондами.`,
    estimatedCostUsd: 120000,
    region: 'Dnipropetrovsk Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 48.4500,
    cityLongitude: 35.0667,
    photos: [
      { filename: 'samar-dental-thermo-closeup.jpg', altText: 'Dental clinic facade detail showing planned insulation areas' },
      { filename: 'samar-dental-thermo-wide.jpg', altText: 'Samar City Dental Clinic building wide view' },
    ],
  },

  // ── 9. Samar Primary Health Care Facade ──
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
    urgency: 'MEDIUM',
    cityLatitude: 48.4500,
    cityLongitude: 35.0667,
    photos: [
      { filename: 'samar-healthcare-facade.jpg', altText: 'City Center of Primary Health Care building in Samar' },
    ],
  },

  // ── 10. Zelenodolsk Lyceum Solar ──
  {
    municipalityName: 'Zelenodolsk',
    municipalityNameUk: 'Зеленодольськ',
    facilityName: 'Zelenodolsk Lyceum No. 2',
    facilityNameUk: 'Зеленодольський ліцей №2',
    category: 'SCHOOL',
    projectType: 'SOLAR_PV',
    briefDescription: 'Solar 43kW hybrid power plant and energy storage for autonomous operation of Zelenodolsk Lyceum No. 2',
    briefDescriptionUk: 'Гібридна сонячна електростанція 43 кВт та накопичувач енергії для автономної роботи Зеленодольського ліцею №2',
    fullDescription: `This project creates a reliable, independent, and resilient energy supply system for the hub educational institution Zelenodolsk Lyceum No. 2 by installing a hybrid solar power plant and energy storage, ensuring uninterrupted educational processes.

The transition to autonomous electricity supply will guarantee stable and uninterrupted operation of the institution, even during grid outages. The project will reduce the school's dependence on the central power grid and lower energy costs for the community budget.

Budget documentation has been prepared for the required solar power capacity, battery storage, and related equipment. The Department of Education, Culture, Sports, and Youth Policy of the Zelenodolsk City Council is a project partner.

The community is actively seeking partners for project implementation and is open to cooperation with donor organizations and investment funds.`,
    fullDescriptionUk: `Проєкт створює надійну, незалежну та стійку систему енергопостачання для опорного навчального закладу — Зеленодольського ліцею №2 — шляхом встановлення гібридної сонячної електростанції та накопичувача енергії для безперебійного навчального процесу.

Перехід до автономного електропостачання гарантуватиме стабільну та безперебійну роботу закладу навіть під час відключень мережі. Проєкт зменшить залежність школи від централізованої електромережі та знизить енергетичні витрати бюджету громади.

Підготовлено бюджетну документацію для необхідної потужності сонячної електростанції, акумуляторного накопичувача та супутнього обладнання.

Громада активно шукає партнерів для реалізації проєкту та відкрита до співпраці з донорськими організаціями.`,
    estimatedCostUsd: 485000,
    technicalPowerKw: 43,
    region: 'Dnipropetrovsk Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 47.5700,
    cityLongitude: 33.6600,
    photos: [
      { filename: 'zelenodolsk-solar.jpg', altText: 'Solar panel reference installation for Zelenodolsk Lyceum' },
      { filename: 'zelenodolsk-lyceum-3d.jpg', altText: '3D model rendering of Zelenodolsk Lyceum No. 2 with solar panels' },
    ],
    featured: 4,
  },

  // ── 11. Pryiutivka ASC Solar ──
  {
    municipalityName: 'Pryiutivka',
    municipalityNameUk: 'Приютівка',
    facilityName: 'Administrative Service Center & Voinivka Social Institutions',
    facilityNameUk: 'Центр надання адмінпослуг та соціальні заклади с. Войнівка',
    category: 'OTHER',
    projectType: 'SOLAR_PV',
    briefDescription: 'Solar 50kW installation for the Pryiutivka ASC, IDP dormitory, and kindergarten in Voinivka',
    briefDescriptionUk: 'Сонячна електростанція 50 кВт для ЦНАПу Приютівки, гуртожитку для ВПО та дитсадка у Войнівці',
    fullDescription: `Construction of a 50 kW hybrid photovoltaic power plant to provide energy for the Administrative Services Center (ASC), the dormitory for internally displaced persons, and the kindergarten in the village of Voinivka.

The project will ensure stable and uninterrupted functioning of the ASC, dormitory, and kindergarten — critical social infrastructure serving both the local community and displaced families. Expected outcomes include energy independence, reduction of CO₂ emissions, and significant long-term cost savings.

Design and cost documentation has been prepared for project implementation. The Pryiutivka Settlement Council is committed to co-financing up to 50% of the project cost, demonstrating strong community ownership and investment.

The community is open to partnerships with donor organizations and investment funds for the remaining project costs.`,
    fullDescriptionUk: `Будівництво гібридної фотоелектричної електростанції потужністю 50 кВт для енергозабезпечення Центру надання адміністративних послуг (ЦНАП), гуртожитку для внутрішньо переміщених осіб та дитячого садка в селі Войнівка.

Проєкт забезпечить стабільне та безперебійне функціонування ЦНАПу, гуртожитку та дитсадка — критичної соціальної інфраструктури, яка обслуговує як місцеву громаду, так і переселені сім'ї. Очікувані результати: енергонезалежність, зменшення викидів CO₂ та значна довгострокова економія.

Підготовлено проєктно-кошторисну документацію для реалізації проєкту. Приютівська селищна рада зобов'язується співфінансувати до 50% вартості проєкту.

Громада відкрита до партнерства з донорськими організаціями для покриття решти витрат.`,
    estimatedCostUsd: 73000,
    technicalPowerKw: 50,
    cofinancingAvailable: 'YES',
    cofinancingDetails: '50% municipal cofinancing from Pryiutivka Settlement Council',
    urgency: 'MEDIUM',
    cityLatitude: 49.0500,
    cityLongitude: 35.1700,
    photos: [
      { filename: 'pryiutivka-solar.jpg', altText: 'Solar panels with chimney at Pryiutivka facility' },
      { filename: 'pryiutivka-asc.jpg', altText: 'Administrative Service Center building in Pryiutivka' },
    ],
  },

  // ── 12. Slobozhanske ASC Solar ──
  {
    municipalityName: 'Slobozhanske',
    municipalityNameUk: 'Слобожанське',
    facilityName: 'Administrative Service Center (ASC)',
    facilityNameUk: 'Центр надання адміністративних послуг (ЦНАП)',
    category: 'OTHER',
    projectType: 'SOLAR_PV',
    briefDescription: 'Rooftop solar installation for the Administrative Service Center serving displaced persons in Slobozhanske',
    briefDescriptionUk: 'Дахова сонячна електростанція для ЦНАПу Слобожанського, що обслуговує переселенців',
    fullDescription: `Construction of a solar power plant for the public building of the Administrative Service Center (ASC) of the Slobozhanske City Council, Chuhuiv District, Kharkiv Region.

The project will provide a stable and economically efficient source of energy supply for the public building that serves internally displaced persons of the community. Expected results include ensuring uninterrupted provision of public services, reducing electricity consumption by approximately 24,000 kWh annually, and reducing electricity costs by approximately 240,000 UAH per year.

An assessment of the solar power potential and technical specifications has been conducted as part of the EU4UA Project "Slobozhanske Territorial Community," implemented jointly with international partners.

The community is open to partnerships and plans to engage interested stakeholders throughout the project's implementation.`,
    fullDescriptionUk: `Будівництво сонячної електростанції для громадської будівлі Центру надання адміністративних послуг (ЦНАП) Слобожанської міської ради, Чугуївський район, Харківська область.

Проєкт забезпечить стабільне та економічно ефективне джерело енергопостачання для громадської будівлі, яка обслуговує внутрішньо переміщених осіб громади. Очікувані результати: безперебійне надання публічних послуг, зменшення споживання електроенергії приблизно на 24 000 кВт·год на рік та зменшення витрат на електроенергію приблизно на 240 000 грн на рік.

Оцінку сонячного потенціалу та технічні специфікації розроблено в рамках проєкту EU4UA «Слобожанська ТГ» спільно з міжнародними партнерами.

Громада відкрита до партнерства та планує залучати зацікавлених учасників до реалізації проєкту.`,
    estimatedCostUsd: 16000,
    region: 'Kharkiv Oblast',
    cofinancingAvailable: 'NO',
    urgency: 'MEDIUM',
    cityLatitude: 48.9700,
    cityLongitude: 36.3700,
    photos: [
      { filename: 'slobozhanske-3d.jpg', altText: '3D model of Slobozhanske ASC with rooftop solar panels' },
      { filename: 'slobozhanske-thermal.jpg', altText: 'Thermal analysis of Slobozhanske ASC building' },
      { filename: 'slobozhanske-building.jpg', altText: 'Slobozhanske Administrative Service Center building' },
    ],
  },
]

async function main() {
  console.log('=== ADD BATCH 2: 12 Ecoaction Tier 2 Projects ===\n')

  // ── Step 1: Upload photos & create projects ──
  console.log('Step 1: Uploading photos and creating projects...\n')

  const newFeaturedSlots: { projectId: string; slot: number }[] = []

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
        region: def.region ?? null,
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
      newFeaturedSlots.push({ projectId: project.id, slot: def.featured })
    }

    // Create APPROVED ProjectSubmission under Kostia's account
    await prisma.projectSubmission.create({
      data: {
        municipalityName: def.municipalityName,
        municipalityEmail: CONTACT.email,
        region: def.region ?? null,
        facilityName: def.facilityName,
        category: def.category,
        projectType: def.projectType,
        briefDescription: def.briefDescription,
        fullDescription: def.fullDescription,
        urgency: def.urgency,
        estimatedCostUsd: def.estimatedCostUsd,
        technicalPowerKw: def.technicalPowerKw ?? null,
        cofinancingAvailable: def.cofinancingAvailable === 'YES' ? 'YES' : 'NO',
        cofinancingDetails: def.cofinancingDetails ?? null,
        cityName: def.municipalityName,
        cityLatitude: def.cityLatitude,
        cityLongitude: def.cityLongitude,
        contactName: CONTACT.name,
        contactEmail: CONTACT.email,
        partnerOrganization: 'NGO Ecoaction',
        status: 'APPROVED',
        approvedProjectId: project.id,
        reviewedAt: new Date(),
        submittedByUserId: KOSTIA_USER_ID,
      },
    })
    console.log(`    Submission: APPROVED`)
  }

  // ── Step 2: Update featured project slots ──
  console.log('\nStep 2: Updating featured project slots...')

  // Keep existing featured projects in slots 1 & 2, add new ones in 3 & 4
  // First delete any existing slot 3 & 4
  for (const { slot } of newFeaturedSlots) {
    await prisma.featuredProject.deleteMany({ where: { slot } })
  }

  for (const { projectId, slot } of newFeaturedSlots) {
    await prisma.featuredProject.create({
      data: { projectId, slot },
    })
    console.log(`  Slot ${slot}: ${projectId}`)
  }

  // ── Summary ──
  const finalCount = await prisma.project.count()
  const finalFeatured = await prisma.featuredProject.count()
  const finalPhotos = await prisma.projectImage.count()
  const finalSubmissions = await prisma.projectSubmission.count()

  console.log('\n=== BATCH 2 COMPLETE ===')
  console.log(`  Total projects: ${finalCount}`)
  console.log(`  Featured slots: ${finalFeatured}`)
  console.log(`  Total photos: ${finalPhotos}`)
  console.log(`  Total submissions: ${finalSubmissions}`)
}

main()
  .catch((e) => {
    console.error('\nBatch 2 failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
