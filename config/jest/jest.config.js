const nextJest = require('next/jest')

// Next.jsアプリのパスを指定してJest設定を作成
// next.config.jsや.envファイルを自動で読み込む
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: '../../',
})

// Jest設定オブジェクト
const customJestConfig = {
  // 基本設定
  maxWorkers: 1, // テストの並行実行を制限（データベースロック回避）
  testEnvironment: 'node', // Node.js環境でテスト実行
  setupFilesAfterEnv: ['<rootDir>/config/jest/jest.setup.js'], // テスト前の初期化ファイル
  globalSetup: '<rootDir>/config/jest/jest.global-setup.js', // グローバルセットアップ
  globalTeardown: '<rootDir>/config/jest/jest.global-teardown.js', // グローバルティアダウン

  // テスト対象の指定
  testMatch: [
    '**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)', // テストファイルのパターン
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/', // .nextディレクトリを除外
    '<rootDir>/node_modules/', // node_modulesを除外
  ],

  // ファイル変換とモジュール解決
  moduleNameMapper: {
    // パスエイリアスの設定（tsconfig.jsonと同期）
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },

  // パフォーマンスと出力設定
  testTimeout: 30000, // テストタイムアウト: 30秒
  verbose: true, // 詳細な出力を表示

  // カバレッジ設定
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}', // アプリケーションコード
    'lib/**/*.{js,jsx,ts,tsx}', // ライブラリコード
    '!**/*.d.ts', // 型定義ファイルを除外
    '!**/node_modules/**', // node_modulesを除外
  ],
  coverageReporters: ['text', 'lcov', 'html'], // カバレッジレポートの形式
  coverageDirectory: 'coverage', // カバレッジレポートの出力先
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// Next.jsの非同期設定を適切に読み込むためにこの形式でエクスポート
module.exports = createJestConfig(customJestConfig) 