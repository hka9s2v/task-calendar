# 📝 Task Calendar App

Next.js 14とPrismaを使用したモダンなタスク管理（Todo）アプリケーションです。

## 🚀 機能

- ✅ タスクの作成・表示・編集・削除（CRUD操作）
- ✅ タスクの完了/未完了切り替え
- ✅ レスポンシブデザイン（Tailwind CSS）
- ✅ リアルタイムデータ更新
- ✅ ユーザー認証（NextAuth.js）
  - ローカル認証（メール・パスワード）
- ✅ 繰り返しタスクの管理
  - 毎日、毎週、毎月、隔週の繰り返し設定
  - 曜日指定（週次タスク）
  - 日付指定（月次タスク）
- ✅ カレンダー表示
- ✅ 完了履歴の管理
- ✅ 包括的なテストスイート（Jest）

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: SQLite（開発・テスト環境）/ PostgreSQL（本番環境・NeonDB）
- **ORM**: Prisma
- **認証**: NextAuth.js
- **スタイリング**: Tailwind CSS
- **UI**: React 18
- **パッケージマネージャー**: npm
- **テスト**: Jest + Testing Library
- **デプロイ**: Vercel + NeonDB

### APIエンドポイント

- **`app/api/todos/route.ts`**:
  - `GET /api/todos`: 認証済みユーザーのTodo取得
  - `POST /api/todos`: 新規Todo作成（繰り返し設定含む）
- **`app/api/todos/[id]/route.ts`**:
  - `PATCH /api/todos/[id]`: Todo更新
  - `DELETE /api/todos/[id]`: Todo削除
- **`app/api/auth/[...nextauth]/route.ts`**: NextAuth認証エンドポイント

## 🔧 環境要件

- Node.js 18.0以上
- npm 9.0以上

## 🚀 起動手順

### 1. リポジトリをクローン

### 2. 環境変数の設定

`.env`ファイルを作成：
```bash
# データベース
DATABASE_URL="file:./dev.db"
# NextAuth設定
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. 依存関係のインストール

```bash
npm install
```
このコマンドにより以下が自動実行されます：
- 必要なパッケージのインストール
- `prisma generate`（Prismaクライアント生成）

### 4. データベースのセットアップ

```bash
npx prisma db push
```
このコマンドにより：
- SQLiteデータベースファイル（`dev.db`）が作成されます
- 全テーブル（User、Todo、CompletionHistory等）が作成されます

### 5. 開発サーバーの起動

```bash
npm run dev
```
`http://localhost:3000`でアプリケーションが起動する

## 📜 利用可能なスクリプト

### 開発・ビルド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# リンタ実行
npm run lint
```

### テスト

```bash
# 全テスト実行
npm test
# カバレッジ付き
npm run test:coverage
```

### データベース管理

```bash
# 開発環境用
npx prisma generate              # Prismaクライアント再生成
npx prisma db push              # データベーススキーマ同期
npx prisma studio               # Prisma Studio（DB管理画面）起動

# 本番環境用（NeonDB）
npm run db:generate:neon        # 本番用Prismaクライアント生成
npm run db:deploy:neon          # 本番用データベースデプロイ
npm run db:studio:neon          # 本番用Prisma Studio起動
```

## 🧪 テスト
### テスト実行

```bash
# 全テスト実行（60テスト）
npm test

# 特定のテストファイル実行
npm test -- __tests__/api/todos/route.test.ts

# カバレッジレポート生成
npm run test:coverage
```

## 🔍 トラブルシューティング

### データベース接続エラー

```bash
# Prismaクライアント再生成
npx prisma generate

# データベース再作成
rm prisma/dev.db
npx prisma db push
```

### テスト失敗

```bash
# テストデータベースクリーンアップ
rm -f prisma/test*.db

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

## 🎯 デプロイ

- 基本的にmasterブランチPushをトリガーとして自動デプロイされます

### Vercel + NeonDBでのデプロイ初回設定

#### 1. NeonDBでデータベース作成
#### 2. GitHubにプッシュ
#### 3. Vercelでプロジェクトをインポート
#### 4. 必要な環境変数

```bash
# データベース
DATABASE_URL=postgresql://username:password@ep-xxx-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# NextAuth設定
NEXTAUTH_SECRET=your-production-secret-key
NEXTAUTH_URL=https://your-domain.vercel.app

# Prisma設定
PRISMA_SCHEMA_PATH=prisma/schema.production.prisma
```

#### 5. 本番データベースのセットアップ

```bash
# 本番用データベースのマイグレーション
npm run db:deploy:neon
```