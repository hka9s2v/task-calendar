// テスト環境変数の設定（グローバルセットアップと同期）
process.env.DATABASE_URL = `file:./test.db`;
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret-key";
process.env.NEXTAUTH_URL = "http://localhost:3000";

// 各テストファイルの開始時にカウンターをリセット
beforeAll(() => {
  if (global.testUserCounter !== undefined) {
    global.testUserCounter = 0;
  }
});

// 各テスト前にデータベースをクリーンアップ（データのみ削除、構造は保持）
beforeEach(async () => {
  const { prisma } = require('./lib/prisma');
  
  try {
    // 外部キー制約を無効にして一括削除
    await prisma.$executeRaw`PRAGMA foreign_keys = OFF;`;
    
    // 順序を考慮してデータを削除（テーブル構造は保持）
    await prisma.$transaction([
      prisma.completionHistory.deleteMany(),
      prisma.todo.deleteMany(),
      prisma.session.deleteMany(),
      prisma.account.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    
    // 外部キー制約を再有効化
    await prisma.$executeRaw`PRAGMA foreign_keys = ON;`;
    
    // SQLiteのsequenceをリセット（IDカウンターをリセット）
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
