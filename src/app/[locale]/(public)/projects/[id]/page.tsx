import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import ProjectDetailClient from './ProjectDetailClient'

interface PageProps {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        facilityName: true,
        facilityNameUk: true,
        municipalityName: true,
        municipalityNameUk: true,
        briefDescription: true,
        briefDescriptionUk: true,
        fullDescription: true,
        fullDescriptionUk: true,
        estimatedCostUsd: true,
        region: true,
        photos: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: { url: true },
        },
      },
    })

    if (!project) {
      return {
        title: 'Project Not Found | hromada',
      }
    }

    const isUk = locale === 'uk'
    const title = (isUk ? project.facilityNameUk : null) || project.facilityName
    const municipality = (isUk ? project.municipalityNameUk : null) || project.municipalityName
    const description = (isUk ? project.briefDescriptionUk : null)
      || project.briefDescription
      || (isUk ? project.fullDescriptionUk : null)
      || project.fullDescription
      || ''
    const truncatedDescription = description.length > 200
      ? description.slice(0, 197) + '...'
      : description

    const location = project.region
      ? `${municipality}, ${project.region}`
      : municipality

    const cost = project.estimatedCostUsd
      ? ` | $${Number(project.estimatedCostUsd).toLocaleString('en-US')}`
      : ''

    const ogTitle = `${title} - ${location}${cost}`
    const photoUrl = project.photos[0]?.url

    return {
      title: `${title} | hromada`,
      description: truncatedDescription,
      openGraph: {
        title: ogTitle,
        description: truncatedDescription,
        type: 'article',
        siteName: 'hromada',
        ...(photoUrl ? {
          images: [{ url: photoUrl, width: 1200, height: 630, alt: title }],
        } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: truncatedDescription,
        ...(photoUrl ? { images: [photoUrl] } : {}),
      },
    }
  } catch (error) {
    console.error('Error generating project metadata:', error)
    return {
      title: 'Project | hromada',
    }
  }
}

export default function ProjectDetailPage() {
  return <ProjectDetailClient />
}
