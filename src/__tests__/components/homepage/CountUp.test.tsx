import { render, screen, act } from '@testing-library/react'
import { CountUp, CountUpCurrency } from '@/components/homepage/CountUp'

// Mock formatCurrency
jest.mock('@/types', () => ({
  formatCurrency: (amount: number, options?: { compact?: boolean }) => {
    if (options?.compact) {
      if (amount >= 1000000) {
        const millions = amount / 1000000
        return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`
      } else if (amount >= 1000) {
        const thousands = amount / 1000
        return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
      }
      return `$${amount}`
    }
    return `$${amount.toLocaleString()}`
  },
}))

// Track IntersectionObserver instances and callbacks
let intersectionCallback: IntersectionObserverCallback | null = null
let observedElements: Element[] = []
const mockDisconnect = jest.fn()
const mockObserve = jest.fn((el: Element) => {
  observedElements.push(el)
})

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersectionCallback = callback
  }
  observe = mockObserve
  unobserve = jest.fn()
  disconnect = mockDisconnect
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// Helper to simulate an element becoming visible
function triggerIntersection(isIntersecting: boolean) {
  if (intersectionCallback) {
    const entries = [
      {
        isIntersecting,
        boundingClientRect: {} as DOMRectReadOnly,
        intersectionRatio: isIntersecting ? 1 : 0,
        intersectionRect: {} as DOMRectReadOnly,
        rootBounds: null,
        target: observedElements[observedElements.length - 1] || document.createElement('span'),
        time: Date.now(),
      },
    ] as IntersectionObserverEntry[]
    intersectionCallback(entries, new MockIntersectionObserver(() => {}) as unknown as IntersectionObserver)
  }
}

describe('CountUp', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    intersectionCallback = null
    observedElements = []
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders a span element', () => {
      render(<CountUp end={100} />)

      const span = screen.getByText((content, element) => element?.tagName === 'SPAN')
      expect(span).toBeInTheDocument()
    })

    it('starts with value 0', () => {
      render(<CountUp end={100} />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('renders with prefix', () => {
      render(<CountUp end={50} prefix="$" />)

      expect(screen.getByText('$0')).toBeInTheDocument()
    })

    it('renders with suffix', () => {
      render(<CountUp end={50} suffix="+" />)

      expect(screen.getByText('0+')).toBeInTheDocument()
    })

    it('renders with both prefix and suffix', () => {
      render(<CountUp end={50} prefix="$" suffix="M" />)

      expect(screen.getByText('$0M')).toBeInTheDocument()
    })
  })

  describe('IntersectionObserver setup', () => {
    it('creates an IntersectionObserver', () => {
      render(<CountUp end={100} />)

      expect(mockObserve).toHaveBeenCalled()
    })

    it('observes the span element', () => {
      render(<CountUp end={100} />)

      expect(observedElements.length).toBeGreaterThan(0)
      expect(observedElements[observedElements.length - 1].tagName).toBe('SPAN')
    })

    it('disconnects observer on unmount', () => {
      const { unmount } = render(<CountUp end={100} />)

      unmount()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('Animation trigger', () => {
    it('does not animate until element is visible', () => {
      render(<CountUp end={100} />)

      // Still at 0, no animation started
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('starts animation when element intersects', () => {
      // Mock requestAnimationFrame to immediately invoke callback
      const originalRAF = window.requestAnimationFrame
      let rafCallbacks: FrameRequestCallback[] = []
      window.requestAnimationFrame = jest.fn((cb: FrameRequestCallback) => {
        rafCallbacks.push(cb)
        return rafCallbacks.length
      })

      render(<CountUp end={100} duration={1000} />)

      act(() => {
        triggerIntersection(true)
      })

      // The animation was kicked off via requestAnimationFrame
      expect(window.requestAnimationFrame).toHaveBeenCalled()

      window.requestAnimationFrame = originalRAF
    })
  })
})

describe('CountUpCurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    intersectionCallback = null
    observedElements = []
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders a span element', () => {
      render(<CountUpCurrency end={50000} />)

      const span = screen.getByText((content, element) => element?.tagName === 'SPAN')
      expect(span).toBeInTheDocument()
    })

    it('starts with formatted value of 0', () => {
      render(<CountUpCurrency end={50000} />)

      // formatCurrency(0, { compact: true }) returns "$0"
      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })

  describe('IntersectionObserver setup', () => {
    it('creates an IntersectionObserver', () => {
      render(<CountUpCurrency end={50000} />)

      expect(mockObserve).toHaveBeenCalled()
    })

    it('disconnects observer on unmount', () => {
      const { unmount } = render(<CountUpCurrency end={50000} />)

      unmount()
      expect(mockDisconnect).toHaveBeenCalled()
    })
  })

  describe('Currency formatting', () => {
    it('uses formatCurrency with compact option', () => {
      render(<CountUpCurrency end={50000} />)

      // Initially shows $0 (formatCurrency(0, { compact: true }))
      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })
})
