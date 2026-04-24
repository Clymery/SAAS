"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import FabricCanvas from "@/components/canvas/FabricCanvas"
import Toolbar from "@/components/canvas/Toolbar"
import LayerPanel from "@/components/canvas/LayerPanel"
import PropertiesPanel from "@/components/canvas/PropertiesPanel"
import AIPanel from "@/components/canvas/AIPanel"
import BatchPanel from "@/components/canvas/BatchPanel"
import TemplateModal from "@/components/canvas/TemplateModal"

type RightPanel = "properties" | "ai" | "batch"

export default function StudioPage() {
  const params = useParams()
  const id = params.id as string
  const [rightPanel, setRightPanel] = useState<RightPanel>("properties")
  const [templateOpen, setTemplateOpen] = useState(false)

  const tabs: { key: RightPanel; label: string }[] = [
    { key: "properties", label: "属性" },
    { key: "ai", label: "AI" },
    { key: "batch", label: "批量" },
  ]

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b px-4 h-12 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-sm">Project</h1>
          <span className="text-xs text-gray-400">#{id}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            onClick={() => setTemplateOpen(true)}
          >
            应用模板
          </button>
          <div className="text-xs text-gray-500">SAAS Studio</div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbar */}
        <div className="w-20 shrink-0 bg-white border-r overflow-y-auto">
          <Toolbar
            onOpenAI={() => setRightPanel("ai")}
            onOpenBatch={() => setRightPanel("batch")}
            onOpenTemplate={() => setTemplateOpen(true)}
          />
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden bg-gray-100">
            <FabricCanvas width={800} height={800} />
          </div>

          {/* Bottom: Layer Panel */}
          <div className="h-52 shrink-0 bg-white border-t">
            <LayerPanel />
          </div>
        </div>

        {/* Right: Panel with Tabs */}
        <div className="w-72 shrink-0 bg-white border-l flex flex-col">
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  rightPanel === tab.key
                    ? "text-gray-900 border-b-2 border-gray-800 bg-gray-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setRightPanel(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden">
            {rightPanel === "properties" && <PropertiesPanel />}
            {rightPanel === "ai" && <AIPanel projectId={id} />}
            {rightPanel === "batch" && <BatchPanel projectId={id} />}
          </div>
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </div>
  )
}
