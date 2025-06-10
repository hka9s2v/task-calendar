# 📝 Task Calendar App

Next.js 14とPrismaを使用したモダンなタスク管理（Todo）アプリケーションです。

## 🚀 機能

- ✅ タスクの作成・表示・編集・削除（CRUD操作）
- ✅ タスクの完了/未完了切り替え
- ✅ インライン編集（ダブルクリックで編集モード）
- ✅ レスポンシブデザイン（Tailwind CSS）
- ✅ リアルタイムデータ更新
- ✅ TypeScript対応

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **データベース**: SQLite（開発環境）/ Prisma ORM
- **スタイリング**: Tailwind CSS
- **UI**: React 18
- **パッケージマネージャー**: npm

## 📁 プロジェクト構成

```
task-calender/
├── 🔧 設定ファイル
│   ├── package.json              # 依存関係とスクリプト定義
│   ├── tsconfig.json             # TypeScript設定
│   ├── tailwind.config.ts        # Tailwind CSS設定
│   ├── postcss.config.js         # PostCSS設定
│   └── next-env.d.ts             # Next.js型定義（自動生成）
│
├── 🗄️ データベース関連
│   ├── prisma/
│   │   ├── schema.prisma         # データベーススキーマ
│   │   └── dev.db               # SQLiteデータベースファイル
│   └── lib/
│       └── prisma.ts            # Prismaクライアント設定
│
├── 🎨 フロントエンド
│   └── app/
│       ├── layout.tsx           # アプリ全体レイアウト
│       ├── page.tsx             # ホームページ
│       ├── globals.css          # グローバルCSS
│       ├── types/
│       │   └── todo.ts          # Todo型定義
│       └── components/
│           ├── TodoList.tsx     # Todoリストメインコンポーネント
│           └── TodoItem.tsx     # 個別Todoアイテム
│
└── 🌐 API（バックエンド）
    └── app/api/todos/
        ├── route.ts             # Todo一覧・作成API
        └── [id]/
            └── route.ts         # 個別Todo操作API
```

## 📋 ファイル詳細説明

### 設定ファイル

- **`package.json`**: プロジェクトの依存関係、スクリプト、メタデータを定義
- **`tsconfig.json`**: TypeScriptコンパイラの設定（Next.js最適化済み）
- **`tailwind.config.ts`**: Tailwind CSSの設定とカスタマイズ
- **`postcss.config.js`**: PostCSSプロセッサー設定

### データベース関連

- **`prisma/schema.prisma`**: Todoモデルのスキーマ定義（SQLite使用）
- **`lib/prisma.ts`**: Prismaクライアントのシングルトンインスタンス
- **`prisma/dev.db`**: SQLiteデータベースファイル（実データ保存）

### フロントエンドコンポーネント

- **`app/layout.tsx`**: アプリケーション全体の共通レイアウト
- **`app/page.tsx`**: ホームページ（TodoListコンポーネントを表示）
- **`app/types/todo.ts`**: Todo型の定義
- **`app/components/TodoList.tsx`**: 
  - Todo一覧表示
  - 新規Todo追加フォーム
  - CRUD操作のAPI通信
  - ローディング・エラー状態管理
- **`app/components/TodoItem.tsx`**: 
  - 個別Todoアイテムのレンダリング
  - チェックボックス（完了切り替え）
  - インライン編集機能
  - 削除ボタン

### APIエンドポイント

- **`app/api/todos/route.ts`**:
  - `GET /api/todos`: 全Todo取得
  - `POST /api/todos`: 新規Todo作成
- **`app/api/todos/[id]/route.ts`**:
  - `PATCH /api/todos/[id]`: Todo更新
  - `DELETE /api/todos/[id]`: Todo削除

## 🔧 環境要件

- Node.js 18.0以上
- npm 9.0以上

## 🚀 起動手順

### 1. リポジトリをクローン

```bash
git clone <repository-url>
cd task-calender
```

### 2. 依存関係のインストール

```bash
npm install
```

このコマンドにより以下が自動実行されます：
- 必要なパッケージのインストール
- `prisma generate`（Prismaクライアント生成）

### 3. データベースのセットアップ

```bash
npx prisma db push
```

このコマンドにより：
- SQLiteデータベースファイル（`dev.db`）が作成されます
- Todoテーブルが作成されます

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. アプリケーションにアクセス

ブラウザで以下のURLにアクセス：
```
http://localhost:3000
```

## 📜 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# リンタ実行
npm run lint

# Prismaクライアント再生成
npx prisma generate

# データベーススキーマ同期
npx prisma db push

# Prisma Studio（DB管理画面）起動
npx prisma studio
```

## 🎯 使用方法

1. **新規タスク作成**: 上部の入力欄にタスク名を入力して「追加」ボタンをクリック
2. **タスク完了切り替え**: チェックボックスをクリック
3. **タスク編集**: タスク名をダブルクリックしてインライン編集
4. **タスク削除**: 「削除」ボタンをクリック

## 🔍 トラブルシューティング

### データベース接続エラー

```bash
# Prismaクライアント再生成
npx prisma generate

# データベース再作成
rm prisma/dev.db
npx prisma db push
```

### 依存関係の問題

```bash
# node_modulesとpackage-lock.jsonを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ポート3000が使用中の場合

```bash
# 他のポートで起動
npm run dev -- -p 3001
```

## 🔮 今後の拡張予定

- [ ] ユーザー認証機能
- [ ] カテゴリ分類機能
- [ ] 期限設定機能
- [ ] カレンダー表示機能
- [ ] データエクスポート機能

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

バグ報告や機能提案は、GitHubのIssuesページでお受けしています。

---

**開発者**: task-calendar-app team  
**バージョン**: 0.1.0 