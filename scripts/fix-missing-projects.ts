/**
 * Script to add the projects that failed geocoding with corrected location names
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CONTACTS = {
  energyact: { name: 'Anastasiia Vereshchynska', email: 'anastasiia@energyact.org', org: 'Energy Act For Ukraine' },
}

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

// Projects that failed geocoding with corrected names
const missingProjects = [
  {
    location: 'Mykolaiv, Ukraine', // Fixed spelling
    municipalityName: 'Mykolaiiv',
    object: 'Mykolaiiv regional children\'s hospital',
    powerKw: 60,
    panels: 111,
    costUsd: 30000,
    cofinance: 'Yes, building hybrid PV',
    dcPower: true
  },
  {
    location: 'Fontanka, Odesa Oblast, Ukraine', // Avanhardivska is near Fontanka
    municipalityName: 'Avanhardivska village community',
    object: 'Prylymanskyi lyceum',
    powerKw: 36,
    panels: 67,
    costUsd: 18000,
    cofinance: 'Yes, building hybrid PV',
    dcPower: true
  },
  {
    location: 'Mariianivka, Kyiv Oblast, Ukraine', // Added oblast
    municipalityName: 'Mariianivka',
    object: 'Multi-field school/kindergarten',
    powerKw: 15,
    panels: 28,
    costUsd: 7500,
    cofinance: 'Yes, building hybrid PV',
    dcPower: true
  },
]

async function main() {
  console.log('🔧 Adding missing projects...\n')

  const contactInfo = CONTACTS.energyact

  for (const proj of missingProjects) {
    console.log(`📍 Geocoding: ${proj.location}...`)
    const coords = await geocode(proj.location)

    if (!coords) {
      console.log(`   ⚠ Still failed to geocode ${proj.location}`)
      // Use approximate coordinates for Odesa oblast for Avanhardivska
      if (proj.location.includes('Fontanka')) {
        // Fontanka is near Odesa
        const approxCoords = { lat: 46.4, lng: 30.7 }
        console.log(`   📍 Using approximate coordinates for ${proj.municipalityName}`)

        await createProject(proj, approxCoords, contactInfo)
      } else if (proj.location.includes('Mariianivka')) {
        // Mariianivka, Kyiv Oblast
        const approxCoords = { lat: 50.2, lng: 30.0 }
        console.log(`   📍 Using approximate coordinates for ${proj.municipalityName}`)

        await createProject(proj, approxCoords, contactInfo)
      }
      continue
    }

    await new Promise(resolve => setTimeout(resolve, 1100))
    await createProject(proj, coords, contactInfo)
  }

  console.log('\n✅ Done!')
}

async function createProject(proj: any, coords: { lat: number; lng: number }, contactInfo: any) {
  const briefDesc = `${proj.powerKw}kW solar PV installation for ${proj.object.toLowerCase()}`
  const fullDesc = `Solar photovoltaic system installation for ${proj.object} in ${proj.municipalityName}.

Technical specifications:
• Theoretical power: ${proj.powerKw} kW (DC)
• Number of 540W panels: ${proj.panels}
• Estimated cost: $${proj.costUsd.toLocaleString()} USD

Co-financing: ${proj.cofinance}`

  try {
    await prisma.project.create({
      data: {
        municipalityName: proj.municipalityName,
        facilityName: proj.object,
        category: proj.object.toLowerCase().includes('school') || proj.object.toLowerCase().includes('lyceum') || proj.object.toLowerCase().includes('kindergarten') ? 'SCHOOL' : 'HOSPITAL',
        briefDescription: briefDesc.substring(0, 150),
        fullDescription: fullDesc.substring(0, 2000),
        cityLatitude: coords.lat,
        cityLongitude: coords.lng,
        contactName: contactInfo.name,
        contactEmail: contactInfo.email,
        urgency: 'MEDIUM',
        status: 'OPEN',
        projectType: 'SOLAR_PV',
        projectSubtype: 'Hybrid PV (DC)',
        technicalPowerKw: proj.powerKw,
        numberOfPanels: proj.panels,
        estimatedCostUsd: proj.costUsd,
        cofinancingAvailable: 'YES',
        cofinancingDetails: 'Building hybrid PV system',
        partnerOrganization: contactInfo.org,
      }
    })
    console.log(`   ✓ Created: ${proj.object}`)
  } catch (error) {
    console.error(`   ✗ Error:`, error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
