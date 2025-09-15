# Business News App - デプロイガイド

## 概要
Dify APIを使用したビジネスニュースアプリケーションです。

## デプロイ方法

### 1. Vercel（推奨）

#### 手順
1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイ

#### 環境変数設定
```
NEXT_PUBLIC_DIFY_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=app-PBQ2sTwUEbWf4GXHFey5B4H0
DIFY_APP_ID=app-PBQ2sTwUEbWf4GXHFey5B4H0
DIFY_WORKFLOW_ID=88a47c57-4a02-456d-b3bf-e8c45baff08c
```

### 2. Netlify

#### 手順
1. [Netlify](https://netlify.com)にアカウントを作成
2. GitHubリポジトリを接続
3. ビルド設定：
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 環境変数を設定

### 3. その他のプラットフォーム

#### Railway
- GitHubリポジトリを接続
- 自動でNext.jsアプリとして認識
- 環境変数を設定

#### Render
- GitHubリポジトリを接続
- Web Serviceとして設定
- 環境変数を設定

## 環境変数

### 必須環境変数
- `NEXT_PUBLIC_DIFY_BASE_URL`: Dify APIのベースURL
- `DIFY_API_KEY`: Dify APIキー
- `DIFY_APP_ID`: DifyアプリID
- `DIFY_WORKFLOW_ID`: DifyワークフローID

### オプション環境変数
- `NODE_ENV`: 環境（production/development）

## ビルドコマンド

```bash
# 依存関係のインストール
npm install

# 本番ビルド
npm run build

# 本番サーバー起動
npm start
```

## 機能

- 3つのカテゴリ（ビジネス、テクノロジー、政治）のニュース表示
- 毎朝6時の自動更新
- 手動更新機能
- レスポンシブデザイン
- Dify APIとの連携

## トラブルシューティング

### よくある問題
1. **環境変数が設定されていない**
   - デプロイ先の環境変数設定を確認

2. **Dify APIエラー**
   - APIキーとアプリIDが正しいか確認
   - Difyのワークフローが有効か確認

3. **ビルドエラー**
   - Node.jsのバージョンが18以上か確認
   - 依存関係が正しくインストールされているか確認

## サポート

問題が発生した場合は、以下を確認してください：
1. 環境変数の設定
2. Dify APIの状態
3. ブラウザのコンソールログ
