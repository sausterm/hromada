'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapWrapper } from '@/components/map/MapWrapper'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { type Project, CATEGORY_CONFIG, URGENCY_CONFIG } from '@/types'

// Mock data for development - replace with API call
const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    municipalityName: 'Kharkiv Oblast',
    facilityName: 'Regional Hospital #5',
    category: 'HOSPITAL',
    description: 'Critical need for medical equipment including ventilators, patient monitors, and surgical instruments. The hospital serves over 50,000 residents and was damaged during recent attacks.',
    address: 'Kharkiv, Ukraine',
    latitude: 49.9935,
    longitude: 36.2304,
    contactName: 'Dr. Olena Kovalenko',
    contactEmail: 'hospital5@kharkiv.ua',
    contactPhone: '+380501234567',
    urgency: 'CRITICAL',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400'],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    municipalityName: 'Kyiv Oblast',
    facilityName: 'School #127',
    category: 'SCHOOL',
    description: 'Need educational supplies, computers, and repairs to damaged classrooms. 450 students attend this school.',
    address: 'Bucha, Kyiv Oblast, Ukraine',
    latitude: 50.5414,
    longitude: 30.2131,
    contactName: 'Natalia Shevchenko',
    contactEmail: 'school127@bucha.ua',
    urgency: 'HIGH',
    status: 'OPEN',
    photos: ['https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400'],
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
    photos: ['https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400'],
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
    photos: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400'],
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

export default function HomePage() {
  const [projects] = useState<Project[]>(MOCK_PROJECTS)

  // Featured projects (critical/high urgency, open status)
  const featuredProjects = projects
    .filter((p) => p.status === 'OPEN' && (p.urgency === 'CRITICAL' || p.urgency === 'HIGH'))
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[var(--ukraine-600)] to-[var(--ukraine-700)] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hromada
          </h1>
          <p className="text-xl md:text-2xl text-[var(--ukraine-100)] mb-2">
            громада — community
          </p>
          <p className="text-lg text-[var(--ukraine-200)] max-w-2xl mx-auto mb-8">
            Connecting American donors directly with Ukrainian municipalities
            that need support for critical infrastructure
          </p>
          <div className="flex justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Browse Projects
            </Button>
            <Link href="/admin">
              <Button size="lg" variant="secondary">
                Admin Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <MapWrapper projects={projects} />
        </div>
      </section>

      {/* Featured Projects */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Urgent Needs</h2>
            <p className="text-gray-600">Projects requiring immediate support</p>
          </div>
          <Link href="/projects">
            <Button variant="ghost">View All Projects →</Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredProjects.map((project) => {
            const categoryConfig = CATEGORY_CONFIG[project.category]
            const urgencyConfig = URGENCY_CONFIG[project.urgency]

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card variant="interactive" padding="none" className="h-full">
                  {/* Photo */}
                  <div className="h-48 bg-gray-200 relative">
                    {project.photos.length > 0 ? (
                      <img
                        src={project.photos[0]}
                        alt={project.facilityName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        {categoryConfig.icon}
                      </div>
                    )}
                    {/* Urgency badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={project.urgency === 'CRITICAL' ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {urgencyConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    {/* Category */}
                    <Badge
                      size="sm"
                      dot
                      dotColor={categoryConfig.color}
                      className="mb-2"
                    >
                      {categoryConfig.label}
                    </Badge>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {project.facilityName}
                    </h3>

                    {/* Municipality */}
                    <p className="text-sm text-gray-500 mb-2">
                      {project.municipalityName}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--ukraine-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🗺️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Browse the Map</h3>
              <p className="text-gray-600 text-sm">
                Explore verified projects from Ukrainian municipalities on our interactive map
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[var(--gold-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Review Details</h3>
              <p className="text-gray-600 text-sm">
                See exactly what each community needs, including specifications and contact info
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect Directly</h3>
              <p className="text-gray-600 text-sm">
                Reach out directly to municipality contacts to coordinate support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            Hromada — Connecting communities across borders
          </p>
          <p className="text-xs mt-2">
            No payment processing. We facilitate direct connections only.
          </p>
        </div>
      </footer>
    </main>
  )
}
