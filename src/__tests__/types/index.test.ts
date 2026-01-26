import { CATEGORY_CONFIG, URGENCY_CONFIG, STATUS_CONFIG } from '@/types'

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
})
