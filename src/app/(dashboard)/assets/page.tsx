"use client"

import { useEffect, useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import {
  Upload,
  ImageIcon,
  Trash2,
  X,
  Search,
  FileImage,
  Monitor,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
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
    // Note: API doesn't have DELETE for assets, we remove from UI for now
    setAssets((prev) => prev.filter((a) => a.id !== deleteId))
    setDeleteId(null)
    setPreviewAsset(null)
  }

  const filtered = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">素材库</h1>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          上传素材
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          title={search || activeTab !== "all" ? "未找到素材" : "素材库为空"}
          description={
            search || activeTab !== "all"
              ? "尝试调整筛选条件"
              : "上传您的第一张素材图片"
          }
          action={
            search || activeTab !== "all"
              ? undefined
              : {
                  label: "上传素材",
                  onClick: () => setUploadOpen(true),
                }
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-lg border bg-white overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="aspect-square bg-gray-100 relative">
                {asset.thumbnail ? (
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <FileImage className="h-8 w-8 opacity-40" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {typeLabel(asset.type)}
                  </Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteId(asset.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>上传素材</DialogTitle>
            <DialogDescription>拖拽或点击选择图片文件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!previewFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? "释放以上传文件" : "拖拽文件到此处，或点击选择"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-gray-100">
                  <img
                    src={previewFile}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => {
                      setPreviewFile(null)
                      setFileToUpload(null)
                    }}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
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
                    placeholder="输入素材名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asset-type">类型</Label>
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

      {/* Preview Modal */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.name}</DialogTitle>
            <DialogDescription>
              {previewAsset && typeLabel(previewAsset.type)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden max-h-[60vh]">
            {previewAsset?.url ? (
              <img
                src={previewAsset.url}
                alt={previewAsset.name}
                className="max-w-full max-h-[60vh] object-contain"
              />
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

      {/* Delete Confirmation */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-destructive" />
              确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个素材吗？此操作无法撤销。</DialogDescription>
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
