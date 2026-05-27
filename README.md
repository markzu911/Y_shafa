# 沙发摆放效果图网页应用

一个使用 Gemini 图片模型的 Node.js 零依赖网页应用。流程为：

1. 上传房间图片，分析布局、家具和装修风格。
2. 上传沙发图片，分析外形、材质和细节。
3. 选择场景视角、清晰度和比例，生成对应沙发摆放效果图。

## 环境变量

复制 `.env.example` 为 `.env`，填入 Gemini API Key：

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
GEMINI_ANALYSIS_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview
```

也可以直接在系统环境变量中设置 `GEMINI_API_KEY`。

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
- 分析模型默认使用 `gemini-2.5-flash`，生图模型默认使用 `gemini-3.1-flash-image-preview`。
- 生成图参数包含：远景图、中近景、近景、模特；1K、2K、4K；4:3、3:4。
- 如果模型没有返回图片，页面会显示 Gemini 返回的错误或文本提示。
