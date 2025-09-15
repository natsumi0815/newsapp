"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, RefreshCw, Clock, TrendingUp, Briefcase, Cpu, AlertCircle } from "lucide-react"
import Link from "next/link"
import { NewsCard } from "@/components/news-card"
import { NewsSkeleton } from "@/components/news-skeleton"
import { useAllNews } from "@/hooks/use-news"
import { useAutoUpdate } from "@/hooks/use-auto-update"
import { NewsCategory } from "@/lib/dify-config"


export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NewsCategory>("business")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Dify APIからニュースを取得（レート制限対応）
  const { allNews, isLoading, error, lastUpdated, refresh } = useAllNews(5)

  // 自動更新機能（毎朝6時）
  const { manualUpdate } = useAutoUpdate({
    onUpdate: refresh,
    updateTime: "06:00"
  })

  const handleRefresh = async () => {
    await manualUpdate()
  }

  const getCategoryIcon = (category: NewsCategory) => {
    switch (category) {
      case "business":
        return <Briefcase className="h-4 w-4" />
      case "technology":
        return <Cpu className="h-4 w-4" />
      case "politics":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Briefcase className="h-4 w-4" />
    }
  }

  const handleNewsShare = (news: any) => {
    // カスタム共有ロジック
    console.log("Sharing news:", news.title)
  }

  const renderNewsContent = (newsData: any[]) => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Difyでニュースを生成中...</h3>
        <p className="text-muted-foreground mb-4">
          Difyワークフロー実行中（最大2分程度かかる場合があります）<br/>
          キーワード生成 → Tavily検索 → AI処理 → ニュースレター形式で出力中
        </p>
          <div className="grid gap-6 w-full">
            {[...Array(2)].map((_, index) => (
              <NewsSkeleton key={index} />
            ))}
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">API制限に達しました</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              DifyのAIモデル（gpt-3.5-turbo）のレート制限に達しています。<br/>
              フォールバックニュースを表示中です。しばらく待ってから再試行してください。
            </p>
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </div>
      )
    }

    if (newsData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">ニュースが見つかりません</h3>
          <p className="text-muted-foreground mb-4">このカテゴリにはまだニュースがありません</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
        </div>
      )
    }

    return (
      <div className="grid gap-6">
        {newsData.map((news) => (
          <NewsCard key={news.id} news={news} categoryIcon={getCategoryIcon(activeTab)} onShare={handleNewsShare} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <h1 className="text-xl md:text-2xl font-bold text-primary">ビジネスニュース</h1>
              <Badge variant="secondary" className="text-xs hidden sm:flex">
                <Clock className="h-3 w-3 mr-1" />
                最終更新: {lastUpdated ? lastUpdated.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "未更新"}
              </Badge>
      {error && (
        <Badge variant="destructive" className="text-xs hidden sm:flex">
          <AlertCircle className="h-3 w-3 mr-1" />
          API制限
        </Badge>
      )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="hidden sm:flex bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                更新
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="sm:hidden bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
                  <Settings className="h-4 w-4 mr-2" />
                  設定
                </Button>
                <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="sm:hidden mt-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              最終更新: {lastUpdated ? lastUpdated.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "未更新"}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as NewsCategory)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-auto">
            <TabsTrigger
              value="business"
              className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1.5"
            >
              <Briefcase className="h-4 w-4" />
              <span className="text-xs sm:text-sm">ビジネス</span>
            </TabsTrigger>
            <TabsTrigger
              value="technology"
              className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1.5"
            >
              <Cpu className="h-4 w-4" />
              <span className="text-xs sm:text-sm">テクノロジー</span>
            </TabsTrigger>
            <TabsTrigger
              value="politics"
              className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 sm:py-1.5"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs sm:text-sm">政治</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-4 md:space-y-6">
            {renderNewsContent(allNews.business)}
          </TabsContent>

          <TabsContent value="technology" className="space-y-4 md:space-y-6">
            {renderNewsContent(allNews.technology)}
          </TabsContent>

          <TabsContent value="politics" className="space-y-4 md:space-y-6">
            {renderNewsContent(allNews.politics)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
