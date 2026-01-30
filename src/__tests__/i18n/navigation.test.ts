// Test the navigation exports
describe('i18n/navigation exports', () => {
  it('exports Link component', async () => {
    // Mock the next-intl/navigation module
    jest.doMock('next-intl/navigation', () => ({
      createNavigation: jest.fn().mockReturnValue({
        Link: jest.fn(),
        redirect: jest.fn(),
        usePathname: jest.fn(),
        useRouter: jest.fn(),
      }),
    }))

    // Mock the i18n module
    jest.doMock('@/i18n', () => ({
      locales: ['en', 'uk'],
    }))

    jest.resetModules()
    const navigation = await import('@/i18n/navigation')

    expect(navigation.Link).toBeDefined()
    expect(navigation.redirect).toBeDefined()
    expect(navigation.usePathname).toBeDefined()
    expect(navigation.useRouter).toBeDefined()
  })
})
