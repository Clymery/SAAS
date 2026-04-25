"use client"

import { useCallback, useEffect, useState } from "react"
import { LayoutTemplate, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { loadCanvasFromJSON } from "@/lib/canvas"
import { useCanvasStore } from "@/stores/canvasStore"

interface Template {
  id: string
  name: string
  category: string
  scene?: string | null
  thumbnail: string
  width: number
  height: number
  canvasData?: string
}

const CATEGORIES = ["全部", "taobao", "tmall", "jd", "amazon"]
const SCENES = ["全部", "bedroom", "living_room", "studio", "festival"]

export default function TemplateModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const canvas = useCanvasStore((state) => state.canvas)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("全部")
  const [sceneFilter, setSceneFilter] = useState("全部")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) return

    const fetchTemplates = async () => {
      setLoading(true)
      setError("")
      try {
        const params = new URLSearchParams()
        if (categoryFilter !== "全部") params.append("category", categoryFilter)
        if (sceneFilter !== "全部") params.append("scene", sceneFilter)
        const res = await fetch(`/api/templates?${params.toString()}`)
        if (!res.ok) throw new Error("获取模板失败")
        const data = await res.json()
        setTemplates(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "获取模板失败")
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [open, categoryFilter, sceneFilter])

  const filteredTemplates = templates.filter((template) => {
    if (!search.trim()) return true
    return template.name.toLowerCase().includes(search.trim().toLowerCase())
  })

  const handleApply = useCallback(
    (template: Template) => {
      if (!canvas) return
      canvas.setDimensions({ width: template.width, height: template.height })
      if (template.canvasData) {
        try {
          loadCanvasFromJSON(canvas, template.canvasData)
        } catch {
          canvas.clear()
          canvas.backgroundColor = "#ffffff"
          canvas.renderAll()
        }
      } else {
        canvas.clear()
        canvas.backgroundColor = "#ffffff"
        canvas.renderAll()
      }
      useCanvasStore.getState().saveState()
      onClose()
    },
    [canvas, onClose]
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">模板库</h2>
          </div>
          <button className="rounded-md p-1 text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b px-6 py-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索模板..."
              className="flex-1 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">平台:</span>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    categoryFilter === category ? "border-gray-800 bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">场景:</span>
              {SCENES.map((scene) => (
                <button
                  key={scene}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                    sceneFilter === scene ? "border-gray-800 bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setSceneFilter(scene)}
                >
                  {scene}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-100 bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && filteredTemplates.length === 0 && (
            <p className="py-12 text-center text-gray-400">没有找到模板</p>
          )}

          {!loading && filteredTemplates.length > 0 && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-medium text-gray-800">{template.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {template.category}
                      </span>
                      {template.scene && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          {template.scene}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {template.width} x {template.height}
                    </p>
                    <Button size="sm" className="mt-2 w-full" onClick={() => handleApply(template)}>
                      应用模板
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
