import React from 'react'

// Mock framer-motion for tests
export const motion = {
  div: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <div ref={ref} {...props}>{children}</div>
  )),
  span: React.forwardRef(({ children, ...props }: any, ref: any) => (
    <span ref={ref} {...props}>{children}</span>
  )),
}

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>

export const useAnimation = () => ({
  start: () => Promise.resolve(),
  set: () => {},
  stop: () => {},
})

export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: () => {},
  onChange: () => () => {},
})

export const useSpring = (initial: number) => ({
  get: () => initial,
  set: () => {},
})

export const useTransform = () => ({
  get: () => 0,
})
