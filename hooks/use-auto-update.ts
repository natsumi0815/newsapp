import { useEffect, useCallback } from 'react'

interface UseAutoUpdateOptions {
  onUpdate: () => void
  updateTime: string // "06:00" 形式
}

export function useAutoUpdate({ onUpdate, updateTime }: UseAutoUpdateOptions) {
  const scheduleNextUpdate = useCallback(() => {
    const now = new Date()
    const [hours, minutes] = updateTime.split(':').map(Number)
    
    // 今日の更新時刻を設定
    const todayUpdate = new Date(now)
    todayUpdate.setHours(hours, minutes, 0, 0)
    
    // 今日の更新時刻が過ぎている場合は明日の更新時刻を設定
    const nextUpdate = todayUpdate <= now 
      ? new Date(todayUpdate.getTime() + 24 * 60 * 60 * 1000)
      : todayUpdate
    
    const timeUntilUpdate = nextUpdate.getTime() - now.getTime()
    
    console.log(`次回自動更新: ${nextUpdate.toLocaleString('ja-JP')}`)
    
    const timeoutId = setTimeout(() => {
      console.log('自動更新を実行します')
      onUpdate()
      scheduleNextUpdate() // 次の更新をスケジュール
    }, timeUntilUpdate)
    
    return timeoutId
  }, [onUpdate, updateTime])

  useEffect(() => {
    const timeoutId = scheduleNextUpdate()
    
    return () => {
      clearTimeout(timeoutId)
    }
  }, [scheduleNextUpdate])

  // 手動更新のための関数
  const manualUpdate = useCallback(() => {
    console.log('手動更新を実行します')
    onUpdate()
  }, [onUpdate])

  return { manualUpdate }
}
