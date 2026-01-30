// Project categories for map pins
export type Category = 'HOSPITAL' | 'SCHOOL' | 'WATER' | 'ENERGY' | 'OTHER'

// Urgency levels
export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Project status
export type Status = 'OPEN' | 'IN_DISCUSSION' | 'MATCHED' | 'FULFILLED'

// Project type for renewable energy projects
export type ProjectType = 'SOLAR_PV' | 'BATTERY_STORAGE' | 'HEAT_PUMP' | 'THERMO_MODERNIZATION'

// Co-financing availability status
export type CofinancingStatus = 'YES' | 'NO' | 'NEEDS_CLARIFICATION'

// Main Project type
export interface Project {
  id: string
  municipalityName: string
  region?: string  // Oblast/region name
  municipalityEmail: string
  facilityName: string
  category: Category
  briefDescription: string
  description: string
  fullDescription?: string  // From database, mapped to description for display
  address: string
  // City-level coordinates only (for security during wartime)
  cityLatitude: number
  cityLongitude: number
  // Legacy fields for backward compatibility
  latitude?: number
  longitude?: number
  contactName: string
  contactEmail: string
  contactPhone?: string
  urgency: Urgency
  status: Status
  photos?: string[]
  // Technical & Financial Details (for renewable energy projects)
  projectType?: ProjectType
  projectSubtype?: string
  technicalPowerKw?: number
  numberOfPanels?: number
  estimatedCostUsd?: number
  cofinancingAvailable?: CofinancingStatus
  cofinancingDetails?: string
  partnerOrganization?: string
  // Ukrainian translations (auto-generated)
  municipalityNameUk?: string
  facilityNameUk?: string
  briefDescriptionUk?: string
  fullDescriptionUk?: string
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Helper to get localized project content
export function getLocalizedProject(project: Project, locale: string): {
  municipalityName: string
  facilityName: string
  briefDescription: string
  fullDescription: string
} {
  if (locale === 'uk') {
    return {
      municipalityName: project.municipalityNameUk || project.municipalityName,
      facilityName: project.facilityNameUk || project.facilityName,
      briefDescription: project.briefDescriptionUk || project.briefDescription,
      fullDescription: project.fullDescriptionUk || project.fullDescription || project.description,
    }
  }
  // Default to English
  return {
    municipalityName: project.municipalityName,
    facilityName: project.facilityName,
    briefDescription: project.briefDescription,
    fullDescription: project.fullDescription || project.description,
  }
}

// Contact submission from donors
export interface ContactSubmission {
  id: string
  projectId: string
  donorName: string
  donorEmail: string
  message: string
  handled: boolean
  createdAt: Date
}

// Category display info for map - warm humanitarian palette
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  HOSPITAL: { label: 'Hospital / Medical', color: '#C75B39', icon: '🏥' },      // Deep terracotta
  SCHOOL: { label: 'School / Education', color: '#7B9E6B', icon: '🏫' },        // Sage green
  WATER: { label: 'Water Utility', color: '#5B8FA8', icon: '💧' },              // Muted teal
  ENERGY: { label: 'Energy Infrastructure', color: '#D4954A', icon: '⚡' },     // Warm amber
  OTHER: { label: 'Other Infrastructure', color: '#8B7355', icon: '🏗️' },      // Warm taupe
}

// Urgency display info - warm palette
export const URGENCY_CONFIG: Record<Urgency, { label: string; color: string }> = {
  LOW: { label: 'Low', color: '#8B7355' },          // Warm taupe
  MEDIUM: { label: 'Medium', color: '#D4954A' },    // Warm amber
  HIGH: { label: 'High', color: '#D4754E' },        // Terracotta
  CRITICAL: { label: 'Critical', color: '#B84A32' }, // Deep rust
}

// Status display info - warm palette
export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  OPEN: { label: 'Seeking Donors', color: '#7B9E6B' },      // Sage green
  IN_DISCUSSION: { label: 'In Discussion', color: '#5B8FA8' }, // Muted teal
  MATCHED: { label: 'Matched', color: '#9B7BB8' },          // Dusty purple
  FULFILLED: { label: 'Fulfilled', color: '#8B7355' },      // Warm taupe
}

// Project type display info - warm palette
export const PROJECT_TYPE_CONFIG: Record<ProjectType, { label: string; color: string; icon: string }> = {
  SOLAR_PV: { label: 'Solar PV', color: '#D4954A', icon: '☀️' },           // Warm amber
  BATTERY_STORAGE: { label: 'Battery Storage', color: '#5B8FA8', icon: '🔋' }, // Muted teal
  HEAT_PUMP: { label: 'Heat Pump', color: '#C75B39', icon: '🔥' },         // Deep terracotta
  THERMO_MODERNIZATION: { label: 'Thermo-modernization', color: '#8B7355', icon: '🏠' }, // Warm taupe
}

// Co-financing status display info
export const COFINANCING_CONFIG: Record<CofinancingStatus, { label: string; color: string }> = {
  YES: { label: 'Yes', color: '#7B9E6B' },                    // Sage green
  NO: { label: 'No', color: '#B84A32' },                      // Deep rust
  NEEDS_CLARIFICATION: { label: 'Needs Clarification', color: '#D4954A' }, // Warm amber
}

// Currency format options
export interface FormatCurrencyOptions {
  compact?: boolean  // Use compact format like $60K instead of $60,000
  showPrefix?: boolean  // Show "USD" prefix like "USD $60K"
}

// Utility function to format currency
export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}): string {
  const { compact = false, showPrefix = false } = options

  let formatted: string

  if (compact) {
    if (amount >= 1000000) {
      const millions = amount / 1000000
      formatted = `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
    } else if (amount >= 1000) {
      const thousands = amount / 1000
      formatted = `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
    } else {
      formatted = `$${amount}`
    }
  } else {
    formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return showPrefix ? `USD ${formatted}` : formatted
}

// Utility function to format power in kW
export function formatPower(kw: number): string {
  return `${kw.toLocaleString()} kW`
}

// Utility function to format relative time (e.g., "2 days ago")
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`
  }

  const diffInYears = Math.floor(diffInDays / 365)
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`
}
