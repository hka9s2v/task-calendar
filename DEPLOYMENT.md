# 📚 Vercel + NeonDB 完全デプロイガイド

## 🎯 概要

このガイドでは、Task Calendar AppをVercel（フロントエンド・API）とNeonDB（データベース）を使用して無料でデプロイする手順を詳しく説明します。

## 📋 前提条件

- ✅ GitHubアカウント
- ✅ Vercelアカウント（無料）
- ✅ NeonDBアカウント（無料）
- ✅ ローカル開発環境（Node.js 18+）

---

## 🗄️ Phase 1: NeonDBデータベースのセットアップ

### 1.1 NeonDBアカウント作成

1. **NeonDBサイトにアクセス**
   - [https://neon.tech/](https://neon.tech/) にアクセス
   - 「Sign up」をクリック

2. **アカウント登録**
   - GitHubアカウントでサインアップ（推奨）
   - または、メールアドレスで登録

3. **プロジェクト作成**
   ```
   Project name: task-calendar-app
   Region: US East (Ohio) - us-east-2 （推奨：レスポンス速度）
   PostgreSQL version: 15 （最新安定版）
   ```

### 1.2 データベース接続情報の取得

1. **ダッシュボードで接続情報を確認**
   - プロジェクト作成後、自動的にダッシュボードに移動
   - 「Connection Details」セクションを確認

2. **接続文字列をコピー**
   ```bash
   # 例：
   postgresql://username:password@ep-abc123-def456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. **接続情報の詳細**
   ```
   Host: ep-abc123-def456.us-east-2.aws.neon.tech
   Database: neondb
   Username: username
   Password: [自動生成されたパスワード]
   Port: 5432
   SSL Mode: require
   ```

### 1.3 NeonDB無料プランの制限確認

```
✅ ストレージ: 512MB
✅ コンピュート時間: 月間100時間
✅ プロジェクト数: 1つ
✅ データベース数: 無制限
✅ 同時接続数: 100
✅ 自動バックアップ: 7日間保持
```

---

## 🐙 Phase 2: GitHubリポジトリの準備

### 2.0 リポジトリの公開設定（重要）

**Vercel無料プランの制限：**
- ✅ **Publicリポジトリ**: 完全無料でデプロイ可能
- ❌ **Privateリポジトリ**: Vercel Pro プラン（月額$20）が必要

#### Publicリポジトリに変更する方法

1. **GitHubリポジトリページにアクセス**
   - ブラウザでGitHubリポジトリを開く
   - 「Settings」タブをクリック

2. **リポジトリ設定の変更**
   ```
   Settings → General → Danger Zone → Change repository visibility
   → Make public → 確認メッセージに "task-calender" を入力
   → I understand, change repository visibility
   ```

3. **セキュリティ確認事項**
   ```
   ✅ .env ファイルが .gitignore に含まれている
   ✅ APIキーや機密情報がコードに含まれていない
   ✅ データベース接続文字列がハードコードされていない
   ✅ 環境変数はVercelで別途設定予定
   ```

**注意：** ソースコードは公開されますが、環境変数（データベース接続情報、APIキー等）はVercelで安全に管理されるため、セキュリティ上の問題はありません。

### 2.1 ローカルでの最終確認

```bash
# 1. 現在のディレクトリを確認
pwd
# /Users/ttk/task-calender

# 2. 変更内容を確認
git status

# 3. 必要なファイルが存在することを確認
ls -la prisma/schema.production.prisma
ls -la vercel.json
ls -la DEPLOYMENT.md
```

### 2.2 GitHubへのプッシュ

```bash
# 1. 全ての変更をステージング
git add .

# 2. コミット作成
git commit -m "feat: NeonDB対応デプロイ設定完了

- NeonDB用Prismaスキーマ追加
- Vercel設定をNeonDB対応に更新
- デプロイ手順書を詳細化
- 環境変数テンプレート更新"

# 3. GitHubにプッシュ
git push origin main
```

### 2.3 GitHubリポジトリの確認

1. **GitHubでリポジトリを確認**
   - ブラウザでGitHubリポジトリにアクセス
   - 最新のコミットが反映されていることを確認

2. **重要ファイルの存在確認**
   ```
   ✅ prisma/schema.production.prisma
   ✅ vercel.json
   ✅ DEPLOYMENT.md
   ✅ env.example
   ✅ package.json (NeonDB用スクリプト含む)
   ```

---

## 🚀 Phase 3: Vercelでのデプロイ設定

### 3.1 Vercelアカウント作成・ログイン

1. **Vercelサイトにアクセス**
   - [https://vercel.com/](https://vercel.com/) にアクセス
   - 「Sign up」をクリック

2. **GitHubアカウントで連携**
   - 「Continue with GitHub」を選択
   - GitHubでの認証を完了

### 3.2 プロジェクトのインポート

1. **新規プロジェクト作成**
   - Vercelダッシュボードで「New Project」をクリック
   - 「Import Git Repository」を選択

2. **リポジトリの選択**
   - `task-calender`リポジトリを検索
   - 「Import」をクリック

3. **プロジェクト設定**
   ```
   Project Name: task-calendar-app
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install && npx prisma generate --schema=prisma/schema.production.prisma
   Node.js Version: 18.x
   ```

### 3.3 環境変数の設定

1. **環境変数セクションに移動**
   - プロジェクト設定画面で「Environment Variables」を選択

2. **必須環境変数の追加**

   **DATABASE_URL**
   ```
   Name: DATABASE_URL
   Value: postgresql://username:password@ep-abc123-def456.us-east-2.aws.neon.tech/neondb?sslmode=require
   Environment: Production, Preview, Development
   ```

   **NEXTAUTH_SECRET**
   ```bash
   # ターミナルで32文字のランダム文字列を生成
   openssl rand -base64 32
   # 例: abc123def456ghi789jkl012mno345pqr678
   ```
   ```
   Name: NEXTAUTH_SECRET
   Value: [生成された32文字の文字列]
   Environment: Production, Preview, Development
   ```

   **NEXTAUTH_URL**
   ```
   Name: NEXTAUTH_URL
   Value: https://task-calendar-app.vercel.app (デプロイ後に更新)
   Environment: Production
   ```

   **PRISMA_SCHEMA_PATH**
   ```
   Name: PRISMA_SCHEMA_PATH
   Value: prisma/schema.production.prisma
   Environment: Production, Preview
   ```

3. **オプション環境変数（Google OAuth使用時）**

   **GOOGLE_CLIENT_ID**
   ```
   Name: GOOGLE_CLIENT_ID
   Value: [Google Cloud ConsoleのClient ID]
   Environment: Production, Preview, Development
   ```

   **GOOGLE_CLIENT_SECRET**
   ```
   Name: GOOGLE_CLIENT_SECRET
   Value: [Google Cloud ConsoleのClient Secret]
   Environment: Production, Preview, Development
   ```

### 3.4 デプロイの実行

1. **「Deploy」ボタンをクリック**
   - 環境変数設定完了後、「Deploy」をクリック

2. **ビルドプロセスの監視**
   ```
   ✅ Installing dependencies...
   ✅ Generating Prisma client...
   ✅ Building Next.js application...
   ✅ Optimizing production build...
   ✅ Deployment successful!
   ```

3. **デプロイURL の確認**
   - 例: `https://task-calendar-app-abc123.vercel.app`

---

## 🗄️ Phase 4: データベースの初期化

### 4.1 ローカルでのデータベースセットアップ

```bash
# 1. NeonDBの接続文字列を環境変数に設定
export DATABASE_URL="postgresql://username:password@ep-abc123-def456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# 2. 本番用Prismaクライアントを生成
npm run db:generate:neon

# 3. データベーススキーマを本番DBに適用
npm run db:deploy:neon

# 4. 接続テスト
npm run db:studio:neon
```

### 4.2 データベース初期化の確認

1. **Prisma Studioでの確認**
   - `npm run db:studio:neon`実行後、ブラウザが開く
   - テーブル構造が正しく作成されていることを確認

2. **NeonDBダッシュボードでの確認**
   - NeonDBのWebコンソールにアクセス
   - 「Tables」タブでテーブル一覧を確認
   ```
   ✅ User
   ✅ Account
   ✅ Session
   ✅ VerificationToken
   ✅ Todo
   ✅ CompletionHistory
   ```

---

## ✅ Phase 5: デプロイの確認とテスト

### 5.1 基本機能のテスト

1. **アプリケーションにアクセス**
   - デプロイされたURLにアクセス
   - 例: `https://task-calendar-app-abc123.vercel.app`

2. **ユーザー登録・ログインテスト**
   ```
   ✅ ユーザー登録フォームの表示
   ✅ 新規ユーザー登録の実行
   ✅ ログイン機能の確認
   ✅ セッション管理の確認
   ```

3. **タスク管理機能のテスト**
   ```
   ✅ タスクの作成
   ✅ タスクの表示
   ✅ タスクの編集
   ✅ タスクの削除
   ✅ タスクの完了切り替え
   ```

### 5.2 パフォーマンスの確認

1. **Vercelダッシュボードでの監視**
   - Functions実行時間
   - レスポンス時間
   - エラー率

2. **NeonDBダッシュボードでの監視**
   - データベース接続数
   - クエリ実行時間
   - ストレージ使用量

---

## 🔄 Phase 6: 継続的デプロイの設定

### 6.1 自動デプロイの確認

```bash
# 1. 軽微な変更を加える
echo "# デプロイテスト" >> README.md

# 2. コミット・プッシュ
git add README.md
git commit -m "test: デプロイテスト"
git push origin main

# 3. Vercelで自動デプロイが開始されることを確認
```

### 6.2 プレビューデプロイの設定

1. **ブランチ作成**
   ```bash
   git checkout -b feature/new-feature
   # 何らかの変更を加える
   git add .
   git commit -m "feat: 新機能追加"
   git push origin feature/new-feature
   ```

2. **プルリクエスト作成**
   - GitHubでプルリクエストを作成
   - Vercelが自動的にプレビューデプロイを作成

---

## 🛠️ トラブルシューティング

### ビルドエラーの対処

**エラー: Prisma Client generation failed**
```bash
# 解決方法
npm run db:generate:neon
```

**エラー: Database connection failed**
```bash
# 1. 接続文字列の確認
echo $DATABASE_URL

# 2. NeonDBプロジェクトの状態確認
# NeonDBダッシュボードでプロジェクトが起動していることを確認

# 3. SSL設定の確認
# 接続文字列に ?sslmode=require が含まれていることを確認
```

### データベース接続エラーの対処

**エラー: Connection timeout**
```bash
# 1. NeonDBの無料プラン制限を確認
# - コンピュート時間: 月間100時間以内
# - 同時接続数: 100以内

# 2. 接続プーリング設定の確認
# lib/prisma.ts の設定を確認
```

**エラー: SSL connection required**
```bash
# 接続文字列にSSL設定を追加
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### 認証エラーの対処

**エラー: NEXTAUTH_SECRET not found**
```bash
# 1. 環境変数の確認
# Vercelダッシュボードで NEXTAUTH_SECRET が設定されていることを確認

# 2. 新しいシークレットの生成
openssl rand -base64 32
```

**エラー: NEXTAUTH_URL mismatch**
```bash
# 1. 正しいデプロイURLを確認
# 2. Vercelの環境変数を更新
NEXTAUTH_URL=https://your-actual-domain.vercel.app
```

---

## 📊 監視とメンテナンス

### 日常的な監視項目

1. **Vercelダッシュボード**
   ```
   ✅ 関数実行回数（月間1000回以内）
   ✅ 帯域幅使用量（月間100GB以内）
   ✅ ビルド時間
   ✅ エラー率
   ```

2. **NeonDBダッシュボード**
   ```
   ✅ ストレージ使用量（512MB以内）
   ✅ コンピュート時間（月間100時間以内）
   ✅ 接続数
   ✅ クエリパフォーマンス
   ```

### 定期メンテナンス

**月次チェック**
```bash
# 1. 依存関係の更新確認
npm outdated

# 2. セキュリティ監査
npm audit

# 3. データベース使用量確認
# NeonDBダッシュボードで確認

# 4. バックアップ状況確認
# NeonDBの自動バックアップ設定を確認
```

---

## 🔒 セキュリティ設定

### 環境変数の管理

1. **本番環境の分離**
   ```
   ✅ 本番用の強力なパスワード使用
   ✅ 開発環境と本番環境の完全分離
   ✅ 環境変数の定期的な更新
   ```

2. **アクセス制御**
   ```
   ✅ NeonDBのIP制限設定（必要に応じて）
   ✅ Vercelプロジェクトのアクセス権限管理
   ✅ GitHubリポジトリの適切な権限設定
   ```

### データベースセキュリティ

1. **接続セキュリティ**
   ```
   ✅ SSL接続の強制
   ✅ 強力なパスワードの使用
   ✅ 接続文字列の適切な管理
   ```

2. **データ保護**
   ```
   ✅ 個人情報の適切な暗号化
   ✅ パスワードのハッシュ化
   ✅ セッション管理の適切な実装
   ```

---

## 💰 コスト管理

### 無料プランの制限監視

**Vercel無料プラン**
```
月間制限:
- 帯域幅: 100GB
- 関数実行: 1000回
- ビルド時間: 6000分
- チームメンバー: 1人
```

**NeonDB無料プラン**
```
月間制限:
- ストレージ: 512MB
- コンピュート時間: 100時間
- プロジェクト: 1つ
- データベース: 無制限
```

### 使用量最適化のヒント

1. **Vercel最適化**
   ```
   ✅ 画像最適化の活用
   ✅ 静的生成の活用
   ✅ エッジキャッシュの活用
   ✅ 不要なAPI呼び出しの削減
   ```

2. **NeonDB最適化**
   ```
   ✅ 効率的なクエリの作成
   ✅ 不要なデータの定期削除
   ✅ インデックスの適切な設定
   ✅ 接続プーリングの活用
   ```

---

## 🔄 バックアップとリストア

### 自動バックアップ

**NeonDBの自動バックアップ**
```
✅ 7日間の自動バックアップ
✅ ポイントインタイムリカバリ
✅ ワンクリックリストア
```

### 手動バックアップ

```bash
# 1. データベースダンプの作成
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. バックアップファイルの確認
ls -la backup_*.sql

# 3. リストア（必要時）
psql $DATABASE_URL < backup_20240101_120000.sql
```

---

## 🎉 デプロイ完了チェックリスト

### 最終確認項目

```
✅ NeonDBプロジェクトが正常に動作している
✅ Vercelデプロイが成功している
✅ 環境変数が正しく設定されている
✅ データベーススキーマが正しく作成されている
✅ ユーザー登録・ログインが動作している
✅ タスク管理機能が正常に動作している
✅ 自動デプロイが設定されている
✅ 監視ダッシュボードが確認できている
✅ バックアップ設定が有効になっている
✅ セキュリティ設定が適切に行われている
```

### 成功時の状態

```
🎯 アプリケーションURL: https://your-app.vercel.app
🗄️ データベース: NeonDB (PostgreSQL)
🚀 デプロイ: Vercel
📊 監視: Vercel + NeonDB ダッシュボード
🔒 セキュリティ: SSL + 環境変数管理
💰 コスト: 完全無料
```

---

**🎊 おめでとうございます！Task Calendar Appのデプロイが完了しました！**

このガイドに従って設定を行うことで、プロダクションレベルのアプリケーションを無料で運用できます。何か問題が発生した場合は、トラブルシューティングセクションを参照してください。 