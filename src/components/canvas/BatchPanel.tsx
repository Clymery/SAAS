"use client"

import { useCallback, useRef, useState } from "react"
import JSZip from "jszip"
import { Download, ImagePlus, Loader2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCanvasStore } from "@/stores/canvasStore"

interface BatchJob {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  resultUrl?: string
}

const STYLE_PRESETS = [
  { label: "简约高级", prompt: "minimal premium product scene, soft natural light, clean composition" },
  { label: "温暖家居", prompt: "warm home interior, cozy atmosphere, realistic commercial product photography" },
  { label: "清新春夏", prompt: "fresh spring summer style, airy colors, refined textile product scene" },
  { label: "轻奢质感", prompt: "luxury product scene, premium material, elegant lighting" },
]

const QUANTITY_OPTIONS = [1, 5, 10, 20]

export default function BatchPanel({ projectId }: { projectId: string }) {
  const canvas = useCanvasStore((state) => state.canvas)
  const [prompt, setPrompt] = useState("")
  const [quantity, setQuantity] = useState(5)
  const [productImageUrl, setProductImageUrl] = useState("")
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [running, setRunning] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("上传图片失败")
      const { url } = await res.json()
      setProductImageUrl(url)
      setError("")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "上传图片失败")
    }
    e.target.value = ""
  }, [])

  const useCanvasImage = useCallback(() => {
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (active && active.type === "image") {
      setProductImageUrl(active.toDataURL({ format: "png", multiplier: 1 }))
      setError("")
    } else {
      setError("请先在画布中选择一张图片")
    }
  }, [canvas])

  const runBatch = useCallback(async () => {
    if (!prompt.trim()) {
      setError("请输入批量生成提示词")
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
      setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, ...updates } : job)))
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
              metadata: { inputImageUrl: productImageUrl || undefined, style: "batch" },
            }),
          })
          if (!res.ok) throw new Error("创建批量任务失败")
          const generation = await res.json()

          await fetch("/api/ai/mock-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "batch", generationId: generation.id, inputImageUrl: productImageUrl || undefined }),
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
    const completed = jobs.filter((job) => job.status === "completed" && job.resultUrl)
    if (completed.length === 0) return
    const zip = new JSZip()
    await Promise.all(
      completed.map(async (job, index) => {
        if (!job.resultUrl) return
        const res = await fetch(job.resultUrl)
        const blob = await res.blob()
        zip.file(`batch-result-${index + 1}.jpg`, blob)
      })
    )
    const content = await zip.generateAsync({ type: "blob" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(content)
    link.download = "batch-results.zip"
    link.click()
  }, [jobs])

  const completedCount = jobs.filter((job) => job.status === "completed").length
  const progress = jobs.length > 0 ? Math.round((completedCount / jobs.length) * 100) : 0

  return (
    <div className="h-full overflow-y-auto border-l bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Package className="h-4 w-4" />
        批量生成
      </div>

      {error && <div className="mb-3 rounded-md border border-red-100 bg-red-50 p-2 text-xs text-red-600">{error}</div>}

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-500">商品图片</label>
        <div className="mb-2 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={useCanvasImage}>
            使用画布图片
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="mr-1 h-3.5 w-3.5" />
            上传图片
          </Button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {productImageUrl && (
          <div className="mt-2 aspect-video overflow-hidden rounded-md border bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={productImageUrl} alt="product" className="h-full w-full object-contain" />
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-500">生成提示词</label>
        <textarea
          className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="描述要批量生成的场景风格..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="mt-1 flex flex-wrap gap-1">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
              onClick={() => setPrompt(preset.prompt)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-gray-500">生成数量</label>
        <div className="flex gap-2">
          {QUANTITY_OPTIONS.map((option) => (
            <button
              key={option}
              className={`flex-1 rounded-md border py-1.5 text-sm transition-colors ${
                quantity === option ? "border-gray-800 bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setQuantity(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <Button className="mb-4 w-full" size="sm" disabled={running || !prompt.trim()} onClick={runBatch}>
        {running ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Package className="mr-1 h-4 w-4" />}
        开始批量生成
      </Button>

      {jobs.length > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>进度</span>
            <span>{completedCount} / {jobs.length}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 space-y-1">
            {jobs.map((job, index) => (
              <div key={job.id} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">任务 {index + 1}</span>
                <span className={job.status === "completed" ? "text-green-600" : job.status === "failed" ? "text-red-500" : job.status === "processing" ? "text-blue-500" : "text-gray-400"}>
                  {job.status === "completed" ? "已完成" : job.status === "failed" ? "失败" : job.status === "processing" ? "生成中..." : "等待中"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedCount > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-medium text-gray-500">生成结果</label>
            <button className="text-xs text-blue-600 hover:underline" onClick={handleDownloadZip}>
              下载全部 ZIP
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {jobs.map(
              (job, index) =>
                job.resultUrl && (
                  <div key={job.id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-md border bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={job.resultUrl} alt={`result-${index}`} className="h-full w-full object-cover" />
                    </div>
                    <button
                      className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => handleDownload(job.resultUrl!, index)}
                    >
                      <Download className="h-5 w-5" />
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
