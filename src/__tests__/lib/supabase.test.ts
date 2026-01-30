describe('supabase configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('exports STORAGE_BUCKET constant', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    const { STORAGE_BUCKET } = await import('@/lib/supabase')
    expect(STORAGE_BUCKET).toBe('project-images')
  })

  it('exports isSupabaseConfigured as true when credentials exist', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn().mockReturnValue({}),
    }))

    jest.resetModules()
    const { isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(true)
  })

  it('exports isSupabaseConfigured as false when URL missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    jest.resetModules()
    const { isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(false)

    consoleSpy.mockRestore()
  })

  it('exports isSupabaseConfigured as false when key missing', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    jest.resetModules()
    const { isSupabaseConfigured } = await import('@/lib/supabase')
    expect(isSupabaseConfigured).toBe(false)

    consoleSpy.mockRestore()
  })

  it('logs warning when credentials missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

    jest.resetModules()
    await import('@/lib/supabase')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Supabase environment variables not configured')
    )

    consoleSpy.mockRestore()
  })
})
