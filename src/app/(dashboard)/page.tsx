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
  const handlePromptPanelAction = (action: string) => {
    void action
    // Reserved for later: wire prompt panel controls to generation settings.
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center pt-5 text-center text-[#6a4f3e] sm:pt-10">
        <h1 className="font-serif text-4xl font-semibold tracking-normal text-[#6a4f3e] drop-shadow-[0_2px_12px_rgba(255,248,236,0.7)] sm:text-5xl">
          创意由你，尽情释放
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#80644d] drop-shadow-[0_2px_10px_rgba(255,248,236,0.65)] sm:text-base">
          用 AI 快速制作商品场景图、背景图和可投放营销素材
        </p>

        <div className="mt-14 flex min-h-36 w-full flex-col gap-4 rounded-[28px] border border-[#f4dfc5]/55 bg-[#fff7ea]/64 p-4 text-left shadow-[0_20px_60px_rgba(118,82,55,0.12)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <button
              type="button"
              onClick={() => handlePromptPanelAction("mode:generate")}
              className="flex h-10 items-center gap-2 rounded-full border border-[#d8b48b]/45 bg-[#e4c09a]/75 px-4 text-sm font-semibold text-[#5b4030] shadow-sm shadow-[#b58b5f]/10 transition-colors hover:bg-[#dab187]/85"
            >
              <ImageIcon className="h-4 w-4" />
              生成
            </button>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#80644d]">
              <button
                type="button"
                onClick={() => handlePromptPanelAction("model:product-pro")}
                className="rounded-full border border-[#ead8c1]/65 bg-[#fff6e8]/58 px-3 py-2 shadow-sm shadow-[#b58b5f]/5 transition-colors hover:bg-[#fff0dc]/78"
              >
                商品图 Pro
              </button>
              <button
                type="button"
                onClick={() => handlePromptPanelAction("quality:hd")}
                className="rounded-full border border-[#ead8c1]/65 bg-[#fff6e8]/58 px-3 py-2 shadow-sm shadow-[#b58b5f]/5 transition-colors hover:bg-[#fff0dc]/78"
              >
                高清
              </button>
              <button
                type="button"
                onClick={() => handlePromptPanelAction("ratio:1:1")}
                className="rounded-full border border-[#ead8c1]/65 bg-[#fff6e8]/58 px-3 py-2 shadow-sm shadow-[#b58b5f]/5 transition-colors hover:bg-[#fff0dc]/78"
              >
                1:1
              </button>
            </div>
          </div>

          <div className="flex flex-1 items-center rounded-2xl bg-[#fffdf7]/38 px-1">
            <p className="text-lg font-medium text-[#9b826d]">
              描述你想要的商品场景、风格或背景...
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => handlePromptPanelAction("attach:image")}
              className="flex h-11 items-center gap-2 rounded-full border border-[#ead8c1]/55 bg-[#fff8ec]/62 px-4 text-sm font-medium text-[#7a604b] shadow-sm shadow-[#b58b5f]/5 transition-colors hover:bg-[#fff0dc]/78"
            >
              <Plus className="h-4 w-4" />
              图片
            </button>
            <button
              type="button"
              onClick={() => handlePromptPanelAction("submit")}
              className="flex h-12 items-center gap-2 rounded-full border border-[#a87855]/30 bg-[#b98d66]/88 px-5 text-sm font-semibold text-[#fffaf1] shadow-[0_10px_24px_rgba(126,82,51,0.16)] transition-colors hover:bg-[#aa7a55]/90"
            >
              <Sparkles className="h-4 w-4 fill-[#fffaf1]" />
              生成
              <span className="rounded-full bg-[#fff6e8]/25 px-2 py-0.5 tabular-nums">#</span>  {/* 这里放置的占位变量# */}
            </button>
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
              className="flex min-h-[52px] items-center gap-2 rounded-full border border-[#f5e4cf]/80 bg-[#fff8ec]/75 px-6 text-sm font-semibold text-[#684f3d] shadow-lg shadow-[#8a6240]/15 backdrop-blur-md transition-colors hover:bg-[#f4dfc5]/85"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)] backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ede4ff] text-[#8b78b8]">
                <Wand2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#8d7660]">AI 生成次数</p>
                <p className="text-2xl font-bold text-[#4f3d30]">{usage?.totalGenerations ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)] backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff3e9] text-[#6aa184]">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#8d7660]">剩余额度</p>
                <p className="text-2xl font-bold text-[#4f3d30]">
                  {usage ? Math.max(0, usage.monthLimit - usage.totalGenerations) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)] backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff0cf] text-[#c29248]">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#8d7660]">项目数量</p>
                <p className="text-2xl font-bold text-[#4f3d30]">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)] backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffe3e8] text-[#c98291]">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#8d7660]">素材数量</p>
                <p className="text-2xl font-bold text-[#4f3d30]">{assetCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#4f3d30]">快速开始</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push("/projects")}
            className="bg-[#6b4a37] text-[#fffaf1] shadow-sm shadow-[#8a6240]/20 hover:bg-[#7a563f]"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建项目
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/projects")}
            className="border-[#dfcbb4] bg-[#fffaf1]/85 text-[#5f4938] shadow-sm shadow-[#8a6240]/10 hover:bg-[#f5e8d6] hover:text-[#4f3d30]"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            查看项目
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/assets")}
            className="border-[#dfcbb4] bg-[#fffaf1]/85 text-[#5f4938] shadow-sm shadow-[#8a6240]/10 hover:bg-[#f5e8d6] hover:text-[#4f3d30]"
          >
            <Upload className="mr-2 h-4 w-4" />
            上传素材
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#4f3d30]">最近项目</h2>
          <Link href="/projects" className="flex items-center gap-1 text-sm font-medium text-[#6f503d] hover:text-[#4f3d30] hover:underline">
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
                <Card className="h-full cursor-pointer rounded-2xl border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)] transition-shadow hover:shadow-[0_18px_42px_rgba(95,65,43,0.16)]">
                  <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-[#f4eadc]">
                    {project.coverImage ? (
                      // Kept as img because project covers can be local uploads or future signed URLs.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#b59a7e]">
                        <Layers className="h-8 w-8 opacity-40" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base text-[#4f3d30]">{project.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 text-[#8d7660]">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-[#8d7660]">
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
