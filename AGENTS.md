# Codex Project Instructions

本文件是 Codex 每次进入本仓库时优先阅读的项目指引。请先读本文件，再按任务需要读取 `.codex/project-context/` 下的详细文档。

## 项目定位

这是一个 AI 驱动的电商/营销视觉资产制作 SaaS。用户登录后创建项目，在 Studio 中使用 Fabric.js 编辑画布，通过 AI 生成场景图、抠图结果、背景图和批量变体，并管理素材、模板、生成记录和用量。

## 技术栈

- Next.js 14 App Router、React 18、TypeScript
- Tailwind CSS、shadcn 风格组件、lucide-react
- NextAuth v4 Credentials 登录
- Prisma ORM、SQLite 本地数据库
- Fabric.js 画布编辑
- Zustand 管理画布状态
- BullMQ、ioredis 已安装，后续适合做异步生成队列

## 关键目录

- `src/app`：页面与 API Route。
- `src/app/(studio)/studio/[id]/page.tsx`：核心 Studio 工作台。
- `src/components/canvas`：Fabric 画布、工具栏、图层、属性、AI、批量和模板组件。
- `src/stores/canvasStore.ts`：画布实例、选中对象、图层、撤销重做、canvasData。
- `src/lib`：auth、prisma、canvas、utils 等基础能力。
- `prisma/schema.prisma`：User、Project、Asset、Generation、Template、UsageStat。
- `public/uploads`：当前本地上传目录，仅适合开发环境。

## 开发命令

```bash
npm run dev
npm run build
npm run lint
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

Windows PowerShell 遇到 `npm.ps1` 执行策略问题时，优先使用：

```powershell
npm.cmd run dev
npx.cmd prisma generate
```

## 开发规则

- 所有用户资源 API 必须使用 `getServerSession(authOptions)` 校验登录态。
- 查询 Project、Asset、Generation、UsageStat 时必须限制 `userId`，避免跨用户访问。
- API 错误返回保持 `{ error: string }`。
- 新建 AI 任务先写入 `Generation(status: "pending")`，完成后更新 `status/resultUrl/error/metadata`。
- 用量统计只在任务从非 completed 变为 completed 时递增。
- React 组件不要直接调用第三方模型 API；provider 调用应放在服务端 `src/lib/ai` 或 API/worker 中。
- Fabric 对象变更后要同步 `renderAll()`、必要时 `saveState()`，避免画布和 store 状态漂移。
- 不要提交真实 API key；新增密钥只写 `.env.local` 示例或文档。
- 生产前必须关闭 `next.config.mjs` 的 `typescript.ignoreBuildErrors`，并修复真实类型问题。

## 后续 AI 接入方向

优先把当前 `/api/ai/mock-generate` 演进为真实生成链路：

1. `POST /api/generations` 创建 pending 任务。
2. `POST /api/ai/generate` 或队列 worker 调用真实图片生成 provider。
3. 下载或保存生成图片，得到可访问 `resultUrl`。
4. 更新 `Generation` 状态和用量。
5. 前端轮询 `GET /api/generations/[id]`，展示结果并支持加入画布、设为背景、保存素材。

## 详细文档

- `.codex/project-context/overview.md`：项目目标、当前能力、路线图。
- `.codex/project-context/architecture.md`：目录结构、核心模块、API、数据模型。
- `.codex/project-context/development-guide.md`：开发约定、验证清单、风险点。
- `.codex/project-context/ai-integration.md`：真实图片生成 API 接入方案。
- `.codex/project-context/skills.md`：推荐使用和创建的 Codex skills。

## 已知风险

- 当前部分 TSX 文案仍可能存在历史乱码，需要逐步清理为 UTF-8。目前已经清理完毕，仅保留巡检。
- `/api/ai/mock-generate` 只返回 mock URL，没有真实图片文件，预览可能 404。
- `public/uploads` 与 SQLite 只适合本地开发，生产建议迁移到对象存储和 PostgreSQL。
