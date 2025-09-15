// Dify API設定
export const DIFY_CONFIG = {
  // Dify APIのベースURL
  baseUrl: process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://api.dify.ai/v1',
  
  // APIキー
  apiKey: process.env.DIFY_API_KEY || 'app-PBQ2sTwUEbWf4GXHFey5B4H0',
  
  // アプリケーションID
  appId: process.env.DIFY_APP_ID || '88a47c57-4a02-456d-b3bf-e8c45baff08c',
  
  // エンドポイント
  endpoints: {
    chat: '/chat-messages',
    completion: '/completion-messages',
    workflow: '/workflows/run',
  },
  
  // リクエスト設定
  requestConfig: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  // ニュースカテゴリマッピング
  categories: {
    business: '経済・ビジネス',
    technology: 'テクノロジー',
    politics: '政治・国際関係',
  },
} as const

// 環境変数の検証
export function validateDifyConfig() {
  const hasApiKey = process.env.DIFY_API_KEY || DIFY_CONFIG.apiKey
  const hasAppId = process.env.DIFY_APP_ID || DIFY_CONFIG.appId
  
  if (!hasApiKey || !hasAppId) {
    console.warn('Dify API設定が不完全です')
    return false
  }
  
  return true
}

// Dify APIレスポンスの型定義
export interface DifyResponse {
  message_id: string
  conversation_id: string
  mode: string
  answer: string
  metadata: {
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    retriever_resources?: any[]
  }
  created_at: number
}

// ニュースアイテムの型定義
export interface NewsItem {
  id: string
  title: string
  summary: string
  businessInsight: string
  url: string
  timestamp: string
  category: string
  source?: string
}

// ニュースカテゴリの型
export type NewsCategory = 'business' | 'technology' | 'politics'
