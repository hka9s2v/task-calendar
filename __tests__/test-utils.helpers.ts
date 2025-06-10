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
  const email = (userData?.email || `test${global.testUserCounter}@example.com`).toLowerCase();
  const name = userData?.name || 'Test User';
  const password = userData?.password || 'password123';
  
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });
  
  return { user, password };
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
}

// テスト用完了履歴作成ヘルパー
export async function createTestCompletionHistory(
  todoId: string,
  userId: string,
  date?: Date
) {
  const completedAt = date || new Date();
  
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