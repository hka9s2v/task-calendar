import { POST } from '../../../app/api/auth/register/route';
import { createMockRequest, createTestUser } from '../../helpers/test-utils';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

describe('/api/auth/register', () => {
  describe('POST /api/auth/register', () => {
    it('正常なユーザー登録を実行できる', async () => {
      const userData = {
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data.message).toBe('アカウントが正常に作成されました');
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.email).toBe(userData.email);
      expect(data.user.name).toBe(userData.name);
      expect(data.user.password).toBeUndefined(); // パスワードは返さない

      // データベースにユーザーが作成されているか確認
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe(userData.email);
      expect(createdUser?.name).toBe(userData.name);
      
      // パスワードがハッシュ化されているか確認
      const passwordMatch = await bcrypt.compare(userData.password, createdUser!.password);
      expect(passwordMatch).toBe(true);
    });

    it('必須フィールドが不足している場合は400エラーを返す', async () => {
      const userData = {
        name: 'Test User',
        // email が不足
        password: 'password123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('名前、メールアドレス、パスワードは必須です');
    });

    it('名前が不足している場合は400エラーを返す', async () => {
      const userData = {
        // name が不足
        email: 'newuser@example.com',
        password: 'password123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('名前、メールアドレス、パスワードは必須です');
    });

    it('パスワードが不足している場合は400エラーを返す', async () => {
      const userData = {
        name: 'Test User',
        email: 'newuser@example.com',
        // password が不足
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('名前、メールアドレス、パスワードは必須です');
    });

    it('空の値の場合は400エラーを返す', async () => {
      const userData = {
        name: '',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('名前、メールアドレス、パスワードは必須です');
    });

    it('空白のみのフィールドの場合は400エラーを返す', async () => {
      const userData = {
        name: '   ',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('名前、メールアドレス、パスワードは必須です');
    });

    it('既存のメールアドレスの場合は400エラーを返す', async () => {
      // 既存ユーザーを作成
      await createTestUser({ 
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'password123'
      });

      const userData = {
        name: 'New User',
        email: 'existing@example.com', // 重複するメール
        password: 'newpassword123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('このメールアドレスは既に使用されています');
    });

    it('異なるケースのメールアドレスでも重複として扱う', async () => {
      // 小文字のメールで既存ユーザーを作成
      await createTestUser({ 
        email: 'test@example.com',
        name: 'Existing User',
        password: 'password123'
      });

      const userData = {
        name: 'New User',
        email: 'TEST@EXAMPLE.COM', // 大文字だが同じメール
        password: 'newpassword123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('このメールアドレスは既に使用されています');
    });

    it('パスワードが適切な強度でハッシュ化される', async () => {
      const userData = {
        name: 'Test User',
        email: 'secure@example.com',
        password: 'mySecurePassword123!'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);

      // データベースからユーザーを取得
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user).toBeDefined();
      
      // ハッシュ化されたパスワードが元のパスワードと一致することを確認
      const isValidPassword = await bcrypt.compare(userData.password, user!.password);
      expect(isValidPassword).toBe(true);
      
      // ハッシュ化されたパスワードが元のパスワードと異なることを確認
      expect(user!.password).not.toBe(userData.password);
      
      // ハッシュの強度を確認（bcryptのパスワードは$2b$12$で始まる）
      expect(user!.password).toMatch(/^\$2b\$12\$/);
    });

    it('無効なJSONの場合は適切にエラーハンドリングする', async () => {
      const request = {
        method: 'POST',
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: new Headers(),
      };

      const response = await POST(request as any);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('アカウント作成に失敗しました');
    });

    it('非常に長い名前でも適切に処理する', async () => {
      const userData = {
        name: 'A'.repeat(100), // 100文字の名前
        email: 'longname@example.com',
        password: 'password123'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.user.name).toBe(userData.name);
    });

    it('特殊文字を含むパスワードでも正常に処理する', async () => {
      const userData = {
        name: 'Test User',
        email: 'special@example.com',
        password: 'P@ssw0rd!#$%^&*()'
      };

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', userData);

      const response = await POST(request);
      
      expect(response.status).toBe(201);
      
      // パスワードが正しくハッシュ化され検証できることを確認
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      const isValidPassword = await bcrypt.compare(userData.password, user!.password);
      expect(isValidPassword).toBe(true);
    });
  });
}); 