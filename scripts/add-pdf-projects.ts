/**
 * Script to add renewable energy projects from the PDF document
 * Run with: npx tsx scripts/add-pdf-projects.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Load environment variables from .env.local
config({ path: '.env.local' })

console.log('Connecting to database...')

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter and client
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Contact persons mapping
const CONTACTS = {
  ecoclub: { name: 'Dmytro Sakaliuk', email: 'dmytro@ecoclub.ua', org: 'NGO Ecoclub' },
  ecoaction: { name: 'Kostiantyn Krynytskyi', email: 'kostiantyn@ecoaction.org', org: 'NGO Ecoaction' },
  greenpeace: { name: 'Denys Tsutsaiev', email: 'denys@greenpeace.org', org: 'Greenpeace CEE' },
  energyact: { name: 'Anastasiia Vereshchynska', email: 'anastasiia@energyact.org', org: 'Energy Act For Ukraine' },
  ecoclub_myhaylo: { name: 'Dmytro Sakaliuk / Myhaylo Lukyanyk', email: 'dmytro@ecoclub.ua', org: 'NGO Ecoclub' },
}

// Geocoding function using OpenStreetMap Nominatim
async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Hromada-Project-Seeder/1.0' }
    })
    const data = await response.json()
    if (data && data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch (error) {
    console.error(`Geocoding failed for ${location}:`, error)
    return null
  }
}

// Helper to determine category
function getCategory(objectName: string): 'HOSPITAL' | 'SCHOOL' | 'WATER' | 'ENERGY' | 'OTHER' {
  const lower = objectName.toLowerCase()
  if (lower.includes('hospital') || lower.includes('polyclinic') || lower.includes('maternity') || lower.includes('surgical') || lower.includes('obstetrics')) {
    return 'HOSPITAL'
  }
  if (lower.includes('school') || lower.includes('kindergarten') || lower.includes('lyceum') || lower.includes('preschool') || lower.includes('gymnasium')) {
    return 'SCHOOL'
  }
  if (lower.includes('water') || lower.includes('sewage') || lower.includes('pumping')) {
    return 'WATER'
  }
  if (lower.includes('heat') || lower.includes('energy') || lower.includes('power') || lower.includes('boiler')) {
    return 'ENERGY'
  }
  return 'OTHER'
}

// Helper to determine cofinancing status
function getCofinancingStatus(text: string): 'YES' | 'NO' | 'NEEDS_CLARIFICATION' | null {
  const lower = text.toLowerCase()
  if (lower.includes('needs to be clarified')) return 'NEEDS_CLARIFICATION'
  if (lower.includes('yes') || lower.includes('так')) return 'YES'
  if (lower === 'no') return 'NO'
  return null
}

// Helper to extract cofinancing details
function getCofinancingDetails(text: string): string | null {
  if (text.toLowerCase().includes('needs to be clarified')) return null
  // Extract amounts like "500 000 UAH", "20%", "6 mln UAH"
  const match = text.match(/(\d[\d\s,]*\s*(UAH|грн|%|mln|million))/i)
  if (match) return match[0].trim()
  if (text.toLowerCase().includes('building hybrid')) return 'Building hybrid PV system'
  if (text.toLowerCase() === 'yes' || text.toLowerCase() === 'так') return null
  return text
}

// Projects from the PDF - PV STATIONS section (excluding row 16 - Nizhyn maternity hospital)
const pvProjects = [
  { num: 1, location: 'Khotyn, Ukraine', object: 'Khotyn multi-field hospital', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Yes, up to 20%', contact: 'ecoclub' },
  { num: 2, location: 'Pervomaisk, Ukraine', object: 'Pervomaisk central district hospital', powerKw: 180, panels: 333, costUsd: 90000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 3, location: 'Pavlohrad, Ukraine', object: 'Sewage treatment plants', powerKw: 250, panels: 463, costUsd: 125000, cofinance: 'Yes', contact: 'ecoaction' },
  { num: 4, location: 'Pavlohrad, Ukraine', object: 'Water-pumping station', powerKw: 250, panels: 463, costUsd: 125000, cofinance: 'Yes', contact: 'ecoaction' },
  { num: 5, location: 'Bilhorod-Dnistrovskyi, Ukraine', object: 'Bilhorod-Dnistrovskyi multifield hospital', powerKw: 150, panels: 278, costUsd: 75000, cofinance: 'Yes, 500 000 UAH', contact: 'ecoclub' },
  { num: 6, location: 'Horenka, Ukraine', object: 'Kindergarten "Kazka"', powerKw: 20, panels: 37, costUsd: 10000, cofinance: 'Needs to be clarified', contact: 'greenpeace' },
  { num: 7, location: 'Ivankiv, Ukraine', object: 'Ivankiv district hospital', powerKw: 50, panels: 93, costUsd: 25000, cofinance: 'Needs to be clarified', contact: 'greenpeace' },
  { num: 8, location: 'Voznesensk, Ukraine', object: 'Voznesensk multifield hospital', powerKw: 250, panels: 463, costUsd: 125000, cofinance: 'Yes, 500 000 UAH', contact: 'ecoclub' },
  { num: 9, location: 'Dubno, Ukraine', object: 'Dubno town hospital', powerKw: 45, panels: 83, costUsd: 22500, cofinance: 'Yes, 500 000 UAH', contact: 'ecoclub' },
  { num: 10, location: 'Zhmerynka, Ukraine', object: 'Zhmerynka central district hospital', powerKw: 400, panels: 741, costUsd: 200000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 11, location: 'Kodyma, Ukraine', object: 'Kodyma hospital', powerKw: 90, panels: 167, costUsd: 45000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 12, location: 'Kolomyia, Ukraine', object: 'Kolomyia central district hospital', powerKw: 250, panels: 463, costUsd: 125000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 13, location: 'Korosten, Ukraine', object: 'Korosten central town hospital', powerKw: 250, panels: 463, costUsd: 125000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 14, location: 'Kremenchuk, Ukraine', object: 'Kremenchuk town hospital "Pravoberezhna"', powerKw: 50, panels: 93, costUsd: 25000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 15, location: 'Myrhorod, Ukraine', object: 'Myrhorod hospital for intensive care', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Yes, 100 000 UAH', contact: 'ecoclub' },
  // SKIP num 16 - Nizhyn maternity hospital (already exists)
  { num: 17, location: 'Nizhyn, Ukraine', object: 'Nizhyn dental polyclinic', powerKw: 20, panels: 37, costUsd: 10000, cofinance: 'Yes', contact: 'ecoclub' },
  { num: 18, location: 'Ovruch, Ukraine', object: 'Ovruch town hospital', powerKw: 75, panels: 139, costUsd: 37500, cofinance: 'Yes', contact: 'ecoclub' },
  { num: 19, location: 'Podilsk, Ukraine', object: 'Podilsk town hospital', powerKw: 150, panels: 278, costUsd: 75000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 20, location: 'Poltava, Ukraine', object: 'Children\'s hospital', powerKw: 150, panels: 278, costUsd: 75000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 21, location: 'Poltava, Ukraine', object: '1-A town hospital', powerKw: 130, panels: 241, costUsd: 65000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 23, location: 'Rivne, Ukraine', object: 'Children\'s hospital', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Yes, 500 000 UAH', contact: 'ecoclub' },
  { num: 24, location: 'Rivne, Ukraine', object: 'Town dental polyclinic', powerKw: 40, panels: 74, costUsd: 20000, cofinance: 'Yes', contact: 'ecoclub' },
  { num: 25, location: 'Selydove, Ukraine', object: 'Selydove central town hospital', powerKw: 40, panels: 74, costUsd: 20000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 26, location: 'Fastiv, Ukraine', object: 'Fastiv multi-field hospital for intensive care', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Needs to be clarified', contact: 'ecoclub' },
  { num: 27, location: 'Cherkasy, Ukraine', object: 'Cherkasy town hospital for emergency care #3', powerKw: 150, panels: 278, costUsd: 75000, cofinance: 'Yes, 750 000 UAH', contact: 'ecoclub' },
  { num: 28, location: 'Chornomorsk, Ukraine', object: 'Chornomorsk town hospital', powerKw: 150, panels: 278, costUsd: 75000, cofinance: 'Yes, 500 000 UAH', contact: 'ecoclub' },
  { num: 29, location: 'Zhytomyr, Ukraine', object: 'Hospital #1', powerKw: 75, panels: 139, costUsd: 37500, cofinance: 'Yes, 500 000 UAH', contact: 'ecoclub' },
  { num: 30, location: 'Zviahel, Ukraine', object: 'Water utility company', powerKw: 220, panels: 407, costUsd: 110000, cofinance: 'Yes, 6 mln UAH', contact: 'ecoclub' },
  { num: 31, location: 'Brody, Ukraine', object: 'Brody water supply company', powerKw: 225, panels: 417, costUsd: 112500, cofinance: 'Yes, 4 mln UAH', contact: 'ecoclub' },
  { num: 34, location: 'Mykolaiiv, Ukraine', object: 'Mykolaiiv regional children\'s hospital', powerKw: 60, panels: 111, costUsd: 30000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 35, location: 'Kharkiv, Ukraine', object: 'Children\'s hospital #16', powerKw: 40, panels: 74, costUsd: 20000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 36, location: 'Derhachi, Ukraine', object: 'Derhachi central hospital', powerKw: 28, panels: 52, costUsd: 14000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 37, location: 'Chernihiv, Ukraine', object: 'Chernihiv regional hospital', powerKw: 74, panels: 137, costUsd: 37000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 38, location: 'Novomoskovsk, Ukraine', object: 'Novomoskovsk central regional hospital for intensive care', powerKw: 45, panels: 83, costUsd: 22500, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 39, location: 'Odesa, Ukraine', object: 'Odesa regional children\'s hospital', powerKw: 98, panels: 181, costUsd: 49000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 40, location: 'Odesa, Ukraine', object: 'Odesa lyceum "European"', powerKw: 30, panels: 56, costUsd: 15000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 41, location: 'Avanhardivska, Ukraine', object: 'Prylymanskyi lyceum', powerKw: 36, panels: 67, costUsd: 18000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 42, location: 'Ananiv, Ukraine', object: 'Ananiv lyceum #2', powerKw: 24, panels: 44, costUsd: 12000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 43, location: 'Mariianivka, Ukraine', object: 'Multi-field school/kindergarten', powerKw: 15, panels: 28, costUsd: 7500, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 44, location: 'Krasiatychi, Ukraine', object: 'Multi-field school/kindergarten', powerKw: 16.5, panels: 31, costUsd: 8250, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 45, location: 'Okhtyrka, Ukraine', object: 'Okhtyrka school #5', powerKw: 33, panels: 61, costUsd: 16500, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 46, location: 'Okhtyrka, Ukraine', object: 'Okhtyrka Antonenko-Davydovycha school', powerKw: 22, panels: 41, costUsd: 11000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 47, location: 'Lebedyn, Ukraine', object: 'Lebedyn school #7', powerKw: 32, panels: 59, costUsd: 16000, cofinance: 'Yes, building hybrid PV', contact: 'energyact', dcPower: true },
  { num: 48, location: 'Chervonohrad, Ukraine', object: 'Administrative building of Chervonohrad town council', powerKw: 50, panels: 93, costUsd: 25000, cofinance: 'Yes', contact: 'ecoaction' },
  { num: 49, location: 'Pavlohrad, Ukraine', object: 'Pavlohrad water supply company', powerKw: 120, panels: 222, costUsd: 60000, cofinance: 'Yes', contact: 'ecoaction' },
  { num: 50, location: 'Dobropillia, Ukraine', object: 'Specialised school #4', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 51, location: 'Dobropillia, Ukraine', object: 'Sports palace', powerKw: 30, panels: 56, costUsd: 15000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 52, location: 'Dobropillia, Ukraine', object: 'Culture center', powerKw: 90, panels: 167, costUsd: 45000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 53, location: 'Myrnohrad, Ukraine', object: 'Surgical facility of Myrnohrad central town hospital', powerKw: 70, panels: 130, costUsd: 35000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 54, location: 'Myrnohrad, Ukraine', object: 'School #10', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 55, location: 'Myrnohrad, Ukraine', object: 'Harmonia lyceum', powerKw: 170, panels: 315, costUsd: 85000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 56, location: 'Novohrodivka, Ukraine', object: 'School #7', powerKw: 90, panels: 167, costUsd: 45000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 57, location: 'Novohrodivka, Ukraine', object: 'Children\'s center "Radist"', powerKw: 30, panels: 56, costUsd: 15000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 58, location: 'Novohrodivka, Ukraine', object: 'Care center', powerKw: 60, panels: null, costUsd: null, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 59, location: 'Pokrovsk, Ukraine', object: 'Educational complex #1', powerKw: 90, panels: 167, costUsd: 45000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 60, location: 'Pokrovsk, Ukraine', object: 'Preschool #42', powerKw: 30, panels: 56, costUsd: 15000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 61, location: 'Pokrovsk, Ukraine', object: 'Obstetrics and gynecology department of the town hospital', powerKw: 60, panels: 111, costUsd: 30000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 62, location: 'Selydove, Ukraine', object: 'Care center #2', powerKw: 28, panels: 52, costUsd: 14000, cofinance: 'Yes', contact: 'ecoaction' },
  { num: 63, location: 'Selydove, Ukraine', object: 'Preschool #44 "Prolisok"', powerKw: 94, panels: 174, costUsd: 47000, cofinance: 'Yes', contact: 'ecoaction' },
  { num: 64, location: 'Toretsk, Ukraine', object: 'Administrative services center', powerKw: 30, panels: 56, costUsd: 15000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
  { num: 65, location: 'Toretsk, Ukraine', object: 'School #6', powerKw: 100, panels: 185, costUsd: 50000, cofinance: 'Needs to be clarified', contact: 'ecoaction' },
]

// Heat pump projects
const heatPumpProjects = [
  { num: 1, location: 'Kostopil, Ukraine', object: 'Municipal enterprise Kostopilkomunenergiia, 26 Stepanska str.', powerKw: 120, costUsd: 187000, cofinance: 'Yes', contact: 'ecoclub_myhaylo' },
  { num: 2, location: 'Kostopil, Ukraine', object: 'Municipal enterprise Kostopilkomunenergiia, 7B Artyleriyskyi av.', powerKw: 600, costUsd: 915000, cofinance: 'Yes', contact: 'ecoclub_myhaylo' },
  { num: 3, location: 'Kostopil, Ukraine', object: 'Municipal enterprise Kostopilkomunenergiia, 16A Stepanska str.', powerKw: 600, costUsd: 915000, cofinance: 'Yes', contact: 'ecoclub_myhaylo' },
  { num: 4, location: 'Kostopil, Ukraine', object: 'Municipal enterprise Kostopilkomunenergiia, 7 Artyleriyskyi av.', powerKw: 40, costUsd: 62000, cofinance: 'Yes', contact: 'ecoclub_myhaylo' },
  { num: 5, location: 'Zviahel, Ukraine', object: 'Municipal enterprise Novohrad-Volynskteplokomun­energo, 44 Kyivska str.', powerKw: 180, costUsd: 270750, cofinance: 'Yes, up to 20%', contact: 'ecoclub_myhaylo' },
  { num: 6, location: 'Zviahel, Ukraine', object: 'Municipal enterprise Novohrad-Volynskteplokomun­energo, 63A Karpenka str.', powerKw: 120, costUsd: 183000, cofinance: 'Yes, up to 20%', contact: 'ecoclub_myhaylo' },
  { num: 7, location: 'Khmelnytskyi, Ukraine', object: 'Sewage treatment plant 1, Rakovo', powerKw: 2000, costUsd: 3000000, cofinance: 'Yes, up to 10%', contact: 'ecoclub_myhaylo' },
  { num: 8, location: 'Lutsk, Ukraine', object: 'Municipal enterprise Lutskteplo, 8A Artseulova str.', powerKw: 210, costUsd: 345000, cofinance: 'Yes, up to 20%', contact: 'ecoclub_myhaylo' },
  { num: 9, location: 'Lutsk, Ukraine', object: 'Municipal enterprise Lutskteplo, 15 Zadvoretska str.', powerKw: 32, costUsd: 49500, cofinance: 'Yes, up to 20%', contact: 'ecoclub_myhaylo' },
]

async function main() {
  console.log('🌱 Starting PDF projects import...\n')

  // Check if Nizhyn maternity hospital already exists
  const existingNizhyn = await prisma.project.findFirst({
    where: {
      municipalityName: { contains: 'Nizhyn', mode: 'insensitive' },
      facilityName: { contains: 'maternity', mode: 'insensitive' }
    }
  })

  if (existingNizhyn) {
    console.log('✓ Found existing Nizhyn maternity hospital, will skip it\n')
  }

  let created = 0
  let skipped = 0
  let errors = 0

  // Process PV projects
  console.log('=== SOLAR PV PROJECTS ===\n')

  for (const proj of pvProjects) {
    try {
      // Geocode the location
      console.log(`📍 Geocoding: ${proj.location}...`)
      const coords = await geocode(proj.location)

      if (!coords) {
        console.log(`   ⚠ Failed to geocode ${proj.location}, skipping`)
        skipped++
        continue
      }

      // Add small delay to respect Nominatim rate limits
      await new Promise(resolve => setTimeout(resolve, 1100))

      const contactInfo = CONTACTS[proj.contact as keyof typeof CONTACTS]
      const municipalityName = proj.location.replace(', Ukraine', '')

      // Check if project already exists
      const existing = await prisma.project.findFirst({
        where: {
          municipalityName: { contains: municipalityName.split(',')[0], mode: 'insensitive' },
          facilityName: { contains: proj.object.substring(0, 20), mode: 'insensitive' }
        }
      })

      if (existing) {
        console.log(`   ⏭ Project already exists: ${proj.object}`)
        skipped++
        continue
      }

      const category = getCategory(proj.object)
      const cofinancingStatus = getCofinancingStatus(proj.cofinance)
      const cofinancingDetails = getCofinancingDetails(proj.cofinance)

      const briefDesc = `${proj.powerKw}kW solar PV installation for ${proj.object.toLowerCase()}`
      const fullDesc = `Solar photovoltaic system installation for ${proj.object} in ${municipalityName}.

Technical specifications:
• Theoretical power: ${proj.powerKw} kW${(proj as any).dcPower ? ' (DC)' : ''}
• Number of 540W panels: ${proj.panels || 'TBD'}
• Estimated cost: $${proj.costUsd?.toLocaleString() || 'TBD'} USD

Co-financing: ${proj.cofinance}`

      await prisma.project.create({
        data: {
          municipalityName,
          facilityName: proj.object,
          category,
          briefDescription: briefDesc.substring(0, 150),
          fullDescription: fullDesc.substring(0, 2000),
          cityLatitude: coords.lat,
          cityLongitude: coords.lng,
          contactName: contactInfo.name,
          contactEmail: contactInfo.email,
          urgency: 'MEDIUM',
          status: 'OPEN',
          projectType: 'SOLAR_PV',
          projectSubtype: (proj as any).dcPower ? 'Hybrid PV (DC)' : 'Standard PV',
          technicalPowerKw: proj.powerKw,
          numberOfPanels: proj.panels,
          estimatedCostUsd: proj.costUsd,
          cofinancingAvailable: cofinancingStatus,
          cofinancingDetails,
          partnerOrganization: contactInfo.org,
        }
      })

      console.log(`   ✓ Created: ${proj.object}`)
      created++

    } catch (error) {
      console.error(`   ✗ Error creating project ${proj.object}:`, error)
      errors++
    }
  }

  // Process heat pump projects
  console.log('\n=== HEAT PUMP PROJECTS ===\n')

  for (const proj of heatPumpProjects) {
    try {
      console.log(`📍 Geocoding: ${proj.location}...`)
      const coords = await geocode(proj.location)

      if (!coords) {
        console.log(`   ⚠ Failed to geocode ${proj.location}, skipping`)
        skipped++
        continue
      }

      await new Promise(resolve => setTimeout(resolve, 1100))

      const contactInfo = CONTACTS[proj.contact as keyof typeof CONTACTS]
      const municipalityName = proj.location.replace(', Ukraine', '')

      // Check if project already exists
      const existing = await prisma.project.findFirst({
        where: {
          municipalityName: { contains: municipalityName.split(',')[0], mode: 'insensitive' },
          facilityName: { contains: proj.object.substring(0, 20), mode: 'insensitive' }
        }
      })

      if (existing) {
        console.log(`   ⏭ Project already exists: ${proj.object}`)
        skipped++
        continue
      }

      const cofinancingStatus = getCofinancingStatus(proj.cofinance)
      const cofinancingDetails = getCofinancingDetails(proj.cofinance)

      const briefDesc = `${proj.powerKw}kW heat pump for district heating at ${proj.object.split(',')[0]}`
      const fullDesc = `Heat pump installation for district heating system at ${proj.object} in ${municipalityName}.

Technical specifications:
• Theoretical power: ${proj.powerKw} kW
• Estimated cost: $${proj.costUsd.toLocaleString()} USD

Co-financing: ${proj.cofinance}`

      await prisma.project.create({
        data: {
          municipalityName,
          facilityName: proj.object,
          category: 'ENERGY',
          briefDescription: briefDesc.substring(0, 150),
          fullDescription: fullDesc.substring(0, 2000),
          cityLatitude: coords.lat,
          cityLongitude: coords.lng,
          contactName: contactInfo.name,
          contactEmail: contactInfo.email,
          urgency: 'MEDIUM',
          status: 'OPEN',
          projectType: 'HEAT_PUMP',
          projectSubtype: 'District heating',
          technicalPowerKw: proj.powerKw,
          estimatedCostUsd: proj.costUsd,
          cofinancingAvailable: cofinancingStatus,
          cofinancingDetails,
          partnerOrganization: contactInfo.org,
        }
      })

      console.log(`   ✓ Created: ${proj.object}`)
      created++

    } catch (error) {
      console.error(`   ✗ Error creating project ${proj.object}:`, error)
      errors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✅ Import completed!`)
  console.log(`   Created: ${created} projects`)
  console.log(`   Skipped: ${skipped} projects`)
  console.log(`   Errors: ${errors} projects`)
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
