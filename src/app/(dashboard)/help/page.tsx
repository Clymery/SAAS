"use client"

import { HelpCircle } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function HelpPage() {
  return (
    <EmptyState
      icon={HelpCircle}
      title="帮助"
      description="帮助中心页面待完善。"
    />
  )
}
