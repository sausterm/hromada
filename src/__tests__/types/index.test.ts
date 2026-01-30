import {
  CATEGORY_CONFIG,
  URGENCY_CONFIG,
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  COFINANCING_CONFIG,
  formatCurrency,
  formatPower,
  formatRelativeTime,
  getLocalizedProject,
  Project,
} from '@/types'

describe('Type configurations', () => {
  describe('CATEGORY_CONFIG', () => {
    it('has all required categories', () => {
      expect(CATEGORY_CONFIG).toHaveProperty('HOSPITAL')
      expect(CATEGORY_CONFIG).toHaveProperty('SCHOOL')
      expect(CATEGORY_CONFIG).toHaveProperty('WATER')
      expect(CATEGORY_CONFIG).toHaveProperty('ENERGY')
      expect(CATEGORY_CONFIG).toHaveProperty('OTHER')
    })

    it('each category has label, color, and icon', () => {
      Object.values(CATEGORY_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
        expect(config).toHaveProperty('icon')
        expect(typeof config.label).toBe('string')
        expect(typeof config.color).toBe('string')
        expect(typeof config.icon).toBe('string')
      })
    })

    it('colors are valid hex codes', () => {
      const hexRegex = /^#[0-9A-Fa-f]{6}$/
      Object.values(CATEGORY_CONFIG).forEach((config) => {
        expect(config.color).toMatch(hexRegex)
      })
    })
  })

  describe('URGENCY_CONFIG', () => {
    it('has all required urgency levels', () => {
      expect(URGENCY_CONFIG).toHaveProperty('LOW')
      expect(URGENCY_CONFIG).toHaveProperty('MEDIUM')
      expect(URGENCY_CONFIG).toHaveProperty('HIGH')
      expect(URGENCY_CONFIG).toHaveProperty('CRITICAL')
    })

    it('each urgency has label and color', () => {
      Object.values(URGENCY_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
      })
    })
  })

  describe('STATUS_CONFIG', () => {
    it('has all required statuses', () => {
      expect(STATUS_CONFIG).toHaveProperty('OPEN')
      expect(STATUS_CONFIG).toHaveProperty('IN_DISCUSSION')
      expect(STATUS_CONFIG).toHaveProperty('MATCHED')
      expect(STATUS_CONFIG).toHaveProperty('FULFILLED')
    })

    it('each status has label and color', () => {
      Object.values(STATUS_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
      })
    })
  })

  describe('PROJECT_TYPE_CONFIG', () => {
    it('has all required project types', () => {
      expect(PROJECT_TYPE_CONFIG).toHaveProperty('SOLAR_PV')
      expect(PROJECT_TYPE_CONFIG).toHaveProperty('HEAT_PUMP')
      expect(PROJECT_TYPE_CONFIG).toHaveProperty('BATTERY_STORAGE')
      expect(PROJECT_TYPE_CONFIG).toHaveProperty('THERMO_MODERNIZATION')
    })

    it('each project type has label, color, and icon', () => {
      Object.values(PROJECT_TYPE_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
        expect(config).toHaveProperty('icon')
      })
    })
  })

  describe('COFINANCING_CONFIG', () => {
    it('has all required cofinancing statuses', () => {
      expect(COFINANCING_CONFIG).toHaveProperty('YES')
      expect(COFINANCING_CONFIG).toHaveProperty('NO')
      expect(COFINANCING_CONFIG).toHaveProperty('NEEDS_CLARIFICATION')
    })

    it('each status has label and color', () => {
      Object.values(COFINANCING_CONFIG).forEach((config) => {
        expect(config).toHaveProperty('label')
        expect(config).toHaveProperty('color')
      })
    })
  })
})

