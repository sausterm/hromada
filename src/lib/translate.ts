/**
 * Google Cloud Translation API integration
 *
 * Requires GOOGLE_CLOUD_API_KEY environment variable
 * Free tier: 500,000 characters/month
 *
 * @see https://cloud.google.com/translate/docs/reference/rest/v2/translate
 */

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2'

interface TranslationResult {
  translatedText: string
  detectedSourceLanguage?: string
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}

/**
 * Translate text using Google Cloud Translation API
 */
export async function translateText(
  text: string,
  targetLanguage: 'uk' | 'en',
  sourceLanguage?: 'uk' | 'en'
): Promise<TranslationResult | null> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY

  if (!apiKey) {
    console.warn('[translate] GOOGLE_CLOUD_API_KEY not configured, skipping translation')
    return null
  }

  if (!text || text.trim().length === 0) {
    return null
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: text,
      target: targetLanguage,
      format: 'text',
    })

    if (sourceLanguage) {
      params.append('source', sourceLanguage)
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[translate] Google API error:', error)
      return null
    }

    const data: GoogleTranslateResponse = await response.json()

    if (data.data?.translations?.[0]) {
      return {
        translatedText: data.data.translations[0].translatedText,
        detectedSourceLanguage: data.data.translations[0].detectedSourceLanguage,
      }
    }

    return null
  } catch (error) {
    console.error('[translate] Translation failed:', error)
    return null
  }
}

/**
 * Translate multiple texts in a single API call (more efficient)
 */
export async function translateTexts(
  texts: string[],
  targetLanguage: 'uk' | 'en',
  sourceLanguage?: 'uk' | 'en'
): Promise<(string | null)[]> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY

  if (!apiKey) {
    console.warn('[translate] GOOGLE_CLOUD_API_KEY not configured, skipping translation')
    return texts.map(() => null)
  }

  // Filter out empty texts but keep track of indices
  const validTexts = texts.map((t, i) => ({ text: t, index: i })).filter(({ text }) => text && text.trim().length > 0)

  if (validTexts.length === 0) {
    return texts.map(() => null)
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      target: targetLanguage,
      format: 'text',
    })

    // Add each text as a separate 'q' parameter
    validTexts.forEach(({ text }) => params.append('q', text))

    if (sourceLanguage) {
      params.append('source', sourceLanguage)
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[translate] Google API error:', error)
      return texts.map(() => null)
    }

    const data: GoogleTranslateResponse = await response.json()

    // Map results back to original indices
    const results: (string | null)[] = texts.map(() => null)

    if (data.data?.translations) {
      validTexts.forEach(({ index }, i) => {
        if (data.data.translations[i]) {
          results[index] = data.data.translations[i].translatedText
        }
      })
    }

    return results
  } catch (error) {
    console.error('[translate] Batch translation failed:', error)
    return texts.map(() => null)
  }
}

/**
 * Detect if text is primarily in Ukrainian or English
 */
export function detectLanguage(text: string): 'uk' | 'en' | 'unknown' {
  if (!text || text.trim().length === 0) return 'unknown'

  // Count Cyrillic characters
  const cyrillicPattern = /[\u0400-\u04FF]/g
  const cyrillicMatches = text.match(cyrillicPattern)
  const cyrillicCount = cyrillicMatches ? cyrillicMatches.length : 0

  // Count Latin characters
  const latinPattern = /[a-zA-Z]/g
  const latinMatches = text.match(latinPattern)
  const latinCount = latinMatches ? latinMatches.length : 0

  if (cyrillicCount > latinCount * 2) {
    return 'uk'
  } else if (latinCount > cyrillicCount * 2) {
    return 'en'
  }

  return 'unknown'
}

/**
 * Translate project content to Ukrainian
 * Returns object with Ukrainian translations
 */
export async function translateProjectToUkrainian(project: {
  municipalityName: string
  facilityName: string
  briefDescription: string
  fullDescription: string
}): Promise<{
  municipalityNameUk: string | null
  facilityNameUk: string | null
  briefDescriptionUk: string | null
  fullDescriptionUk: string | null
}> {
  const textsToTranslate = [
    project.municipalityName,
    project.facilityName,
    project.briefDescription,
    project.fullDescription,
  ]

  const translations = await translateTexts(textsToTranslate, 'uk', 'en')

  return {
    municipalityNameUk: translations[0],
    facilityNameUk: translations[1],
    briefDescriptionUk: translations[2],
    fullDescriptionUk: translations[3],
  }
}

/**
 * Translate project content to English
 * Returns object with English translations
 */
export async function translateProjectToEnglish(project: {
  municipalityName: string
  facilityName: string
  briefDescription: string
  fullDescription: string
}): Promise<{
  municipalityName: string | null
  facilityName: string | null
  briefDescription: string | null
  fullDescription: string | null
}> {
  const textsToTranslate = [
    project.municipalityName,
    project.facilityName,
    project.briefDescription,
    project.fullDescription,
  ]

  const translations = await translateTexts(textsToTranslate, 'en', 'uk')

  return {
    municipalityName: translations[0],
    facilityName: translations[1],
    briefDescription: translations[2],
    fullDescription: translations[3],
  }
}
