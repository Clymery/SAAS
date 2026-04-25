"use client"

import { useCallback, useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Image as ImageIcon, Move, RotateCw, Type } from "lucide-react"
import { useCanvasStore } from "@/stores/canvasStore"

export default function PropertiesPanel() {
  const canvas = useCanvasStore((state) => state.canvas)
  const activeObject = useCanvasStore((state) => state.activeObject)
  const saveState = useCanvasStore((state) => state.saveState)
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
      <div className="h-full border-l bg-white p-4">
        <p className="mt-8 text-center text-sm text-gray-400">请选择一个对象以编辑属性</p>
      </div>
    )
  }

  const isText = activeObject.type === "text" || activeObject.type === "i-text"
  const isImage = activeObject.type === "image"
  const sectionClass = "mb-4"
  const labelClass = "mb-1 block text-xs font-medium text-gray-500"
  const inputClass = "w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const rowClass = "grid grid-cols-2 gap-2"

  return (
    <div className="h-full overflow-y-auto border-l bg-white">
      <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold text-gray-700">
        {isText ? <Type className="h-4 w-4" /> : isImage ? <ImageIcon className="h-4 w-4" /> : <Move className="h-4 w-4" />}
        属性
      </div>

      <div className="p-4">
        <div className={sectionClass}>
          <label className={labelClass}>透明度</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={localValues.opacity}
            onChange={(e) => {
              const value = Number(e.target.value)
              setLocalValues((current) => ({ ...current, opacity: value }))
              updateObj({ opacity: value })
            }}
            className="w-full"
          />
          <div className="text-right text-xs text-gray-500">{Math.round(localValues.opacity * 100)}%</div>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>位置</label>
          <div className={rowClass}>
            <div>
              <span className="text-xs text-gray-400">X</span>
              <input
                type="number"
                className={inputClass}
                value={localValues.left}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setLocalValues((current) => ({ ...current, left: value }))
                  updateObj({ left: value })
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
                  const value = Number(e.target.value)
                  setLocalValues((current) => ({ ...current, top: value }))
                  updateObj({ top: value })
                }}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>尺寸</label>
          <div className={rowClass}>
            <div>
              <span className="text-xs text-gray-400">W</span>
              <input
                type="number"
                className={inputClass}
                value={localValues.width}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setLocalValues((current) => ({ ...current, width: value }))
                  if (isImage) {
                    updateObj({ scaleX: value / (activeObject as any).width })
                  } else {
                    updateObj({ width: value })
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
                  const value = Number(e.target.value)
                  setLocalValues((current) => ({ ...current, height: value }))
                  if (isImage) {
                    updateObj({ scaleY: value / (activeObject as any).height })
                  } else {
                    updateObj({ height: value })
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <label className={labelClass}>旋转</label>
          <div className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 text-gray-400" />
            <input
              type="number"
              className={inputClass}
              value={localValues.angle}
              onChange={(e) => {
                const value = Number(e.target.value)
                setLocalValues((current) => ({ ...current, angle: value }))
                updateObj({ angle: value })
              }}
            />
            <span className="text-xs text-gray-400">度</span>
          </div>
        </div>

        {isText && (
          <>
            <div className={sectionClass}>
              <label className={labelClass}>字号</label>
              <input
                type="number"
                className={inputClass}
                value={localValues.fontSize}
                onChange={(e) => {
                  const value = Number(e.target.value)
                  setLocalValues((current) => ({ ...current, fontSize: value }))
                  updateObj({ fontSize: value })
                }}
              />
            </div>
            <div className={sectionClass}>
              <label className={labelClass}>字体</label>
              <select
                className={inputClass}
                value={localValues.fontFamily}
                onChange={(e) => {
                  const value = e.target.value
                  setLocalValues((current) => ({ ...current, fontFamily: value }))
                  updateObj({ fontFamily: value })
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
              <label className={labelClass}>颜色</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localValues.fill}
                  onChange={(e) => {
                    const value = e.target.value
                    setLocalValues((current) => ({ ...current, fill: value }))
                    updateObj({ fill: value })
                  }}
                  className="h-8 w-8 cursor-pointer rounded border p-0"
                />
                <span className="text-xs text-gray-500">{localValues.fill}</span>
              </div>
            </div>
            <div className={sectionClass}>
              <label className={labelClass}>背景</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localValues.backgroundColor === "transparent" ? "#ffffff" : localValues.backgroundColor}
                  onChange={(e) => {
                    const value = e.target.value
                    setLocalValues((current) => ({ ...current, backgroundColor: value }))
                    updateObj({ backgroundColor: value })
                  }}
                  className="h-8 w-8 cursor-pointer rounded border p-0"
                />
                <button
                  className="text-xs text-gray-500 underline"
                  onClick={() => {
                    setLocalValues((current) => ({ ...current, backgroundColor: "transparent" }))
                    updateObj({ backgroundColor: "" })
                  }}
                >
                  清除
                </button>
              </div>
            </div>
            <div className={sectionClass}>
              <label className={labelClass}>样式</label>
              <div className="flex gap-2">
                <button
                  className={`rounded-md border px-3 py-1 text-sm ${localValues.fontWeight === "bold" ? "bg-gray-800 text-white" : "bg-white"}`}
                  onClick={() => {
                    const next = localValues.fontWeight === "bold" ? "normal" : "bold"
                    setLocalValues((current) => ({ ...current, fontWeight: next }))
                    updateObj({ fontWeight: next })
                  }}
                >
                  加粗
                </button>
                <button
                  className={`rounded-md border px-3 py-1 text-sm ${localValues.fontStyle === "italic" ? "bg-gray-800 text-white" : "bg-white"}`}
                  onClick={() => {
                    const next = localValues.fontStyle === "italic" ? "normal" : "italic"
                    setLocalValues((current) => ({ ...current, fontStyle: next }))
                    updateObj({ fontStyle: next })
                  }}
                >
                  斜体
                </button>
              </div>
            </div>
          </>
        )}

        <div className={sectionClass}>
          <label className={labelClass}>图层顺序</label>
          <div className="flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-sm hover:bg-gray-50" onClick={handleBringForward}>
              <ArrowUp className="h-4 w-4" />
              前移
            </button>
            <button className="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-sm hover:bg-gray-50" onClick={handleSendBackward}>
              <ArrowDown className="h-4 w-4" />
              后移
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
