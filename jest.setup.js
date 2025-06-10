const { execSync } = require('child_process');

// 一意のテストデータベースファイル名を生成
const testDbName = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.db`;

// テスト環境変数の設定
process.env.DATABASE_URL = `file:./${testDbName}`;
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret-key";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// テスト前のデータベース準備
beforeAll(async () => {
  try {
    // テストデータベースを削除（存在する場合）
    try {
      require('fs').unlinkSync(`./${testDbName}`);
    } catch (e) {
      // ファイルが存在しない場合は無視
    }
    
    // テストデータベースでマイグレーション実行
    execSync('npx prisma db push --force-reset', { 
      env: { ...process.env, DATABASE_URL: `file:./${testDbName}` },
      stdio: 'pipe'
    });
    
    // Prismaクライアントを生成
    execSync('npx prisma generate', { stdio: 'pipe' });
    
    console.log(`Test database initialized: ${testDbName}`);
  } catch (error) {
    console.error('Failed to initialize test database:', error.message);
    throw error;
  }
});

// テスト後のクリーンアップ
afterAll(async () => {
  try {
    const { prisma } = require('./lib/prisma');
    await prisma.$disconnect();
    
    // テストデータベースを削除
    require('fs').unlinkSync(`./${testDbName}`);
    console.log('Test database cleaned up');
  } catch (e) {
    // ファイルが存在しない場合は無視
  }
});

// 各テストファイルの開始時にカウンターをリセット
beforeAll(() => {
  if (global.testUserCounter !== undefined) {
    global.testUserCounter = 0;
  }
});

// 各テスト前にデータベースをクリーンアップ（トランザクション内でのみ）
beforeEach(async () => {
  const { prisma } = require('./lib/prisma');
  
  try {
    // 外部キー制約を無効にして一括削除
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
    
    // 順序を考慮してデータを削除
    await prisma.$transaction([
      prisma.completionHistory.deleteMany(),
      prisma.todo.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    
    // 外部キー制約を再有効化
    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    
    // SQLiteのsequenceをリセット
    try {
      await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name IN ('User', 'Todo', 'CompletionHistory', 'Account', 'Session');`;
    } catch (seqError) {
      // sqlite_sequenceテーブルが存在しない場合は無視
    }
    
  } catch (error) {
    console.error('Failed to cleanup before test:', error.message);
    // 基本的なクリーンアップが失敗した場合の処理
    try {
      await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
      const tables = ['CompletionHistory', 'Todo', 'Session', 'Account', 'User'];
      for (const table of tables) {
        await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`);
      }
      await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    } catch (secondError) {
      console.error('Critical cleanup failure in beforeEach:', secondError.message);
    }
  }
  
  // カウンターを再設定
  if (global.testUserCounter !== undefined) {
    global.testUserCounter = Math.floor(Math.random() * 1000) + Date.now() % 10000;
  }
});

// 各テスト後にもクリーンアップ（安全策として）
afterEach(async () => {
  const { prisma } = require('./lib/prisma');
  
  try {
    // 外部キー制約を無効にして一括削除
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
    
    // 順序を考慮してデータを削除
    await prisma.$transaction([
      prisma.completionHistory.deleteMany(),
      prisma.todo.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    
    // 外部キー制約を再有効化
    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    
    // SQLiteのsequenceをリセット
    try {
      await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name IN ('User', 'Todo', 'CompletionHistory', 'Account', 'Session');`;
    } catch (seqError) {
      // sqlite_sequenceテーブルが存在しない場合は無視
    }
    
  } catch (error) {
    console.error('Failed to cleanup after test:', error.message);
  }
}); 