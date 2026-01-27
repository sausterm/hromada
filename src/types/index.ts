// Project categories for map pins
export type Category = 'HOSPITAL' | 'SCHOOL' | 'WATER' | 'ENERGY' | 'OTHER'

// Urgency levels
export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Project status
export type Status = 'OPEN' | 'IN_DISCUSSION' | 'MATCHED' | 'FULFILLED'

// Project type for renewable energy projects
export type ProjectType = 'SOLAR_PV' | 'HEAT_PUMP' | 'WATER_TREATMENT' | 'GENERAL'

// Co-financing availability status
export type CofinancingStatus = 'YES' | 'NO' | 'NEEDS_CLARIFICATION'

// Main Project type
export interface Project {
  id: string
  municipalityName: string
  municipalityEmail: string
  facilityName: string
  category: Category
  briefDescription: string
  description: string
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
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Inquiry from potential donors
export interface Inquiry {
  id: string
  projectId: string
  name: string
  email: string
  organization?: string
  message: string
  createdAt: Date
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
  HEAT_PUMP: { label: 'Heat Pump', color: '#C75B39', icon: '🔥' },         // Deep terracotta
  WATER_TREATMENT: { label: 'Water Treatment', color: '#5B8FA8', icon: '💧' }, // Muted teal
  GENERAL: { label: 'General', color: '#8B7355', icon: '🔧' },             // Warm taupe
}

// Co-financing status display info
export const COFINANCING_CONFIG: Record<CofinancingStatus, { label: string; color: string }> = {
  YES: { label: 'Yes', color: '#7B9E6B' },                    // Sage green
  NO: { label: 'No', color: '#B84A32' },                      // Deep rust
  NEEDS_CLARIFICATION: { label: 'Needs Clarification', color: '#D4954A' }, // Warm amber
}

// Utility function to format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Utility function to format power in kW
export function formatPower(kw: number): string {
  return `${kw.toLocaleString()} kW`
}
