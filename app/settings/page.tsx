"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Plus, X, Briefcase, Cpu, TrendingUp, Globe, Heart, Zap } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
  icon: string
  enabled: boolean
  color: string
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([
    { id: "business", name: "ビジネス", icon: "briefcase", enabled: true, color: "emerald" },
    { id: "technology", name: "テクノロジー", icon: "cpu", enabled: true, color: "blue" },
    { id: "politics", name: "政治", icon: "trending-up", enabled: true, color: "purple" },
  ])

  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("globe")

  const availableIcons = [
    { id: "globe", icon: Globe, name: "国際" },
    { id: "heart", icon: Heart, name: "健康" },
    { id: "zap", icon: Zap, name: "エネルギー" },
    { id: "briefcase", icon: Briefcase, name: "ビジネス" },
    { id: "cpu", icon: Cpu, name: "テクノロジー" },
    { id: "trending-up", icon: TrendingUp, name: "政治" },
  ]

  const getIconComponent = (iconId: string) => {
    const iconData = availableIcons.find((icon) => icon.id === iconId)
    return iconData ? iconData.icon : Globe
  }

  const handleToggleCategory = (categoryId: string) => {
    setCategories((prev) => prev.map((cat) => (cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat)))
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: `custom-${Date.now()}`,
        name: newCategoryName.trim(),
        icon: selectedIcon,
        enabled: true,
        color: "gray",
      }
      setCategories((prev) => [...prev, newCategory])
      setNewCategoryName("")
      setSelectedIcon("globe")
    }
  }

  const handleRemoveCategory = (categoryId: string) => {
    // デフォルトカテゴリは削除不可
    if (["business", "technology", "politics"].includes(categoryId)) {
      return
    }
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
  }

  const handleSaveSettings = () => {
    // 実際のアプリでは設定をDifyに送信
    console.log("Settings saved:", categories)
    alert("設定を保存しました")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">戻る</span>
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl font-bold text-primary">設定</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4 md:py-6 max-w-4xl">
        <div className="space-y-4 md:space-y-6">
          {/* Category Management */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">ニュースカテゴリ管理</CardTitle>
              <p className="text-sm text-muted-foreground">
                表示するニュースカテゴリを管理できます。カテゴリの追加・削除・有効/無効の切り替えが可能です。
              </p>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              {/* Current Categories */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">現在のカテゴリ</h3>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const IconComponent = getIconComponent(category.icon)
                    const isDefault = ["business", "technology", "politics"].includes(category.id)

                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                          <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                          <span className="font-medium text-sm md:text-base truncate">{category.name}</span>
                          {isDefault && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              デフォルト
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                          <div className="flex items-center space-x-1 md:space-x-2">
                            <Label htmlFor={`toggle-${category.id}`} className="text-xs md:text-sm whitespace-nowrap">
                              有効
                            </Label>
                            <Switch
                              id={`toggle-${category.id}`}
                              checked={category.enabled}
                              onCheckedChange={() => handleToggleCategory(category.id)}
                            />
                          </div>
                          {!isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveCategory(category.id)}
                              className="p-1 md:p-2"
                            >
                              <X className="h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Add New Category */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">新しいカテゴリを追加</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="category-name" className="text-sm md:text-base">
                        カテゴリ名
                      </Label>
                      <Input
                        id="category-name"
                        placeholder="例: 環境・エネルギー"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm md:text-base">アイコン選択</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                        {availableIcons.map((iconData) => {
                          const IconComponent = iconData.icon
                          return (
                            <Button
                              key={iconData.id}
                              variant={selectedIcon === iconData.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedIcon(iconData.id)}
                              className="flex flex-col items-center space-y-1 h-auto py-2"
                            >
                              <IconComponent className="h-4 w-4" />
                              <span className="text-xs">{iconData.name}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    カテゴリを追加
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* News Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">ニュース取得設定</CardTitle>
              <p className="text-sm text-muted-foreground">ニュースの取得に関する設定を管理できます。</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <Label htmlFor="auto-update" className="text-sm md:text-base">自動更新</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">30分ごとに自動でニュースを更新します</p>
                </div>
                <Switch id="auto-update" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <Label htmlFor="international-news" className="text-sm md:text-base">海外ニュース取得</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">海外のニュースソースからも情報を取得します</p>
                </div>
                <Switch id="international-news" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <Label htmlFor="deduplicate" className="text-sm md:text-base">重複記事の除外</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">類似した内容の記事を自動で除外します</p>
                </div>
                <Switch id="deduplicate" defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} size="lg" className="w-full sm:w-auto">
              設定を保存
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
