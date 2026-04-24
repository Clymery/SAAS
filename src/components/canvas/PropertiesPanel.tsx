"use client"

import { useCallback, useEffect, useState } from "react"
import { useCanvasStore } from "@/stores/canvasStore"
import {
  ArrowUp,
  ArrowDown,
  Type,
  Image as ImageIcon,
  Move,
  RotateCw,
} from "lucide-react"

export default function PropertiesPanel() {
  const canvas = useCanvasStore((s) => s.canvas)
  const activeObject = useCanvasStore((s) => s.activeObject)
  const saveState = useCanvasStore((s) => s.saveState)

  const [localValues, setLocalValues] = useState({
    opacity: 1,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    angle: 0,
    fontSize: 20,
    fontFamily: "Inter",
    fill: "#000000",
    backgroundColor: "transparent",
    fontWeight: "normal",
    fontStyle: "normal",
  })

  useEffect(() => {
    if (!activeObject) return
    const obj = activeObject as any
    setLocalValues({
      opacity: obj.opacity ?? 1,
      left: Math.round(obj.left ?? 0),
      top: Math.round(obj.top ?? 0),
      width: Math.round(obj.getScaledWidth?.() ?? obj.width ?? 0),
      height: Math.round(obj.getScaledHeight?.() ?? obj.height ?? 0),
      angle: Math.round(obj.angle ?? 0),
      fontSize: obj.fontSize ?? 20,
      fontFamily: obj.fontFamily ?? "Inter",
      fill: obj.fill ?? "#000000",
      backgroundColor: obj.backgroundColor ?? "transparent",
      fontWeight: obj.fontWeight ?? "normal",
      fontStyle: obj.fontStyle ?? "normal",
    })
  }, [activeObject])

  const updateObj = useCallback(
    (updates: Record<string, unknown>) => {
      if (!canvas || !activeObject) return
      activeObject.set(updates)
      canvas.renderAll()
      saveState()
    },
    [canvas, activeObject, saveState]
  )

  const handleBringForward = useCallback(() => {
    if (!canvas || !activeObject) return
    canvas.bringObjectForward(activeObject)
    canvas.renderAll()
    saveState()
  }, [canvas, activeObject, saveState])

  const handleSendBackward = useCallback(() => {
    if (!canvas || !activeObject) return
    canvas.sendObjectBackwards(activeObject)
    canvas.renderAll()
    saveState()
  }, [canvas, activeObject, saveState])

  if (!activeObject) {
    return (
      <div className="h-full bg-white border-l p-4">
        <p className="text-sm text-gray-400 text-center mt-8">
          Select an object to edit properties
        </p>
      </div>
    )
  }

  const isText = activeObject.type === "text" || activeObject.type === "i-text"
  const isImage = activeObject.type === "image"

  const sectionClass = "mb-4"
  const labelClass = "block text-xs font-medium text-gray-500 mb-1"
  const inputClass =
    "w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
  const rowClass = "grid grid-cols-2 gap-2"

  return (
    <div className="h-full bg-white border-l overflow-y-auto">
      <div className="px-4 py-3 border-b text-sm font-semibold text-gray-700 flex items-center gap-2">
        {isText ? <Type className="w-4 h-4" /> : isImage ? <ImageIcon className="w-4 h-4" /> : <Move className="w-4 h-4" />}
        Properties
      </div>

      <div className="p-4">
        {/* Opacity */}
        <div className={sectionClass}>
          <label className={labelClass}>Opacity</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={localValues.opacity}
            onChange={(e) => {
              const val = Number(e.target.value)
              setLocalValues((v) => ({ ...v, opacity: val }))
              updateObj({ opacity: val })
            }}
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-right">
            {Math.round(localValues.opacity * 100)}%
          </div>
        </div>

        {/* Position */}
        <div className={sectionClass}>
          <label className={labelClass}>Position</label>
          <div className={rowClass}>
            <div>
              <span className="text-xs text-gray-400">X</span>
              <input
                type="number"
                className={inputClass}
                value={localValues.left}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setLocalValues((v) => ({ ...v, left: val }))
                  updateObj({ left: val })
                }}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">Y</span>
              <input
                type="number"
                className={inputClass}
                value={localValues.top}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setLocalValues((v) => ({ ...v, top: val }))
                  updateObj({ top: val })
                }}
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className={sectionClass}>
          <label className={labelClass}>Size</label>
          <div className={rowClass}>
            <div>
              <span className="text-xs text-gray-400">W</span>
              <input
                type="number"
                className={inputClass}
                value={localValues.width}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setLocalValues((v) => ({ ...v, width: val }))
                  if (isImage) {
                    const scaleX = val / (activeObject as any).width
                    updateObj({ scaleX })
                  } else {
                    updateObj({ width: val })
                  }
                }}
              />
            </div>
            <div>
              <span className="text-xs text-gray-400">H</span>
              <input
                type="number"
                className={inputClass}
                value={localValues.height}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setLocalValues((v) => ({ ...v, height: val }))
                  if (isImage) {
                    const scaleY = val / (activeObject as any).height
                    updateObj({ scaleY })
                  } else {
                    updateObj({ height: val })
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className={sectionClass}>
          <label className={labelClass}>Rotation</label>
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-gray-400" />
            <input
              type="number"
              className={inputClass}
              value={localValues.angle}
              onChange={(e) => {
                const val = Number(e.target.value)
                setLocalValues((v) => ({ ...v, angle: val }))
                updateObj({ angle: val })
              }}
            />
            <span className="text-xs text-gray-400">°</span>
          </div>
        </div>

        {/* Text-specific */}
        {isText && (
          <>
            <div className={sectionClass}>
              <label className={labelClass}>Font Size</label>
              <input
                type="number"
                className={inputClass}
                value={localValues.fontSize}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setLocalValues((v) => ({ ...v, fontSize: val }))
                  updateObj({ fontSize: val })
                }}
              />
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Font Family</label>
              <select
                className={inputClass}
                value={localValues.fontFamily}
                onChange={(e) => {
                  const val = e.target.value
                  setLocalValues((v) => ({ ...v, fontFamily: val }))
                  updateObj({ fontFamily: val })
                }}
              >
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="monospace">Monospace</option>
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
              </select>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localValues.fill}
                  onChange={(e) => {
                    const val = e.target.value
                    setLocalValues((v) => ({ ...v, fill: val }))
                    updateObj({ fill: val })
                  }}
                  className="w-8 h-8 p-0 border rounded cursor-pointer"
                />
                <span className="text-xs text-gray-500">{localValues.fill}</span>
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localValues.backgroundColor === "transparent" ? "#ffffff" : localValues.backgroundColor}
                  onChange={(e) => {
                    const val = e.target.value
                    setLocalValues((v) => ({ ...v, backgroundColor: val }))
                    updateObj({ backgroundColor: val })
                  }}
                  className="w-8 h-8 p-0 border rounded cursor-pointer"
                />
                <button
                  className="text-xs text-gray-500 underline"
                  onClick={() => {
                    setLocalValues((v) => ({ ...v, backgroundColor: "transparent" }))
                    updateObj({ backgroundColor: "" })
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className={sectionClass}>
              <label className={labelClass}>Style</label>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 text-sm border rounded-md ${
                    localValues.fontWeight === "bold" ? "bg-gray-800 text-white" : "bg-white"
                  }`}
                  onClick={() => {
                    const next = localValues.fontWeight === "bold" ? "normal" : "bold"
                    setLocalValues((v) => ({ ...v, fontWeight: next }))
                    updateObj({ fontWeight: next })
                  }}
                >
                  Bold
                </button>
                <button
                  className={`px-3 py-1 text-sm border rounded-md ${
                    localValues.fontStyle === "italic" ? "bg-gray-800 text-white" : "bg-white"
                  }`}
                  onClick={() => {
                    const next = localValues.fontStyle === "italic" ? "normal" : "italic"
                    setLocalValues((v) => ({ ...v, fontStyle: next }))
                    updateObj({ fontStyle: next })
                  }}
                >
                  Italic
                </button>
              </div>
            </div>
          </>
        )}

        {/* Layer Order */}
        <div className={sectionClass}>
          <label className={labelClass}>Layer Order</label>
          <div className="flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              onClick={handleBringForward}
            >
              <ArrowUp className="w-4 h-4" />
              Forward
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-sm border rounded-md hover:bg-gray-50"
              onClick={handleSendBackward}
            >
              <ArrowDown className="w-4 h-4" />
              Backward
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