describe('Utility functions', () => {
  describe('formatCurrency', () => {
    describe('default formatting (non-compact)', () => {
      it('formats small amounts correctly', () => {
        expect(formatCurrency(500)).toBe('$500')
      })

      it('formats thousands with comma separator', () => {
        expect(formatCurrency(5000)).toBe('$5,000')
        expect(formatCurrency(60000)).toBe('$60,000')
      })

      it('formats hundreds of thousands correctly', () => {
        expect(formatCurrency(250000)).toBe('$250,000')
      })

      it('formats millions correctly', () => {
        expect(formatCurrency(1500000)).toBe('$1,500,000')
      })

      it('formats zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0')
      })
    })

    describe('compact formatting', () => {
      it('formats amounts under 1000 without suffix', () => {
        expect(formatCurrency(500, { compact: true })).toBe('$500')
        expect(formatCurrency(999, { compact: true })).toBe('$999')
      })

      it('formats thousands with K suffix', () => {
        expect(formatCurrency(1000, { compact: true })).toBe('$1K')
        expect(formatCurrency(5000, { compact: true })).toBe('$5K')
        expect(formatCurrency(60000, { compact: true })).toBe('$60K')
      })

      it('formats thousands with decimal when needed', () => {
        expect(formatCurrency(1500, { compact: true })).toBe('$1.5K')
        expect(formatCurrency(25500, { compact: true })).toBe('$25.5K')
      })

      it('formats millions with M suffix', () => {
        expect(formatCurrency(1000000, { compact: true })).toBe('$1M')
        expect(formatCurrency(5000000, { compact: true })).toBe('$5M')
      })

      it('formats millions with decimal when needed', () => {
        expect(formatCurrency(1500000, { compact: true })).toBe('$1.5M')
        expect(formatCurrency(2750000, { compact: true })).toBe('$2.8M')
      })
    })

    describe('showPrefix option', () => {
      it('adds USD prefix when showPrefix is true', () => {
        expect(formatCurrency(5000, { showPrefix: true })).toBe('USD $5,000')
      })

      it('works with compact and showPrefix together', () => {
        expect(formatCurrency(60000, { compact: true, showPrefix: true })).toBe('USD $60K')
        expect(formatCurrency(1500000, { compact: true, showPrefix: true })).toBe('USD $1.5M')
      })
    })
  })

  describe('formatPower', () => {
    it('formats power in kW', () => {
      expect(formatPower(50)).toBe('50 kW')
    })

    it('formats power with comma separator for large values', () => {
      expect(formatPower(1000)).toBe('1,000 kW')
      expect(formatPower(5500)).toBe('5,500 kW')
    })

    it('formats zero power', () => {
      expect(formatPower(0)).toBe('0 kW')
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "just now" for times less than a minute ago', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('just now')

      const thirtySecsAgo = new Date(Date.now() - 30 * 1000)
      expect(formatRelativeTime(thirtySecsAgo)).toBe('just now')
    })

    it('returns minutes ago for times less than an hour ago', () => {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago')

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago')

      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000)
      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe('59 minutes ago')
    })

    it('returns hours ago for times less than a day ago', () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago')

      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago')

      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000)
      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe('23 hours ago')
    })

    it('returns days ago for times less than a week ago', () => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago')

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago')

      const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(sixDaysAgo)).toBe('6 days ago')
    })

    it('returns weeks ago for times less than a month ago', () => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(oneWeekAgo)).toBe('1 week ago')

      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago')

      const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeWeeksAgo)).toBe('3 weeks ago')
    })

    it('returns months ago for times less than a year ago', () => {
      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago')

      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeMonthsAgo)).toBe('3 months ago')

      const elevenMonthsAgo = new Date(Date.now() - 330 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(elevenMonthsAgo)).toBe('11 months ago')
    })

    it('returns years ago for times over a year ago', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago')

      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago')
    })
  })

  describe('getLocalizedProject', () => {
    const mockProject: Project = {
      id: 'test-1',
      municipalityName: 'Kyiv',
      municipalityEmail: 'kyiv@example.com',
      facilityName: 'Central Hospital',
      category: 'HOSPITAL',
      briefDescription: 'A hospital project',
      description: 'Detailed description',
      fullDescription: 'Full detailed description of the project',
      address: '123 Main St',
      cityLatitude: 50.4501,
      cityLongitude: 30.5234,
      contactName: 'John Doe',
      contactEmail: 'john@example.com',
      urgency: 'HIGH',
      status: 'OPEN',
      municipalityNameUk: 'Київ',
      facilityNameUk: 'Центральна лікарня',
      briefDescriptionUk: 'Проект лікарні',
      fullDescriptionUk: 'Повний детальний опис проекту',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it('returns Ukrainian translations when locale is uk', () => {
      const localized = getLocalizedProject(mockProject, 'uk')

      expect(localized.municipalityName).toBe('Київ')
      expect(localized.facilityName).toBe('Центральна лікарня')
      expect(localized.briefDescription).toBe('Проект лікарні')
      expect(localized.fullDescription).toBe('Повний детальний опис проекту')
    })

    it('returns English content when locale is en', () => {
      const localized = getLocalizedProject(mockProject, 'en')

      expect(localized.municipalityName).toBe('Kyiv')
      expect(localized.facilityName).toBe('Central Hospital')
      expect(localized.briefDescription).toBe('A hospital project')
      expect(localized.fullDescription).toBe('Full detailed description of the project')
    })

    it('falls back to English when Ukrainian translations are missing', () => {
      const projectWithoutUk: Project = {
        ...mockProject,
        municipalityNameUk: undefined,
        facilityNameUk: undefined,
        briefDescriptionUk: undefined,
        fullDescriptionUk: undefined,
      }

      const localized = getLocalizedProject(projectWithoutUk, 'uk')

      expect(localized.municipalityName).toBe('Kyiv')
      expect(localized.facilityName).toBe('Central Hospital')
      expect(localized.briefDescription).toBe('A hospital project')
      expect(localized.fullDescription).toBe('Full detailed description of the project')
    })

    it('falls back to description when fullDescription is missing', () => {
      const projectWithoutFullDesc: Project = {
        ...mockProject,
        fullDescription: undefined,
        fullDescriptionUk: undefined,
      }

      const localizedEn = getLocalizedProject(projectWithoutFullDesc, 'en')
      expect(localizedEn.fullDescription).toBe('Detailed description')

      const localizedUk = getLocalizedProject(projectWithoutFullDesc, 'uk')
      expect(localizedUk.fullDescription).toBe('Detailed description')
    })

    it('defaults to English for unknown locales', () => {
      const localized = getLocalizedProject(mockProject, 'fr')

      expect(localized.municipalityName).toBe('Kyiv')
      expect(localized.facilityName).toBe('Central Hospital')
    })
  })
})
