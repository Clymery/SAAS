"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Pencil,
  Copy,
  Trash2,
  Clock,
  Layers,
  X,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { Project } from "@/types"

type ViewMode = "grid" | "list"

const PRESETS = [
  { label: "淘宝主图", width: 800, height: 800 },
  { label: "天猫详情", width: 790, height: 400 },
  { label: "京东", width: 800, height: 800 },
  { label: "亚马逊", width: 2000, height: 2000 },
  { label: "自定义", width: 800, height: 800 },
]

export default function ProjectsPage() {
  // const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    width: 800,
    height: 800,
    preset: "自定义",
  })

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return projects
    return projects.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [projects, search])

  const handlePresetChange = (value: string | null) => {
    if (!value) return
    const preset = PRESETS.find((p) => p.label === value)
    if (preset) {
      setForm((f) => ({
        ...f,
        preset: value,
        width: preset.width,
        height: preset.height,
      }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          width: form.width,
          height: form.height,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCreateOpen(false)
        setProjects((prev) => [data, ...prev])
        setForm({ name: "", description: "", width: 800, height: 800, preset: "自定义" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDuplicate = async (project: Project) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${project.name} 副本`,
        description: project.description,
        width: project.width,
        height: project.height,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setProjects((prev) => [data, ...prev])
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/projects?id=${deleteId}`, { method: "DELETE" })
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteId))
      }
    } finally {
      setDeleteId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">我的项目</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger>
            <div className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap transition-all outline-none select-none px-2.5 h-8 gap-1.5 cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              新建项目
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建项目</DialogTitle>
              <DialogDescription>创建一个新的设计项目</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">项目名称</Label>
                <Input
                  id="project-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="输入项目名称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-desc">描述</Label>
                <Input
                  id="project-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="可选描述"
                />
              </div>
              <div className="space-y-2">
                <Label>预设尺寸</Label>
                <Select value={form.preset} onValueChange={(v) => handlePresetChange(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESETS.map((p) => (
                      <SelectItem key={p.label} value={p.label}>
                        {p.label} ({p.width}x{p.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">宽度</Label>
                  <Input
                    id="width"
                    type="number"
                    value={form.width}
                    onChange={(e) => setForm((f) => ({ ...f, width: Number(e.target.value) }))}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">高度</Label>
                  <Input
                    id="height"
                    type="number"
                    value={form.height}
                    onChange={(e) => setForm((f) => ({ ...f, height: Number(e.target.value) }))}
                    min={1}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "创建中..." : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索项目..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex items-center rounded-lg border p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded p-1.5 ${viewMode === "grid" ? "bg-gray-100 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded p-1.5 ${viewMode === "list" ? "bg-gray-100 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={search ? "未找到匹配项目" : "暂无项目"}
          description={search ? "请尝试其他搜索关键词" : "创建您的第一个设计项目"}
          action={
            search
              ? undefined
              : {
                  label: "新建项目",
                  onClick: () => setCreateOpen(true),
                }
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Card key={project.id} className="group hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 relative overflow-hidden rounded-t-xl">
                {project.coverImage ? (
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Layers className="h-8 w-8 opacity-40" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-1">
                      {project.description || "无描述"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge variant="secondary">{project.width}x{project.height}</Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link href={`/studio/${project.id}`} className="inline-flex items-center justify-center rounded-lg border border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors size-6">
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    <Button size="icon-xs" variant="ghost" onClick={() => handleDuplicate(project)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon-xs" variant="ghost" onClick={() => setDeleteId(project.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目名称</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>尺寸</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">
                    <Link href={`/studio/${project.id}`} className="hover:underline">
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {project.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{project.width}x{project.height}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(project.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/studio/${project.id}`} className="inline-flex items-center justify-center rounded-lg border border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors size-6">
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <Button size="icon-xs" variant="ghost" onClick={() => handleDuplicate(project)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon-xs" variant="ghost" onClick={() => setDeleteId(project.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              此操作无法撤销。您确定要删除这个项目吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
