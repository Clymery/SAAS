"use client"

import { useCallback, useRef } from "react"
import {
  Download,
  ImagePlus,
  LayoutTemplate,
  Maximize,
  MousePointer2,
  Package,
  Palette,
  Redo2,
  Scissors,
  Trash2,
  Type,
  Undo2,
  Wand2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { createImageLayer, createTextLayer, exportCanvas } from "@/lib/canvas"
import { useCanvasStore } from "@/stores/canvasStore"

export default function Toolbar({
  onOpenAI,
  onOpenBatch,
  onOpenTemplate,
}: {
  onOpenAI?: () => void
  onOpenBatch?: () => void
  onOpenTemplate?: () => void
}) {
  const canvas = useCanvasStore((s) => s.canvas)
  const activeObject = useCanvasStore((s) => s.activeObject)
  const canUndo = useCanvasStore((s) => s.canUndo)
  const canRedo = useCanvasStore((s) => s.canRedo)
  const undo = useCanvasStore((s) => s.undo)
  const redo = useCanvasStore((s) => s.redo)
  const saveState = useCanvasStore((s) => s.saveState)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !canvas) return
      const reader = new FileReader()
      reader.onload = (event) => {
        const url = event.target?.result as string
        if (url) createImageLayer(canvas, url)
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    },
    [canvas]
  )

  const handleAddText = useCallback(() => {
    if (!canvas) return
    createTextLayer(canvas, "双击编辑文字")
  }, [canvas])

  const handleBgColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!canvas) return
      canvas.backgroundColor = e.target.value
      canvas.renderAll()
      saveState()
    },
    [canvas, saveState]
  )

  const handleDelete = useCallback(() => {
    if (!canvas) return
    const active = canvas.getActiveObject()
    if (!active) return
    canvas.remove(active)
    canvas.discardActiveObject()
    canvas.renderAll()
    useCanvasStore.setState({ activeObject: null })
    saveState()
  }, [canvas, saveState])

  const handleZoomIn = useCallback(() => {
    if (!canvas) return
    canvas.setZoom(Math.min(canvas.getZoom() + 0.1, 3))
    canvas.renderAll()
  }, [canvas])

  const handleZoomOut = useCallback(() => {
    if (!canvas) return
    canvas.setZoom(Math.max(canvas.getZoom() - 0.1, 0.2))
    canvas.renderAll()
  }, [canvas])

  const handleFit = useCallback(() => {
    if (!canvas) return
    canvas.setZoom(1)
    canvas.renderAll()
  }, [canvas])

  const handleExport = useCallback(
    (format: "png" | "jpeg") => {
      if (!canvas) return
      const data = exportCanvas(canvas, format)
      const link = document.createElement("a")
      link.href = data
      link.download = `export.${format}`
      link.click()
    },
    [canvas]
  )

  const isImageSelected = activeObject?.type === "image"
  const btnClass =
    "flex w-full flex-col items-center justify-center gap-1 rounded-md px-1 py-3 text-xs text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
  const disabledClass = "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-gray-600"

  return (
    <div className="flex h-full w-full flex-col items-center gap-1 overflow-y-auto border-r bg-white py-2">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={bgInputRef} type="color" className="hidden" onChange={handleBgColorChange} />

      <button className={btnClass} title="选择">
        <MousePointer2 className="h-5 w-5" />
        <span>选择</span>
      </button>
      <button className={btnClass} onClick={() => fileInputRef.current?.click()} title="添加图片">
        <ImagePlus className="h-5 w-5" />
        <span>图片</span>
      </button>
      <button className={btnClass} onClick={handleAddText} title="添加文字">
        <Type className="h-5 w-5" />
        <span>文字</span>
      </button>
      <button className={btnClass} onClick={() => bgInputRef.current?.click()} title="背景颜色">
        <Palette className="h-5 w-5" />
        <span>背景</span>
      </button>

      <div className="my-1 h-px w-full bg-gray-200" />

      <button className={`${btnClass} ${!canUndo ? disabledClass : ""}`} onClick={() => undo()} disabled={!canUndo} title="撤销">
        <Undo2 className="h-5 w-5" />
        <span>撤销</span>
      </button>
      <button className={`${btnClass} ${!canRedo ? disabledClass : ""}`} onClick={() => redo()} disabled={!canRedo} title="重做">
        <Redo2 className="h-5 w-5" />
        <span>重做</span>
      </button>
      <button className={btnClass} onClick={handleDelete} title="删除">
        <Trash2 className="h-5 w-5" />
        <span>删除</span>
      </button>

      <div className="my-1 h-px w-full bg-gray-200" />

      <button className={btnClass} onClick={handleZoomIn} title="放大">
        <ZoomIn className="h-5 w-5" />
        <span>放大</span>
      </button>
      <button className={btnClass} onClick={handleZoomOut} title="缩小">
        <ZoomOut className="h-5 w-5" />
        <span>缩小</span>
      </button>
      <button className={btnClass} onClick={handleFit} title="适配">
        <Maximize className="h-5 w-5" />
        <span>适配</span>
      </button>

      <div className="my-1 h-px w-full bg-gray-200" />

      <button className={btnClass} onClick={() => handleExport("png")} title="导出 PNG">
        <Download className="h-5 w-5" />
        <span>PNG</span>
      </button>
      <button className={btnClass} onClick={() => handleExport("jpeg")} title="导出 JPG">
        <Download className="h-5 w-5" />
        <span>JPG</span>
      </button>

      <div className="my-1 h-px w-full bg-gray-200" />

      <button className={btnClass} onClick={onOpenAI} title="AI 场景生成">
        <Wand2 className="h-5 w-5" />
        <span>AI 场景</span>
      </button>
      <button
        className={`${btnClass} ${!isImageSelected ? disabledClass : ""}`}
        onClick={() => {
          if (isImageSelected) onOpenAI?.()
        }}
        disabled={!isImageSelected}
        title="背景移除"
      >
        <Scissors className="h-5 w-5" />
        <span>抠图</span>
      </button>
      <button className={btnClass} onClick={onOpenBatch} title="批量生成">
        <Package className="h-5 w-5" />
        <span>批量</span>
      </button>
      <button className={btnClass} onClick={onOpenTemplate} title="模板">
        <LayoutTemplate className="h-5 w-5" />
        <span>模板</span>
      </button>
    </div>
  )
}
