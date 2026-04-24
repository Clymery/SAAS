"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { User, Lock, BarChart3, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  })

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  })

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
      // Mock profile update - in real app this would call an API
      await new Promise((r) => setTimeout(r, 500))
      await update({ name: profile.name })
      setMessage({ type: "success", text: "个人资料已更新" })
    } catch {
      setMessage({ type: "error", text: "更新失败" })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSave = async () => {
    setMessage(null)
    if (password.new !== password.confirm) {
      setMessage({ type: "error", text: "两次输入的新密码不一致" })
      return
    }
    if (password.new.length < 6) {
      setMessage({ type: "error", text: "新密码至少需要6位" })
      return
    }
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 500))
      setMessage({ type: "success", text: "密码修改成功" })
      setPassword({ current: "", new: "", confirm: "" })
    } catch {
      setMessage({ type: "error", text: "密码修改失败" })
    } finally {
      setSaving(false)
    }
  }

  const userInitial = session?.user?.name?.[0] || session?.user?.email?.[0] || "U"

  return (
    <div className="space-y-6 max-w-3xl">
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
            使用统计
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>个人资料</CardTitle>
              <CardDescription>管理您的个人信息和头像</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" onClick={() => setMessage({ type: "success", text: "头像上传功能即将上线" })}>
                    更换头像
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG 格式，最大 2MB</p>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    placeholder="您的姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    disabled
                    placeholder="您的邮箱"
                  />
                  <p className="text-xs text-muted-foreground">邮箱地址暂不支持修改</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProfileSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>更新您的登录密码</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={password.current}
                  onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                  placeholder="输入当前密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password.new}
                  onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
                  placeholder="输入新密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={password.confirm}
                  onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                  placeholder="再次输入新密码"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handlePasswordSave} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  更新密码
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>使用统计</CardTitle>
              <CardDescription>查看您的账号使用情况和额度</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingUsage ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : usage ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">本月生成次数</p>
                    <p className="text-2xl font-bold mt-1">{usage.totalGenerations}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">剩余额度</p>
                    <p className="text-2xl font-bold mt-1">
                      {Math.max(0, usage.monthLimit - usage.totalGenerations)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">已生成图片数</p>
                    <p className="text-2xl font-bold mt-1">{usage.totalImages}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">存储使用量</p>
                    <p className="text-2xl font-bold mt-1">
                      {(usage.storageUsed / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">暂无统计数据</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
