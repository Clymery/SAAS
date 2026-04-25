"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { BarChart3, Loader2, Lock, Save, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface UsageStats {
  totalGenerations: number
  monthLimit: number
  storageUsed: number
  totalImages: number
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loadingUsage, setLoadingUsage] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [profile, setProfile] = useState({ name: "", email: "" })
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" })

  useEffect(() => {
    if (session?.user) {
      setProfile({
        name: session.user.name || "",
        email: session.user.email || "",
      })
    }
  }, [session])

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then((data) => setUsage(data))
      .catch(console.error)
      .finally(() => setLoadingUsage(false))
  }, [])

  const handleProfileSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      // TODO: 增加真实 profile update API。
      await new Promise((resolve) => setTimeout(resolve, 500))
      await update({ name: profile.name })
      setMessage({ type: "success", text: "个人资料已保存" })
    } catch {
      setMessage({ type: "error", text: "保存失败，请稍后重试" })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    setMessage(null)
    if (password.next !== password.confirm) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" })
      return
    }
    if (password.next.length < 6) {
      setMessage({ type: "error", text: "新密码至少需要 6 位" })
      return
    }
    setSaving(true)
    try {
      // TODO: 增加真实 password update API。
      await new Promise((resolve) => setTimeout(resolve, 500))
      setMessage({ type: "success", text: "密码已更新" })
      setPassword({ current: "", next: "", confirm: "" })
    } catch {
      setMessage({ type: "error", text: "密码更新失败" })
    } finally {
      setSaving(false)
    }
  }

  const userInitial = session?.user?.name?.[0] || session?.user?.email?.[0] || "U"

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">设置</h1>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-1.5">
            <Lock className="h-4 w-4" />
            修改密码
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            用量统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
              <CardDescription>管理你的账号基础信息。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
                </Avatar>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage({ type: "success", text: "头像上传功能待接入" })}
                  >
                    更换头像
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">支持 JPG、PNG，建议小于 2MB。</p>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((current) => ({ ...current, name: e.target.value }))}
                    placeholder="请输入姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                  <p className="text-xs text-muted-foreground">邮箱暂不支持修改。</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>更新你的登录密码。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword((current) => ({ ...current, current: e.target.value }))}
                  placeholder="请输入当前密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password.next}
                  onChange={(e) => setPassword((current) => ({ ...current, next: e.target.value }))}
                  placeholder="请输入新密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword((current) => ({ ...current, confirm: e.target.value }))}
                  placeholder="请再次输入新密码"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePasswordSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  更新密码
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用量统计</CardTitle>
              <CardDescription>查看当前账号的生成和存储用量。</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : usage ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">AI 生成次数</p>
                    <p className="mt-1 text-2xl font-bold">{usage.totalGenerations}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">剩余额度</p>
                    <p className="mt-1 text-2xl font-bold">
                      {Math.max(0, usage.monthLimit - usage.totalGenerations)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">图片数量</p>
                    <p className="mt-1 text-2xl font-bold">{usage.totalImages}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">存储用量</p>
                    <p className="mt-1 text-2xl font-bold">
                      {(usage.storageUsed / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">暂无用量数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
