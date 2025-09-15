import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('=== API Route: Dify Request ===')
    console.log('Request body:', JSON.stringify(body, null, 2))
    
    // 環境変数から設定を取得
    const baseUrl = process.env.NEXT_PUBLIC_DIFY_BASE_URL || 'https://api.dify.ai/v1'
    const apiKey = process.env.DIFY_API_KEY || 'app-PBQ2sTwUEbWf4GXHFey5B4H0'
    const appId = process.env.DIFY_APP_ID || '88a47c57-4a02-456d-b3bf-e8c45baff08c'
    
    console.log('API Key:', apiKey ? 'Set' : 'Not set')
    console.log('App ID:', appId ? 'Set' : 'Not set')
    
    // Dify APIにリクエストを送信（タイムアウト時間を延長）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2分でタイムアウト
    
    // リクエストボディを正しく処理
    const requestBody = body.body || body
    
    console.log('Processed request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await fetch(`${baseUrl}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    console.log('Dify API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Dify API error:', errorText)
      
      // 504エラーの場合は特別な処理
      if (response.status === 504) {
        return NextResponse.json(
          { 
            error: 'Dify API timeout - 処理に時間がかかりすぎています。しばらく待ってから再試行してください。',
            status: 'timeout',
            retryAfter: 30
          },
          { status: 408 } // Request Timeout
        )
      }
      
      return NextResponse.json(
        { error: `Dify API error: ${response.status} ${response.statusText} - ${errorText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    console.log('Dify API response data:', JSON.stringify(data, null, 2))
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
