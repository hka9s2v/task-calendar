const nextJest = require('next/jest')

// Next.jsアプリのパスを指定してJest設定を作成
// next.config.jsや.envファイルを自動で読み込む
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // テストの並行実行を制限してデータベースロックを防ぐ
  // 1 = シーケンシャル実行、複数 = 並行実行のワーカー数
  maxWorkers: 1,
  
  // グローバルセットアップ（全テスト実行前に1回だけ実行）
  // テストデータベースの初期化を行う
  globalSetup: '<rootDir>/jest.global-setup.js',
  
  // グローバルティアダウン（全テスト実行後に1回だけ実行）
  // データベース接続のクリーンアップを行う
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // APIテスト用設定（Node環境）
  // JSDOMではなくNode.js環境でテストを実行（APIテスト用）
  testEnvironment: 'jest-environment-node',
  
  // テスト実行前に読み込むセットアップファイル
  // データベース初期化やモック設定を行う
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // テスト対象ファイルのパターン指定
  // どのファイルをテストとして認識するかを定義
  testMatch: [
    '**/__tests__/api/**/*.(test|spec).(js|jsx|ts|tsx)',    // APIテストファイル
    '**/__tests__/lib/**/*.(test|spec).(js|jsx|ts|tsx)',    // ライブラリテストファイル
  ],
  
  // モジュール名の解決ルール
  // インポートパスのエイリアス設定
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',  // @/で始まるパスをルートディレクトリから解決
  },
  
  // ファイル変換の設定
  // TypeScript、JSX等を実行可能なJavaScriptに変換
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // ES Modulesとして扱うファイル拡張子
  // importとexportを使用できるファイル形式を指定
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // テストのタイムアウト設定（ミリ秒）
  // データベース操作等で時間がかかるテスト用に30秒に設定
  testTimeout: 30000,
  
  // カバレッジ収集対象ファイルの指定
  // テストカバレッジレポートに含めるファイルパターン
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',      // appディレクトリ内の全JSファイル
    'lib/**/*.{js,jsx,ts,tsx}',      // libディレクトリ内の全JSファイル
    '!app/**/*.d.ts',                // TypeScript定義ファイルは除外
    '!app/**/layout.tsx',            // Next.jsレイアウトファイルは除外
    '!app/**/loading.tsx',           // Next.jsローディングファイルは除外
    '!app/**/not-found.tsx',         // Next.js 404ページは除外
    '!app/**/error.tsx',             // Next.jsエラーページは除外
    '!app/providers.tsx',            // プロバイダーファイルは除外
  ],
  
  // テスト実行時に無視するパス
  // テスト対象から除外するディレクトリを指定
  testPathIgnorePatterns: [
    '<rootDir>/.next/',              // Next.jsビルド出力ディレクトリ
    '<rootDir>/node_modules/',       // npmパッケージディレクトリ
  ],
  
  // カバレッジレポートの出力形式
  // テストカバレッジの結果をどの形式で出力するか
  coverageReporters: ['text', 'lcov', 'html'],
  
  // カバレッジレポートの出力ディレクトリ
  // カバレッジファイルの保存先フォルダ
  coverageDirectory: 'coverage',
  
  // テスト実行時の詳細出力を有効化
  // テスト結果の詳細情報を表示
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
// Next.jsの非同期設定を適切に読み込むためにこの形式でエクスポート
module.exports = createJestConfig(customJestConfig) 