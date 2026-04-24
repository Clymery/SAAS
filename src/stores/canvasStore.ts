"use client"

import { create } from "zustand"
import type { Canvas, FabricObject } from "fabric"
import type { CanvasLayer } from "@/types"

interface CanvasState {
  canvas: Canvas | null
  setCanvas: (canvas: Canvas) => void
  activeObject: FabricObject | null
  setActiveObject: (obj: FabricObject | null) => void
  layers: CanvasLayer[]
  addLayer: (layer: CanvasLayer) => void
  removeLayer: (id: string) => void
  updateLayer: (id: string, updates: Partial<CanvasLayer>) => void
  reorderLayers: (fromIndex: number, toIndex: number) => void
  history: string[]
  historyIndex: number
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  saveState: () => void
  canvasData: string | null
  setCanvasData: (data: string) => void
}

const MAX_HISTORY = 50

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvas: null,
  setCanvas: (canvas) => set({ canvas }),
  activeObject: null,
  setActiveObject: (activeObject) => set({ activeObject }),
  layers: [],
  addLayer: (layer) =>
    set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (id) =>
    set((state) => ({ layers: state.layers.filter((l) => l.id !== id) })),
  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),
  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const layers = [...state.layers]
      const [removed] = layers.splice(fromIndex, 1)
      layers.splice(toIndex, 0, removed)
      return { layers }
    }),
  history: [],
  historyIndex: -1,
  canUndo: false,
  canRedo: false,
  saveState: () => {
    const { canvas, history, historyIndex } = get()
    if (!canvas) return
    const json = JSON.stringify(canvas.toJSON())
    if (historyIndex >= 0 && history[historyIndex] === json) return

    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(json)
    if (newHistory.length > MAX_HISTORY) newHistory.shift()

    const newIndex = newHistory.length - 1
    set({
      history: newHistory,
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: false,
    })
  },
  undo: () => {
    const { canvas, history, historyIndex } = get()
    if (!canvas || historyIndex <= 0) return
    const newIndex = historyIndex - 1
    canvas.loadFromJSON(history[newIndex]).then(() => {
      canvas.renderAll()
      set({
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
      })
    })
  },
  redo: () => {
    const { canvas, history, historyIndex } = get()
    if (!canvas || historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    canvas.loadFromJSON(history[newIndex]).then(() => {
      canvas.renderAll()
      set({
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < history.length - 1,
      })
    })
  },
  canvasData: null,
  setCanvasData: (canvasData) => set({ canvasData }),
}))
