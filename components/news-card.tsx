"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Clock, Share2, Bookmark, BookmarkCheck } from "lucide-react"
import { useState } from "react"

interface NewsItem {
  id: number
  title: string
  summary: string
  businessInsight: string
  url: string
  timestamp: string
  category: string
  source?: string
}

interface NewsCardProps {
  news: NewsItem
  categoryIcon: React.ReactNode
  onShare?: (news: NewsItem) => void
}

export function NewsCard({ news, categoryIcon, onShare }: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
    // 実際のアプリではブックマーク状態をローカルストレージやAPIに保存
  }

  const handleShare = () => {
    if (onShare) {
      onShare(news)
    } else {
      // デフォルトの共有機能
      if (navigator.share) {
        navigator.share({
          title: news.title,
          text: news.summary,
          url: news.url,
        })
      } else {
        // フォールバック: クリップボードにコピー
        navigator.clipboard.writeText(`${news.title}\n${news.url}`)
        alert("リンクをクリップボードにコピーしました")
      }
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // ウィンドウサイズを安全に取得
  const getMaxLength = () => {
    if (typeof window === 'undefined') return 200 // SSR時はデフォルト値
    return window.innerWidth < 768 ? 150 : 200
  }

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg leading-tight text-balance mb-2 md:mb-3 group-hover:text-primary transition-colors pr-2">
              {news.title}
            </CardTitle>
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs w-fit">
                {categoryIcon}
                <span className="ml-1">{news.category}</span>
              </Badge>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs sm:text-sm">{news.timestamp}</span>
              </div>
              {news.source && <span className="text-xs hidden md:inline">出典: {news.source}</span>}
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2 md:ml-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              className="opacity-60 group-hover:opacity-100 transition-opacity p-1 md:p-2"
            >
              {isBookmarked ? (
                <BookmarkCheck className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              ) : (
                <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="opacity-60 group-hover:opacity-100 transition-opacity p-1 md:p-2"
            >
              <Share2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 pt-0">
        {/* 概要セクション */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-primary flex items-center">
            <div className="w-1 h-4 bg-primary rounded-full mr-2"></div>
            概要
          </h4>
          <p className="text-sm leading-relaxed text-pretty">
            {isExpanded ? news.summary : truncateText(news.summary, getMaxLength())}
          </p>
        </div>

        {/* ビジネス的示唆セクション */}
        <div>
          <h4 className="font-semibold text-sm mb-2 text-secondary flex items-center">
            <div className="w-1 h-4 bg-secondary rounded-full mr-2"></div>
            ビジネス的示唆
          </h4>
          <p className="text-sm leading-relaxed text-pretty">
            {isExpanded
              ? news.businessInsight
              : truncateText(news.businessInsight, getMaxLength())}
          </p>
        </div>

        {/* 展開/折りたたみボタン */}
        {(news.summary.length > 150 || news.businessInsight.length > 150) && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-xs">
              {isExpanded ? "折りたたむ" : "もっと読む"}
            </Button>
          </div>
        )}

        {/* フッター */}
        <div className="flex flex-col space-y-3 pt-3 md:pt-4 border-t">
          {news.url && news.url !== '#' && (
            <div className="flex flex-col space-y-2">
              <div className="text-xs text-muted-foreground">
                <strong>出典:</strong>
                <span className="ml-1 break-all opacity-75 hover:opacity-100 transition-opacity">
                  {news.url}
                </span>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                asChild 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:scale-105"
              >
                <a 
                  href={news.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`${news.title}の元記事を新しいタブで開く`}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  元記事を読む
                </a>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
