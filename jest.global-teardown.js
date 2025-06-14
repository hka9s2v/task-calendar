module.exports = async () => {
  console.log('🧹 Cleaning up test database globally...');
  
  try {
    // Prisma接続を切断
    const { prisma } = require('./lib/prisma');
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  } catch (error) {
    // 接続が既に切断されている場合は無視
    console.log('ℹ️  Database connection already closed');
  }
  
  console.log('✅ Global cleanup completed');
}; 