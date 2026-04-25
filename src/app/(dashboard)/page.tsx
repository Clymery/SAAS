"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  Brush,
  Clock,
  CreditCard,
  FolderOpen,
  ImageIcon,
  Layers,
  Layers3,
  Plus,
  Scissors,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Project } from "@/types"

interface UsageStats {
  totalGenerations: number
  monthLimit: number
  storageUsed: number
  totalImages: number
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [assetCount, setAssetCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status !== "authenticated") return

    Promise.all([
      fetch("/api/projects").then((res) => res.json()),
      fetch("/api/usage").then((res) => res.json()),
      fetch("/api/assets").then((res) => res.json()),
    ])
      .then(([projectsData, usageData, assetsData]) => {
        setProjects(Array.isArray(projectsData) ? projectsData : [])
        setUsage(usageData)
        setAssetCount(Array.isArray(assetsData) ? assetsData.length : 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading" || loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (status === "unauthenticated") return null

  const recentProjects = projects.slice(0, 6)
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

  return (
    <div className="space-y-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center pt-5 text-center text-white sm:pt-10">
        <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
          创意由你，尽情释放
        </h1>
        <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
          用 AI 快速制作商品场景图、背景图和可投放营销素材
        </p>

        <div className="mt-14 w-full rounded-[28px] border border-white/20 bg-gray-950/50 p-3 text-left shadow-2xl shadow-black/25 backdrop-blur-xl">
          <div className="flex min-h-36 flex-col gap-4 rounded-[22px] border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                <ImageIcon className="h-4 w-4" />
                生成
              </button>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/70">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2">
                  商品图 Pro
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2">
                  高清
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2">
                  1:1
                </span>
              </div>
            </div>

            <div className="flex flex-1 items-center">
              <p className="text-lg font-medium text-white/60">
                描述你想要的商品场景、风格或背景...
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-full bg-white/10 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/20"
              >
                <Plus className="h-4 w-4" />
                图片
              </button>
              <button
                type="button"
                className="flex h-12 items-center gap-2 rounded-full bg-white/20 px-5 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-colors hover:bg-white/25"
              >
                <Sparkles className="h-4 w-4 fill-white" />
                生成
                <span className="rounded-full bg-white/20 px-2 py-0.5 tabular-nums">2</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex w-full flex-wrap justify-center gap-3">
          {[
            { label: "商品场景", icon: Sparkles, href: "/projects" },
            { label: "背景替换", icon: Brush, href: "/projects" },
            { label: "智能抠图", icon: Scissors, href: "/assets" },
            { label: "批量变体", icon: Layers3, href: "/projects" },
            { label: "万能画布", icon: Wand2, href: "/projects" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.href)}
              className="flex min-h-[52px] items-center gap-2 rounded-full border border-white/20 bg-gray-950/50 px-6 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AI 生成次数</p>
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
                <p className="text-sm text-muted-foreground">项目数量</p>
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
                <p className="text-sm text-muted-foreground">素材数量</p>
                <p className="text-2xl font-bold">{assetCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">快速开始</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => router.push("/projects")}>
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            <FolderOpen className="mr-2 h-4 w-4" />
            查看项目
          </Button>
          <Button variant="outline" onClick={() => router.push("/assets")}>
            <Upload className="mr-2 h-4 w-4" />
            上传素材
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">最近项目</h2>
          <Link href="/projects" className="flex items-center gap-1 text-sm text-primary hover:underline">
            查看全部 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="还没有项目"
            description="创建第一个项目，开始制作你的 AI 商品视觉素材。"
            action={{
              label: "新建项目",
              onClick: () => router.push("/projects"),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/studio/${project.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <div className="relative aspect-video overflow-hidden rounded-t-xl bg-gray-100">
                    {project.coverImage ? (
                      // Kept as img because project covers can be local uploads or future signed URLs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
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
