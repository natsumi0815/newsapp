import { useState, useEffect, useCallback } from 'react'
import { difyClient } from '@/lib/dify-client'
import { NewsItem, NewsCategory } from '@/lib/dify-config'

// ニュース取得用のカスタムフック
export function useNews(category: NewsCategory, limit: number = 5) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // ニュース取得関数
  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const newsData = await difyClient.fetchNews(category, limit)
      setNews(newsData)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ニュースの取得に失敗しました'
      setError(errorMessage)
      console.error('News fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [category, limit])

  // 初回読み込み
  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  // リフレッシュ関数
  const refresh = useCallback(() => {
    fetchNews()
  }, [fetchNews])

  return {
    news,
    isLoading,
    error,
    lastUpdated,
    refresh,
  }
}

// 全カテゴリのニュースを取得するフック
export function useAllNews(limit: number = 5) {
  const [allNews, setAllNews] = useState<Record<NewsCategory, NewsItem[]>>({
    business: [],
    technology: [],
    politics: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchAllNews = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Difyのフローを1回実行して全カテゴリのニュースを取得
      // レート制限を回避するため、少し待機
      await new Promise(resolve => setTimeout(resolve, 2000))
      const result = await difyClient.fetchNews('business', limit)
      
      // Difyのレスポンスから全カテゴリのニュースを解析
      const newAllNews: Record<NewsCategory, NewsItem[]> = {
        business: [],
        technology: [],
        politics: [],
      }

      // レスポンス全体を解析して各カテゴリに分類
      if (result && result.length > 0) {
        console.log(`Processing ${result.length} news items for categorization`)
        
        result.forEach((item, index) => {
          console.log(`Item ${index + 1}: category="${item.category}", title="${item.title}"`)
          
          // カテゴリ名で分類（より柔軟に）
          if (item.category === 'business' || item.category === '経済・ビジネス' || item.category === '経済') {
            newAllNews.business.push(item)
            console.log(`  → Added to business category`)
          } else if (item.category === 'technology' || item.category === 'テクノロジー') {
            newAllNews.technology.push(item)
            console.log(`  → Added to technology category`)
          } else if (item.category === 'politics' || item.category === '政治・国際関係' || item.category === '政治') {
            newAllNews.politics.push(item)
            console.log(`  → Added to politics category`)
          } else {
            // カテゴリが不明な場合は、デフォルトでbusinessに分類
            console.log(`  → Unknown category "${item.category}", defaulting to business`)
            newAllNews.business.push(item)
          }
        })
        
        console.log('Successfully categorized news:', {
          business: newAllNews.business.length,
          technology: newAllNews.technology.length,
          politics: newAllNews.politics.length
        })
      } else {
        console.log('No news items found in response')
      }

      setAllNews(newAllNews)
      setLastUpdated(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ニュースの取得に失敗しました'
      setError(errorMessage)
      console.error('All news fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  // 初回読み込み
  useEffect(() => {
    fetchAllNews()
  }, [fetchAllNews])

  // リフレッシュ関数
  const refresh = useCallback(() => {
    fetchAllNews()
  }, [fetchAllNews])

  return {
    allNews,
    isLoading,
    error,
    lastUpdated,
    refresh,
  }
}

// ヘルスチェック用フック
export function useDifyHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = useCallback(async () => {
    setIsChecking(true)
    try {
      const healthy = await difyClient.healthCheck()
      setIsHealthy(healthy)
    } catch (error) {
      console.error('Health check failed:', error)
      setIsHealthy(false)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkHealth()
  }, [checkHealth])

  return {
    isHealthy,
    isChecking,
    checkHealth,
  }
}
