# 家纺设计智能体 Demo

这是一个基于 Streamlit 的最小可运行 demo：输入简单设计描述，上传参考图，调用 GLM-5 优化提示词，再生成一张设计理念图。

## 运行

```powershell
pip install -r requirements.txt
streamlit run app.py
```

打开页面后，默认使用 `glm5-local` 模式：

1. 读取 `config/.SAAS` 中的 `API_BASE_URL`、`API_KEY`、`LLM_MODEL`。
2. 调用兼容 OpenAI Chat Completions 的 `glm-5` 接口生成英文设计提示词。
3. 使用本地 Pillow 生成器输出一张概念图。

## 配置

配置文件位于：

```text
config/.SAAS
```

提示词模板位于：

```text
config/skill
```

`config/.SAAS` 中包含：

- `IMAGE_PROVIDER`：默认 `glm5-local`
- `API_BASE_URL`：兼容 OpenAI 的接口地址
- `API_KEY`：模型服务 Key
- `LLM_MODEL`：默认 `glm-5`

如果后续要调用真实图像接口，把 `OPENAI_IMAGE_API_KEY` 填好，并把页面侧边栏的生成模式切换为 `openai-image`。

## 当前能力

- 描述文本输入
- 参考图上传
- GLM-5 提示词优化
- 本地演示图生成
- 可选 OpenAI Images API 生成/编辑入口
- 生成结果展示、下载、保存到 `outputs/`

## 说明

这个版本只追求把闭环跑通，不做历史上下文、多轮优化、批量生成、局部重绘等高级能力。页面里保留了这些入口，后续可以逐步补实现。
