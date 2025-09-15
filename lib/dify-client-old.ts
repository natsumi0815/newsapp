import { DIFY_CONFIG, NewsCategory, NewsItem, DifyResponse } from './dify-config'

export class DifyClient {
  private baseUrl: string
  private apiKey: string
  private appId: string

  constructor() {
    this.baseUrl = DIFY_CONFIG.baseUrl
    this.apiKey = DIFY_CONFIG.apiKey
    this.appId = DIFY_CONFIG.appId
  }

  private async makeRequest(endpoint: string, body: any): Promise<any> {
    try {
      console.log('=== Dify API Request ===')
      console.log('Endpoint:', endpoint)
      console.log('Body:', JSON.stringify(body, null, 2))
      console.log('API Key:', this.apiKey ? 'Set' : 'Not set')
      console.log('App ID:', this.appId ? 'Set' : 'Not set')
      console.log('=======================')

      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint,
          body
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('=== Dify API Error ===')
        console.log('Status:', response.status)
        console.log('Status Text:', response.statusText)
        console.log('Error Response:', errorText)
        console.log('======================')
        throw new Error(`Dify API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('=== Dify API Success ===')
      console.log('Response:', JSON.stringify(data, null, 2))
      console.log('========================')
      return data
    } catch (error) {
      console.error('=== Dify API Error ===')
      console.error('Error:', error)
      console.error('======================')
      throw error
    }
  }

  async fetchNews(category: NewsCategory, limit: number = 5): Promise<NewsItem[]> {
    try {
      console.log(`Fetching news for category: ${category}, limit: ${limit}`)
      
      const prompt = this.generateNewsPrompt(category, limit)
      console.log('Generated prompt:', prompt)

      const requestBody = {
        inputs: {
          trigger_type: '全カテゴリニュース取得 (all_news)  ',
          category: category,
        },
        query: prompt,
        response_mode: 'blocking',
        conversation_id: '',
        user: 'business-news-app',
        files: [],
        auto_generate_name: false,
      }

      const response = await this.makeRequest(DIFY_CONFIG.endpoints.chat, requestBody)
      
      if (response && response.answer) {
        console.log('Dify response received, parsing...')
        return this.parseAllCategoriesResponse(response, category)
      } else {
        console.log('No answer in response, using fallback')
        return this.getFallbackNews(category, limit)
      }
    } catch (error) {
      console.error('Error fetching news from Dify:', error)
      
      // エラーメッセージをチェック
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.log('エラーが発生しました:', errorMessage)
      
      if (errorMessage.includes('timeout') || errorMessage.includes('408')) {
        console.log('タイムアウトエラー: Difyの処理に時間がかかりすぎています')
        return this.getFallbackNews(category, limit)
      }
      
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('tpm') || errorMessage.includes('context')) {
        console.log('レート制限またはコンテキスト制限エラー: フォールバックニュースを返します')
        return this.getFallbackNews(category, limit)
      }
      
      console.log('フォールバックニュースを返します')
      return this.getFallbackNews(category, limit)
    }
  }

  private generateNewsPrompt(category: NewsCategory, limit: number): string {
    return "ニュースを取得してください"
  }

  private parseAllCategoriesResponse(response: DifyResponse, category: NewsCategory): NewsItem[] {
    try {
      console.log('Parsing all categories response:', response.answer)
      
      if (!response || !response.answer) {
        console.log('No response or answer found')
        return []
      }
      
      console.log('Full response length:', response.answer?.length)
      console.log('Full response (first 1000 chars):', response.answer?.substring(0, 1000))
      console.log('Full response (last 1000 chars):', response.answer?.substring(response.answer.length - 1000))
      
      // 各カテゴリの出現回数を確認
      const categories = ['テクノロジー', '経済・ビジネス', '政治・国際関係', '経済', '政治']
      categories.forEach(cat => {
        const count = (response.answer?.match(new RegExp(`【${cat}】`, 'g')) || []).length
        console.log(`Category "${cat}" appears ${count} times`)
      })
      
      // ◾️ の出現回数を確認
      const bulletCount = (response.answer?.match(/◾️/g) || []).length
      console.log(`Total ◾️ bullets found: ${bulletCount}`)
      
      console.log('=============================')
      
      const answer = response.answer
      const allNewsItems: NewsItem[] = []
      
      // カテゴリ名のパターンを定義
      const categoryPatterns = [
        { name: 'テクノロジー', key: 'technology' },
        { name: '経済・ビジネス', key: 'business' },
        { name: '政治・国際関係', key: 'politics' },
        { name: '経済', key: 'business' },
        { name: '政治', key: 'politics' }
      ]
      
      // 各カテゴリを解析
      categoryPatterns.forEach(({ name, key }) => {
        // 複数のパターンでカテゴリを検索
        const categoryPatterns = [
          new RegExp(`【${name}】([\\s\\S]*?)(?=【|$)`),
          new RegExp(`${name}：([\\s\\S]*?)(?=【|$)`),
          new RegExp(`${name}\\s*([\\s\\S]*?)(?=【|$)`),
        ]
        
        let categoryContent = ''
        let foundPattern = ''
        
        for (const pattern of categoryPatterns) {
          const match = answer.match(pattern)
          if (match) {
            categoryContent = match[1].trim()
            foundPattern = pattern.source
            break
          }
        }
        
        if (categoryContent) {
          console.log(`Found ${name} content using pattern: ${foundPattern}`)
          console.log(`Content length: ${categoryContent.length}`)
          console.log(`Content preview:`, categoryContent.substring(0, 300) + '...')
          
          const items = this.parseDifyFormatResponse(categoryContent, key as NewsCategory)
          console.log(`Parsed ${items.length} items for ${name}`)
          allNewsItems.push(...items)
        } else {
          console.log(`No content found for ${name} with any pattern`)
        }
      })
      
      return allNewsItems
    } catch (error) {
      console.error('Error parsing all categories response:', error)
      return []
    }
  }

  private parseDifyFormatResponse(content: string, category: NewsCategory): NewsItem[] {
    const newsItems: NewsItem[] = []
    
    console.log(`=== Parsing ${category} content ===`)
    console.log('Content:', content.substring(0, 500) + '...')
    
    // 複数のタイトルパターンを試行
    const titlePatterns = [
      /◾️\s*([^\n]+)/g,
      /•\s*([^\n]+)/g,
      /-\s*([^\n]+)/g,
      /\d+\.\s*([^\n]+)/g,
    ]
    
    let titleMatches: string[] = []
    let usedPattern = ''
    
    for (const pattern of titlePatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        titleMatches = matches
        usedPattern = pattern.source
        console.log(`Found ${matches.length} titles using pattern: ${pattern.source}`)
        break
      }
    }
    
    // タイトルが見つからない場合は、内容全体を1つのアイテムとして扱う
    if (titleMatches.length === 0) {
      console.log('No titles found, treating entire content as single item')
      titleMatches = ['【単一ニュース】']
      usedPattern = 'single'
    }
    
    if (titleMatches.length > 0) {
      console.log(`Found ${titleMatches.length} titles:`, titleMatches)
      
      titleMatches.forEach((match, index) => {
        // パターンに応じてタイトルを抽出
        let title = ''
        let itemContent = ''
        
        if (usedPattern === 'single') {
          // 単一アイテムの場合、内容全体を使用
          title = `${DIFY_CONFIG.categories[category]}ニュース`
          itemContent = content
        } else {
          if (usedPattern.includes('◾️')) {
            title = match.replace(/◾️\s*/, '').trim()
          } else if (usedPattern.includes('•')) {
            title = match.replace(/•\s*/, '').trim()
          } else if (usedPattern.includes('-')) {
            title = match.replace(/-\s*/, '').trim()
          } else if (usedPattern.includes('\\d')) {
            title = match.replace(/\d+\.\s*/, '').trim()
          }
          
          // タイトルの後の内容を取得（URLも含める）
          const titleIndex = content.indexOf(match)
          let nextTitleIndex = index < titleMatches.length - 1 
            ? content.indexOf(titleMatches[index + 1])
            : content.length
          
          // 次のカテゴリセクション（【】で始まる）がある場合は、それより前で切り取る
          const nextCategoryIndex = content.indexOf('【', titleIndex + match.length)
          if (nextCategoryIndex !== -1 && nextCategoryIndex < nextTitleIndex) {
            nextTitleIndex = nextCategoryIndex
          }
          
          // URL部分も含めるために、より広い範囲を取得
          itemContent = content.substring(titleIndex, nextTitleIndex)
          
          // URLが見つからない場合は、次のタイトルまたはカテゴリまで拡張
          if (!itemContent.includes('【URL】') && !itemContent.includes('http')) {
            // 次のタイトルまたはカテゴリの直前まで拡張
            const extendedEnd = index < titleMatches.length - 1 
              ? content.indexOf(titleMatches[index + 1])
              : content.length
            
            // 次のカテゴリセクションがある場合は、それより前で切り取る
            const nextCategoryIndexExtended = content.indexOf('【', titleIndex + match.length)
            const finalEnd = nextCategoryIndexExtended !== -1 && nextCategoryIndexExtended < extendedEnd 
              ? nextCategoryIndexExtended 
              : extendedEnd
            
            itemContent = content.substring(titleIndex, finalEnd)
            console.log(`Extended item content to include URL. New length: ${itemContent.length}`)
          }
          
          // itemContentが空の場合は、タイトルから次のタイトルまでを取得
          if (!itemContent || itemContent.trim().length === 0) {
            const startIndex = content.indexOf(match)
            const endIndex = index < titleMatches.length - 1 
              ? content.indexOf(titleMatches[index + 1])
              : content.length
            itemContent = content.substring(startIndex, endIndex)
            console.log(`Fixed empty itemContent. New length: ${itemContent.length}`)
          }
        }
        
        console.log(`Processing title ${index + 1}:`, title)
        console.log(`Item content for "${title}":`, itemContent.substring(0, 300) + '...')
        console.log(`Full item content length:`, itemContent.length)
        console.log(`Item content contains 【URL】:`, itemContent.includes('【URL】'))
        console.log(`Item content contains http:`, itemContent.includes('http'))
        console.log(`Item content contains https:`, itemContent.includes('https'))
        console.log(`Item content contains tipranks:`, itemContent.includes('tipranks'))
        
        // 概要とビジネス示唆を抽出
        const summaryMatch = itemContent.match(/◎概要[：:]\s*([^◎]+)/)
        const insightMatch = itemContent.match(/◎ビジネス的示唆[：:]\s*([^【]+)/)
        
        const summary = summaryMatch ? summaryMatch[1].trim() : '概要を生成中...'
        const insight = insightMatch ? insightMatch[1].trim() : 'ビジネス示唆を生成中...'
        
        // URL抽出の改善
        let url = ''
        let foundUrl = false
        
        console.log('Searching for URL in content:', itemContent.substring(0, 200) + '...')
        console.log('Full item content:', itemContent)
        console.log('Item content type:', typeof itemContent)
        console.log('Item content length:', itemContent.length)
        
        // 方法1: 【URL】パターンを直接検索
        const urlPatterns = [
          /【URL】\s*(https?:\/\/[^\s\n]+)/,  // 【URL】の直後にURLを優先
          /【URL】[：:]\s*([^\n]+)/,
          /【URL】\s*([^\n]+)/,  // コロンなしのパターン
          /【URL】：\s*([^\n]+)/,  // 全角コロンのパターン
          /【URL】\s*([^\s]+)/,  // 空白文字で区切られたURL
          /URL[：:]\s*([^\n]+)/,
          /リンク[：:]\s*([^\n]+)/,
          /https?:\/\/[^\s]+/g  // 直接URLを検索
        ]
        
        // 方法2.1: 直接URLパターンを検索
        if (!foundUrl) {
          const directUrlMatch = itemContent.match(/【URL】\s*(https?:\/\/[^\s\n]+)/)
          if (directUrlMatch) {
            url = directUrlMatch[1].trim()
            console.log(`Found direct URL: ${url}`)
            foundUrl = true
          }
        }
        
        // 方法2.2: より柔軟な【URL】パターン
        if (!foundUrl) {
          const flexibleUrlMatch = itemContent.match(/【URL】\s*([^\n]+)/)
          if (flexibleUrlMatch) {
            const potentialUrl = flexibleUrlMatch[1].trim()
            if (potentialUrl.startsWith('http')) {
              url = potentialUrl
              console.log(`Found URL with flexible pattern: ${url}`)
              foundUrl = true
            }
          }
        }
        
        // 方法2.3: 直接http(s)URLを検索
        if (!foundUrl) {
          const httpUrls = itemContent.match(/https?:\/\/[^\s\n]+/g)
          if (httpUrls && httpUrls.length > 0) {
            url = httpUrls[0].trim()
            console.log(`Found direct HTTP URL: ${url}`)
            foundUrl = true
          }
        }
        
        // 方法2.4: 元のコンテンツ全体からURLを検索
        if (!foundUrl) {
          const originalContent = content // 元のコンテンツ全体
          const allUrlsInOriginal = originalContent.match(/https?:\/\/[^\s\n]+/g)
          if (allUrlsInOriginal && allUrlsInOriginal.length > 0) {
            console.log(`Found ${allUrlsInOriginal.length} URLs in original content:`, allUrlsInOriginal)
            // タイトルに関連するURLを探す
            const titleWords = title.split(' ').slice(0, 3) // タイトルの最初の3単語
            for (const urlCandidate of allUrlsInOriginal) {
              // タイトルの近くにあるURLを選択
              const urlIndex = originalContent.indexOf(urlCandidate)
              const titleIndex = originalContent.indexOf(title)
              console.log(`URL: ${urlCandidate}, URL index: ${urlIndex}, Title index: ${titleIndex}, Distance: ${Math.abs(urlIndex - titleIndex)}`)
              if (Math.abs(urlIndex - titleIndex) < 1000) { // 1000文字以内
                url = urlCandidate.trim()
                console.log(`Found URL near title in original content: ${url}`)
                foundUrl = true
                break
              }
            }
          }
        }
        
        // 方法2.5: タイトルに基づいてURLを直接検索
        if (!foundUrl) {
          const originalContent = content
          // タイトルの一部を使ってURLを検索
          const titleWords = title.split(' ').slice(0, 2) // 最初の2単語
          for (const word of titleWords) {
            const wordIndex = originalContent.indexOf(word)
            if (wordIndex !== -1) {
              // その単語の前後1000文字以内でURLを検索
              const searchStart = Math.max(0, wordIndex - 1000)
              const searchEnd = Math.min(originalContent.length, wordIndex + 1000)
              const searchContent = originalContent.substring(searchStart, searchEnd)
              const nearbyUrls = searchContent.match(/https?:\/\/[^\s\n]+/g)
              if (nearbyUrls && nearbyUrls.length > 0) {
                url = nearbyUrls[0].trim()
                console.log(`Found URL near title word "${word}": ${url}`)
                foundUrl = true
                break
              }
            }
          }
        }
        
        // 方法3: その他のパターンを試行
        if (!foundUrl) {
          for (const pattern of urlPatterns) {
            const match = itemContent.match(pattern)
            if (match) {
              url = match[1].trim()
              console.log(`Found URL with pattern ${pattern.source}: ${url}`)
              foundUrl = true
              break
            } else {
              console.log(`No match for pattern: ${pattern}`)
            }
          }
        }
        
        if (!foundUrl) {
          console.log(`No URL found in content: ${itemContent}`)
          console.log(`Content length: ${itemContent.length}`)
          console.log(`Content contains 【URL】: ${itemContent.includes('【URL】')}`)
          console.log(`Content contains http: ${itemContent.includes('http')}`)
          console.log(`Content contains https: ${itemContent.includes('https')}`)
          console.log(`Content contains tipranks: ${itemContent.includes('tipranks')}`)
          
          // 最後の手段: 元のコンテンツから最初のURLを使用
          const originalContent = content
          const firstUrl = originalContent.match(/https?:\/\/[^\s\n]+/)
          if (firstUrl) {
            url = firstUrl[0].trim()
            console.log(`Using first URL from original content: ${url}`)
          } else {
            // フォールバック: テスト用URLを設定
            url = 'https://example.com/fallback-news'
            console.log(`Using fallback URL: ${url}`)
          }
        }
        
        console.log(`Extracted - Summary: ${summary.substring(0, 50)}...`)
        console.log(`Extracted - Insight: ${insight.substring(0, 50)}...`)
        console.log(`Extracted - URL: ${url}`)
        console.log(`URL length: ${url.length}`)
        console.log(`URL is empty: ${url === ''}`)
        console.log(`Final URL for news item: "${url}"`)
        
        newsItems.push({
          id: `${category}-${Date.now()}-${index}`,
          title: title,
          summary: summary,
          businessInsight: insight,
          url: url,
          timestamp: new Date().toISOString(),
          category: category,
          source: 'Dify AI',
        })
      })
    } else {
      console.log('No titles found with any pattern')
    }
    
    // ニュースアイテムが見つからない場合は、内容全体を1つのアイテムとして扱う
    if (newsItems.length === 0) {
      console.log('No news items found, creating fallback item')
      newsItems.push({
        id: `${category}-${Date.now()}`,
        title: `${DIFY_CONFIG.categories[category]}ニュース`,
        summary: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        businessInsight: 'Dify AIが生成したニュース',
        url: '',
        timestamp: new Date().toISOString(),
        category: category,
        source: 'Dify AI',
      })
    }
    
    console.log(`=== Parsed ${newsItems.length} items for ${category} ===`)
    return newsItems
  }

  private getFallbackNews(category: NewsCategory, limit: number): NewsItem[] {
    const fallbackNews: Record<NewsCategory, NewsItem[]> = {
      business: [
        {
          id: 'fallback-business-1',
          title: '経済指標の動向と市場への影響',
          summary: '最新の経済指標が発表され、市場に大きな影響を与えています。GDP成長率、失業率、インフレ率などの主要指標の動向を分析し、今後の経済見通しについて考察します。',
          businessInsight: '企業は経済指標の動向を注視し、投資戦略や事業計画の見直しを検討する必要があります。特に金利動向は資金調達コストに直結するため、慎重な対応が求められます。',
          url: 'https://example.com/fallback-news',
          timestamp: new Date().toISOString(),
          category: 'business',
          source: 'Fallback News',
        },
        {
          id: 'fallback-business-2',
          title: 'グローバルサプライチェーンの再構築',
          summary: '地政学的リスクの高まりにより、企業はサプライチェーンの多様化と再構築を進めています。リスク分散とコスト最適化のバランスを図る新たな戦略が求められています。',
          businessInsight: 'サプライチェーンの再構築は短期的にはコスト増加を伴いますが、長期的には事業の持続可能性向上に寄与します。戦略的パートナーシップの構築が重要です。',
          url: 'https://example.com/fallback-news',
          timestamp: new Date().toISOString(),
          category: 'business',
          source: 'Fallback News',
        },
      ],
      technology: [
        {
          id: 'fallback-tech-1',
          title: 'AI技術の進歩とビジネス応用',
          summary: '人工知能技術が急速に発展し、様々な業界での実用化が進んでいます。機械学習、自然言語処理、画像認識などの技術が企業の業務効率化に大きく貢献しています。',
          businessInsight: 'AI技術の導入により、企業は業務の自動化と効率化を実現できます。ただし、適切なデータ管理とセキュリティ対策が不可欠です。',
          url: 'https://example.com/fallback-news',
          timestamp: new Date().toISOString(),
          category: 'technology',
          source: 'Fallback News',
        },
        {
          id: 'fallback-tech-2',
          title: 'クラウドコンピューティングの普及',
          summary: 'クラウドサービスの利用が企業のデジタル変革を加速させています。スケーラビリティ、コスト効率、セキュリティの向上により、多くの企業がクラウド移行を進めています。',
          businessInsight: 'クラウド移行は初期投資を要しますが、長期的には運用コストの削減と柔軟性の向上をもたらします。段階的な移行戦略が推奨されます。',
          url: 'https://example.com/fallback-news',
          timestamp: new Date().toISOString(),
          category: 'technology',
          source: 'Fallback News',
        },
      ],
      politics: [
        {
          id: 'fallback-politics-1',
          title: '国際政治情勢と経済への影響',
          summary: '国際政治の動向が世界経済に大きな影響を与えています。貿易政策、外交関係、地政学的リスクの変化が企業の戦略決定に重要な要素となっています。',
          businessInsight: '企業は国際政治情勢の変化に敏感に対応し、リスク管理と機会創出の両面から戦略を検討する必要があります。多様化と柔軟性が鍵となります。',
          url: 'https://example.com/fallback-news',
          timestamp: new Date().toISOString(),
          category: 'politics',
          source: 'Fallback News',
        },
        {
          id: 'fallback-politics-2',
          title: '規制環境の変化と企業対応',
          summary: '各国の規制環境が急速に変化しており、企業は新たなコンプライアンス要件に対応する必要があります。環境規制、データ保護法、労働法などの変更が企業戦略に影響を与えています。',
          businessInsight: '規制対応は単なるコストではなく、競争優位性を構築する機会でもあります。早期対応により市場での信頼性向上が期待できます。',
          url: 'https://example.com/fallback-news',
          timestamp: new Date().toISOString(),
          category: 'politics',
          source: 'Fallback News',
        },
      ],
    }

    return fallbackNews[category].slice(0, limit)
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest(DIFY_CONFIG.endpoints.chat, {
        inputs: {
          trigger_type: '全カテゴリニュース取得 (all_news)  ',
          category: '経済・ビジネス (business)',
        },
        query: 'ヘルスチェック',
        response_mode: 'blocking',
        conversation_id: '',
        user: 'business-news-app',
      })
      return response && response.answer
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

export const difyClient = new DifyClient()