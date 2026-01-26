'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { type Project, type Category, type Urgency, type Status, CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG } from '@/types'

interface ProjectFormProps {
  project?: Project | null
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export interface ProjectFormData {
  municipalityName: string
  facilityName: string
  category: Category
  description: string
  address: string
  latitude: string
  longitude: string
  contactName: string
  contactEmail: string
  contactPhone: string
  urgency: Urgency
  status: Status
  photos: string[]
}

const initialFormData: ProjectFormData = {
  municipalityName: '',
  facilityName: '',
  category: 'OTHER',
  description: '',
  address: '',
  latitude: '',
  longitude: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  urgency: 'MEDIUM',
  status: 'OPEN',
  photos: [],
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})
  const [isGeocoding, setIsGeocoding] = useState(false)

  const isEditing = !!project

  useEffect(() => {
    if (project) {
      setFormData({
        municipalityName: project.municipalityName,
        facilityName: project.facilityName,
        category: project.category,
        description: project.description,
        address: project.address,
        latitude: project.latitude.toString(),
        longitude: project.longitude.toString(),
        contactName: project.contactName,
        contactEmail: project.contactEmail,
        contactPhone: project.contactPhone || '',
        urgency: project.urgency,
        status: project.status,
        photos: project.photos,
      })
    }
  }, [project])

  const handleChange = (field: keyof ProjectFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const geocodeAddress = async () => {
    if (!formData.address.trim()) {
      setErrors((prev) => ({ ...prev, address: 'Enter an address first' }))
      return
    }

    setIsGeocoding(true)
    try {
      // Using OpenStreetMap Nominatim (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`,
        { headers: { 'User-Agent': 'Hromada/1.0' } }
      )
      const data = await response.json()

      if (data && data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon,
        }))
        setErrors((prev) => ({ ...prev, latitude: undefined, longitude: undefined }))
      } else {
        setErrors((prev) => ({ ...prev, address: 'Could not find coordinates for this address' }))
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, address: 'Geocoding failed. Please enter coordinates manually.' }))
    } finally {
      setIsGeocoding(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {}

    if (!formData.municipalityName.trim()) newErrors.municipalityName = 'Required'
    if (!formData.facilityName.trim()) newErrors.facilityName = 'Required'
    if (!formData.description.trim()) newErrors.description = 'Required'
    if (!formData.address.trim()) newErrors.address = 'Required'
    if (!formData.latitude.trim()) newErrors.latitude = 'Required'
    if (!formData.longitude.trim()) newErrors.longitude = 'Required'
    if (!formData.contactName.trim()) newErrors.contactName = 'Required'
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email'
    }

    // Validate coordinates
    const lat = parseFloat(formData.latitude)
    const lng = parseFloat(formData.longitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.latitude = 'Invalid latitude (-90 to 90)'
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.longitude = 'Invalid longitude (-180 to 180)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Project' : 'Add New Project'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Basic Information</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Municipality/Oblast *
                </label>
                <Input
                  value={formData.municipalityName}
                  onChange={handleChange('municipalityName')}
                  placeholder="e.g., Kharkiv Oblast"
                  error={errors.municipalityName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facility Name *
                </label>
                <Input
                  value={formData.facilityName}
                  onChange={handleChange('facilityName')}
                  placeholder="e.g., Regional Hospital #5"
                  error={errors.facilityName}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={handleChange('category')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)]"
                >
                  {(Object.keys(CATEGORY_CONFIG) as Category[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_CONFIG[cat].icon} {CATEGORY_CONFIG[cat].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency *
                </label>
                <select
                  value={formData.urgency}
                  onChange={handleChange('urgency')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)]"
                >
                  {(Object.keys(URGENCY_CONFIG) as Urgency[]).map((urg) => (
                    <option key={urg} value={urg}>
                      {URGENCY_CONFIG[urg].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={handleChange('status')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ukraine-200)] focus:border-[var(--ukraine-500)]"
                >
                  {(Object.keys(STATUS_CONFIG) as Status[]).map((stat) => (
                    <option key={stat} value={stat}>
                      {STATUS_CONFIG[stat].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <Textarea
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="Describe the needs, what's required, and how donors can help..."
                error={errors.description}
                rows={6}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Location</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={formData.address}
                    onChange={handleChange('address')}
                    placeholder="e.g., Kharkiv, Ukraine"
                    error={errors.address}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={geocodeAddress}
                  isLoading={isGeocoding}
                  loadingText="Finding..."
                >
                  Get Coordinates
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude *
                </label>
                <Input
                  value={formData.latitude}
                  onChange={handleChange('latitude')}
                  placeholder="e.g., 49.9935"
                  error={errors.latitude}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude *
                </label>
                <Input
                  value={formData.longitude}
                  onChange={handleChange('longitude')}
                  placeholder="e.g., 36.2304"
                  error={errors.longitude}
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Contact Information</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person *
              </label>
              <Input
                value={formData.contactName}
                onChange={handleChange('contactName')}
                placeholder="e.g., Dr. Olena Kovalenko"
                error={errors.contactName}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={handleChange('contactEmail')}
                  placeholder="contact@example.ua"
                  error={errors.contactEmail}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={handleChange('contactPhone')}
                  placeholder="+380..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" isLoading={isLoading} loadingText="Saving...">
              {isEditing ? 'Update Project' : 'Create Project'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
