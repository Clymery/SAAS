"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowRight,
  Brush,
  Clock,
  CreditCard,
  Download,
  FolderOpen,
  ImageIcon,
  Layers,
  Layers3,
  Loader2,
  Plus,
  Scissors,
  Sparkles,
  Upload,
  Wand2,
  X,
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

interface OptimizedPrompt {
  zh: string
  en: string
}

interface GenerationResult {
  prompt: OptimizedPrompt
  url: string
}

type GenStep = "idle" | "optimizing" | "generating" | "done" | "error"
type ImageModel = "stable-diffusion-ultra" | "gpt-image-2"

const MODEL_OPTIONS: { id: ImageModel; label: string; sublabel: string }[] = [
  { id: "stable-diffusion-ultra", label: "Stable Image Ultra", sublabel: "Stability AI" },
  { id: "gpt-image-2", label: "GPT Image 2", sublabel: "OpenAI" },
]

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // dashboard data
  const [projects, setProjects] = useState<Project[]>([])
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [assetCount, setAssetCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // prompt panel state
  const [selectedModel, setSelectedModel] = useState<ImageModel>("stable-diffusion-ultra")
  const [promptText, setPromptText] = useState("")
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [genStep, setGenStep] = useState<GenStep>("idle")
  const [genError, setGenError] = useState("")
  const [optimizedPrompts, setOptimizedPrompts] = useState<OptimizedPrompt[]>([])
  const [results, setResults] = useState<GenerationResult[]>([])

  useEffect(() => {
    if (status !== "authenticated") return
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/usage").then((r) => r.json()),
      fetch("/api/assets").then((r) => r.json()),
    ])
      .then(([p, u, a]) => {
        setProjects(Array.isArray(p) ? p : [])
        setUsage(u)
        setAssetCount(Array.isArray(a) ? a.length : 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [status])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const handleImageSelect = useCallback(async (file: File) => {
    setUploadingImage(true)
    const preview = URL.createObjectURL(file)
    setReferenceImagePreview(preview)

    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) throw new Error("上传失败")
      const { url } = await res.json()
      setReferenceImageUrl(url)
    } catch {
      setReferenceImagePreview(null)
      setReferenceImageUrl(null)
    } finally {
      setUploadingImage(false)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!promptText.trim() || genStep !== "idle") return
    setGenError("")
    setResults([])
    setOptimizedPrompts([])

    // Step 1: optimize prompts via DeepSeek
    setGenStep("optimizing")
    let prompts: OptimizedPrompt[]
    try {
      const res = await fetch("/api/ai/optimize-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: promptText, imageUrl: referenceImageUrl }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || "提示词优化失败")
      }
      const data = await res.json()
      prompts = data.prompts as OptimizedPrompt[]
      setOptimizedPrompts(prompts)
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "提示词优化失败")
      setGenStep("error")
      return
    }

    // Step 2: generate images in parallel
    setGenStep("generating")
    try {
      const imageResults = await Promise.all(
        prompts.map(async (prompt) => {
          const res = await fetch("/api/ai/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt.en, model: selectedModel }),
          })
          if (!res.ok) {
            const { error } = await res.json()
            throw new Error(error || "图片生成失败")
          }
          const { url } = await res.json()
          return { prompt, url } as GenerationResult
        })
      )
      setResults(imageResults)
      setGenStep("done")
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "图片生成失败")
      setGenStep("error")
    }
  }, [promptText, referenceImageUrl, genStep])

  const handleDownload = useCallback((url: string, index: number) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `pattern-design-${index + 1}.jpg`
    a.click()
  }, [])

  const resetGeneration = useCallback(() => {
    setGenStep("idle")
    setGenError("")
    setResults([])
    setOptimizedPrompts([])
  }, [])

  const isGenerating = genStep === "optimizing" || genStep === "generating"

  if (status === "loading" || loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (status === "unauthenticated") return null

  const recentProjects = projects.slice(0, 6)
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" })

  return (
    <div className="space-y-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center pt-5 text-center text-[#6a4f3e] sm:pt-10">
        <h1 className="font-serif text-4xl font-semibold tracking-normal text-[#6a4f3e] drop-shadow-[0_2px_12px_rgba(255,248,236,0.7)] sm:text-5xl">
          创意由你，尽情释放
        </h1>
        <p className="mt-3 text-sm font-semibold text-[#80644d] drop-shadow-[0_2px_10px_rgba(255,248,236,0.65)] sm:text-base">
          用 AI 生成家居家纺图案设计参考图，一句话描述，即刻呈现
        </p>

        {/* Prompt Panel */}
        <div className="mt-14 flex min-h-36 w-full flex-col gap-4 rounded-[28px] border border-[#f4dfc5]/55 bg-[#fff7ea]/64 p-4 text-left shadow-[0_20px_60px_rgba(118,82,55,0.12)] backdrop-blur-xl sm:p-5">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
            <div className="flex h-10 items-center gap-2 rounded-full border border-[#d8b48b]/45 bg-[#e4c09a]/75 px-4 text-sm font-semibold text-[#5b4030] shadow-sm shadow-[#b58b5f]/10">
              <ImageIcon className="h-4 w-4" />
              生成模型
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {MODEL_OPTIONS.map((opt) => {
                const active = selectedModel === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setSelectedModel(opt.id)}
                    className={`flex flex-col items-start rounded-2xl border px-3 py-1.5 text-left transition-all disabled:opacity-50 ${
                      active
                        ? "border-[#b98d66]/60 bg-[#e4c09a]/70 shadow-sm shadow-[#b58b5f]/15"
                        : "border-[#ead8c1]/65 bg-[#fff6e8]/58 hover:bg-[#fff0dc]/78"
                    }`}
                  >
                    <span className={`text-xs font-semibold ${active ? "text-[#4f3d30]" : "text-[#6b5040]"}`}>
                      {opt.label}
                    </span>
                    <span className={`text-[10px] ${active ? "text-[#7a604b]" : "text-[#9b826d]"}`}>
                      {opt.sublabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Reference image preview */}
          {referenceImagePreview && (
            <div className="flex items-center gap-2 px-1">
              <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-[#e0c8a8]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={referenceImagePreview} alt="参考图" className="h-full w-full object-cover" />
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setReferenceImageUrl(null); setReferenceImagePreview(null) }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a57c]/60 text-[#5b4030]"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="text-xs text-[#9b826d]">参考图已上传</span>
            </div>
          )}

          {/* Textarea */}
          <div className="flex flex-1 items-start rounded-2xl bg-[#fffdf7]/38 px-3 py-2">
            <textarea
              className="w-full resize-none bg-transparent text-lg font-medium text-[#4f3d30] placeholder-[#9b826d] focus:outline-none"
              rows={3}
              placeholder="描述你想要的图案风格，例如：夏日清爽风，绿植藤蔓，水彩晕染，适合床品印花..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageSelect(file)
                e.target.value = ""
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || uploadingImage}
              className="flex h-11 items-center gap-2 rounded-full border border-[#ead8c1]/55 bg-[#fff8ec]/62 px-4 text-sm font-medium text-[#7a604b] shadow-sm shadow-[#b58b5f]/5 transition-colors hover:bg-[#fff0dc]/78 disabled:opacity-50"
            >
              {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {referenceImagePreview ? "更换参考图" : "上传参考图"}
            </button>

            <button
              type="button"
              onClick={genStep === "done" || genStep === "error" ? resetGeneration : handleGenerate}
              disabled={isGenerating || !promptText.trim() || uploadingImage}
              className="flex h-12 items-center gap-2 rounded-full border border-[#a87855]/30 bg-[#b98d66]/88 px-5 text-sm font-semibold text-[#fffaf1] shadow-[0_10px_24px_rgba(126,82,51,0.16)] transition-colors hover:bg-[#aa7a55]/90 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 fill-[#fffaf1]" />
              )}
              {genStep === "optimizing" && "优化提示词中..."}
              {genStep === "generating" && "生成图片中..."}
              {(genStep === "done" || genStep === "error") && "重新生成"}
              {genStep === "idle" && "生成"}
            </button>
          </div>
        </div>

        {/* Error state */}
        {genStep === "error" && genError && (
          <div className="mt-4 w-full rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
            {genError}
          </div>
        )}

        {/* Optimized prompts display */}
        {optimizedPrompts.length > 0 && (
          <div className="mt-6 w-full text-left">
            <h2 className="mb-3 text-base font-semibold text-[#4f3d30]">优化后的提示词</h2>
            <div className="flex flex-col gap-3">
              {optimizedPrompts.map((p, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#efe0cd]/80 bg-[#fffaf1]/90 px-4 py-3 shadow-[0_6px_18px_rgba(95,65,43,0.07)]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-[#e4c09a]/75 px-2.5 py-0.5 text-xs font-semibold text-[#5b4030]">
                      方案 {i + 1}
                    </span>
                  </div>
                  <p className="mb-2 text-sm leading-relaxed text-[#4f3d30]">
                    <span className="mr-1 font-medium text-[#7a604b]">中文：</span>
                    {p.zh}
                  </p>
                  <p className="text-xs leading-relaxed text-[#8d7660]">
                    <span className="mr-1 font-medium text-[#9b826d]">English:</span>
                    {p.en}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generation results */}
        {results.length > 0 && (
          <div className="mt-6 w-full text-left">
            <h2 className="mb-4 text-base font-semibold text-[#4f3d30]">生成结果</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {results.map((result, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.url}
                    alt={`generated-${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="mb-3 line-clamp-2 text-xs text-[#8d7660]">{result.prompt.zh}</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(result.url, i)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-[#dfcbb4] bg-[#fffaf1] py-1.5 text-xs font-medium text-[#5f4938] hover:bg-[#f5e8d6]"
                      >
                        <Download className="h-3 w-3" />
                        下载
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push("/projects")}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#6b4a37] py-1.5 text-xs font-medium text-[#fffaf1] hover:bg-[#7a563f]"
                      >
                        <Wand2 className="h-3 w-3" />
                        在 Studio 编辑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature shortcuts */}
        <div className="mt-8 flex w-full flex-wrap justify-center gap-3">
          {[
            { label: "花卉图案", icon: Sparkles, href: "/projects" },
            { label: "几何纹样", icon: Layers3, href: "/projects" },
            { label: "新中式", icon: Brush, href: "/projects" },
            { label: "北欧简约", icon: Scissors, href: "/projects" },
            { label: "热带风情", icon: Wand2, href: "/projects" },
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

      {/* Stats cards */}
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

      {/* Quick actions */}
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

      {/* Recent projects */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#4f3d30]">最近项目</h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-sm font-medium text-[#6f503d] hover:text-[#4f3d30] hover:underline"
          >
            查看全部 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="还没有项目"
            description="创建第一个项目，开始制作你的 AI 商品视觉素材。"
            action={{ label: "新建项目", onClick: () => router.push("/projects") }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/studio/${project.id}`}>
                <Card className="h-full cursor-pointer rounded-2xl border-[#efe0cd]/80 bg-[#fffaf1]/90 shadow-[0_14px_34px_rgba(95,65,43,0.10)] transition-shadow hover:shadow-[0_18px_42px_rgba(95,65,43,0.16)]">
                  <div className="relative aspect-video overflow-hidden rounded-t-2xl bg-[#f4eadc]">
                    {project.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="h-full w-full object-cover"
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
