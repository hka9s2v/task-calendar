import { NextRequest } from 'next/server';
import { GET } from '../../../app/api/calendar/route';
import { getServerSession } from 'next-auth/next';
import { createTestUser, createTestTodo, createTestCompletionHistory, createMockRequest, createMockSession } from '../../helpers/test-utils';

// getServerSessionをモック
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/calendar', () => {
  describe('GET /api/calendar', () => {
    it('認証されていない場合は401を返す', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('ログインが必要です');
    });

    it('有効な年月でカレンダーデータを取得できる', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      // テストTODOを作成
      const todo1 = await createTestTodo(testUser.id, { 
        title: 'Daily Task',
        isRecurring: true,
        repeatType: 'daily'
      });
      
      const todo2 = await createTestTodo(testUser.id, { 
        title: 'One-time Task',
        isRecurring: false
      });

      // 完了履歴を作成
      await createTestCompletionHistory(todo1.id, testUser.id, new Date(2024, 0, 15)); // 2024年1月15日
      await createTestCompletionHistory(todo2.id, testUser.id, new Date(2024, 0, 20)); // 2024年1月20日

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.year).toBe(2024);
      expect(data.month).toBe(1);
      expect(data.todos).toHaveLength(2);
      
      // TODO1の検証
      const todo1Data = data.todos.find((t: any) => t.id === todo1.id);
      expect(todo1Data.title).toBe('Daily Task');
      expect(todo1Data.isRecurring).toBe(true);
      expect(todo1Data.repeatType).toBe('daily');
      expect(todo1Data.completions).toHaveLength(1);
      expect(todo1Data.completions[0].day).toBe(15);
      
      // TODO2の検証
      const todo2Data = data.todos.find((t: any) => t.id === todo2.id);
      expect(todo2Data.title).toBe('One-time Task');
      expect(todo2Data.isRecurring).toBe(false);
      expect(todo2Data.completions).toHaveLength(1);
      expect(todo2Data.completions[0].day).toBe(20);
    });

    it('年月パラメータなしの場合は現在の年月を使用する', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar');

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.year).toBe(currentYear);
      expect(data.month).toBe(currentMonth);
      expect(Array.isArray(data.todos)).toBe(true);
    });

    it('無効な月パラメータの場合は400エラーを返す', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=13');

      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid year or month parameter');
    });

    it('月が0以下の場合は400エラーを返す', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=0');

      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid year or month parameter');
    });

    it('年が数値でない場合は400エラーを返す', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=invalid&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid year or month parameter');
    });

    it('他のユーザーのデータは取得されない', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      
      // 他のユーザーとTODOを作成
      const { user: otherUser } = await createTestUser({ email: 'other@example.com' });
      const otherTodo = await createTestTodo(otherUser.id, { title: 'Other User Todo' });
      await createTestCompletionHistory(otherTodo.id, otherUser.id, new Date(2024, 0, 10));

      // テストユーザーのTODOも作成
      const userTodo = await createTestTodo(testUser.id, { title: 'User Todo' });
      await createTestCompletionHistory(userTodo.id, testUser.id, new Date(2024, 0, 15));

      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.todos).toHaveLength(1);
      expect(data.todos[0].title).toBe('User Todo');
      expect(data.todos[0].completions).toHaveLength(1);
    });

    it('指定した月の完了履歴のみが含まれる', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const todo = await createTestTodo(testUser.id, { title: 'Test Todo' });
      
      // 異なる月の完了履歴を作成
      await createTestCompletionHistory(todo.id, testUser.id, new Date(2024, 0, 15)); // 1月
      await createTestCompletionHistory(todo.id, testUser.id, new Date(2024, 1, 15)); // 2月
      await createTestCompletionHistory(todo.id, testUser.id, new Date(2024, 2, 15)); // 3月

      // 1月のデータを取得
      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.todos).toHaveLength(1);
      expect(data.todos[0].completions).toHaveLength(1);
      expect(data.todos[0].completions[0].day).toBe(15);
    });

    it('週次繰り返しTODOの情報が正しく含まれる', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const weeklyTodo = await createTestTodo(testUser.id, {
        title: 'Weekly Task',
        isRecurring: true,
        repeatType: 'weekly',
        weekDays: '1,3,5' // 月、水、金
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.todos).toHaveLength(1);
      const todoData = data.todos[0];
      expect(todoData.title).toBe('Weekly Task');
      expect(todoData.isRecurring).toBe(true);
      expect(todoData.repeatType).toBe('weekly');
      expect(todoData.weekDays).toBe('1,3,5');
    });

    it('月次繰り返しTODOの情報が正しく含まれる', async () => {
      // ユーザーを作成
      const { user: testUser } = await createTestUser();
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const monthlyTodo = await createTestTodo(testUser.id, {
        title: 'Monthly Task',
        isRecurring: true,
        repeatType: 'monthly',
        monthDay: 15
      });

      const request = createMockRequest('GET', 'http://localhost:3000/api/calendar?year=2024&month=1');

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.todos).toHaveLength(1);
      const todoData = data.todos[0];
      expect(todoData.title).toBe('Monthly Task');
      expect(todoData.isRecurring).toBe(true);
      expect(todoData.repeatType).toBe('monthly');
      expect(todoData.monthDay).toBe(15);
    });
  });
}); 