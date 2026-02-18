import {
  detectLanguage,
  translateText,
  translateTexts,
  translateProjectToUkrainian,
  translateProjectToEnglish,
} from '@/lib/translate'

// Mock fetch globally
global.fetch = jest.fn()

describe('translate module', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
  })

  describe('detectLanguage', () => {
    it('returns "unknown" for empty string', () => {
      expect(detectLanguage('')).toBe('unknown')
    })

    it('returns "unknown" for whitespace only', () => {
      expect(detectLanguage('   ')).toBe('unknown')
    })

    it('returns "uk" for Ukrainian text', () => {
      expect(detectLanguage('Привіт, як справи?')).toBe('uk')
      expect(detectLanguage('Київ - столиця України')).toBe('uk')
      expect(detectLanguage('Центральна лікарня потребує допомоги')).toBe('uk')
    })

    it('returns "en" for English text', () => {
      expect(detectLanguage('Hello, how are you?')).toBe('en')
      expect(detectLanguage('Central Hospital needs solar panels')).toBe('en')
      expect(detectLanguage('This is a test project description')).toBe('en')
    })

    it('returns "uk" when Cyrillic characters dominate', () => {
      // Mix with some numbers/symbols
      expect(detectLanguage('Проект #123: Лікарня')).toBe('uk')
    })

    it('returns "en" when Latin characters dominate', () => {
      // Mix with some numbers/symbols
      expect(detectLanguage('Project #123: Hospital')).toBe('en')
    })

    it('returns "unknown" for mixed text without clear majority', () => {
      // Roughly equal Latin and Cyrillic
      expect(detectLanguage('Hello Привіт')).toBe('unknown')
    })

    it('returns "unknown" for numbers only', () => {
      expect(detectLanguage('12345')).toBe('unknown')
    })

    it('returns "unknown" for symbols only', () => {
      expect(detectLanguage('!@#$%^&*()')).toBe('unknown')
    })
  })

  describe('translateText', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv, DEEPL_API_KEY: 'test-api-key' }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('returns null when API key is not configured', async () => {
      delete process.env.DEEPL_API_KEY
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = await translateText('Hello', 'uk')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEEPL_API_KEY not configured')
      )

      consoleSpy.mockRestore()
    })

    it('returns null for empty text', async () => {
      const result = await translateText('', 'uk')
      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('returns null for whitespace only text', async () => {
      const result = await translateText('   ', 'uk')
      expect(result).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('successfully translates text', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [
              {
                text: 'Привіт',
                detected_source_language: 'EN',
              },
            ],
          }),
      })

      const result = await translateText('Hello', 'uk')

      expect(result).toEqual({
        translatedText: 'Привіт',
        detectedSourceLanguage: 'en',
      })
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api-free.deepl.com'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'DeepL-Auth-Key test-api-key',
            'Content-Type': 'application/json',
          },
        })
      )
    })

    it('includes source language when provided', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [{ text: 'Hello' }],
          }),
      })

      await translateText('Привіт', 'en', 'uk')

      // DeepL sends source_lang in the JSON body
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"source_lang":"UK"'),
        })
      )
    })

    it('returns null on API error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('API Error'),
      })

      const result = await translateText('Hello', 'uk')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('returns null on network error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await translateText('Hello', 'uk')

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('returns null when translations array is empty', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [],
          }),
      })

      const result = await translateText('Hello', 'uk')

      expect(result).toBeNull()
    })
  })

  describe('translateTexts', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv, DEEPL_API_KEY: 'test-api-key' }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('returns array of nulls when API key is not configured', async () => {
      delete process.env.DEEPL_API_KEY
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = await translateTexts(['Hello', 'World'], 'uk')

      expect(result).toEqual([null, null])
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('returns array of nulls for empty texts array', async () => {
      const result = await translateTexts([], 'uk')
      expect(result).toEqual([])
    })

    it('returns array of nulls for all empty strings', async () => {
      const result = await translateTexts(['', '   ', ''], 'uk')
      expect(result).toEqual([null, null, null])
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('successfully translates multiple texts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [
              { text: 'Привіт' },
              { text: 'Світ' },
            ],
          }),
      })

      const result = await translateTexts(['Hello', 'World'], 'uk')

      expect(result).toEqual(['Привіт', 'Світ'])
    })

    it('handles mixed valid and empty texts', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [
              { text: 'Привіт' },
              { text: 'Світ' },
            ],
          }),
      })

      const result = await translateTexts(['Hello', '', 'World'], 'uk')

      // Only 'Hello' and 'World' are valid, but 'World' is at index 2
      // The API only receives valid texts, so we need to check the implementation
      expect(result[1]).toBeNull() // Empty string returns null
    })

    it('returns array of nulls on API error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('API Error'),
      })

      const result = await translateTexts(['Hello', 'World'], 'uk')

      expect(result).toEqual([null, null])
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('returns array of nulls on network error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await translateTexts(['Hello', 'World'], 'uk')

      expect(result).toEqual([null, null])
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('translateProjectToUkrainian', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv, DEEPL_API_KEY: 'test-api-key' }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('translates project fields to Ukrainian', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [
              { text: 'Київ' },
              { text: 'Центральна лікарня' },
              { text: 'Короткий опис' },
              { text: 'Повний опис' },
            ],
          }),
      })

      const result = await translateProjectToUkrainian({
        municipalityName: 'Kyiv',
        facilityName: 'Central Hospital',
        briefDescription: 'Brief description',
        fullDescription: 'Full description',
      })

      expect(result).toEqual({
        municipalityNameUk: 'Київ',
        facilityNameUk: 'Центральна лікарня',
        briefDescriptionUk: 'Короткий опис',
        fullDescriptionUk: 'Повний опис',
      })
    })

    it('returns nulls when translation fails', async () => {
      delete process.env.DEEPL_API_KEY
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = await translateProjectToUkrainian({
        municipalityName: 'Kyiv',
        facilityName: 'Central Hospital',
        briefDescription: 'Brief description',
        fullDescription: 'Full description',
      })

      expect(result).toEqual({
        municipalityNameUk: null,
        facilityNameUk: null,
        briefDescriptionUk: null,
        fullDescriptionUk: null,
      })

      consoleSpy.mockRestore()
    })
  })

  describe('translateProjectToEnglish', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv, DEEPL_API_KEY: 'test-api-key' }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('translates project fields to English', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            translations: [
              { text: 'Kyiv' },
              { text: 'Central Hospital' },
              { text: 'Brief description' },
              { text: 'Full description' },
            ],
          }),
      })

      const result = await translateProjectToEnglish({
        municipalityName: 'Київ',
        facilityName: 'Центральна лікарня',
        briefDescription: 'Короткий опис',
        fullDescription: 'Повний опис',
      })

      expect(result).toEqual({
        municipalityName: 'Kyiv',
        facilityName: 'Central Hospital',
        briefDescription: 'Brief description',
        fullDescription: 'Full description',
      })
    })

    it('returns nulls when translation fails', async () => {
      delete process.env.DEEPL_API_KEY
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const result = await translateProjectToEnglish({
        municipalityName: 'Київ',
        facilityName: 'Центральна лікарня',
        briefDescription: 'Короткий опис',
        fullDescription: 'Повний опис',
      })

      expect(result).toEqual({
        municipalityName: null,
        facilityName: null,
        briefDescription: null,
        fullDescription: null,
      })

      consoleSpy.mockRestore()
    })
  })
})
