"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import AIPanel from "@/components/canvas/AIPanel"
import BatchPanel from "@/components/canvas/BatchPanel"
import FabricCanvas from "@/components/canvas/FabricCanvas"
import LayerPanel from "@/components/canvas/LayerPanel"
import PropertiesPanel from "@/components/canvas/PropertiesPanel"
import TemplateModal from "@/components/canvas/TemplateModal"
import Toolbar from "@/components/canvas/Toolbar"

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
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex h-12 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Project</h1>
          <span className="text-xs text-gray-400">#{id}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-700"
            onClick={() => setTemplateOpen(true)}
          >
            使用模板
          </button>
          <div className="text-xs text-gray-500">SAAS Studio</div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-20 shrink-0 overflow-y-auto border-r bg-white">
          <Toolbar
            onOpenAI={() => setRightPanel("ai")}
            onOpenBatch={() => setRightPanel("batch")}
            onOpenTemplate={() => setTemplateOpen(true)}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-hidden bg-gray-100">
            <FabricCanvas width={800} height={800} />
          </div>
          <div className="h-52 shrink-0 border-t bg-white">
            <LayerPanel />
          </div>
        </div>

        <div className="flex w-72 shrink-0 flex-col border-l bg-white">
          <div className="flex border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  rightPanel === tab.key
                    ? "border-b-2 border-gray-800 bg-gray-50 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
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

      <TemplateModal open={templateOpen} onClose={() => setTemplateOpen(false)} />
    </div>
  )
}
