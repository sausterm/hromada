/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/healthcheck/route'

describe('/api/healthcheck', () => {
  it('GET returns ok with timestamp', async () => {
    const res = await GET()
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.time).toBeDefined()
  })

  it('POST returns ok with method and timestamp', async () => {
    const res = await POST()
    const data = await res.json()
    expect(data.ok).toBe(true)
    expect(data.method).toBe('POST')
    expect(data.time).toBeDefined()
  })
})
