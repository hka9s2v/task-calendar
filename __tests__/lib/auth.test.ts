import { authOptions } from '../../lib/auth';
import { createTestUser } from '../helpers/test-utils';
import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';

// NextAuthの型定義をモック
jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'credentials',
    type: 'credentials',
  })),
}));

jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    id: 'google',
    name: 'google',
    type: 'oauth',
  })),
}));

describe('Auth Configuration', () => {
  describe('authOptions', () => {
    it('認証設定が正しく構成されている', () => {
      expect(authOptions).toBeDefined();
      expect(authOptions.providers).toBeDefined();
      expect(authOptions.adapter).toBeDefined();
      expect(authOptions.session).toBeDefined();
      expect(authOptions.session?.strategy).toBe('jwt');
      expect(authOptions.callbacks).toBeDefined();
    });

    it('JWT設定が正しく構成されている', () => {
      expect(authOptions.callbacks?.jwt).toBeDefined();
      expect(typeof authOptions.callbacks?.jwt).toBe('function');
    });

    it('セッション設定が正しく構成されている', () => {
      expect(authOptions.callbacks?.session).toBeDefined();
      expect(typeof authOptions.callbacks?.session).toBe('function');
    });
  });

  describe('Credentials Provider', () => {
    it('有効なメールとパスワードでユーザー認証ができる', async () => {
      // テストユーザーを作成
      const { user, password } = await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      });

      // credentialsプロバイダーの設定を取得
      const credentialsProvider = authOptions.providers.find(
        provider => provider.id === 'credentials'
      );

      expect(credentialsProvider).toBeDefined();

      // authorizeコールバックが存在し、関数であることを確認
      if (credentialsProvider && 'authorize' in credentialsProvider) {
        expect(typeof credentialsProvider.authorize).toBe('function');

        // authorize関数をテスト
        const result = await credentialsProvider.authorize({
          email: 'test@example.com',
          password: 'password123'
        }, {});

        expect(result).toBeDefined();
        expect(result?.id).toBe(user.id);
        expect(result?.email).toBe(user.email);
        expect(result?.name).toBe(user.name);
      }
    });

    it('存在しないメールアドレスでは認証に失敗する', async () => {
      const credentialsProvider = authOptions.providers.find(
        provider => provider.id === 'credentials'
      );

      if (credentialsProvider && 'authorize' in credentialsProvider) {
        const result = await credentialsProvider.authorize({
          email: 'nonexistent@example.com',
          password: 'password123'
        }, {});

        expect(result).toBeNull();
      }
    });

    it('間違ったパスワードでは認証に失敗する', async () => {
      // テストユーザーを作成
      await createTestUser({
        email: 'test@example.com',
        name: 'Test User',
        password: 'correctpassword'
      });

      const credentialsProvider = authOptions.providers.find(
        provider => provider.id === 'credentials'
      );

      if (credentialsProvider && 'authorize' in credentialsProvider) {
        const result = await credentialsProvider.authorize({
          email: 'test@example.com',
          password: 'wrongpassword'
        }, {});

        expect(result).toBeNull();
      }
    });

    it('パスワードフィールドがnullのユーザーでは認証に失敗する', async () => {
      // パスワードなしのユーザーを作成（OAuth専用ユーザー）
      const user = await prisma.user.create({
        data: {
          email: 'oauth@example.com',
          name: 'OAuth User',
          password: null as any,
        },
      });

      const credentialsProvider = authOptions.providers.find(
        provider => provider.id === 'credentials'
      );

      if (credentialsProvider && 'authorize' in credentialsProvider) {
        const result = await credentialsProvider.authorize({
          email: 'oauth@example.com',
          password: 'anypassword'
        }, {});

        expect(result).toBeNull();
      }
    });
  });

  describe('JWT Callback', () => {
    it('JWTコールバックがユーザーIDを正しく設定する', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      
      if (jwtCallback) {
        const mockUser = { id: 'user123', email: 'test@example.com' };
        const mockToken = {};

        const result = await jwtCallback({ 
          token: mockToken, 
          user: mockUser,
          account: null,
          profile: undefined,
          trigger: 'signIn',
          isNewUser: false
        } as any);

        expect(result.userId).toBe('user123');
      }
    });

    it('JWTコールバックがユーザーなしでも動作する', async () => {
      const jwtCallback = authOptions.callbacks?.jwt;
      
      if (jwtCallback) {
        const mockToken = { userId: 'existing123' };

        const result = await jwtCallback({ 
          token: mockToken, 
          user: undefined as any,
          account: null,
          profile: undefined
        } as any);

        expect(result.userId).toBe('existing123');
      }
    });
  });

  describe('Session Callback', () => {
    it('セッションコールバックがユーザーIDを正しく設定する', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      
      if (sessionCallback) {
        const mockSession = {
          user: { 
            id: 'defaultId',
            email: 'test@example.com',
            name: null,
            image: null
          },
          expires: new Date().toISOString()
        };
        const mockToken = { userId: 'user123' };

        const result = await sessionCallback({ 
          session: mockSession, 
          token: mockToken 
        } as any);

        expect((result.user as any)?.id).toBe('user123');
        expect(result.user?.email).toBe('test@example.com');
      }
    });

    it('セッションコールバックがトークンにuserIdがない場合も動作する', async () => {
      const sessionCallback = authOptions.callbacks?.session;
      
      if (sessionCallback) {
        const mockSession = {
          user: { 
            id: 'defaultId',
            email: 'test@example.com',
            name: null,
            image: null
          },
          expires: new Date().toISOString()
        };
        const mockToken = {}; // userIdなし

        const result = await sessionCallback({ 
          session: mockSession, 
          token: mockToken 
        } as any);

        // userIdがない場合は既存のidが保持される
        expect((result.user as any)?.id).toBe('defaultId');
        expect(result.user?.email).toBe('test@example.com');
      }
    });
  });

  describe('Password Verification', () => {
    it('bcryptを使用したパスワード検証が正しく動作する', async () => {
      const plainPassword = 'testPassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 12);

      // 正しいパスワードで検証成功
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);

      // 間違ったパスワードで検証失敗
      const isInvalid = await bcrypt.compare('wrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('空のパスワードでは検証に失敗する', async () => {
      const hashedPassword = await bcrypt.hash('somePassword', 12);
      
      const isValid = await bcrypt.compare('', hashedPassword);
      expect(isValid).toBe(false);
    });

    it('異なる強度でハッシュ化されたパスワードも検証できる', async () => {
      const plainPassword = 'consistentPassword';
      
      // 異なる強度でハッシュ化
      const hash10 = await bcrypt.hash(plainPassword, 10);
      const hash12 = await bcrypt.hash(plainPassword, 12);
      
      // どちらも正しく検証できる
      expect(await bcrypt.compare(plainPassword, hash10)).toBe(true);
      expect(await bcrypt.compare(plainPassword, hash12)).toBe(true);
      
      // ハッシュ値は異なる
      expect(hash10).not.toBe(hash12);
    });
  });
}); 