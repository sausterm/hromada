import { render, screen } from '@testing-library/react'
import { JourneyStepper } from '@/components/donor/JourneyStepper'

describe('JourneyStepper', () => {
  it('renders all 5 journey steps', () => {
    render(<JourneyStepper status="PENDING_CONFIRMATION" />)
    expect(screen.getByText('Payment Received')).toBeInTheDocument()
    expect(screen.getByText('Funds Forwarded to Ukraine')).toBeInTheDocument()
    expect(screen.getByText('Public Procurement')).toBeInTheDocument()
    expect(screen.getByText('Construction & Updates')).toBeInTheDocument()
    expect(screen.getByText('Project Complete')).toBeInTheDocument()
  })

  it('shows step descriptions in non-compact mode', () => {
    render(<JourneyStepper status="RECEIVED" />)
    expect(screen.getByText(/received by POCACITO/)).toBeInTheDocument()
    expect(screen.getByText(/wired to the implementing NGO/)).toBeInTheDocument()
  })

  it('hides step descriptions in compact mode', () => {
    render(<JourneyStepper status="RECEIVED" compact />)
    expect(screen.queryByText(/received by POCACITO/)).not.toBeInTheDocument()
  })

  it('shows 0 completed steps for PENDING_CONFIRMATION', () => {
    const { container } = render(<JourneyStepper status="PENDING_CONFIRMATION" />)
    const greenCircles = container.querySelectorAll('.bg-green-500')
    expect(greenCircles.length).toBe(0)
  })

  it('shows 1 completed step for RECEIVED status', () => {
    const { container } = render(<JourneyStepper status="RECEIVED" />)
    const greenCircles = container.querySelectorAll('.bg-green-500')
    expect(greenCircles.length).toBeGreaterThanOrEqual(1)
  })

  it('shows 2 completed steps for FORWARDED status', () => {
    const { container } = render(<JourneyStepper status="FORWARDED" />)
    const greenCircles = container.querySelectorAll('div.rounded-full.bg-green-500')
    expect(greenCircles.length).toBe(2)
  })

  it('shows 3 completed steps for FORWARDED with Prozorro', () => {
    const { container } = render(
      <JourneyStepper status="FORWARDED" hasProzorroUpdates />
    )
    const greenCircles = container.querySelectorAll('div.rounded-full.bg-green-500')
    expect(greenCircles.length).toBe(3)
  })

  it('shows 4 completed steps for FORWARDED with photos', () => {
    const { container } = render(
      <JourneyStepper status="FORWARDED" hasPhotoUpdates />
    )
    const greenCircles = container.querySelectorAll('div.rounded-full.bg-green-500')
    expect(greenCircles.length).toBe(4)
  })

  it('shows all 5 steps completed for COMPLETED status', () => {
    const { container } = render(<JourneyStepper status="COMPLETED" />)
    const greenCircles = container.querySelectorAll('div.rounded-full.bg-green-500')
    expect(greenCircles.length).toBe(5)
  })

  it('shows refund message for REFUNDED status', () => {
    render(<JourneyStepper status="REFUNDED" />)
    expect(screen.getByText('This donation has been refunded.')).toBeInTheDocument()
    expect(screen.queryByText('Payment Received')).not.toBeInTheDocument()
  })

  it('shows error message for FAILED status', () => {
    render(<JourneyStepper status="FAILED" />)
    expect(screen.getByText(/issue with this donation/)).toBeInTheDocument()
    expect(screen.queryByText('Payment Received')).not.toBeInTheDocument()
  })
})
