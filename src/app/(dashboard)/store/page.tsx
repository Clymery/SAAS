"use client"

import { ShoppingBag } from "lucide-react"
import { EmptyState } from "@/components/shared/EmptyState"

export default function StorePage() {
  return (
    <EmptyState
      icon={ShoppingBag}
      title="商城"
      description="商城页面待完善。"
    />
  )
}
