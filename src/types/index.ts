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
// Icons are SVG path data from Lucide icons (viewBox="0 0 24 24", stroke-based)
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  HOSPITAL: {
    label: 'Hospital / Medical',
    color: '#C75B39',  // Deep terracotta
    icon: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>'  // HeartPulse
  },
  SCHOOL: {
    label: 'School / Education',
    color: '#7B9E6B',  // Sage green
    icon: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>'  // GraduationCap
  },
  WATER: {
    label: 'Water Utility',
    color: '#5B8FA8',  // Muted teal
    icon: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>'  // Droplet
  },
  ENERGY: {
    label: 'Energy Infrastructure',
    color: '#D4954A',  // Warm amber
    icon: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'  // Zap/Bolt
  },
  OTHER: {
    label: 'Other Infrastructure',
    color: '#8B7355',  // Warm taupe
    icon: '<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/>'  // Factory
  },
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
