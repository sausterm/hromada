'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { InquiryForm } from '@/components/projects/InquiryForm'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG } from '@/types'

// Mock data - same as homepage for now
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    municipalityName: 'Kharkiv Oblast',
    facilityName: 'Regional Hospital #5',
    category: 'HOSPITAL',
    description: 'Critical need for medical equipment including ventilators, patient monitors, and surgical instruments. The hospital serves over 50,000 residents and was damaged during recent attacks.\n\nSpecific needs include:\n- 5 portable ventilators\n- 10 patient monitoring systems\n- Surgical instrument sets\n- Emergency power generators\n- Medical supplies and medications',
    address: 'Kharkiv, Ukraine',
    latitude: 49.9935,
    longitude: 36.2304,
    contactName: 'Dr. Olena Kovalenko',
    contactEmail: 'hospital5@kharkiv.ua',
    contactPhone: '+380501234567',
    urgency: 'CRITICAL',
    status: 'OPEN',
    photos: [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800',
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    municipalityName: 'Kyiv Oblast',
    facilityName: 'School #127',
    category: 'SCHOOL',
    description: 'Need educational supplies, computers, and repairs to damaged classrooms. 450 students attend this school.\n\nRequired items:\n- 30 laptop computers for students\n- Educational materials and textbooks\n- Classroom furniture replacement\n- Window repairs and insulation\n- Heating system maintenance',
    address: 'Bucha, Kyiv Oblast, Ukraine',
    latitude: 50.5414,
    longitude: 30.2131,
    contactName: 'Natalia Shevchenko',
    contactEmail: 'school127@bucha.ua',
    urgency: 'HIGH',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    municipalityName: 'Odesa Oblast',
    facilityName: 'Municipal Water Treatment Plant',
    category: 'WATER',
    description: 'Urgent need for water filtration equipment and backup generators. Plant provides clean water to 30,000 residents.',
    address: 'Odesa, Ukraine',
    latitude: 46.4825,
    longitude: 30.7233,
    contactName: 'Viktor Bondarenko',
    contactEmail: 'water@odesa.ua',
    urgency: 'HIGH',
    status: 'IN_DISCUSSION',
    photos: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    municipalityName: 'Lviv Oblast',
    facilityName: 'Power Substation East',
    category: 'ENERGY',
    description: 'Transformers and electrical equipment needed to restore power to residential area. Currently 2,000 homes without stable electricity.',
    address: 'Lviv, Ukraine',
    latitude: 49.8397,
    longitude: 24.0297,
    contactName: 'Andriy Melnyk',
    contactEmail: 'energy@lviv.ua',
    urgency: 'MEDIUM',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    municipalityName: 'Dnipro Oblast',
    facilityName: 'Community Center',
    category: 'OTHER',
    description: 'Heating system repairs needed before winter. Center serves as shelter for displaced families.',
    address: 'Dnipro, Ukraine',
    latitude: 48.4647,
    longitude: 35.0462,
    contactName: 'Maria Tkachenko',
    contactEmail: 'community@dnipro.ua',
    urgency: 'HIGH',
    status: 'OPEN',
    photos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState(0)

  useEffect(() => {
    // Simulate API call - replace with actual fetch
    const found = MOCK_PROJECTS.find((p) => p.id === projectId)
    setProject(found || null)
    setIsLoading(false)
  }, [projectId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
        <p className="text-gray-600 mb-6">The project you're looking for doesn't exist.</p>
        <Link href="/">
          <Button>Back to Map</Button>
        </Link>
      </div>
    )
  }

  const categoryConfig = CATEGORY_CONFIG[project.category]
  const urgencyConfig = URGENCY_CONFIG[project.urgency]
  const statusConfig = STATUS_CONFIG[project.status]

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-[var(--ukraine-600)] hover:underline text-sm">
            ← Back to Map
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            {project.photos.length > 0 && (
              <div className="space-y-3">
                <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={project.photos[selectedPhoto]}
                    alt={project.facilityName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {project.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {project.photos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedPhoto === index
                            ? 'border-[var(--ukraine-600)]'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`${project.facilityName} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Info */}
            <div>
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge dot dotColor={categoryConfig.color}>
                  {categoryConfig.icon} {categoryConfig.label}
                </Badge>
                <Badge
                  variant={project.status === 'OPEN' ? 'success' : 'default'}
                >
                  {statusConfig.label}
                </Badge>
                {project.urgency !== 'LOW' && (
                  <Badge
                    variant={project.urgency === 'CRITICAL' ? 'danger' : 'warning'}
                  >
                    {urgencyConfig.label} Urgency
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.facilityName}
              </h1>

              {/* Municipality */}
              <p className="text-lg text-gray-600 mb-6">
                {project.municipalityName}
              </p>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  About This Project
                </h2>
                <div className="text-gray-700 whitespace-pre-line">
                  {project.description}
                </div>
              </div>
            </div>

            {/* Location */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                <p className="text-gray-600">{project.address}</p>
                <a
                  href={`https://www.google.com/maps?q=${project.latitude},${project.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--ukraine-600)] hover:underline text-sm mt-2 inline-block"
                >
                  View on Google Maps →
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Contact Person</p>
                    <p className="font-medium text-gray-900">{project.contactName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <a
                      href={`mailto:${project.contactEmail}`}
                      className="font-medium text-[var(--ukraine-600)] hover:underline"
                    >
                      {project.contactEmail}
                    </a>
                  </div>
                  {project.contactPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a
                        href={`tel:${project.contactPhone}`}
                        className="font-medium text-[var(--ukraine-600)] hover:underline"
                      >
                        {project.contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inquiry Form */}
            <InquiryForm
              projectId={project.id}
              projectName={project.facilityName}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Hromada — Connecting communities across borders
          </p>
        </div>
      </footer>
    </main>
  )
}
