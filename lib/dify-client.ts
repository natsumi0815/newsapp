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

      // カテゴリ名を正しい形式に変換
      const categoryMapping = {
        'business': '経済・ビジネス (business)',
        'technology': 'テクノロジー (technology)',
        'politics': '政治・国際関係 (politics)'
      }

      const requestBody = {
        inputs: {
          trigger_type: '全カテゴリニュース取得 (all_news)  ',
          category: categoryMapping[category] || '経済・ビジネス (business)',
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
      console.log('Parsing all categories response:', response)
      
      // レスポンス構造を確認
      let answer = ''
      if (response && response.answer) {
        answer = response.answer
      } else if (response && typeof response === 'string') {
        answer = response
      } else if (response && (response as any).result && (response as any).result.answer) {
        answer = (response as any).result.answer
      } else {
        console.log('No valid answer found in response:', response)
        return []
      }
      
      const allNewsItems: NewsItem[] = []
      
      console.log('Full response length:', answer.length)
      console.log('Full response (first 1000 chars):', answer.substring(0, 1000))
      console.log('Full response (last 1000 chars):', answer.substring(answer.length - 1000))
      
      // デバッグ: 実際の出力形式を詳しく確認
      console.log('=== FULL RESPONSE CONTENT ===')
      console.log(answer)
      console.log('=== END FULL RESPONSE ===')
      
      // デバッグ: レスポンス全体にURLが含まれているか確認
      const allUrlsInResponse = answer.match(/https?:\/\/[^\s\n]+/g)
      if (allUrlsInResponse && allUrlsInResponse.length > 0) {
        console.log(`🔍 Found ${allUrlsInResponse.length} URLs in full response:`, allUrlsInResponse)
      } else {
        console.log(`❌ No URLs found in full response`)
      }
      
      // デバッグ: 【URL】パターンが含まれているか確認
      const urlMarkers = answer.match(/【URL】/g)
      if (urlMarkers && urlMarkers.length > 0) {
        console.log(`🔍 Found ${urlMarkers.length} 【URL】 markers in full response`)
      } else {
        console.log(`❌ No 【URL】 markers found in full response`)
      }
      
      // 各カテゴリの出現回数を確認
      const categories = ['テクノロジー', '経済・ビジネス', '政治・国際関係', '経済', '政治']
      categories.forEach(cat => {
        const count = (answer.match(new RegExp(`【${cat}】`, 'g')) || []).length
        console.log(`Category "${cat}" appears ${count} times`)
      })
      
      // ◾️ の出現回数を確認
      const bulletCount = (answer.match(/◾️/g) || []).length
      console.log(`Total ◾️ bullets found: ${bulletCount}`)
      
      console.log('=============================')
      
      // デバッグ: 実際のレスポンス構造を確認
      console.log('🔍 Debugging response structure:')
      console.log('Response type:', typeof response)
      console.log('Response keys:', Object.keys(response || {}))
      if (response && response.answer) {
        console.log('✅ Found response.answer')
        console.log('Answer type:', typeof response.answer)
        console.log('Answer length:', response.answer.length)
      }
      if (response && (response as any).files) {
        console.log('✅ Found response.files:', (response as any).files)
      }
      
      // カテゴリ名のパターンを定義（より柔軟に）
      const categoryPatterns = [
        { name: 'テクノロジー', key: 'technology' },
        { name: '経済・ビジネス', key: 'business' },
        { name: '政治・国際関係', key: 'politics' },
        { name: '経済', key: 'business' },
        { name: '政治', key: 'politics' },
        { name: 'TECHNOLOGY', key: 'technology' },
        { name: 'BUSINESS', key: 'business' },
        { name: 'POLITICS', key: 'politics' },
        { name: 'Technology', key: 'technology' },
        { name: 'Business', key: 'business' },
        { name: 'Politics', key: 'politics' }
      ]
      
      // 各カテゴリを解析
      categoryPatterns.forEach(({ name, key }) => {
        // 複数のパターンでカテゴリを検索（より柔軟に）
        const patterns = [
          new RegExp(`【${name}】([\\s\\S]*?)(?=【|$)`),
          new RegExp(`${name}：([\\s\\S]*?)(?=【|$)`),
          new RegExp(`${name}\\s*([\\s\\S]*?)(?=【|$)`),
          new RegExp(`【${name}】([\\s\\S]*?)(?=【|$)`),
          new RegExp(`=== ${name} ===([\\s\\S]*?)(?===|$)`),
          new RegExp(`${name} NEWS([\\s\\S]*?)(?=${name} NEWS|$)`),
          new RegExp(`${name}\\s*NEWS([\\s\\S]*?)(?=${name}\\s*NEWS|$)`),
          new RegExp(`${name}:([\\s\\S]*?)(?=${name}:|$)`),
        ]
        
        let categoryContent = ''
        let foundPattern = ''
        
        for (const pattern of patterns) {
          const match = answer.match(pattern)
          if (match) {
            categoryContent = match[1].trim()
            foundPattern = pattern.source
            console.log(`Found category "${name}" with pattern: ${foundPattern}`)
            console.log(`Category content length: ${categoryContent.length}`)
            break
          }
        }
        
        if (categoryContent) {
          console.log(`Found ${name} content using pattern: ${foundPattern}`)
          console.log(`Content length: ${categoryContent.length}`)
          console.log(`Content preview:`, categoryContent.substring(0, 300) + '...')
          
          // デバッグ: カテゴリコンテンツにURLが含まれているか確認
          const categoryUrls = categoryContent.match(/https?:\/\/[^\s\n]+/g)
          if (categoryUrls && categoryUrls.length > 0) {
            console.log(`🔍 Found ${categoryUrls.length} URLs in ${name} content:`, categoryUrls)
          } else {
            console.log(`❌ No URLs found in ${name} content`)
          }
          
          const items = this.parseDifyFormatResponse(categoryContent, key as NewsCategory)
          console.log(`Parsed ${items.length} items for ${name}`)
          allNewsItems.push(...items)
        } else {
          console.log(`No content found for ${name} with any pattern`)
        }
      })
      
      // カテゴリが全く検出されない場合のフォールバック
      if (allNewsItems.length === 0) {
        console.log('❌ No categories detected, trying fallback parsing...')
        const fallbackItems = this.parseFallbackResponse(answer)
        console.log(`Fallback parsing found ${fallbackItems.length} items`)
        return fallbackItems
      }
      
      return allNewsItems
    } catch (error) {
      console.error('Error parsing all categories response:', error)
      return []
    }
  }

  private parseFallbackResponse(content: string): NewsItem[] {
    const newsItems: NewsItem[] = []
    
    console.log('=== Fallback parsing ===')
    console.log('Content length:', content.length)
    console.log('Content preview:', content.substring(0, 500) + '...')
    
    // URLから記事を推測
    const urls = content.match(/https?:\/\/[^\s\n]+/g) || []
    console.log(`Found ${urls.length} URLs for fallback parsing`)
    
    // 各URLに対して記事を作成
    urls.forEach((url, index) => {
      console.log(`Processing URL ${index + 1}/${urls.length}: ${url}`)
      
      // URLの前後からタイトルを推測
      const urlIndex = content.indexOf(url)
      const beforeUrl = content.substring(Math.max(0, urlIndex - 200), urlIndex)
      const afterUrl = content.substring(urlIndex + url.length, Math.min(content.length, urlIndex + url.length + 200))
      
      console.log(`  URL index: ${urlIndex}`)
      console.log(`  Before URL: ${beforeUrl}`)
      console.log(`  After URL: ${afterUrl}`)
      
      // タイトルを抽出（より積極的に）
      let title = `ニュース記事 ${index + 1}`
      
      // 複数の方法でタイトルを抽出
      const titlePatterns = [
        /([^\n]{10,100})/g,
        /([A-Za-z][^\n]{10,100})/g,
        /([^。\n]{10,100})/g
      ]
      
      for (const pattern of titlePatterns) {
        const titleMatch = beforeUrl.match(pattern)
        if (titleMatch && titleMatch.length > 0) {
          const candidate = titleMatch[titleMatch.length - 1].trim()
          if (candidate.length > 10 && candidate.length < 100) {
            title = candidate
            break
          }
        }
      }
      
      // 概要を抽出
      let summary = 'Dify AIが生成したニュース記事です。'
      const summaryMatch = beforeUrl.match(/([^\n]{20,200})/g)
      if (summaryMatch && summaryMatch.length > 0) {
        summary = summaryMatch[summaryMatch.length - 1].trim()
      }
      
      // カテゴリを推測（URLのドメインから）
      let category: NewsCategory = 'business'
      if (url.includes('tech') || url.includes('ai') || url.includes('apple') || url.includes('scitech')) {
        category = 'technology'
      } else if (url.includes('politics') || url.includes('government') || url.includes('bloomberg')) {
        category = 'politics'
      }
      
      console.log(`Fallback item ${index + 1}:`)
      console.log(`  Title: ${title}`)
      console.log(`  Summary: ${summary.substring(0, 50)}...`)
      console.log(`  URL: ${url}`)
      console.log(`  Category: ${category}`)
      
      const newsItem = {
        id: `fallback-${Date.now()}-${index}`,
        title: title,
        summary: summary,
        businessInsight: 'Dify AIが生成したビジネス洞察です。',
        url: url,
        timestamp: new Date().toISOString(),
        category: category,
        source: 'Dify AI (Fallback)',
      }
      
      newsItems.push(newsItem)
      console.log(`✅ Added fallback item ${index + 1} to newsItems`)
    })
    
    console.log(`Total fallback items created: ${newsItems.length}`)
    
    return newsItems
  }

  private parseNewFormatResponse(content: string, category: NewsCategory): NewsItem[] {
    const newsItems: NewsItem[] = []
    
    console.log(`=== Parsing new format for ${category} ===`)
    console.log(`Content length: ${content.length}`)
    console.log(`Content preview: ${content.substring(0, 500)}...`)
    console.log(`Content contains TITLE:: ${content.includes('TITLE:')}`)
    
    // より確実な方法: 記事ブロックを分割して処理
    // TITLE: で始まるブロックを分割
    const articleBlocks = content.split(/(?=TITLE:)/g).filter(block => block.trim().startsWith('TITLE:'))
    
    console.log(`Found ${articleBlocks.length} article blocks`)
    console.log(`Article blocks:`, articleBlocks.map((block, i) => `Block ${i + 1}: ${block.substring(0, 100)}...`))
    
    articleBlocks.forEach((block, index) => {
      console.log(`Processing article block ${index + 1}:`)
      console.log(`Block content: ${block.substring(0, 200)}...`)
      
      const titleMatch = block.match(/TITLE:\s*([^\n]+)/)
      const summaryMatch = block.match(/SUMMARY:\s*([^\n]+)/)
      const insightMatch = block.match(/INSIGHT:\s*([^\n]+)/)
      const urlMatch = block.match(/URL:\s*([^\n]+)/)
      
      const title = titleMatch ? titleMatch[1].trim() : ''
      const summary = summaryMatch ? summaryMatch[1].trim() : '概要を生成中...'
      const insight = insightMatch ? insightMatch[1].trim() : 'ビジネス示唆を生成中...'
      const url = urlMatch ? urlMatch[1].trim() : ''
      
      console.log(`  Title: ${title}`)
      console.log(`  Summary: ${summary.substring(0, 50)}...`)
      console.log(`  Insight: ${insight.substring(0, 50)}...`)
      console.log(`  URL: ${url}`)
      console.log(`  URL length: ${url.length}`)
      
      if (title) {
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
        console.log(`✅ Added article ${index + 1} to newsItems`)
      } else {
        console.log(`❌ Skipped article ${index + 1} due to missing title`)
      }
    })
    
    return newsItems
  }

  private parseDifyFormatResponse(content: string, category: NewsCategory): NewsItem[] {
    const newsItems: NewsItem[] = []
    
    console.log(`=== Parsing ${category} content ===`)
    console.log('Content:', content.substring(0, 500) + '...')
    
    // 新しい形式（TITLE:, URL: 形式）を試行
    const newFormatItems = this.parseNewFormatResponse(content, category)
    console.log(`New format parsing result: ${newFormatItems.length} items`)
    
    if (newFormatItems.length > 0) {
      console.log(`✅ Using new format with ${newFormatItems.length} items`)
      return newFormatItems
    }
    
    console.log(`❌ New format failed, trying legacy format`)
    
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
          
          itemContent = content.substring(titleIndex, nextTitleIndex)
          
          // URLが見つからない場合は、より広い範囲を取得
          if (!itemContent.includes('【URL】') && !itemContent.includes('http')) {
            console.log(`🔍 URL not found in itemContent, expanding range...`)
            console.log(`Current itemContent length: ${itemContent.length}`)
            console.log(`Current itemContent preview: ${itemContent.substring(0, 200)}...`)
            
            // より積極的に範囲を拡張 - 次のカテゴリセクションまで
            let extendedEnd = content.length
            
            // 次のカテゴリセクション（【】で始まる）を探す
            const nextCategoryIndex = content.indexOf('【', titleIndex + match.length)
            if (nextCategoryIndex !== -1) {
              extendedEnd = nextCategoryIndex
              console.log(`Found next category at index: ${nextCategoryIndex}`)
            } else {
              console.log(`No next category found, using full content length: ${content.length}`)
            }
            
            itemContent = content.substring(titleIndex, extendedEnd)
            console.log(`✅ Extended item content to include URL. New length: ${itemContent.length}`)
            console.log(`Extended itemContent preview: ${itemContent.substring(0, 300)}...`)
            console.log(`Extended itemContent contains 【URL】: ${itemContent.includes('【URL】')}`)
            console.log(`Extended itemContent contains http: ${itemContent.includes('http')}`)
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
        
        console.log(`🔍 Starting URL extraction for title: "${title}"`)
        console.log(`Item content length: ${itemContent.length}`)
        console.log(`Item content preview: ${itemContent.substring(0, 200)}...`)
        
        // 方法1: 【URL】パターンを直接検索
        const urlPatterns = [
          /【URL】\s*(https?:\/\/[^\s\n]+)/,
          /【URL】[：:]\s*([^\n]+)/,
          /【URL】\s*([^\n]+)/,
          /【URL】：\s*([^\n]+)/,
          /【URL】\s*([^\s]+)/,
          /URL[：:]\s*([^\n]+)/,
          /リンク[：:]\s*([^\n]+)/,
          /https?:\/\/[^\s]+/g
        ]
        
        // 直接URLパターンを検索
        if (!foundUrl) {
          console.log(`🔍 Testing direct URL pattern: /【URL】\\s*(https?:\\/\\/[^\\s\\n]+)/`)
          const directUrlMatch = itemContent.match(/【URL】\s*(https?:\/\/[^\s\n]+)/)
          if (directUrlMatch) {
            url = directUrlMatch[1].trim()
            console.log(`✅ Found direct URL: ${url}`)
            foundUrl = true
          } else {
            console.log(`❌ No direct URL match`)
          }
        }
        
        // より柔軟な【URL】パターン
        if (!foundUrl) {
          console.log(`🔍 Testing flexible URL pattern: /【URL】\\s*([^\\n]+)/`)
          const flexibleUrlMatch = itemContent.match(/【URL】\s*([^\n]+)/)
          if (flexibleUrlMatch) {
            const potentialUrl = flexibleUrlMatch[1].trim()
            console.log(`Found potential URL: "${potentialUrl}"`)
            if (potentialUrl.startsWith('http')) {
              url = potentialUrl
              console.log(`✅ Found URL with flexible pattern: ${url}`)
              foundUrl = true
            } else {
              console.log(`❌ Potential URL doesn't start with http: "${potentialUrl}"`)
            }
          } else {
            console.log(`❌ No flexible URL match`)
          }
        }
        
        // 直接http(s)URLを検索
        if (!foundUrl) {
          console.log(`🔍 Testing direct HTTP URL pattern: /https?:\\/\\/[^\\s\\n]+/g`)
          const httpUrls = itemContent.match(/https?:\/\/[^\s\n]+/g)
          if (httpUrls && httpUrls.length > 0) {
            url = httpUrls[0].trim()
            console.log(`✅ Found direct HTTP URL: ${url}`)
            foundUrl = true
          } else {
            console.log(`❌ No direct HTTP URL match`)
          }
        }
        
        // 元のコンテンツ全体からURLを検索
        if (!foundUrl) {
          console.log(`🔍 Searching in original content...`)
          const originalContent = content
          const allUrlsInOriginal = originalContent.match(/https?:\/\/[^\s\n]+/g)
          if (allUrlsInOriginal && allUrlsInOriginal.length > 0) {
            console.log(`Found ${allUrlsInOriginal.length} URLs in original content:`, allUrlsInOriginal)
            console.log(`Searching for title: "${title}"`)
            console.log(`Title index in original content: ${originalContent.indexOf(title)}`)
            
            // タイトルに関連するURLを探す
            for (const urlCandidate of allUrlsInOriginal) {
              const urlIndex = originalContent.indexOf(urlCandidate)
              const titleIndex = originalContent.indexOf(title)
              const distance = Math.abs(urlIndex - titleIndex)
              console.log(`URL: ${urlCandidate}`)
              console.log(`URL index: ${urlIndex}, Title index: ${titleIndex}, Distance: ${distance}`)
              
              if (distance < 5000) { // 距離を5000文字に大幅拡張
                url = urlCandidate.trim()
                console.log(`✅ Found URL near title in original content: ${url}`)
                foundUrl = true
                break
              } else {
                console.log(`❌ URL too far from title (distance: ${distance})`)
              }
            }
          } else {
            console.log(`❌ No URLs found in original content`)
          }
        }
        
        // 最後の手段: カテゴリコンテンツ全体から直接URLを検索
        if (!foundUrl) {
          console.log(`🔍 Searching for URLs in category content...`)
          console.log(`Category content length: ${content.length}`)
          console.log(`Category content preview: ${content.substring(0, 500)}...`)
          
          const categoryUrls = content.match(/https?:\/\/[^\s\n]+/g)
          if (categoryUrls && categoryUrls.length > 0) {
            console.log(`Found ${categoryUrls.length} URLs in category content:`, categoryUrls)
            
            // タイトルに最も近いURLを選択
            let bestUrl = categoryUrls[0]
            let minDistance = Infinity
            
            for (const urlCandidate of categoryUrls) {
              const urlIndex = content.indexOf(urlCandidate)
              const titleIndex = content.indexOf(title)
              const distance = Math.abs(urlIndex - titleIndex)
              
              if (distance < minDistance) {
                minDistance = distance
                bestUrl = urlCandidate
              }
            }
            
            url = bestUrl.trim()
            console.log(`✅ Using closest URL from category content: ${url} (distance: ${minDistance})`)
            foundUrl = true
          } else {
            console.log(`❌ No URLs found in category content`)
            console.log(`Content contains http: ${content.includes('http')}`)
            console.log(`Content contains https: ${content.includes('https')}`)
            console.log(`Content contains 【URL】: ${content.includes('【URL】')}`)
          }
        } else {
          console.log(`✅ URL already found: ${url}`)
        }
        
        // 最終手段: レスポンス全体から直接URLを抽出
        if (!foundUrl) {
          console.log(`🔍 Final attempt: Searching in full response...`)
          // この関数の外からレスポンス全体にアクセスする必要がある
          // 一時的な解決策として、グローバル変数を使用
          if (typeof window !== 'undefined' && (window as any).lastDifyResponse) {
            const fullResponse = (window as any).lastDifyResponse
            const fullUrls = fullResponse.match(/https?:\/\/[^\s\n]+/g)
            if (fullUrls && fullUrls.length > 0) {
              console.log(`Found ${fullUrls.length} URLs in full response:`, fullUrls)
              
              // タイトルに最も近いURLを選択
              let bestUrl = fullUrls[0]
              let minDistance = Infinity
              
              for (const urlCandidate of fullUrls) {
                const urlIndex = fullResponse.indexOf(urlCandidate)
                const titleIndex = fullResponse.indexOf(title)
                const distance = Math.abs(urlIndex - titleIndex)
                
                if (distance < minDistance) {
                  minDistance = distance
                  bestUrl = urlCandidate
                }
              }
              
              url = bestUrl.trim()
              console.log(`✅ Using closest URL from full response: ${url} (distance: ${minDistance})`)
              foundUrl = true
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
            console.log(`✅ Using first URL from original content: ${url}`)
          } else {
            // フォールバック: テスト用URLを設定
            url = 'https://example.com/fallback-news'
            console.log(`❌ Using fallback URL: ${url}`)
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
