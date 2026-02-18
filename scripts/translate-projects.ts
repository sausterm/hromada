/**
 * Batch translate all project descriptions from English to Ukrainian.
 *
 * Usage: npx tsx scripts/translate-projects.ts
 *
 * Requires DEEPL_API_KEY in .env.local
 * DeepL free tier: 500,000 characters/month
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'

// Set up Prisma with PrismaPg adapter (same as src/lib/prisma.ts)
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

async function translateTexts(
  texts: string[],
  targetLanguage: 'uk' | 'en',
  sourceLanguage?: 'uk' | 'en'
): Promise<(string | null)[]> {
  const apiKey = process.env.DEEPL_API_KEY
  if (!apiKey) {
    console.error('DEEPL_API_KEY not configured. Add it to .env.local')
    process.exit(1)
  }

  const langMap: Record<string, string> = { uk: 'UK', en: 'EN' }

  const validTexts = texts
    .map((t, i) => ({ text: t, index: i }))
    .filter(({ text }) => text && text.trim().length > 0)

  if (validTexts.length === 0) return texts.map(() => null)

  const body: Record<string, unknown> = {
    text: validTexts.map(({ text }) => text),
    target_lang: langMap[targetLanguage],
  }
  if (sourceLanguage) body.source_lang = langMap[sourceLanguage]

  const response = await fetch(DEEPL_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('DeepL API error:', response.status, error)
    return texts.map(() => null)
  }

  const data = await response.json()
  const results: (string | null)[] = texts.map(() => null)

  if (data.translations) {
    validTexts.forEach(({ index }, i: number) => {
      if (data.translations[i]) {
        results[index] = data.translations[i].text
      }
    })
  }

  return results
}

async function main() {
  console.log('Fetching projects missing Ukrainian translations...')

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { fullDescriptionUk: null },
        { fullDescriptionUk: '' },
      ],
    },
    select: {
      id: true,
      municipalityName: true,
      facilityName: true,
      briefDescription: true,
      fullDescription: true,
    },
  })

  console.log(`Found ${projects.length} projects to translate\n`)

  let totalChars = 0
  let translated = 0
  let failed = 0

  for (const project of projects) {
    const texts = [
      project.municipalityName,
      project.facilityName,
      project.briefDescription,
      project.fullDescription,
    ]
    const charCount = texts.join('').length
    totalChars += charCount

    console.log(`Translating: ${project.facilityName} (${charCount} chars)...`)

    try {
      const translations = await translateTexts(texts, 'uk', 'en')

      if (translations[3]) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            municipalityNameUk: translations[0],
            facilityNameUk: translations[1],
            briefDescriptionUk: translations[2],
            fullDescriptionUk: translations[3],
          },
        })
        translated++
        console.log(`  Done`)
      } else {
        failed++
        console.log(`  Failed — no translation returned`)
      }
    } catch (err) {
      failed++
      console.error(`  Error:`, err)
    }

    // Rate limit: 100ms between projects
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(`\nResults:`)
  console.log(`  Translated: ${translated}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Total characters: ${totalChars.toLocaleString()}`)

  await prisma.$disconnect()
  await pool.end()
}

main().catch((err) => {
  console.error(err)
  prisma.$disconnect()
  pool.end()
  process.exit(1)
})
