"use client"

import { useEffect, useRef, useCallback } from "react"
import { Canvas, FabricObject, FabricText } from "fabric"
import { useCanvasStore } from "@/stores/canvasStore"
import type { CanvasLayer } from "@/types"

let idCounter = 0
function generateId() {
  return `layer-${Date.now()}-${idCounter++}`
}

function buildLayers(canvas: Canvas): CanvasLayer[] {
  const objects = canvas.getObjects()
  const layers: CanvasLayer[] = objects.map((obj) => {
    const id = (obj as any).layerId || generateId()
    ;(obj as any).layerId = id

    let type: CanvasLayer["type"] = "shape"
    let name = "Shape"
    if (obj.type === "image") {
      type = "image"
      name = "Image"
    } else if (obj.type === "text" || obj.type === "i-text") {
      type = "text"
      name = (obj as FabricText).text?.slice(0, 20) || "Text"
    }

    return {
      id,
      type,
      name,
      visible: obj.visible ?? true,
      locked: obj.selectable === false,
      opacity: obj.opacity ?? 1,
      data: {},
    }
  })
  // Reverse so top layer is first in the panel
  return layers.reverse()
}

interface FabricCanvasProps {
  width?: number
  height?: number
}

export default function FabricCanvas({ width = 800, height = 800 }: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const setCanvas = useCallback((canvas: Canvas | null) => {
    useCanvasStore.setState({ canvas: canvas as any })
  }, [])

  const setActiveObject = useCallback((obj: FabricObject | null) => {
    useCanvasStore.setState({ activeObject: obj as any })
  }, [])

  const saveState = useCallback(() => {
    useCanvasStore.getState().saveState()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
    })

    setCanvas(canvas)
    useCanvasStore.setState({ layers: buildLayers(canvas) })

    const onSelectionCreated = () => setActiveObject(canvas.getActiveObject() || null)
    const onSelectionUpdated = () => setActiveObject(canvas.getActiveObject() || null)
    const onSelectionCleared = () => setActiveObject(null)
    const onObjectModified = () => {
      useCanvasStore.setState({ layers: buildLayers(canvas) })
      saveState()
    }
    const onObjectAdded = () => {
      useCanvasStore.setState({ layers: buildLayers(canvas) })
      saveState()
    }
    const onObjectRemoved = () => {
      useCanvasStore.setState({ layers: buildLayers(canvas) })
      saveState()
    }

    canvas.on("selection:created", onSelectionCreated)
    canvas.on("selection:updated", onSelectionUpdated)
    canvas.on("selection:cleared", onSelectionCleared)
    canvas.on("object:modified", onObjectModified)
    canvas.on("object:added", onObjectAdded)
    canvas.on("object:removed", onObjectRemoved)

    // Save initial state
    const timer = setTimeout(() => saveState(), 0)

    return () => {
      clearTimeout(timer)
      canvas.off("selection:created", onSelectionCreated)
      canvas.off("selection:updated", onSelectionUpdated)
      canvas.off("selection:cleared", onSelectionCleared)
      canvas.off("object:modified", onObjectModified)
      canvas.off("object:added", onObjectAdded)
      canvas.off("object:removed", onObjectRemoved)
      canvas.dispose()
      setCanvas(null)
      setActiveObject(null)
    }
  }, [width, height, setCanvas, setActiveObject, saveState])

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full h-full overflow-auto">
      <canvas
        ref={canvasRef}
        className="shadow-lg"
        style={{ maxWidth: "100%", maxHeight: "100%" }}
      />
    </div>
  )
}
