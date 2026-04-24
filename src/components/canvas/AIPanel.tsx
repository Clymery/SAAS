"use client"

import { useState, useCallback } from "react"
import { useCanvasStore } from "@/stores/canvasStore"
import { Button } from "@/components/ui/button"
import { Loader2, Wand2, Scissors, Sparkles } from "lucide-react"
import { FabricImage } from "fabric"

const STYLE_PRESETS = [
  { label: "北欧简约", prompt: "北欧简约风格卧室，自然光线，白色床单，木质家具，温馨舒适" },
  { label: "现代奢华", prompt: "现代奢华风格卧室，金色装饰，大理石纹理，高端酒店感，柔和灯光" },
  { label: "田园温馨", prompt: "田园温馨风格卧室，碎花图案，暖色调，阳光透过窗帘，舒适惬意" },
  { label: "日式极简", prompt: "日式极简风格卧室，榻榻米，原木色，简洁线条，宁静禅意" },
  { label: "酒店风", prompt: "高端酒店风格卧室，整洁铺床，白色床品，落地窗，城市景观" },
]

export default function AIPanel({ projectId }: { projectId: string }) {
  const canvas = useCanvasStore((s) => s.canvas)
  const activeObject = useCanvasStore((s) => s.activeObject)
  const saveState = useCanvasStore((s) => s.saveState)
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
          metadata: JSON.stringify({ style: "custom" }),
        }),
      })
      if (!res.ok) throw new Error("生成请求失败")
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
          setGeneratedImages([data.resultUrl])
          setLoading(false)
        } else if (data.status === "failed") {
          clearInterval(poll)
          setError("生成失败")
          setLoading(false)
        }
      }, 1000)
    } catch (e: any) {
      setError(e.message || "生成失败")
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
        setError("背景设置失败")
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
      if (!uploadRes.ok) throw new Error("上传失败")
      const { url } = await uploadRes.json()

      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "background_removal",
          projectId,
          metadata: JSON.stringify({ inputImageUrl: url }),
        }),
      })
      if (!res.ok) throw new Error("抠图请求失败")
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
    } catch (e: any) {
      setError(e.message || "抠图失败")
      setBgRemoving(false)
    }
  }, [canvas, activeObject, projectId, saveState])

  return (
    <div className="h-full bg-white border-l overflow-y-auto p-4">
      <div className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        AI 功能
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded-md border border-red-100">
          {error}
        </div>
      )}

      {/* Scene Generation */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-gray-500 mb-2">场景生成</label>
        <textarea
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          placeholder="描述你想要的场景，例如：北欧风格卧室，晨光照射，白色床单..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap gap-1">
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
        <Button
          className="w-full mt-2"
          size="sm"
          disabled={loading || !prompt.trim()}
          onClick={handleGenerate}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wand2 className="w-4 h-4 mr-1" />}
          生成场景
        </Button>
      </div>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="mb-6">
          <label className="block text-xs font-medium text-gray-500 mb-2">生成结果</label>
          <div className="grid grid-cols-2 gap-2">
            {generatedImages.map((url, i) => (
              <button
                key={i}
                className="relative aspect-square rounded-md overflow-hidden border hover:ring-2 hover:ring-blue-500 transition-all"
                onClick={() => handleSetBackground(url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`generated-${i}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-0.5 text-center">
                  点击设为背景
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Background Removal */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-gray-500 mb-2">智能抠图</label>
        <Button
          className="w-full"
          size="sm"
          variant="outline"
          disabled={!isImageSelected || bgRemoving}
          onClick={handleBgRemoval}
        >
          {bgRemoving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Scissors className="w-4 h-4 mr-1" />}
          智能抠图
        </Button>
        {!isImageSelected && (
          <p className="text-[10px] text-gray-400 mt-1 text-center">请先选择一张图片</p>
        )}
      </div>
    </div>
  )
}
