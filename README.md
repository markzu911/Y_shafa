# 沙发摆放效果图网页应用

一个使用 Gemini 与 OpenAI 图片模型的 Node.js 零依赖网页应用。流程为：

1. 上传房间图片，分析布局、家具和装修风格。
2. 上传沙发图片，分析外形、材质和细节。
3. 选择场景视角、清晰度和比例，生成对应沙发摆放效果图。

## 环境变量

复制 `.env.example` 为 `.env`，填入 Gemini 和 OpenAI API Key：

```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE_URL=http://192.168.50.70:8888
PORT=3000
GEMINI_ANALYSIS_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview
OPENAI_POSTER_IMAGE_MODEL=gpt-image-2
```

也可以直接在系统环境变量中设置 `GEMINI_API_KEY` 和 `OPENAI_API_KEY`。

## 启动

项目不需要安装 npm 依赖，只需要 Node.js 18 或更高版本：

```bash
node src/server.js
```

然后打开：

```text
http://localhost:3000
```

## 说明

- 上传图片只在请求内存中处理，不保存到本地。
- 分析模型默认使用 `gemini-2.5-flash`，空间摆放图和产品图默认使用 `gemini-3.1-flash-image-preview`。
- 海报模式的沙发分析、自由创意策划和文字校验使用 Gemini 分析模型；只有完整带字海报的图片生成通过 `OPENAI_API_BASE_URL` 指定的兼容接口调用 `gpt-image-2`，生图模型由 `OPENAI_POSTER_IMAGE_MODEL` 配置。
- 海报不使用预设风格、构图或展示角度；模型根据沙发自由选择生活化场景与少量道具。用户上传的参考海报仅用于迁移设计方法，未上传时使用默认的家居广告设计原则。
- 海报中文由图片模型直接生成，随后逐字校验标题、副标题和一至两个卖点。校验失败会自动重新生成，最多三次；全部失败时不返回图片。
- 生成图参数包含：远景图、中近景、近景、模特；1K、2K、4K；4:3、3:4。
- 如果模型没有返回图片，页面会显示对应模型服务返回的错误提示。
