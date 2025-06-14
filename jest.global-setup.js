const { execSync } = require('child_process');

module.exports = async () => {
  console.log('🔧 Setting up test database globally...');
  
  // 固定のテストデータベースファイル名
  const testDbName = 'test.db';
  
  // テスト環境変数の設定
  process.env.DATABASE_URL = `file:./test.db`;
  process.env.NODE_ENV = "test";
  process.env.NEXTAUTH_SECRET = "test-secret-key";
  process.env.NEXTAUTH_URL = "http://localhost:3000";
  
  try {
    // 既存のテストDBファイルをチェック
    const fs = require('fs');
    const dbPath = `./prisma/${testDbName}`;
    
    if (fs.existsSync(dbPath)) {
      console.log('♻️  Reusing existing test database');
      // 既存のDBファイルがある場合は、データのみクリーンアップ
      try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
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
          console.log('ℹ️  sqlite_sequence table not found, skipping sequence reset');
        }
        
        await prisma.$disconnect();
        console.log('🧹 Cleaned existing test database data');
      } catch (cleanupError) {
        console.log('⚠️  Failed to cleanup existing DB, recreating...', cleanupError.message);
        // クリーンアップに失敗した場合は削除して再作成
        fs.unlinkSync(dbPath);
        await createNewDatabase();
      }
    } else {
      console.log('📊 Creating new test database...');
      await createNewDatabase();
    }
    
    console.log(`✅ Test database ready: ${testDbName}`);
  } catch (error) {
    console.error('❌ Failed to initialize test database:', error.message);
    throw error;
  }
  
  async function createNewDatabase() {
    // テストデータベースでマイグレーション実行
    execSync('npx prisma db push --force-reset', { 
      env: { ...process.env, DATABASE_URL: `file:./test.db` },
      stdio: 'pipe'
    });
    
    // Prismaクライアントを生成
    execSync('npx prisma generate', { stdio: 'pipe' });
  }
}; 