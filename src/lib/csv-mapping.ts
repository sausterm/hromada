/**
 * CSV column mapping for Partner_Project_Template.csv → ProjectSubmission fields.
 *
 * The CSV template uses bilingual headers (EN / UK). We match on the English
 * portion so partners can use either language variant of the template.
 */

// Map from CSV header (case-insensitive, trimmed) to ProjectSubmission field name
const COLUMN_MAP: Record<string, string> = {
  'municipality': 'municipalityName',
  'facility': 'facilityName',
  'category': 'category',
  'project type': 'projectType',
  'short description': 'briefDescription',
  'full description': 'fullDescription',
  'urgency': 'urgency',
  'estimated cost (usd)': 'estimatedCostUsd',
  'power (kw)': 'technicalPowerKw',
  'number of panels': 'numberOfPanels',
  'co-financing (%)': 'cofinancingPercent',
  'co-financing source': 'cofinancingSource',
  'oblast': 'region',
  'city': 'cityName',
  'latitude': 'cityLatitude',
  'longitude': 'cityLongitude',
  'contact name': 'contactName',
  'contact email': 'contactEmail',
  'edrpou': 'edrpou',
  'partner': 'partnerOrganization',
  'notes': 'additionalNotes',
}

// Valid values for enum fields
const VALID_CATEGORIES = ['HOSPITAL', 'SCHOOL', 'WATER', 'ENERGY', 'OTHER'] as const
const VALID_PROJECT_TYPES = ['SOLAR_PV', 'BATTERY_STORAGE', 'HEAT_PUMP', 'THERMO_MODERNIZATION', 'IDP_HOUSING', 'GENERAL'] as const
const VALID_URGENCIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const

/**
 * Normalise a CSV header to its canonical key in COLUMN_MAP.
 * Strips the Ukrainian portion after " / " and lowercases.
 */
function normalizeHeader(header: string): string {
  // Take only the English part (before " / ")
  const english = header.split(' / ')[0].trim().toLowerCase()
  return english
}

/**
 * Map a CSV header to a submission field name.
 */
export function mapHeader(header: string): string | null {
  const normalized = normalizeHeader(header)
  return COLUMN_MAP[normalized] ?? null
}

export interface CsvRowValidation {
  row: number
  data: Record<string, string>
  mapped: Record<string, unknown>
  errors: string[]
  warnings: string[]
}

/**
 * Validate and map a single parsed CSV row to a ProjectSubmission-compatible object.
 * Returns the mapped data plus any validation errors/warnings.
 */
