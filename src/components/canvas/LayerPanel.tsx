"use client"

import { useCallback } from "react"
import { useCanvasStore } from "@/stores/canvasStore"
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Type,
  Square,
  Layers,
} from "lucide-react"

function getLayerIcon(type: string) {
  switch (type) {
    case "image":
      return <ImageIcon className="w-4 h-4 text-gray-500" />
    case "text":
      return <Type className="w-4 h-4 text-gray-500" />
    case "background":
      return <Square className="w-4 h-4 text-gray-500" />
    default:
      return <Layers className="w-4 h-4 text-gray-500" />
  }
}

export default function LayerPanel() {
  const canvas = useCanvasStore((s) => s.canvas)
  const layers = useCanvasStore((s) => s.layers)
  const activeObject = useCanvasStore((s) => s.activeObject)
  const saveState = useCanvasStore((s) => s.saveState)

  const getCanvasObjectByLayerId = useCallback(
    (id: string) => {
      if (!canvas) return null
      return canvas.getObjects().find((obj) => (obj as any).layerId === id) || null
    },
    [canvas]
  )

  const handleSelectLayer = useCallback(
    (id: string) => {
      if (!canvas) return
      const obj = getCanvasObjectByLayerId(id)
      if (obj && obj.selectable !== false && obj.visible !== false) {
        canvas.setActiveObject(obj)
        canvas.renderAll()
        useCanvasStore.setState({ activeObject: obj })
      }
    },
    [canvas, getCanvasObjectByLayerId]
  )

  const handleToggleVisibility = useCallback(
    (id: string) => {
      if (!canvas) return
      const obj = getCanvasObjectByLayerId(id)
      if (!obj) return
      obj.set("visible", !obj.visible)
      canvas.renderAll()
      useCanvasStore.setState({
        layers: layers.map((l) =>
          l.id === id ? { ...l, visible: !l.visible } : l
        ),
      })
      saveState()
    },
    [canvas, getCanvasObjectByLayerId, layers, saveState]
  )

  const handleToggleLock = useCallback(
    (id: string) => {
      if (!canvas) return
      const obj = getCanvasObjectByLayerId(id)
      if (!obj) return
      const locked = obj.selectable !== false
      obj.set({
        selectable: locked ? false : true,
        evented: locked ? false : true,
      })
      canvas.renderAll()
      useCanvasStore.setState({
        layers: layers.map((l) =>
          l.id === id ? { ...l, locked: locked } : l
        ),
      })
      saveState()
    },
    [canvas, getCanvasObjectByLayerId, layers, saveState]
  )

  const handleDeleteLayer = useCallback(
    (id: string) => {
      if (!canvas) return
      const obj = getCanvasObjectByLayerId(id)
      if (!obj) return
      canvas.remove(obj)
      canvas.discardActiveObject()
      canvas.renderAll()
      useCanvasStore.setState({ activeObject: null })
      saveState()
    },
    [canvas, getCanvasObjectByLayerId, saveState]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      e.dataTransfer.setData("text/plain", String(index))
    },
    []
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault()
      const fromIndex = Number(e.dataTransfer.getData("text/plain"))
      if (isNaN(fromIndex) || fromIndex === toIndex) return
      if (!canvas) return

      const objects = canvas.getObjects()
      // layers are reversed relative to canvas objects
      const fromCanvasIndex = objects.length - 1 - fromIndex
      const toCanvasIndex = objects.length - 1 - toIndex

      const obj = objects[fromCanvasIndex]
      if (!obj) return

      if (toCanvasIndex > fromCanvasIndex) {
        for (let i = fromCanvasIndex; i < toCanvasIndex; i++) {
          canvas.bringObjectForward(obj)
        }
      } else {
        for (let i = fromCanvasIndex; i > toCanvasIndex; i--) {
          canvas.sendObjectBackwards(obj)
        }
      }

      canvas.renderAll()

      // Rebuild layers
      const newLayers = [...layers]
      const [removed] = newLayers.splice(fromIndex, 1)
      newLayers.splice(toIndex, 0, removed)
      useCanvasStore.setState({ layers: newLayers })
      saveState()
    },
    [canvas, layers, saveState]
  )

  return (
    <div className="h-full flex flex-col bg-white border-t">
      <div className="px-3 py-2 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Layers className="w-4 h-4" />
        Layers
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 && (
          <div className="p-4 text-sm text-gray-400 text-center">No layers</div>
        )}
        {layers.map((layer, index) => {
          const isActive =
            activeObject && (activeObject as any).layerId === layer.id
          return (
            <div
              key={layer.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => handleSelectLayer(layer.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                isActive ? "bg-blue-50 hover:bg-blue-50" : ""
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
              {getLayerIcon(layer.type)}
              <span className="flex-1 truncate select-none">{layer.name}</span>
              <button
                className="p-1 rounded hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleVisibility(layer.id)
                }}
                title={layer.visible ? "Hide" : "Show"}
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4 text-gray-500" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-gray-200"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleLock(layer.id)
                }}
                title={layer.locked ? "Unlock" : "Lock"}
              >
                {layer.locked ? (
                  <Lock className="w-4 h-4 text-gray-500" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                className="p-1 rounded hover:bg-red-100 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteLayer(layer.id)
                }}
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
