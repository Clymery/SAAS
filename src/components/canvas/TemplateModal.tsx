"use client"

import { useState, useEffect, useCallback } from "react"
import { useCanvasStore } from "@/stores/canvasStore"
import { Button } from "@/components/ui/button"
import { Loader2, X, LayoutTemplate, Search } from "lucide-react"
import { loadCanvasFromJSON } from "@/lib/canvas"

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

const CATEGORIES = ["全部", "淘宝", "天猫", "京东", "亚马逊"]
const SCENES = ["全部", "卧室", "客厅", "浴室", "儿童房"]

export default function TemplateModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const canvas = useCanvasStore((s) => s.canvas)
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
      } catch (e: any) {
        setError(e.message || "获取模板失败")
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [open, categoryFilter, sceneFilter])

  const filteredTemplates = templates.filter((t) => {
    if (search.trim()) {
      return t.name.toLowerCase().includes(search.trim().toLowerCase())
    }
    return true
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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-800">模板库</h2>
          </div>
          <button
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
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
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    categoryFilter === c
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setCategoryFilter(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">场景:</span>
              {SCENES.map((s) => (
                <button
                  key={s}
                  className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                    sceneFilter === s
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setSceneFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md border border-red-100 text-center">
              {error}
            </div>
          )}

          {!loading && !error && filteredTemplates.length === 0 && (
            <p className="text-center text-gray-400 py-12">未找到模板</p>
          )}

          {!loading && filteredTemplates.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
                >
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%239ca3af' font-size='10'%3ENo Image%3C/text%3E%3C/svg%3E"
                      }}
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-800 truncate">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                        {template.category}
                      </span>
                      {template.scene && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                          {template.scene}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {template.width} x {template.height}
                    </p>
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleApply(template)}
                    >
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