export function validateAndMapRow(
  rowData: Record<string, string>,
  rowIndex: number,
  headerMap: Record<string, string | null>
): CsvRowValidation {
  const errors: string[] = []
  const warnings: string[] = []
  const mapped: Record<string, unknown> = {}

  // Map each CSV column to its schema field
  for (const [csvHeader, value] of Object.entries(rowData)) {
    const field = headerMap[csvHeader]
    if (!field) continue
    const trimmed = (value ?? '').trim()
    if (!trimmed) continue
    mapped[field] = trimmed
  }

  // --- Required fields ---
  if (!mapped.municipalityName) errors.push('Municipality is required')
  if (!mapped.facilityName) errors.push('Facility name is required')
  if (!mapped.briefDescription) errors.push('Short description is required')
  if (!mapped.fullDescription) errors.push('Full description is required')
  if (!mapped.cityName) errors.push('City is required')
  if (!mapped.contactName) errors.push('Contact name is required')
  if (!mapped.contactEmail) errors.push('Contact email is required')

  // --- Category validation ---
  if (mapped.category) {
    const cat = String(mapped.category).toUpperCase()
    if (VALID_CATEGORIES.includes(cat as typeof VALID_CATEGORIES[number])) {
      mapped.category = cat
    } else {
      errors.push(`Invalid category "${mapped.category}". Must be one of: ${VALID_CATEGORIES.join(', ')}`)
    }
  } else {
    errors.push('Category is required')
  }

  // --- Project type ---
  if (mapped.projectType) {
    const pt = String(mapped.projectType).toUpperCase().replace(/[\s-]/g, '_')
    if (VALID_PROJECT_TYPES.includes(pt as typeof VALID_PROJECT_TYPES[number])) {
      mapped.projectType = pt
    } else {
      warnings.push(`Unknown project type "${mapped.projectType}" — defaulting to GENERAL`)
      mapped.projectType = 'GENERAL'
    }
  } else {
    mapped.projectType = 'GENERAL'
  }

  // --- Urgency ---
  if (mapped.urgency) {
    const urg = String(mapped.urgency).toUpperCase()
    if (VALID_URGENCIES.includes(urg as typeof VALID_URGENCIES[number])) {
      mapped.urgency = urg
    } else {
      warnings.push(`Unknown urgency "${mapped.urgency}" — defaulting to MEDIUM`)
      mapped.urgency = 'MEDIUM'
    }
  } else {
    mapped.urgency = 'MEDIUM'
  }

  // --- Numeric fields ---
  if (mapped.estimatedCostUsd) {
    const num = parseFloat(String(mapped.estimatedCostUsd).replace(/[,$]/g, ''))
    if (isNaN(num) || num < 0) {
      errors.push(`Invalid estimated cost: "${mapped.estimatedCostUsd}"`)
    } else {
      mapped.estimatedCostUsd = num
    }
  }

  if (mapped.technicalPowerKw) {
    const num = parseFloat(String(mapped.technicalPowerKw))
    if (isNaN(num) || num < 0) {
      warnings.push(`Invalid power value: "${mapped.technicalPowerKw}"`)
      delete mapped.technicalPowerKw
    } else {
      mapped.technicalPowerKw = num
    }
  }

  if (mapped.numberOfPanels) {
    const num = parseInt(String(mapped.numberOfPanels), 10)
    if (isNaN(num) || num < 0) {
      warnings.push(`Invalid panel count: "${mapped.numberOfPanels}"`)
      delete mapped.numberOfPanels
    } else {
      mapped.numberOfPanels = num
    }
  }

  // --- Coordinates ---
  if (mapped.cityLatitude) {
    const lat = parseFloat(String(mapped.cityLatitude))
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.push(`Invalid latitude: "${mapped.cityLatitude}"`)
    } else {
      mapped.cityLatitude = lat
    }
  } else {
    errors.push('Latitude is required')
  }

  if (mapped.cityLongitude) {
    const lng = parseFloat(String(mapped.cityLongitude))
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.push(`Invalid longitude: "${mapped.cityLongitude}"`)
    } else {
      mapped.cityLongitude = lng
    }
  } else {
    errors.push('Longitude is required')
  }

  // --- Co-financing ---
  if (mapped.cofinancingPercent) {
    const pct = parseFloat(String(mapped.cofinancingPercent).replace('%', ''))
    if (!isNaN(pct) && pct > 0) {
      mapped.cofinancingAvailable = 'YES'
      const source = mapped.cofinancingSource ? ` (${mapped.cofinancingSource})` : ''
      mapped.cofinancingDetails = `${pct}% co-financing${source}`
    }
  }
  // Clean up intermediate fields
  delete mapped.cofinancingPercent
  delete mapped.cofinancingSource

  // --- Email format ---
  if (mapped.contactEmail) {
    mapped.municipalityEmail = mapped.municipalityEmail || mapped.contactEmail
  }

  // --- Description length ---
  if (mapped.briefDescription && String(mapped.briefDescription).length > 150) {
    warnings.push(`Short description truncated to 150 characters (was ${String(mapped.briefDescription).length})`)
    mapped.briefDescription = String(mapped.briefDescription).substring(0, 150)
  }

  if (mapped.fullDescription && String(mapped.fullDescription).length > 2000) {
    warnings.push(`Full description truncated to 2000 characters`)
    mapped.fullDescription = String(mapped.fullDescription).substring(0, 2000)
  }

  return {
    row: rowIndex,
    data: rowData,
    mapped,
    errors,
    warnings,
  }
}

/**
 * Build the header→field mapping from an array of CSV headers.
 */
export function buildHeaderMap(headers: string[]): Record<string, string | null> {
  const map: Record<string, string | null> = {}
  for (const header of headers) {
    map[header] = mapHeader(header)
  }
  return map
}
