'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { ImageUpload } from './ImageUpload'
import {
  type Project,
  type Category,
  type Urgency,
  type Status,
  type ProjectType,
  type CofinancingStatus,
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  COFINANCING_CONFIG,
} from '@/types'

interface ProjectFormProps {
  project?: Project | null
  onSubmit: (data: ProjectFormData) => Promise<void>
  onCancel: () => void
  onDelete?: () => void
  isLoading?: boolean
}

export interface ProjectFormData {
  municipalityName: string
  facilityName: string
  category: Category
  briefDescription: string
  fullDescription: string
  address: string
  cityLatitude: string
  cityLongitude: string
  contactName: string
  contactEmail: string
  contactPhone: string
  urgency: Urgency
  status: Status
  photos: string[]
  // Technical & Financial Details
  projectType: ProjectType | ''
  projectSubtype: string
  technicalPowerKw: string
  numberOfPanels: string
  estimatedCostUsd: string
  cofinancingAvailable: CofinancingStatus | ''
  cofinancingDetails: string
  partnerOrganization: string
}

const initialFormData: ProjectFormData = {
  municipalityName: '',
  facilityName: '',
  category: 'OTHER',
  briefDescription: '',
  fullDescription: '',
  address: '',
  cityLatitude: '',
  cityLongitude: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  urgency: 'MEDIUM',
  status: 'OPEN',
  photos: [],
  // Technical & Financial Details
  projectType: '',
  projectSubtype: '',
  technicalPowerKw: '',
  numberOfPanels: '',
  estimatedCostUsd: '',
  cofinancingAvailable: '',
  cofinancingDetails: '',
  partnerOrganization: '',
}

