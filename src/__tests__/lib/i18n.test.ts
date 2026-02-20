// Mock next-intl/server
const mockGetRequestConfig = jest.fn((fn: any) => fn)

jest.mock('next-intl/server', () => ({
  getRequestConfig: mockGetRequestConfig,
}))

describe('i18n config', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('exports locales array with en and uk', () => {
    const { locales } = require('@/i18n')
    expect(locales).toEqual(['en', 'uk'])
  })

  it('exports Locale type (locales is readonly)', () => {
    const { locales } = require('@/i18n')
    expect(locales.length).toBe(2)
    expect(locales[0]).toBe('en')
    expect(locales[1]).toBe('uk')
  })

  it('calls getRequestConfig', () => {
    require('@/i18n')
    expect(mockGetRequestConfig).toHaveBeenCalled()
  })

  it('config function returns en locale and messages for valid locale', async () => {
    const { default: configFn } = require('@/i18n')
    const result = await configFn({ requestLocale: Promise.resolve('en') })

    expect(result.locale).toBe('en')
    expect(result.messages).toBeDefined()
  })

  it('config function returns uk locale and messages', async () => {
    const { default: configFn } = require('@/i18n')
    const result = await configFn({ requestLocale: Promise.resolve('uk') })

    expect(result.locale).toBe('uk')
    expect(result.messages).toBeDefined()
  })

  it('defaults to en for invalid locale', async () => {
    const { default: configFn } = require('@/i18n')
    const result = await configFn({ requestLocale: Promise.resolve('fr') })

    expect(result.locale).toBe('en')
  })

  it('defaults to en when locale is undefined', async () => {
    const { default: configFn } = require('@/i18n')
    const result = await configFn({ requestLocale: Promise.resolve(undefined) })

    expect(result.locale).toBe('en')
  })

  it('defaults to en when locale is empty string', async () => {
    const { default: configFn } = require('@/i18n')
    const result = await configFn({ requestLocale: Promise.resolve('') })

    expect(result.locale).toBe('en')
  })
})
