// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^framer-motion$': '<rootDir>/src/__mocks__/framer-motion.tsx',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // Run tests sequentially to avoid parallel execution issues with shared mocks
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/app/layout.tsx',
  ],
  // Coverage thresholds - increase as more tests are added
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70,
  //   },
  // },
}

// next/jest adds its own transformIgnorePatterns that conflict with ours.
// We need to post-process the config to consolidate them.
const jestConfig = createJestConfig(customJestConfig)
module.exports = async () => {
  const config = await jestConfig()
  // Replace the default transformIgnorePatterns with a unified one
  // that allows transforming jose, next-intl, and geist (from next/jest defaults)
  config.transformIgnorePatterns = [
    '/node_modules/(?!.pnpm)(?!(jose|next-intl|use-intl|@formatjs|intl-messageformat|geist)/)',
    '/node_modules/.pnpm/(?!(jose|next-intl|use-intl|@formatjs|intl-messageformat|geist)@)',
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}
