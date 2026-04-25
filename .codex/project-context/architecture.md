# 架构说明

## 页面

- `src/app/(auth)/login/page.tsx`：登录。
- `src/app/(auth)/register/page.tsx`：注册。
- `src/app/(dashboard)/layout.tsx`：登录后导航布局。
- `src/app/(dashboard)/page.tsx`：仪表盘。
- `src/app/(dashboard)/projects/page.tsx`：项目列表。
- `src/app/(dashboard)/assets/page.tsx`：素材管理。
- `src/app/(dashboard)/settings/page.tsx`：设置。
- `src/app/(studio)/studio/[id]/page.tsx`：画布编辑器。

## 画布模块

- `FabricCanvas.tsx`：Fabric.js 画布核心。
- `Toolbar.tsx`：左侧工具栏。
- `LayerPanel.tsx`：图层面板。
- `PropertiesPanel.tsx`：对象属性。
- `AIPanel.tsx`：场景生成、抠图入口。
- `BatchPanel.tsx`：批量生成入口。
- `TemplateModal.tsx`：模板选择。
- `canvasStore.ts`：画布实例、选中对象、图层、历史记录、canvasData。

## API

- `api/auth/[...nextauth]`：NextAuth。
- `api/register`：注册。
- `api/projects` 与 `api/projects/[id]`：项目 CRUD。
- `api/assets`：素材列表与创建。
- `api/upload`：本地上传。
- `api/templates`：模板列表。
- `api/generations` 与 `api/generations/[id]`：AI 任务。
- `api/ai/mock-generate`：当前 mock AI。
- `api/usage`：用量统计。

## 数据模型

- `User`：用户、角色、关联项目/素材/生成/用量。
- `Project`：画布项目，含尺寸、状态、coverImage、canvasData。
- `Asset`：图片、背景、模板、贴纸等素材。
- `Generation`：AI 任务状态、prompt、resultUrl、error、metadata。
- `Template`：系统模板和默认 canvasData。
- `UsageStat`：总生成数、图片数、存储、月限额。

## 推荐生成数据流

```text
AIPanel/BatchPanel
  -> POST /api/generations
  -> POST /api/ai/generate 或 enqueue worker
  -> provider 调用真实模型
  -> 保存图片并得到 resultUrl
  -> PATCH /api/generations/[id]
  -> 前端轮询并展示结果
  -> 用户加入画布/设为背景/保存素材
```
