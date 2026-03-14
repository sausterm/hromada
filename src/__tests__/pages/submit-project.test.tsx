import { redirect } from 'next/navigation'
import SubmitProjectPage from '@/app/[locale]/(public)/submit-project/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('SubmitProjectPage', () => {
  it('redirects to /projects', () => {
    try {
      SubmitProjectPage()
    } catch {
      // redirect throws in Next.js
    }
    expect(redirect).toHaveBeenCalledWith('/projects')
  })
})
