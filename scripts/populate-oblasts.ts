import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Create Prisma adapter
const adapter = new PrismaPg(pool)

// Create Prisma client with adapter
const prisma = new PrismaClient({
  adapter,
})

// Ukrainian oblasts with approximate bounding boxes [minLat, maxLat, minLng, maxLng]
// and center points for better matching
const OBLASTS: { name: string; bounds: [number, number, number, number]; center: [number, number] }[] = [
  { name: 'Kyiv Oblast', bounds: [49.2, 51.5, 29.3, 32.2], center: [50.45, 30.52] },
  { name: 'Kyiv City', bounds: [50.35, 50.55, 30.25, 30.75], center: [50.45, 30.52] },
  { name: 'Kharkiv Oblast', bounds: [48.5, 50.5, 34.5, 38.5], center: [49.99, 36.23] },
  { name: 'Odesa Oblast', bounds: [45.2, 48.2, 28.5, 33.5], center: [46.48, 30.73] },
  { name: 'Dnipropetrovsk Oblast', bounds: [47.5, 49.5, 33.5, 36.5], center: [48.46, 35.05] },
  { name: 'Donetsk Oblast', bounds: [47.0, 49.5, 36.5, 39.5], center: [48.0, 37.8] },
  { name: 'Zaporizhzhia Oblast', bounds: [46.5, 48.2, 34.0, 37.0], center: [47.84, 35.14] },
  { name: 'Lviv Oblast', bounds: [48.8, 50.5, 22.8, 25.5], center: [49.84, 24.03] },
  { name: 'Kryvyi Rih', bounds: [47.5, 48.2, 33.0, 34.0], center: [47.91, 33.39] },
  { name: 'Mykolaiv Oblast', bounds: [46.5, 48.5, 30.5, 33.5], center: [46.97, 32.0] },
  { name: 'Luhansk Oblast', bounds: [48.0, 50.0, 38.0, 40.5], center: [48.57, 39.31] },
  { name: 'Vinnytsia Oblast', bounds: [48.2, 50.0, 27.5, 30.5], center: [49.23, 28.47] },
  { name: 'Poltava Oblast', bounds: [48.5, 50.5, 32.5, 35.5], center: [49.59, 34.55] },
  { name: 'Chernihiv Oblast', bounds: [50.5, 52.5, 30.5, 33.5], center: [51.49, 31.29] },
  { name: 'Cherkasy Oblast', bounds: [48.5, 50.0, 30.5, 33.0], center: [49.44, 32.06] },
  { name: 'Khmelnytskyi Oblast', bounds: [48.5, 50.5, 25.5, 28.5], center: [49.42, 27.0] },
  { name: 'Zhytomyr Oblast', bounds: [49.5, 51.5, 27.5, 30.5], center: [50.25, 28.66] },
  { name: 'Sumy Oblast', bounds: [50.0, 52.5, 32.5, 35.5], center: [50.91, 34.8] },
  { name: 'Rivne Oblast', bounds: [50.0, 52.0, 25.0, 27.5], center: [50.62, 26.25] },
  { name: 'Ivano-Frankivsk Oblast', bounds: [48.0, 49.5, 23.5, 25.5], center: [48.92, 24.71] },
  { name: 'Ternopil Oblast', bounds: [48.5, 50.0, 24.5, 26.5], center: [49.55, 25.59] },
  { name: 'Volyn Oblast', bounds: [50.5, 52.0, 23.5, 26.0], center: [50.75, 25.34] },
  { name: 'Zakarpattia Oblast', bounds: [47.9, 49.1, 22.1, 24.6], center: [48.62, 22.29] },
  { name: 'Kirovohrad Oblast', bounds: [47.8, 49.5, 31.0, 34.0], center: [48.51, 32.26] },
  { name: 'Chernivtsi Oblast', bounds: [47.7, 48.7, 24.5, 27.0], center: [48.29, 25.93] },
  { name: 'Kherson Oblast', bounds: [45.5, 47.5, 32.5, 36.0], center: [46.64, 32.62] },
  { name: 'Crimea', bounds: [44.3, 46.2, 32.5, 36.7], center: [45.0, 34.1] },
]

function getOblastFromCoordinates(lat: number, lng: number): string | null {
  // First check if it's in Kyiv City (small area, check first)
  if (lat >= 50.35 && lat <= 50.55 && lng >= 30.25 && lng <= 30.75) {
    return 'Kyiv City'
  }

  // Find the oblast with the closest center that also contains the point in bounds
  let bestMatch: string | null = null
  let bestDistance = Infinity

  for (const oblast of OBLASTS) {
    if (oblast.name === 'Kyiv City') continue // Already checked

    const [minLat, maxLat, minLng, maxLng] = oblast.bounds

    // Check if point is within bounds (with some tolerance)
    const tolerance = 0.5 // degrees
    if (lat >= minLat - tolerance && lat <= maxLat + tolerance &&
        lng >= minLng - tolerance && lng <= maxLng + tolerance) {

      // Calculate distance to center
      const [centerLat, centerLng] = oblast.center
      const distance = Math.sqrt(
        Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2)
      )

      if (distance < bestDistance) {
        bestDistance = distance
        bestMatch = oblast.name
      }
    }
  }

  return bestMatch
}

async function populateOblasts() {
  console.log('Fetching projects...')

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      municipalityName: true,
      cityLatitude: true,
      cityLongitude: true,
      region: true,
    },
  })

  console.log(`Found ${projects.length} projects`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const project of projects) {
    // Skip if already has a region
    if (project.region) {
      skipped++
      continue
    }

    const oblast = getOblastFromCoordinates(project.cityLatitude, project.cityLongitude)

    if (oblast) {
      await prisma.project.update({
        where: { id: project.id },
        data: { region: oblast },
      })
      console.log(`✓ ${project.municipalityName} → ${oblast}`)
      updated++
    } else {
      console.log(`✗ Could not determine oblast for ${project.municipalityName} (${project.cityLatitude}, ${project.cityLongitude})`)
      failed++
    }
  }

  console.log('\n--- Summary ---')
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already had region): ${skipped}`)
  console.log(`Failed: ${failed}`)
}

populateOblasts()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
