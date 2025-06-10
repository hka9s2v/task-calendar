import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';

// グローバルカウンターを使用
declare global {
  var testUserCounter: number;
}

if (global.testUserCounter === undefined) {
  global.testUserCounter = 0;
}

// テスト用ユーザー作成ヘルパー
export async function createTestUser(userData?: {
  email?: string;
  name?: string;
  password?: string;
}) {
  global.testUserCounter++;
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 100000);
  const email = (userData?.email || `test${global.testUserCounter}_${timestamp}_${randomNum}@example.com`).toLowerCase();
  const name = userData?.name || 'Test User';
  const password = userData?.password || 'password123';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  try {
    // 既存のメールアドレスをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // ユニークなメールアドレスを再生成
      const uniqueEmail = `test${global.testUserCounter}_${Date.now()}_${Math.floor(Math.random() * 1000000)}@example.com`;
      const user = await prisma.user.create({
        data: {
          email: uniqueEmail,
          name,
          password: hashedPassword,
        },
      });
      return { user, password };
    }
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });
    
    return { user, password };
  } catch (error) {
    console.error('Failed to create test user:', error);
    // リトライ用にさらにユニークなメールアドレスで再試行
    try {
      const retryEmail = `retry${Date.now()}_${Math.floor(Math.random() * 1000000)}@example.com`;
      const user = await prisma.user.create({
        data: {
          email: retryEmail,
          name,
          password: hashedPassword,
        },
      });
      return { user, password };
    } catch (retryError) {
      console.error('Failed to create test user on retry:', retryError);
      throw retryError;
    }
  }
}

// テスト用TODO作成ヘルパー
export async function createTestTodo(userId: string, todoData?: {
  title?: string;
  isRecurring?: boolean;
  repeatType?: string;
  weekDays?: string;
  monthDay?: number;
  completed?: boolean;
}) {
  try {
    // ユーザーが存在するかチェックし、必要に応じて待機
    let userExists = null;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (!userExists && retryCount < maxRetries) {
      userExists = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!userExists) {
        retryCount++;
        if (retryCount < maxRetries) {
          // 少し長めに待機してリトライ
          await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
        }
      }
    }
    
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist after ${maxRetries} retries`);
    }

    // TODO作成を複数回試行
    let createAttempts = 0;
    const maxCreateAttempts = 3;
    
    while (createAttempts < maxCreateAttempts) {
      try {
        return await prisma.todo.create({
          data: {
            title: todoData?.title || 'Test Todo',
            userId,
            isRecurring: todoData?.isRecurring || false,
            repeatType: todoData?.repeatType || null,
            weekDays: todoData?.weekDays || null,
            monthDay: todoData?.monthDay || null,
            completed: todoData?.completed || false,
          },
        });
      } catch (createError: any) {
        createAttempts++;
        
        if (createError.code === 'P2003' && createAttempts < maxCreateAttempts) {
          // 外部キー制約エラーの場合、ユーザーの存在を再確認
          console.warn(`Foreign key constraint error on attempt ${createAttempts}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 100 * createAttempts));
          
          // ユーザーが再度存在するかチェック
          const recheckUser = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!recheckUser) {
            throw new Error(`User with ID ${userId} was deleted during TODO creation`);
          }
        } else {
          throw createError;
        }
      }
    }
    
    throw new Error(`Failed to create TODO after ${maxCreateAttempts} attempts`);
    
  } catch (error) {
    console.error('Failed to create test todo:', error);
    throw error;
  }
}

// テスト用完了履歴作成ヘルパー
export async function createTestCompletionHistory(
  todoId: string,
  userId: string,
  date?: Date
) {
  const completedAt = date || new Date();
  
  try {
    // TODOとユーザーが存在するかチェック
    const todo = await prisma.todo.findUnique({ where: { id: todoId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!todo) {
      throw new Error(`Todo with ID ${todoId} does not exist`);
    }
    if (!user) {
      throw new Error(`User with ID ${userId} does not exist`);
    }
    
    return await prisma.completionHistory.create({
      data: {
        todoId,
        userId,
        completedAt,
        year: completedAt.getFullYear(),
        month: completedAt.getMonth() + 1,
        day: completedAt.getDate(),
      },
    });
  } catch (error) {
    console.error('Failed to create test completion history:', error);
    throw error;
  }
}

// 認証セッションのモック作成ヘルパー
export function createMockSession(userId: string, email?: string) {
  return {
    user: {
      id: userId,
      email: email || 'test@example.com',
      name: 'Test User',
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
  };
}

// HTTPリクエストのモック作成ヘルパー
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000',
  body?: any
) {
  const mockRequest = {
    method,
    url,
    json: jest.fn().mockResolvedValue(body),
    headers: new Headers(),
    nextUrl: new URL(url),
  };
  
  // URLSearchParamsの追加
  const urlObj = new URL(url);
  Object.defineProperty(mockRequest, 'url', {
    value: url,
    writable: true,
  });
  
  return mockRequest as any;
}

// HTTPレスポンスの検証ヘルパー
export function expectSuccessResponse(response: any, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus);
}

export function expectErrorResponse(
  response: any,
  expectedStatus: number,
  errorMessage?: string
) {
  expect(response.status).toBe(expectedStatus);
  if (errorMessage) {
    expect(response.json).toHaveBeenCalled();
  }
}

// 日付ヘルパー
export function createDateString(year: number, month: number, day: number) {
  return new Date(year, month - 1, day).toISOString();
}

// データベースクリーンアップヘルパー（特定テスト用）
export async function cleanupTestData() {
  await prisma.$transaction([
    prisma.completionHistory.deleteMany(),
    prisma.todo.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);
} 