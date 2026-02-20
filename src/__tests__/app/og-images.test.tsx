// Mock next/og ImageResponse
jest.mock('next/og', () => ({
  ImageResponse: class MockImageResponse {
    constructor(public element: any, public options?: any) {}
  },
}))

describe('OpenGraph Image', () => {
  it('exports correct metadata', () => {
    const { alt, size, contentType, runtime } = require('@/app/opengraph-image')
    expect(alt).toBe('hromada - Support Ukrainian renewable infrastructure')
    expect(size).toEqual({ width: 1200, height: 630 })
    expect(contentType).toBe('image/png')
    expect(runtime).toBe('edge')
  })

  it('returns an ImageResponse', () => {
    const { default: OpenGraphImage } = require('@/app/opengraph-image')
    const result = OpenGraphImage()
    expect(result).toBeDefined()
    expect(result.element).toBeDefined()
  })
})

describe('Apple Icon', () => {
  it('exports correct metadata', () => {
    const { size, contentType, runtime } = require('@/app/apple-icon')
    expect(size).toEqual({ width: 180, height: 180 })
    expect(contentType).toBe('image/png')
    expect(runtime).toBe('edge')
  })

  it('returns an ImageResponse', () => {
    const { default: AppleIcon } = require('@/app/apple-icon')
    const result = AppleIcon()
    expect(result).toBeDefined()
    expect(result.element).toBeDefined()
  })
})
