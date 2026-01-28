import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonCard,
  SkeletonProjectDetail,
  SkeletonTable,
  SkeletonMap,
  SkeletonStats,
  SkeletonInquiryCard,
} from '@/components/ui/Skeleton'

describe('Skeleton', () => {
  it('renders with default styles', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.firstChild as HTMLElement
    expect(skeleton.className).toContain('animate-pulse')
    expect(skeleton.className).toContain('bg-gray-200')
  })

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-10 w-20" />)
    const skeleton = container.firstChild as HTMLElement
    expect(skeleton.className).toContain('h-10')
    expect(skeleton.className).toContain('w-20')
  })
})

describe('SkeletonCard', () => {
  it('renders card structure', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.firstChild).toBeInTheDocument()
    // Should have multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('SkeletonProjectDetail', () => {
  it('renders project detail structure', () => {
    const { container } = render(<SkeletonProjectDetail />)
    expect(container.firstChild).toBeInTheDocument()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(5)
  })
})

describe('SkeletonTable', () => {
  it('renders default 5 rows', () => {
    const { container } = render(<SkeletonTable />)
    // Check for border-b classes which indicate rows
    const rows = container.querySelectorAll('.border-b')
    expect(rows.length).toBeGreaterThanOrEqual(5)
  })

  it('renders custom number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} />)
    expect(container.firstChild).toBeInTheDocument()
  })
})

describe('SkeletonMap', () => {
  it('renders map placeholder', () => {
    const { container } = render(<SkeletonMap />)
    const mapContainer = container.firstChild as HTMLElement
    expect(mapContainer.className).toContain('h-[600px]')
  })
})

describe('SkeletonStats', () => {
  it('renders 4 stat cards', () => {
    const { container } = render(<SkeletonStats />)
    const statCards = container.querySelectorAll('.bg-white.rounded-xl')
    expect(statCards.length).toBe(4)
  })
})

describe('SkeletonInquiryCard', () => {
  it('renders inquiry card structure', () => {
    const { container } = render(<SkeletonInquiryCard />)
    expect(container.firstChild).toBeInTheDocument()
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
