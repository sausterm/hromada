import '@testing-library/jest-dom'

// Only apply browser mocks when running in jsdom environment
const isJsdom = typeof window !== 'undefined'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({}),
  usePathname: () => '',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock @/i18n/navigation — default mock for all tests.
// Individual test files can override with their own jest.mock('@/i18n/navigation', ...).
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  Link: jest.fn().mockImplementation(({ children, ...props }) => {
    const React = require('react') // eslint-disable-line @typescript-eslint/no-require-imports
    return React.createElement('a', props, children)
  }),
  redirect: jest.fn(),
}))

// Mock next/dynamic
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (fn) => {
    const Component = fn()
    Component.preload = jest.fn()
    return Component
  },
}))

if (isJsdom) {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {}
    return {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => {
        store[key] = value
      }),
      removeItem: jest.fn((key) => {
        delete store[key]
      }),
      clear: jest.fn(() => {
        store = {}
      }),
      // Expose for tests to reset
      __store: store,
    }
  })()

  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  // Export mock functions for tests
  global.__localStorageMock = localStorageMock

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock ResizeObserver (not available in jsdom)
if (isJsdom) {
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Suppress console errors in tests (optional)
// console.error = jest.fn()
