// Project categories for map pins
export type Category = 'HOSPITAL' | 'SCHOOL' | 'WATER' | 'ENERGY' | 'OTHER'

// Urgency levels
export type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// Project status
export type Status = 'OPEN' | 'IN_DISCUSSION' | 'MATCHED' | 'FULFILLED'

// Main Project type
export interface Project {
  id: string
  municipalityName: string
  facilityName: string
  category: Category
  description: string
  address: string
  latitude: number
  longitude: number
  contactName: string
  contactEmail: string
  contactPhone?: string
  urgency: Urgency
  status: Status
  photos: string[]
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

// Category display info for map
export const CATEGORY_CONFIG: Record<Category, { label: string; color: string; icon: string }> = {
  HOSPITAL: { label: 'Hospital / Medical', color: '#3b82f6', icon: '🏥' },
  SCHOOL: { label: 'School / Education', color: '#22c55e', icon: '🏫' },
  WATER: { label: 'Water Utility', color: '#ef4444', icon: '💧' },
  ENERGY: { label: 'Energy Infrastructure', color: '#f97316', icon: '⚡' },
  OTHER: { label: 'Other Infrastructure', color: '#6b7280', icon: '🏗️' },
}

// Urgency display info
export const URGENCY_CONFIG: Record<Urgency, { label: string; color: string }> = {
  LOW: { label: 'Low', color: '#6b7280' },
  MEDIUM: { label: 'Medium', color: '#eab308' },
  HIGH: { label: 'High', color: '#f97316' },
  CRITICAL: { label: 'Critical', color: '#ef4444' },
}

// Status display info
export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  OPEN: { label: 'Open', color: '#22c55e' },
  IN_DISCUSSION: { label: 'In Discussion', color: '#3b82f6' },
  MATCHED: { label: 'Matched', color: '#a855f7' },
  FULFILLED: { label: 'Fulfilled', color: '#6b7280' },
}
