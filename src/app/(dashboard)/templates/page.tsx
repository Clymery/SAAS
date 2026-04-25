"use client"

import { LayoutTemplate } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function TemplatesPage() {
  return (
    <EmptyState
      icon={LayoutTemplate}
      title="模板"
      description="模板中心页面待完善。"
    />
  )
}
