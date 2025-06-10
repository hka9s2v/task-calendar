const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // テストの並行実行を制限してデータベースロックを防ぐ
  maxWorkers: 1,
  
  projects: [
    // APIテスト用設定（既存のNode環境）
    {
      displayName: 'API Tests',
      testEnvironment: 'jest-environment-node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: [
        '**/__tests__/api/**/*.(test|spec).(js|jsx|ts|tsx)',
        '**/__tests__/lib/**/*.(test|spec).(js|jsx|ts|tsx)',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      extensionsToTreatAsEsm: ['.ts', '.tsx'],
      // APIテストでは並行実行をさらに制限
      maxWorkers: 1,
      // テストのタイムアウト設定
      testTimeout: 30000,
    },
    // フロントエンドテスト用設定（JSDOM環境）
    {
      displayName: 'Frontend Tests',
      testEnvironment: 'jest-environment-jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.frontend.js'],
      testMatch: [
        '**/__tests__/components/**/*.(test|spec).(js|jsx|ts|tsx)',
        '**/__tests__/utils/**/*.(test|spec).(js|jsx|ts|tsx)',
        '**/__tests__/hooks/**/*.(test|spec).(js|jsx|ts|tsx)',
      ],
      moduleNameMapper: {
        // Handle module aliases
        '^@/(.*)$': '<rootDir>/$1',
        // Handle CSS imports (with CSS modules)
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle image imports
        '\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': `<rootDir>/__mocks__/fileMock.js`,
      },
      transform: {
        // Use next/babel for TypeScript and JSX files
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      transformIgnorePatterns: [
        '/node_modules/',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
    }
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/layout.tsx',
    '!app/**/loading.tsx',
    '!app/**/not-found.tsx',
    '!app/**/error.tsx',
    '!app/providers.tsx',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 