export function ProjectForm({ project, onSubmit, onCancel, onDelete, isLoading }: ProjectFormProps) {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({})
  const [isGeocoding, setIsGeocoding] = useState(false)

  const isEditing = !!project

  useEffect(() => {
    if (project) {
      setFormData({
        municipalityName: project.municipalityName || '',
        facilityName: project.facilityName || '',
        category: project.category,
        briefDescription: project.briefDescription || '',
        fullDescription: project.fullDescription || '',
        address: project.address || '',
        cityLatitude: project.cityLatitude.toString(),
        cityLongitude: project.cityLongitude.toString(),
        contactName: project.contactName,
        contactEmail: project.contactEmail,
        contactPhone: project.contactPhone || '',
        urgency: project.urgency,
        status: project.status,
        photos: project.photos || [],
        // Technical & Financial Details
        projectType: project.projectType || '',
        projectSubtype: project.projectSubtype || '',
        technicalPowerKw: project.technicalPowerKw?.toString() || '',
        numberOfPanels: project.numberOfPanels?.toString() || '',
        estimatedCostUsd: project.estimatedCostUsd?.toString() || '',
        cofinancingAvailable: project.cofinancingAvailable || '',
        cofinancingDetails: project.cofinancingDetails || '',
        partnerOrganization: project.partnerOrganization || '',
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

  const handleImagesChange = (photos: string[]) => {
    setFormData((prev) => ({ ...prev, photos }))
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
          cityLatitude: data[0].lat,
          cityLongitude: data[0].lon,
        }))
        setErrors((prev) => ({ ...prev, cityLatitude: undefined, cityLongitude: undefined }))
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
    if (!formData.briefDescription.trim()) {
      newErrors.briefDescription = 'Required'
    } else if (formData.briefDescription.length > 150) {
      newErrors.briefDescription = 'Maximum 150 characters'
    }
    if (!formData.fullDescription.trim()) {
      newErrors.fullDescription = 'Required'
    } else if (formData.fullDescription.length > 2000) {
      newErrors.fullDescription = 'Maximum 2000 characters'
    }
    if (!formData.cityLatitude.trim()) newErrors.cityLatitude = 'Required'
    if (!formData.cityLongitude.trim()) newErrors.cityLongitude = 'Required'
    if (!formData.contactName.trim()) newErrors.contactName = 'Required'
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email'
    }

    // Validate coordinates
    const lat = parseFloat(formData.cityLatitude)
    const lng = parseFloat(formData.cityLongitude)
    if (isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.cityLatitude = 'Invalid latitude (-90 to 90)'
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.cityLongitude = 'Invalid longitude (-180 to 180)'
    }

    // Validate technical/financial fields (optional but must be positive if provided)
    if (formData.technicalPowerKw.trim()) {
      const power = parseFloat(formData.technicalPowerKw)
      if (isNaN(power) || power <= 0) {
        newErrors.technicalPowerKw = 'Must be a positive number'
      }
    }
    if (formData.numberOfPanels.trim()) {
      const panels = parseInt(formData.numberOfPanels)
      if (isNaN(panels) || panels <= 0) {
        newErrors.numberOfPanels = 'Must be a positive whole number'
      }
    }
    if (formData.estimatedCostUsd.trim()) {
      const cost = parseFloat(formData.estimatedCostUsd)
      if (isNaN(cost) || cost <= 0) {
        newErrors.estimatedCostUsd = 'Must be a positive number'
      }
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
                Brief Description * <span className="text-gray-400 font-normal">({formData.briefDescription?.length || 0}/150)</span>
              </label>
              <Textarea
                value={formData.briefDescription}
                onChange={handleChange('briefDescription')}
                placeholder="Short summary for cards and lists (max 150 characters)"
                error={errors.briefDescription}
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Description * <span className="text-gray-400 font-normal">({formData.fullDescription?.length || 0}/2000)</span>
              </label>
              <Textarea
                value={formData.fullDescription}
                onChange={handleChange('fullDescription')}
                placeholder="Detailed description of needs, what's required, and how donors can help..."
                error={errors.fullDescription}
                rows={6}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Location (City-Level Only)</h3>
            <p className="text-sm text-gray-500">
              For security, only enter city-level coordinates. Do not enter exact facility locations.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City/Region <span className="text-gray-400">(optional, for geocoding)</span>
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
                  City Latitude *
                </label>
                <Input
                  value={formData.cityLatitude}
                  onChange={handleChange('cityLatitude')}
                  placeholder="e.g., 49.9935"
                  error={errors.cityLatitude}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Longitude *
                </label>
                <Input
                  value={formData.cityLongitude}
                  onChange={handleChange('cityLongitude')}
                  placeholder="e.g., 36.2304"
                  error={errors.cityLongitude}
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

          {/* Technical & Financial Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Technical & Financial Details</h3>
            <p className="text-sm text-gray-500">
              Optional fields for renewable energy and infrastructure projects.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Type
                </label>
                <select
                  value={formData.projectType}
                  onChange={handleChange('projectType')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                >
                  <option value="">-- Select Type --</option>
                  {(Object.keys(PROJECT_TYPE_CONFIG) as ProjectType[]).map((type) => (
                    <option key={type} value={type}>
                      {PROJECT_TYPE_CONFIG[type].icon} {PROJECT_TYPE_CONFIG[type].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Subtype
                </label>
                <Input
                  value={formData.projectSubtype}
                  onChange={handleChange('projectSubtype')}
                  placeholder="e.g., Building hybrid PV, Ground-mounted"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technical Power (kW)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.technicalPowerKw}
                  onChange={handleChange('technicalPowerKw')}
                  placeholder="e.g., 100"
                  error={errors.technicalPowerKw}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Panels
                  {formData.projectType === 'SOLAR_PV' && <span className="text-amber-600"> *</span>}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.numberOfPanels}
                  onChange={handleChange('numberOfPanels')}
                  placeholder="e.g., 200"
                  error={errors.numberOfPanels}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost (USD)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimatedCostUsd}
                  onChange={handleChange('estimatedCostUsd')}
                  placeholder="e.g., 50000"
                  error={errors.estimatedCostUsd}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Co-financing Available
                </label>
                <select
                  value={formData.cofinancingAvailable}
                  onChange={handleChange('cofinancingAvailable')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--navy-200)] focus:border-[var(--navy-500)]"
                >
                  <option value="">-- Select --</option>
                  {(Object.keys(COFINANCING_CONFIG) as CofinancingStatus[]).map((status) => (
                    <option key={status} value={status}>
                      {COFINANCING_CONFIG[status].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Co-financing Details
                </label>
                <Input
                  value={formData.cofinancingDetails}
                  onChange={handleChange('cofinancingDetails')}
                  placeholder="e.g., Up to 20%, 500,000 UAH"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Partner Organization
              </label>
              <Input
                value={formData.partnerOrganization}
                onChange={handleChange('partnerOrganization')}
                placeholder="e.g., NGO name, partner organization"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Project Images</h3>
            <ImageUpload
              images={formData.photos}
              onChange={handleImagesChange}
              maxImages={5}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" isLoading={isLoading} loadingText="Saving...">
              {isEditing ? 'Update Project' : 'Create Project'}
            </Button>
            {isEditing && onDelete && (
              <Button type="button" variant="danger" onClick={onDelete} disabled={isLoading}>
                Delete Project
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
