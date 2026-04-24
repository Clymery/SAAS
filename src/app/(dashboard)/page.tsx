"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Plus,
  FolderOpen,
  Upload,
  Wand2,
  CreditCard,
  Layers,
  ImageIcon,
  Clock,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
// import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import { Project } from "@/types"

interface UsageStats {
  totalGenerations: number
  monthLimit: number
  storageUsed: number
  totalImages: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [assetCount, setAssetCount] = useState(0)
  const [_loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/projects").then((r) => r.json()),
        fetch("/api/usage").then((r) => r.json()),
        fetch("/api/assets").then((r) => r.json()),
      ])
        .then(([projectsData, usageData, assetsData]) => {
          setProjects(Array.isArray(projectsData) ? projectsData : [])
          setUsage(usageData)
          setAssetCount(Array.isArray(assetsData) ? assetsData.length : 0)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [status])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || _loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const recentProjects = projects.slice(0, 6)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          欢迎来到 Loom42，{session?.user?.name || "设计师"}
        </h1>
        <p className="mt-2 text-indigo-100 max-w-xl">
          开始您的 AI 家纺设计之旅，快速生成高质量的电商素材与设计方案。
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">本月生成次数</p>
                <p className="text-2xl font-bold">{usage?.totalGenerations ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">剩余额度</p>
                <p className="text-2xl font-bold">
                  {usage ? Math.max(0, usage.monthLimit - usage.totalGenerations) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">项目总数</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">素材总数</p>
                <p className="text-2xl font-bold">{assetCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-lg font-semibold mb-4">快速开始</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/projects")}>
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            <FolderOpen className="mr-2 h-4 w-4" />
            打开最近项目
          </Button>
          <Button variant="outline" onClick={() => router.push("/assets")}>
            <Upload className="mr-2 h-4 w-4" />
            上传素材
          </Button>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">最近项目</h2>
          <Link
            href="/projects"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            查看全部 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="暂无项目"
            description="您还没有创建任何项目，点击上方按钮开始创建。"
            action={{
              label: "新建项目",
              onClick: () => router.push("/projects"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/studio/${project.id}`}>
                <Card className="group hover:shadow-md transition-shadow cursor-pointer h-full">
                  <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-xl">
                    {project.coverImage ? (
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Layers className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {project.width} x {project.height} px
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
