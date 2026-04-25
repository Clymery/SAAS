# Codex Skill 推荐

## 当前可直接使用

- `openai-docs`：查询 OpenAI API、图片生成、模型选择等最新官方资料。
- `imagegen`：生成演示素材、模板缩略图、占位场景图。
- `skill-creator`：把项目重复流程沉淀成自定义 skill。
- `skill-installer`：联网安装官方或第三方 skill。

## 建议创建的项目专属 skill

### saas-ai-provider-integration

用于新增真实图片生成 provider，统一任务生命周期、错误处理、结果存储和用量统计。

### next-prisma-api-guardrails

用于编写和审查 API Route，重点检查登录态、`userId` 数据边界、错误响应和用量重复递增。

### studio-canvas-workflow

用于开发 Fabric.js 画布功能，固化图层、选中对象、撤销重做、图片插入和背景替换规则。

### dashboard-ui-builder

用于新增管理后台页面，例如生成记录、用户管理、套餐、用量、模板管理。

### encoding-i18n-cleanup

用于修复中文乱码、统一 UTF-8、整理 UI 文案和错误提示。

## 推荐优先级

1. `encoding-i18n-cleanup`
2. `next-prisma-api-guardrails`
3. `studio-canvas-workflow`
4. `saas-ai-provider-integration`
5. `dashboard-ui-builder`
