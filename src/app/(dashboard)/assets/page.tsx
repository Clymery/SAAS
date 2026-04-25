"use client"

import { useCallback, useEffect, useState } from "react"
import { useDropzone } from "react-dropzone"
import {
  FileImage,
  ImageIcon,
  Monitor,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/EmptyState"
import { Asset } from "@/types"

const TABS = [
  { value: "all", label: "全部" },
  { value: "product", label: "商品图" },
  { value: "background", label: "背景" },
  { value: "template", label: "模板" },
]

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [uploadName, setUploadName] = useState("")
  const [uploadType, setUploadType] = useState("product")
  const [fileToUpload, setFileToUpload] = useState<File | null>(null)

  const fetchAssets = useCallback(() => {
    const type = activeTab === "all" ? "" : activeTab
    const url = type ? `/api/assets?type=${type}` : "/api/assets"
    setLoading(true)
    fetch(url)
      .then((r) => r.json())
      .then((data) => setAssets(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [activeTab])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return
    setFileToUpload(file)
    setPreviewFile(URL.createObjectURL(file))
    setUploadName(file.name.replace(/\.[^/.]+$/, ""))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  })

  const handleUpload = async () => {
    if (!fileToUpload || !uploadName.trim()) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", fileToUpload)
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed")

      const assetRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName,
          type: uploadType,
          url: uploadData.url,
          thumbnail: uploadData.url,
        }),
      })
      const assetData = await assetRes.json()
      if (assetRes.ok) {
        setAssets((prev) => [assetData, ...prev])
        setUploadOpen(false)
        setPreviewFile(null)
        setUploadName("")
        setFileToUpload(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    // TODO: 增加 DELETE /api/assets/[id] 后改为真实删除。
    setAssets((prev) => prev.filter((asset) => asset.id !== deleteId))
    setDeleteId(null)
    setPreviewAsset(null)
  }

  const filtered = assets.filter((asset) =>
    asset.name.toLowerCase().includes(search.toLowerCase())
  )

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      product: "商品图",
      background: "背景",
      template: "模板",
    }
    return map[type] || type
  }

  if (loading && assets.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">素材管理</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          上传素材
        </Button>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索素材..."
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={search || activeTab !== "all" ? "没有匹配的素材" : "素材库为空"}
          description={search || activeTab !== "all" ? "请调整筛选条件。" : "上传商品图、背景或模板素材。"}
          action={
            search || activeTab !== "all"
              ? undefined
              : { label: "上传素材", onClick: () => setUploadOpen(true) }
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="group relative cursor-pointer overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md"
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="relative aspect-square bg-gray-100">
                {asset.thumbnail ? (
                  // Kept as img because asset URLs can be local uploads or future signed URLs.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.thumbnail} alt={asset.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <FileImage className="h-8 w-8 opacity-40" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium">{asset.name}</p>
                <div className="mt-1 flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {typeLabel(asset.type)}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(asset.id)
                    }}
                    className="rounded p-1 text-destructive opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>上传素材</DialogTitle>
            <DialogDescription>选择一张图片并保存到素材库。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!previewFile ? (
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? "松开以上传图片" : "拖拽图片到这里，或点击选择文件"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video overflow-hidden rounded-lg border bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewFile} alt="Preview" className="h-full w-full object-contain" />
                  <button
                    onClick={() => {
                      setPreviewFile(null)
                      setFileToUpload(null)
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-name">素材名称</Label>
                  <Input
                    id="asset-name"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="请输入素材名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-type">素材类型</Label>
                  <select
                    id="asset-type"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none"
                  >
                    <option value="product">商品图</option>
                    <option value="background">背景</option>
                    <option value="template">模板</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={!fileToUpload || !uploadName.trim() || uploading}>
              {uploading ? "上传中..." : "上传"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.name}</DialogTitle>
            <DialogDescription>{previewAsset && typeLabel(previewAsset.type)}</DialogDescription>
          </DialogHeader>
          <div className="flex max-h-[60vh] items-center justify-center overflow-hidden rounded-lg bg-gray-100">
            {previewAsset?.url ? (
              // Kept as img because asset URLs can be local uploads or future signed URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewAsset.url} alt={previewAsset.name} className="max-h-[60vh] max-w-full object-contain" />
            ) : (
              <FileImage className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="destructive" size="sm" onClick={() => setDeleteId(previewAsset?.id || null)}>
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPreviewAsset(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-destructive" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              当前只会从界面中移除该素材，后续需要补充真实删除 API。
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
