"use client"

import { useRef, useCallback } from "react"
import { useCanvasStore } from "@/stores/canvasStore"
import { createImageLayer, createTextLayer, exportCanvas } from "@/lib/canvas"
import {
  MousePointer2,
  ImagePlus,
  Type,
  Palette,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Download,
  Wand2,
  Scissors,
  Package,
  LayoutTemplate,
} from "lucide-react"

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

  const handleAddImage = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !canvas) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const url = ev.target?.result as string
        if (url) {
          createImageLayer(canvas, url)
        }
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    },
    [canvas]
  )

  const handleAddText = useCallback(() => {
    if (!canvas) return
    createTextLayer(canvas, "Double click to edit")
  }, [canvas])

  const handleBgColor = useCallback(() => {
    bgInputRef.current?.click()
  }, [])

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
    if (active) {
      canvas.remove(active)
      canvas.discardActiveObject()
      canvas.renderAll()
      useCanvasStore.setState({ activeObject: null })
      saveState()
    }
  }, [canvas, saveState])

  const handleZoomIn = useCallback(() => {
    if (!canvas) return
    const zoom = canvas.getZoom()
    canvas.setZoom(Math.min(zoom + 0.1, 3))
    canvas.renderAll()
  }, [canvas])

  const handleZoomOut = useCallback(() => {
    if (!canvas) return
    const zoom = canvas.getZoom()
    canvas.setZoom(Math.max(zoom - 0.1, 0.2))
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
    "flex flex-col items-center justify-center gap-1 w-full py-3 px-1 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xs"

  const disabledClass = "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-600"

  return (
    <div className="flex flex-col items-center gap-1 py-2 border-r bg-white w-full h-full overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={bgInputRef}
        type="color"
        className="hidden"
        onChange={handleBgColorChange}
      />

      <button className={btnClass} title="Select">
        <MousePointer2 className="w-5 h-5" />
        <span>Select</span>
      </button>

      <button className={btnClass} onClick={handleAddImage} title="Add Image">
        <ImagePlus className="w-5 h-5" />
        <span>Image</span>
      </button>

      <button className={btnClass} onClick={handleAddText} title="Add Text">
        <Type className="w-5 h-5" />
        <span>Text</span>
      </button>

      <button className={btnClass} onClick={handleBgColor} title="Background Color">
        <Palette className="w-5 h-5" />
        <span>BG Color</span>
      </button>

      <div className="w-full h-px bg-gray-200 my-1" />

      <button
        className={`${btnClass} ${!canUndo ? disabledClass : ""}`}
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo2 className="w-5 h-5" />
        <span>Undo</span>
      </button>

      <button
        className={`${btnClass} ${!canRedo ? disabledClass : ""}`}
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo2 className="w-5 h-5" />
        <span>Redo</span>
      </button>

      <button className={btnClass} onClick={handleDelete} title="Delete">
        <Trash2 className="w-5 h-5" />
        <span>Delete</span>
      </button>

      <div className="w-full h-px bg-gray-200 my-1" />

      <button className={btnClass} onClick={handleZoomIn} title="Zoom In">
        <ZoomIn className="w-5 h-5" />
        <span>Zoom In</span>
      </button>

      <button className={btnClass} onClick={handleZoomOut} title="Zoom Out">
        <ZoomOut className="w-5 h-5" />
        <span>Zoom Out</span>
      </button>

      <button className={btnClass} onClick={handleFit} title="Fit to Screen">
        <Maximize className="w-5 h-5" />
        <span>Fit</span>
      </button>

      <div className="w-full h-px bg-gray-200 my-1" />

      <button className={btnClass} onClick={() => handleExport("png")} title="Export PNG">
        <Download className="w-5 h-5" />
        <span>PNG</span>
      </button>

      <button className={btnClass} onClick={() => handleExport("jpeg")} title="Export JPEG">
        <Download className="w-5 h-5" />
        <span>JPG</span>
      </button>

      <div className="w-full h-px bg-gray-200 my-1" />

      {/* AI Buttons */}
      <button className={btnClass} onClick={onOpenAI} title="AI 场景生成">
        <Wand2 className="w-5 h-5" />
        <span>AI 场景</span>
      </button>

      <button
        className={`${btnClass} ${!isImageSelected ? disabledClass : ""}`}
        onClick={() => {
          if (isImageSelected) onOpenAI?.()
        }}
        disabled={!isImageSelected}
        title="智能抠图"
      >
        <Scissors className="w-5 h-5" />
        <span>抠图</span>
      </button>

      <button className={btnClass} onClick={onOpenBatch} title="批量生成">
        <Package className="w-5 h-5" />
        <span>批量</span>
      </button>

      <button className={btnClass} onClick={onOpenTemplate} title="模板库">
        <LayoutTemplate className="w-5 h-5" />
        <span>模板</span>
      </button>
    </div>
  )
}
