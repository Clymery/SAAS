"use client"

import { useCallback, useState } from "react"
import { FabricImage } from "fabric"
import { Loader2, Scissors, Sparkles, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCanvasStore } from "@/stores/canvasStore"

const STYLE_PRESETS = [
  { label: "简约高级", prompt: "minimal premium product scene, soft natural light, clean composition, realistic texture" },
  { label: "温暖家居", prompt: "warm home interior scene, cozy fabric texture, natural daylight, commercial product photography" },
  { label: "清新春夏", prompt: "fresh spring summer bedding scene, airy colors, elegant floral details, refined product styling" },
  { label: "新中式", prompt: "modern Chinese style interior, elegant patterns, calm neutral palette, premium textile product scene" },
  { label: "轻奢质感", prompt: "luxury lifestyle product scene, refined material, soft shadows, high-end commercial photography" },
]

export default function AIPanel({ projectId }: { projectId: string }) {
  const canvas = useCanvasStore((state) => state.canvas)
  const activeObject = useCanvasStore((state) => state.activeObject)
  const saveState = useCanvasStore((state) => state.saveState)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [error, setError] = useState("")
  const [bgRemoving, setBgRemoving] = useState(false)

  const isImageSelected = activeObject?.type === "image"

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setGeneratedImages([])

    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "scene",
          prompt: prompt.trim(),
          projectId,
          metadata: { style: "custom" },
        }),
      })
      if (!res.ok) throw new Error("创建生成任务失败")
      const generation = await res.json()

      await fetch("/api/ai/mock-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "scene", generationId: generation.id }),
      })

      const poll = setInterval(async () => {
        const pollRes = await fetch(`/api/generations/${generation.id}`)
        const data = await pollRes.json()
        if (data.status === "completed") {
          clearInterval(poll)
          setGeneratedImages(data.resultUrl ? [data.resultUrl] : [])
          setLoading(false)
        } else if (data.status === "failed") {
          clearInterval(poll)
          setError("生成失败")
          setLoading(false)
        }
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "生成失败")
      setLoading(false)
    }
  }, [prompt, projectId])

  const handleSetBackground = useCallback(
    async (url: string) => {
      if (!canvas) return
      try {
        const img = await FabricImage.fromURL(url, { crossOrigin: "anonymous" })
        const cw = canvas.width ?? 800
        const ch = canvas.height ?? 800
        const scale = Math.min(cw / (img.width || cw), ch / (img.height || ch), 1)
        img.scale(scale)
        img.set({ originX: "center", originY: "center", left: cw / 2, top: ch / 2 })
        canvas.backgroundImage = img
        canvas.renderAll()
        saveState()
      } catch {
        setError("设置背景失败")
      }
    },
    [canvas, saveState]
  )

  const handleBgRemoval = useCallback(async () => {
    if (!canvas || !activeObject || activeObject.type !== "image") return
    setBgRemoving(true)
    setError("")

    try {
      const dataUrl = activeObject.toDataURL({ format: "png", multiplier: 1 })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], "image.png", { type: "image/png" })
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("上传图片失败")
      const { url } = await uploadRes.json()

      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "background_removal",
          projectId,
          metadata: { inputImageUrl: url },
        }),
      })
      if (!res.ok) throw new Error("创建抠图任务失败")
      const generation = await res.json()

      await fetch("/api/ai/mock-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "background_removal", generationId: generation.id, inputImageUrl: url }),
      })

      const poll = setInterval(async () => {
        const pollRes = await fetch(`/api/generations/${generation.id}`)
        const data = await pollRes.json()
        if (data.status === "completed") {
          clearInterval(poll)
          const img = await FabricImage.fromURL(data.resultUrl, { crossOrigin: "anonymous" })
          img.set({
            left: activeObject.left,
            top: activeObject.top,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
            angle: activeObject.angle,
            originX: activeObject.originX,
            originY: activeObject.originY,
          })
          canvas.remove(activeObject)
          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()
          saveState()
          setBgRemoving(false)
        } else if (data.status === "failed") {
          clearInterval(poll)
          setError("抠图失败")
          setBgRemoving(false)
        }
      }, 1000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "抠图失败")
      setBgRemoving(false)
    }
  }, [canvas, activeObject, projectId, saveState])

  return (
    <div className="h-full overflow-y-auto border-l bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Sparkles className="h-4 w-4" />
        AI 工具
      </div>

      {error && <div className="mb-3 rounded-md border border-red-100 bg-red-50 p-2 text-xs text-red-600">{error}</div>}

      <div className="mb-6">
        <label className="mb-2 block text-xs font-medium text-gray-500">场景生成</label>
        <textarea
          className="w-full resize-none rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="描述你想要的商品场景，例如：清爽春夏家纺场景，柔和自然光，浅色背景..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-1">
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
        <Button className="mt-2 w-full" size="sm" disabled={loading || !prompt.trim()} onClick={handleGenerate}>
          {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
          生成场景
        </Button>
      </div>

      {generatedImages.length > 0 && (
        <div className="mb-6">
          <label className="mb-2 block text-xs font-medium text-gray-500">生成结果</label>
          <div className="grid grid-cols-2 gap-2">
            {generatedImages.map((url, index) => (
              <button
                key={index}
                className="relative aspect-square overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-blue-500"
                onClick={() => handleSetBackground(url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`generated-${index}`} className="h-full w-full object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 py-0.5 text-center text-[10px] text-white">
                  设为背景
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2">
        <label className="mb-2 block text-xs font-medium text-gray-500">背景移除</label>
        <Button className="w-full" size="sm" variant="outline" disabled={!isImageSelected || bgRemoving} onClick={handleBgRemoval}>
          {bgRemoving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Scissors className="mr-1 h-4 w-4" />}
          移除背景
        </Button>
        {!isImageSelected && <p className="mt-1 text-center text-[10px] text-gray-400">请选择一张图片后再抠图</p>}
      </div>
    </div>
  )
}
