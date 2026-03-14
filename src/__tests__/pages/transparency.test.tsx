import { redirect } from 'next/navigation'
import TransparencyPage from '@/app/[locale]/(public)/transparency/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('TransparencyPage', () => {
  it('redirects to /projects', () => {
    try {
      TransparencyPage()
    } catch {
      // redirect throws in Next.js
    }
    expect(redirect).toHaveBeenCalledWith('/projects')
  })
})
