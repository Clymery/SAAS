"use client"

import { useState, useRef, useCallback } from "react"
import { useCanvasStore } from "@/stores/canvasStore"
import { Button } from "@/components/ui/button"
import { Loader2, Download, ImagePlus, Package } from "lucide-react"
import JSZip from "jszip"

interface BatchJob {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  resultUrl?: string
}

const STYLE_PRESETS = [
  { label: "北欧简约", prompt: "北欧简约风格卧室，自然光线，白色床单，木质家具，温馨舒适" },
  { label: "现代奢华", prompt: "现代奢华风格卧室，金色装饰，大理石纹理，高端酒店感，柔和灯光" },
  { label: "田园温馨", prompt: "田园温馨风格卧室，碎花图案，暖色调，阳光透过窗帘，舒适惬意" },
  { label: "日式极简", prompt: "日式极简风格卧室，榻榻米，原木色，简洁线条，宁静禅意" },
  { label: "酒店风", prompt: "高端酒店风格卧室，整洁铺床，白色床品，落地窗，城市景观" },
]

const QUANTITY_OPTIONS = [1, 5, 10, 20]

export default function BatchPanel({ projectId }: { projectId: string }) {
  const canvas = useCanvasStore((s) => s.canvas)
  const [prompt, setPrompt] = useState("")
  const [quantity, setQuantity] = useState(5)
  const [productImageUrl, setProductImageUrl] = useState<string>("")
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("上传失败")
        const { url } = await res.json()
        setProductImageUrl(url)
        setError("")
      } catch (e: any) {
        setError(e.message || "上传失败")
      }
      e.target.value = ""
    },
    []
  )

  const useCanvasImage = useCallback(() => {
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active && active.type === "image") {
      const dataUrl = active.toDataURL({ format: "png", multiplier: 1 })
      setProductImageUrl(dataUrl)
      setError("")
    } else {
      setError("请先选择画布中的一张图片")
    }
  }, [canvas])

  const runBatch = useCallback(async () => {
    if (!prompt.trim()) {
      setError("请输入场景描述")
      return
    }
    setRunning(true)
    setError("")
    setJobs([])

    const newJobs: BatchJob[] = Array.from({ length: quantity }).map(() => ({
      id: Math.random().toString(36).slice(2),
      status: "pending",
    }))
    setJobs(newJobs)

    const updateJob = (id: string, updates: Partial<BatchJob>) => {
      setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)))
    }

    await Promise.all(
      newJobs.map(async (job) => {
        try {
          updateJob(job.id, { status: "processing" })

          const res = await fetch("/api/generations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "batch",
              prompt: prompt.trim(),
              projectId,
              metadata: JSON.stringify({
                inputImageUrl: productImageUrl || undefined,
                style: "batch",
              }),
            }),
          })
          if (!res.ok) throw new Error("请求失败")
          const generation = await res.json()

          await fetch("/api/ai/mock-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "batch",
              generationId: generation.id,
              inputImageUrl: productImageUrl || undefined,
            }),
          })

          await new Promise<void>((resolve, reject) => {
            const poll = setInterval(async () => {
              const pollRes = await fetch(`/api/generations/${generation.id}`)
              const data = await pollRes.json()
              if (data.status === "completed") {
                clearInterval(poll)
                updateJob(job.id, { status: "completed", resultUrl: data.resultUrl })
                resolve()
              } else if (data.status === "failed") {
                clearInterval(poll)
                updateJob(job.id, { status: "failed" })
                reject(new Error("生成失败"))
              }
            }, 1200)
          })
        } catch {
          updateJob(job.id, { status: "failed" })
        }
      })
    )

    setRunning(false)
  }, [prompt, quantity, productImageUrl, projectId])

  const handleDownload = useCallback((url: string, index: number) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `batch-result-${index + 1}.jpg`
    link.click()
  }, [])

  const handleDownloadZip = useCallback(async () => {
    const completed = jobs.filter((j) => j.status === "completed" && j.resultUrl)
    if (completed.length === 0) return
    const zip = new JSZip()
    await Promise.all(
      completed.map(async (job, i) => {
        if (!job.resultUrl) return
        const res = await fetch(job.resultUrl)
        const blob = await res.blob()
        zip.file(`batch-result-${i + 1}.jpg`, blob)
      })
    )
    const content = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(content)
    link.download = "batch-results.zip"
    link.click()
  }, [jobs])

  const completedCount = jobs.filter((j) => j.status === "completed").length
  const progress = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0

  return (
    <div className="h-full bg-white border-l overflow-y-auto p-4">
      <div className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Package className="w-4 h-4" />
        批量生成
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
          {error}
        </div>
      )}

      {/* Product Image */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">产品图片</label>
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={useCanvasImage}>
            使用画布图片
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="w-3.5 h-3.5 mr-1" />
            上传新图
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {productImageUrl && (
          <div className="mt-2 rounded-md overflow-hidden border aspect-video bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImageUrl} alt="product" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">场景描述</label>
        <textarea
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          placeholder="描述场景风格..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="mt-1 flex flex-wrap gap-1">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-600 transition-colors"
              onClick={() => setPrompt(preset.prompt)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 mb-2">生成数量</label>
        <div className="flex gap-2">
          {QUANTITY_OPTIONS.map((q) => (
            <button
              key={q}
              className={`flex-1 py-1.5 text-sm border rounded-md transition-colors ${
                quantity === q ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setQuantity(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Run */}
      <Button className="w-full mb-4" size="sm" disabled={running || !prompt.trim()} onClick={runBatch}>
        {running ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Package className="w-4 h-4 mr-1" />}
        批量生成
      </Button>

      {/* Progress */}
      {jobs.length > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>进度</span>
            <span>{completedCount} / {jobs.length}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 space-y-1">
            {jobs.map((job, i) => (
              <div key={job.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">任务 {i + 1}</span>
                <span
                  className={`${
                    job.status === "completed"
                      ? "text-green-600"
                      : job.status === "failed"
                      ? "text-red-500"
                      : job.status === "processing"
                      ? "text-blue-500"
                      : "text-gray-400"
                  }`}
                >
                  {job.status === "completed"
                    ? "已完成"
                    : job.status === "failed"
                    ? "失败"
                    : job.status === "processing"
                    ? "生成中..."
                    : "等待中"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {completedCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-500">生成结果</label>
            <button className="text-xs text-blue-600 hover:underline" onClick={handleDownloadZip}>
              下载全部 (ZIP)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {jobs.map(
              (job, i) =>
                job.resultUrl && (
                  <div key={job.id} className="relative group">
                    <div className="aspect-square rounded-md overflow-hidden border bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={job.resultUrl} alt={`result-${i}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      onClick={() => handleDownload(job.resultUrl!, i)}
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
