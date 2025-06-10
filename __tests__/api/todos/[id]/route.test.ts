import { GET, PATCH, DELETE } from '../../../../app/api/todos/[id]/route';
import { createTestUser, createTestTodo, createTestCompletionHistory, createMockRequest, createMockSession } from '../../../helpers/test-utils';
import { getServerSession } from 'next-auth/next';
import { prisma } from '../../../../lib/prisma';

// getServerSessionをモック
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/todos/[id]', () => {
  let testUser: any;
  let testTodo: any;
  
  beforeEach(async () => {
    const { user } = await createTestUser();
    testUser = user;
    testTodo = await createTestTodo(testUser.id, { title: 'Test Todo' });
  });

  describe('GET /api/todos/[id]', () => {
    it('認証されていない場合は401を返す', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('GET');

      const response = await GET(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('ログインが必要です');
    });

    it('存在するTODOを正しく取得できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET');

      const response = await GET(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(200);
      const todo = await response.json();
      
      expect(todo.id).toBe(testTodo.id);
      expect(todo.title).toBe('Test Todo');
      expect(todo.userId).toBe(testUser.id);
    });

    it('他のユーザーのTODOは取得できない', async () => {
      // 他のユーザーとTODOを作成
      const { user: otherUser } = await createTestUser({ email: 'other@example.com' });
      const otherTodo = await createTestTodo(otherUser.id, { title: 'Other User Todo' });

      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET');

      const response = await GET(request, { params: { id: otherTodo.id } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Todo not found');
    });

    it('存在しないTODOは404を返す', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('GET');

      const response = await GET(request, { params: { id: 'non-existent-id' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Todo not found');
    });
  });

  describe('PATCH /api/todos/[id]', () => {
    it('認証されていない場合は401を返す', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('PATCH', 'http://localhost:3000', {
        title: 'Updated Title'
      });

      const response = await PATCH(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('ログインが必要です');
    });

    it('TODOのタイトルを更新できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('PATCH', 'http://localhost:3000', {
        title: 'Updated Title'
      });

      const response = await PATCH(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(200);
      const todo = await response.json();
      
      expect(todo.title).toBe('Updated Title');
      expect(todo.id).toBe(testTodo.id);
    });

    it('TODOを完了状態に更新し、完了履歴を作成する', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('PATCH', 'http://localhost:3000', {
        completed: true
      });

      const response = await PATCH(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(200);
      const todo = await response.json();
      
      expect(todo.lastCompleted).toBeDefined();
      
      // 完了履歴が作成されているかチェック
      const completionHistory = await prisma.completionHistory.findFirst({
        where: {
          todoId: testTodo.id,
          userId: testUser.id
        }
      });
      
      expect(completionHistory).toBeDefined();
      expect(completionHistory?.todoId).toBe(testTodo.id);
    });

    it('繰り返しTODOを完了すると完了状態がリセットされる', async () => {
      // 繰り返しTODOを作成
      const recurringTodo = await createTestTodo(testUser.id, {
        title: 'Recurring Todo',
        isRecurring: true,
        repeatType: 'daily'
      });

      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('PATCH', 'http://localhost:3000', {
        completed: true
      });

      const response = await PATCH(request, { params: { id: recurringTodo.id } });
      
      expect(response.status).toBe(200);
      const todo = await response.json();
      
      // 繰り返しタスクは完了後にcompletedがfalseにリセットされる
      expect(todo.completed).toBe(false);
      expect(todo.lastCompleted).toBeDefined();
    });

    it('他のユーザーのTODOは更新できない', async () => {
      const { user: otherUser } = await createTestUser({ email: 'other@example.com' });
      const otherTodo = await createTestTodo(otherUser.id, { title: 'Other User Todo' });

      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('PATCH', 'http://localhost:3000', {
        title: 'Hacked Title'
      });

      const response = await PATCH(request, { params: { id: otherTodo.id } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Todo not found');
    });

    it('存在しないTODOは404を返す', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('PATCH', 'http://localhost:3000', {
        title: 'New Title'
      });

      const response = await PATCH(request, { params: { id: 'non-existent-id' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Todo not found');
    });
  });

  describe('DELETE /api/todos/[id]', () => {
    it('認証されていない場合は401を返す', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createMockRequest('DELETE');

      const response = await DELETE(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('ログインが必要です');
    });

    it('TODOを正常に削除できる', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('DELETE');

      const response = await DELETE(request, { params: { id: testTodo.id } });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBe('Todo deleted successfully');

      // TODOが実際に削除されたことを確認
      const deletedTodo = await prisma.todo.findUnique({
        where: { id: testTodo.id }
      });
      expect(deletedTodo).toBeNull();
    });

    it('他のユーザーのTODOは削除できない', async () => {
      const { user: otherUser } = await createTestUser({ email: 'other@example.com' });
      const otherTodo = await createTestTodo(otherUser.id, { title: 'Other User Todo' });

      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('DELETE');

      const response = await DELETE(request, { params: { id: otherTodo.id } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Todo not found');

      // 他のユーザーのTODOが削除されていないことを確認
      const stillExists = await prisma.todo.findUnique({
        where: { id: otherTodo.id }
      });
      expect(stillExists).toBeDefined();
    });

    it('存在しないTODOは404を返す', async () => {
      mockGetServerSession.mockResolvedValue(createMockSession(testUser.id));

      const request = createMockRequest('DELETE');

      const response = await DELETE(request, { params: { id: 'non-existent-id' } });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Todo not found');
    });
  });
}); 