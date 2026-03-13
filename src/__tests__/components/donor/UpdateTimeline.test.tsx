import { render, screen, fireEvent } from '@testing-library/react'
import { UpdateTimeline, type TimelineUpdate } from '@/components/donor/UpdateTimeline'

// Mock Badge
jest.mock('@/components/ui/Badge', () => ({
  Badge: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}))

// Mock donor-constants
jest.mock('@/lib/donor-constants', () => ({
  UPDATE_TYPE_CONFIG: {
    PROZORRO_STATUS: { label: 'Procurement', badgeClass: 'bg-blue-50 text-blue-700', icon: 'checkmark' },
    PHOTO_ADDED: { label: 'Photo Update', badgeClass: 'bg-emerald-50 text-emerald-700', icon: 'camera' },
    MANUAL: { label: 'Update', badgeClass: 'bg-cream-200 text-navy-600', icon: 'dot' },
  },
  formatDateTime: (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }),
}))

const baseUpdate: TimelineUpdate = {
  id: 'u1',
  title: 'Test Update',
  message: 'This is a test update message.',
  createdAt: '2026-01-15T10:00:00Z',
}

const prozorroUpdate: TimelineUpdate = {
  id: 'u2',
  title: 'Procurement started',
  message: 'Posted to Prozorro.',
  createdAt: '2026-02-01T08:00:00Z',
  type: 'PROZORRO_STATUS',
  metadata: { prozorroUrl: 'https://prozorro.gov.ua/tender/UA-123' },
}

const photoUpdate: TimelineUpdate = {
  id: 'u3',
  title: 'Photo from site',
  message: 'New photos.',
  createdAt: '2026-02-10T14:00:00Z',
  type: 'PHOTO_ADDED',
  metadata: { photoUrl: 'https://example.com/photo.jpg' },
  createdByName: 'EcoAction',
  createdByRole: 'Partner',
}

const multiPhotoUpdate: TimelineUpdate = {
  id: 'u4',
  title: 'Multiple photos',
  message: 'Several photos from site.',
  createdAt: '2026-02-12T14:00:00Z',
  type: 'PHOTO_ADDED',
  metadata: { photoUrls: ['https://example.com/a.jpg', 'https://example.com/b.jpg'] },
}

describe('UpdateTimeline', () => {
  it('renders empty state when no updates', () => {
    render(<UpdateTimeline updates={[]} variant="full" />)
    expect(screen.getByText('No updates yet')).toBeInTheDocument()
  })

  it('renders update title, message, and formatted date', () => {
    render(<UpdateTimeline updates={[baseUpdate]} variant="full" />)
    expect(screen.getByText('Test Update')).toBeInTheDocument()
    expect(screen.getByText('This is a test update message.')).toBeInTheDocument()
  })

  it('renders Prozorro link for PROZORRO_STATUS updates', () => {
    render(<UpdateTimeline updates={[prozorroUpdate]} variant="full" />)
    expect(screen.getByText('View on Prozorro')).toBeInTheDocument()
    expect(screen.getByText('View on Prozorro').closest('a')).toHaveAttribute(
      'href',
      'https://prozorro.gov.ua/tender/UA-123'
    )
  })

  it('renders badge for typed updates', () => {
    render(<UpdateTimeline updates={[prozorroUpdate]} variant="full" />)
    expect(screen.getByText('Procurement')).toBeInTheDocument()
  })

  it('renders photo for single photoUrl in full variant', () => {
    render(<UpdateTimeline updates={[photoUpdate]} variant="full" />)
    const img = screen.getByAltText('Photo from site')
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('does not render photos in compact variant', () => {
    render(<UpdateTimeline updates={[photoUpdate]} variant="compact" />)
    expect(screen.queryByAltText('Photo from site')).not.toBeInTheDocument()
  })

  it('renders multiple photos for photoUrls array', () => {
    render(<UpdateTimeline updates={[multiPhotoUpdate]} variant="full" />)
    expect(screen.getByAltText('Multiple photos 1')).toBeInTheDocument()
    expect(screen.getByAltText('Multiple photos 2')).toBeInTheDocument()
  })

  it('calls onPhotoClick when photo is clicked (single)', () => {
    const onPhotoClick = jest.fn()
    render(<UpdateTimeline updates={[photoUpdate]} variant="full" onPhotoClick={onPhotoClick} />)
    fireEvent.click(screen.getByAltText('Photo from site'))
    expect(onPhotoClick).toHaveBeenCalledWith('https://example.com/photo.jpg', 'Photo from site')
  })

  it('calls onPhotoClick when photo is clicked (multi)', () => {
    const onPhotoClick = jest.fn()
    render(<UpdateTimeline updates={[multiPhotoUpdate]} variant="full" onPhotoClick={onPhotoClick} />)
    fireEvent.click(screen.getByAltText('Multiple photos 1'))
    expect(onPhotoClick).toHaveBeenCalledWith('https://example.com/a.jpg', 'Multiple photos 1')
  })

  it('shows createdByName and createdByRole when present', () => {
    render(<UpdateTimeline updates={[photoUpdate]} variant="full" />)
    expect(screen.getByText(/EcoAction \(Partner\)/)).toBeInTheDocument()
  })

  it('limits updates when maxUpdates is set', () => {
    const updates = [baseUpdate, prozorroUpdate, photoUpdate]
    render(<UpdateTimeline updates={updates} variant="compact" maxUpdates={2} />)
    expect(screen.getByText(/\+ 1 earlier update/)).toBeInTheDocument()
  })

  it('sorts full variant chronologically (oldest first)', () => {
    const updates = [photoUpdate, baseUpdate]
    render(<UpdateTimeline updates={updates} variant="full" />)
    const titles = screen.getAllByText(/Test Update|Photo from site/)
    expect(titles[0].textContent).toBe('Test Update')
    expect(titles[1].textContent).toBe('Photo from site')
  })

  it('sorts compact variant reverse-chronologically (newest first)', () => {
    const updates = [baseUpdate, photoUpdate]
    render(<UpdateTimeline updates={updates} variant="compact" />)
    const titles = screen.getAllByText(/Test Update|Photo from site/)
    expect(titles[0].textContent).toBe('Photo from site')
    expect(titles[1].textContent).toBe('Test Update')
  })
})
