import { useState, useCallback, useEffect } from 'react'
import { difyClient } from '@/lib/dify-client'
import type { NewsItem, NewsCategory } from '@/lib/dify-config'

// 並列処理版のニュース取得フック
export function useAllNewsParallel(limit: number = 5) {
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
      const categories: NewsCategory[] = ['business', 'technology', 'politics']
      
      // 並列処理でリクエスト（レート制限のリスクあり）
      const promises = categories.map(async (category) => {
        try {
          const result = await difyClient.fetchNews(category, limit)
          return { category, result, success: true }
        } catch (error) {
          console.error(`Failed to fetch ${category} news:`, error)
          return { category, result: [], success: false, error }
        }
      })

      const results = await Promise.allSettled(promises)
      
      const newAllNews: Record<NewsCategory, NewsItem[]> = {
        business: [],
        technology: [],
        politics: [],
      }

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { category, result: newsData } = result.value
          newAllNews[category] = newsData
        }
      })

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

  const refresh = useCallback(() => {
    fetchAllNews()
  }, [fetchAllNews])

  // 初回読み込み
  useEffect(() => {
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
