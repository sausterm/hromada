import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth'
import { translateProjectToUkrainian } from '@/lib/translate'

// POST /api/admin/translate-all - Batch translate all projects to Ukrainian
export async function POST(request: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(request)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.DEEPL_API_KEY) {
      return NextResponse.json(
        { error: 'DEEPL_API_KEY not configured' },
        { status: 500 }
      )
    }

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

    if (projects.length === 0) {
      return NextResponse.json({ message: 'All projects already translated', translated: 0 })
    }

    // Fire-and-forget: translate each project with delays to respect rate limits
    let translated = 0
    const translateAll = async () => {
      for (const project of projects) {
        try {
          const translations = await translateProjectToUkrainian({
            municipalityName: project.municipalityName,
            facilityName: project.facilityName,
            briefDescription: project.briefDescription,
            fullDescription: project.fullDescription,
          })

          if (translations.fullDescriptionUk) {
            await prisma.project.update({
              where: { id: project.id },
              data: {
                municipalityNameUk: translations.municipalityNameUk,
                facilityNameUk: translations.facilityNameUk,
                briefDescriptionUk: translations.briefDescriptionUk,
                fullDescriptionUk: translations.fullDescriptionUk,
              },
            })
            translated++
            console.log(`[translate-all] Translated project ${project.id}: ${project.facilityName}`)
          }
        } catch (err) {
          console.error(`[translate-all] Failed for project ${project.id}:`, err)
        }
        // Rate limit
        await new Promise((r) => setTimeout(r, 100))
      }
      console.log(`[translate-all] Complete: ${translated}/${projects.length} projects translated`)
    }

    translateAll().catch(err => console.error('[translate-all] Batch failed:', err))

    return NextResponse.json({
      message: `Translating ${projects.length} projects in background`,
      queued: projects.length,
    })
  } catch (error) {
    console.error('Error in translate-all:', error)
    return NextResponse.json({ error: 'Failed to start translation' }, { status: 500 })
  }
}
