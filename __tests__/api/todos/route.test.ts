import { NextRequest } from 'next/server';
import { GET, POST } from '../../../app/api/todos/route';
import { createTestUser, createTestTodo, createMockRequest, createMockSession } from '../../helpers/test-utils';
import { getServerSession } from 'next-auth/next';

// getServerSessionをモック
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/todos', () => {
  let testUser: any;
  
  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
  });

  describe('GET /api/todos', () => {
    it('認証されていない場合は401を返す', async () => {
      // 認証セッションなし
      mockGetServerSession.mockResolvedValue(null);

      const response = await GET();
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('ログインが必要です');
    });

    it('認証されたユーザーのTODOリストを取得できる', async () => {
      // 認証セッションを設定
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      // テストデータ作成
      const todo1 = await createTestTodo(testUser.id, { title: 'Test Todo 1' });
      const todo2 = await createTestTodo(testUser.id, { title: 'Test Todo 2', isRecurring: true });
      
      // 他のユーザーのTODO（取得されないことを確認）
      const otherUser = await createTestUser({ email: 'other@example.com' });
      await createTestTodo(otherUser.user.id, { title: 'Other User Todo' });

      const response = await GET();
      
      expect(response.status).toBe(200);
      const todos = await response.json();
      
      expect(Array.isArray(todos)).toBe(true);
      expect(todos).toHaveLength(2);
      expect(todos.map((t: any) => t.title)).toContain('Test Todo 1');
      expect(todos.map((t: any) => t.title)).toContain('Test Todo 2');
      expect(todos.map((t: any) => t.title)).not.toContain('Other User Todo');
    });

    it('空のTODOリストを正しく返す', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const response = await GET();
      
      expect(response.status).toBe(200);
      const todos = await response.json();
      expect(todos).toEqual([]);
    });
  });

  describe('POST /api/todos', () => {
    it('認証されていない場合は401を返す', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', {
        title: 'New Todo'
      });

      const response = await POST(request);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('ログインが必要です');
    });

    it('正常なTODOを作成できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const todoData = {
        title: 'New Todo',
        repeatType: 'daily',
        isRecurring: true
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', todoData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const todo = await response.json();
      
      expect(todo.title).toBe('New Todo');
      expect(todo.userId).toBe(testUser.id);
      expect(todo.isRecurring).toBe(true);
      expect(todo.repeatType).toBe('daily');
      expect(todo.id).toBeDefined();
    });

    it('週次繰り返しTODOを正しく作成できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const todoData = {
        title: 'Weekly Todo',
        repeatType: 'weekly',
        weekDays: '1,3,5'  // 月、水、金
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', todoData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const todo = await response.json();
      
      expect(todo.title).toBe('Weekly Todo');
      expect(todo.repeatType).toBe('weekly');
      expect(todo.weekDays).toBe('1,3,5');
      expect(todo.isRecurring).toBe(true);
    });

    it('月次繰り返しTODOを正しく作成できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const todoData = {
        title: 'Monthly Todo',
        repeatType: 'monthly',
        monthDay: 15
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', todoData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const todo = await response.json();
      
      expect(todo.title).toBe('Monthly Todo');
      expect(todo.repeatType).toBe('monthly');
      expect(todo.monthDay).toBe(15);
      expect(todo.isRecurring).toBe(true);
    });

    it('タイトルが空の場合は400エラーを返す', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const todoData = {
        title: '',
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', todoData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Title is required');
    });

    it('タイトルが空白のみの場合は400エラーを返す', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const todoData = {
        title: '   ',
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', todoData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Title is required');
    });

    it('期日付きTODOを作成できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const dueDate = new Date('2024-12-31');
      const todoData = {
        title: 'Due Date Todo',
        dueDate: dueDate.toISOString()
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/todos', todoData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const todo = await response.json();
      
      expect(todo.title).toBe('Due Date Todo');
      expect(new Date(todo.dueDate)).toEqual(dueDate);
      expect(todo.isRecurring).toBe(false);
    });
  });
}); 