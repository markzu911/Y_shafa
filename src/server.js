import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

loadEnv(path.join(rootDir, '.env'));

const PORT = process.env.PORT || 3000;
const ANALYSIS_MODEL = process.env.GEMINI_ANALYSIS_MODEL || 'gemini-2.5-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';
const MAX_BODY_BYTES = 30 * 1024 * 1024;
const GEMINI_REQUEST_TIMEOUT_MS = getPositiveInteger(process.env.GEMINI_REQUEST_TIMEOUT_MS, 120000);

if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not set. API calls will fail until it is provided.');
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function getPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function getClientErrorMessage(error) {
  const message = String(error?.message || '').trim();
  const normalized = message.toLowerCase();

  if (normalized.includes('high demand')) {
    return '当前生图模型请求量过高，系统已经自动重试但仍未成功。请稍后再点一次生成，或临时切换到较低清晰度后重试。';
  }

  if (normalized.includes('user location is not supported')) {
    return [
      'Gemini API 调用失败：当前网络/IP 所在地区暂不支持使用 Gemini API。',
      '请切换到支持 Gemini API 的网络，或把后端部署到支持地区后重试。'
    ].join('\n');
  }

  if (
    normalized.includes('api key not valid') ||
    normalized.includes('api_key_invalid') ||
    normalized.includes('invalid api key') ||
    normalized.includes('gemini_api_key')
  ) {
    return 'Gemini API Key 无法使用：请检查 .env 里的 GEMINI_API_KEY 是否正确、是否已启用对应 API。';
  }

  if (
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('too many requests')
  ) {
    return 'Gemini API 调用受限：当前 Key 可能已达到配额或触发限流，请稍后重试或检查配额。';
  }

  if (
    normalized.includes('prepayment credits are depleted') ||
    normalized.includes('prepay') ||
    normalized.includes('billing')
  ) {
    return 'Gemini API 预付费额度已用完：请到 Google AI Studio 项目账单页面充值或调整结算设置后再试。';
  }

  if (normalized.includes('model') && (normalized.includes('not found') || normalized.includes('404'))) {
    return 'Gemini 模型不可用：请检查 .env 中 GEMINI_ANALYSIS_MODEL 或 GEMINI_IMAGE_MODEL 的模型名称。';
  }

  if (
    normalized.includes('fetch failed') ||
    normalized.includes('aborted') ||
    normalized.includes('timeout') ||
    normalized.includes('econnreset')
  ) {
    return '连接 Gemini API 超时或中断，系统已经自动重试但仍未成功。请稍后点击“生成”重试，或检查网络/代理后再试。';
  }

  return message || '请求 Gemini 时发生错误，请查看 server.err.log 获取详细日志。';
}

function sendError(res, error) {
  console.error(error);
  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  sendJson(res, statusCode, {
    error: getClientErrorMessage(error)
  });
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    }[ext] || 'application/octet-stream'
  );
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const decodedPath = decodeURIComponent(url.pathname);
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.slice(1);
  const filePath = path.resolve(publicDir, relativePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error('上传内容过大，请使用 30MB 以内的图片。'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(contentType, body) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    throw new Error('无效的上传表单。');
  }

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const fields = {};
  const files = {};
  let cursor = body.indexOf(boundary);

  while (cursor !== -1) {
    const partStart = cursor + boundary.length;
    if (body.slice(partStart, partStart + 2).toString() === '--') break;

    let contentStart = partStart;
    if (body.slice(contentStart, contentStart + 2).toString() === '\r\n') {
      contentStart += 2;
    }

    const nextBoundary = body.indexOf(boundary, contentStart);
    if (nextBoundary === -1) break;

    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), contentStart);
    if (headerEnd === -1 || headerEnd > nextBoundary) break;

    const headerText = body.slice(contentStart, headerEnd).toString('utf8');
    let content = body.slice(headerEnd + 4, nextBoundary);
    if (content.slice(-2).toString() === '\r\n') {
      content = content.slice(0, -2);
    }

    const name = headerText.match(/name="([^"]+)"/)?.[1];
    const filename = headerText.match(/filename="([^"]*)"/)?.[1];
    const mimeType = headerText.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim();

    if (name) {
      if (filename !== undefined && filename !== '') {
        files[name] = {
          filename,
          mimeType: mimeType || 'application/octet-stream',
          buffer: content
        };
      } else {
        fields[name] = content.toString('utf8');
      }
    }

    cursor = nextBoundary;
  }

  return { fields, files };
}

function fileToInlineData(file) {
  if (!file) {
    throw new Error('缺少上传图片。');
  }

  return {
    inline_data: {
      mime_type: file.mimeType,
      data: file.buffer.toString('base64')
    }
  };
}

function extractResponse(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => part.text)
    .filter(Boolean)
    .join('\n')
    .trim();

  const imagePart = parts.find((part) => part.inlineData?.data || part.inline_data?.data);
  const imageData = imagePart?.inlineData || imagePart?.inline_data;
  const mimeType = imageData?.mimeType || imageData?.mime_type || 'image/png';
  const image = imageData?.data ? `data:${mimeType};base64,${imageData.data}` : null;

  return { text, image };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientGeminiError(message, status) {
  const normalized = String(message || '').toLowerCase();
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    normalized.includes('high demand') ||
    normalized.includes('temporarily') ||
    normalized.includes('aborted') ||
    normalized.includes('timeout') ||
    normalized.includes('econnreset') ||
    normalized.includes('fetch failed')
  );
}

async function generateFromParts(parts, model) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('请先设置 GEMINI_API_KEY 环境变量。');
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
  );
  url.searchParams.set('key', process.env.GEMINI_API_KEY);

  const requestBody = JSON.stringify({
    contents: [
      {
        role: 'user',
        parts
      }
    ]
  });

  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, GEMINI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: requestBody,
        signal: controller.signal
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        return extractResponse(payload);
      }

      const message = payload?.error?.message || `Gemini 请求失败：HTTP ${response.status}`;
      const error = new Error(message);
      error.statusCode = response.status >= 500 ? 502 : response.status;
      lastError = error;

      if (!isTransientGeminiError(message, response.status) || attempt === 3) {
        throw error;
      }
    } catch (error) {
      lastError = error;
      const status = Number.isInteger(error?.statusCode) ? error.statusCode : 502;
      if (!isTransientGeminiError(error?.message, status) || attempt === 3) {
        if (!Number.isInteger(error?.statusCode)) {
          error.statusCode = error?.name === 'AbortError' ? 504 : 502;
        }
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    await wait(attempt * 1200);
  }

  throw lastError;
}

async function handleAnalyzeRoom(req, res) {
  const { files } = parseMultipart(req.headers['content-type'] || '', await readBody(req));
  const result = await generateFromParts([
    {
      text:
        '请用中文分析这张房间图片。聚焦于：1. 空间布局和动线；2. 当前家具位置与尺寸关系；3. 墙面、地面、采光和装修风格；4. 适合摆放沙发的位置、朝向、尺度建议；5. 需要避开的遮挡、门窗、插座或通道问题。请输出结构化、可执行的分析。'
    },
    fileToInlineData(files.image)
  ], ANALYSIS_MODEL);

  sendJson(res, 200, { analysis: result.text });
}

async function handleAnalyzeSofa(req, res) {
  const { files } = parseMultipart(req.headers['content-type'] || '', await readBody(req));
  const result = await generateFromParts([
    {
      text:
        '请用中文分析这张沙发图片。聚焦于：1. 外形轮廓和类型；2. 材质、纹理、颜色；3. 扶手、靠背、脚架、缝线等细节；4. 适配的家装风格；5. 在室内效果图中必须保留的视觉特征。请输出结构化、可执行的分析。'
    },
    fileToInlineData(files.image)
  ], ANALYSIS_MODEL);

  sendJson(res, 200, { analysis: result.text });
}

async function handleGenerate(req, res) {
  const { fields, files } = parseMultipart(req.headers['content-type'] || '', await readBody(req));
  const scene = fields.scene || '远景图';
  const needsModel = fields.needsModel === 'true' || scene === '模特';
  const resolution = fields.resolution || '1K';
  const ratio = fields.ratio || '4:3';
  const viewInstructions = {
    远景图: '这是镜头视角要求，不是沙发摆放位置要求。使用较广角的室内远景构图，完整呈现房间布局、主要家具关系和沙发所在的固定合理位置；可以调整拍摄机位，不必复刻用户原图机位，但沙发必须展示正面或正面三分之二视角，不能只展示侧面。',
    中近景: '这是镜头视角要求，不是沙发摆放位置要求。使用中近景构图，让沙发成为画面主体，同时保留周边墙面、地面、窗户/阳台、已有家具和采光关系；沙发仍应放在空间中固定合理的位置，并且必须展示正面或正面三分之二视角。',
    近景: '这是镜头视角要求，不是沙发摆放位置要求。近景是把镜头拉近、改变焦距或收紧取景范围，严格禁止为了做近景而把沙发往画面前方、房间中央、通道或不合理位置移动。近景可以参考单人沙发产品场景图的角度和距离：低到中等机位、正面或轻微三分之二正面视角、沙发占画面主体、距离较近，能清楚看到沙发正面轮廓、靠背、扶手、坐垫和材质细节；严格禁止生成只展示侧面、背面或侧后方的沙发。可以明显改变机位、焦距和取景范围，但环境不能照搬参考图，必须保持用户上传房间的布局逻辑、装修风格、材质、采光方向和空间关系一致。'
  };

  const prompt = [
    `视角解释：本次用户选择的“${scene}”只表示最终效果图的镜头视角、取景范围、焦距感和构图远近，不表示沙发要摆在远处、中间或近处，也不表示对用户上传房间图片做简单放大、裁切或缩小。无论选择远景、中近景还是近景，沙发都必须放在房间里最合理、最符合动线和使用场景的位置。切换场景时可以切换相机机位和镜头视角，不必完全按照用户上传房间图片的原始机位，但必须找到最适合展示沙发正面的机位。尤其选择近景时，只能通过把镜头拉近、改变相机机位、调整焦距或收紧取景范围来形成近景效果，严格禁止把沙发往近处放、往画面前景挪、放到房间中央或放到任何不符合强制摆放规则的位置。可以为了更好展示沙发而改变拍摄机位、镜头朝向、相机高度、焦距和取景范围；近景不必完全按照用户上传房间图片的原始机位，只要生成出的房间布局逻辑、装修风格、材质、采光方向和整体空间关系与用户房间保持一致。`,
    needsModel
      ? '模特图规则：用户选择需要模特，模特必须真实坐在沙发上，身体重量要落在坐垫上，臀部、大腿和沙发坐面之间要有明确接触关系，姿态要符合坐姿，不能站在旁边、靠在旁边、坐在扶手上、漂浮在沙发上方，或者只是出现在沙发附近。'
      : '模特图规则：用户选择不需要模特，画面中不要添加人物或人体局部。',
    '生成原则：绝对不要把用户上传的房间图片当作底图直接修改、覆盖、局部涂抹或贴入沙发。房间图片只用于分析空间布局、家具关系、装修风格、材质和采光；最终效果图必须根据这些分析结果重新生成一个环境一致的房间场景，再把沙发自然融入进去。',
    '房间一致性硬性限制：无论用户选择远景、中近景还是近景，都不能改变用户上传房间的布局、基本样式、装修风格、墙地面关系、门窗位置、已有家具位置和主要空间结构。严禁生成原房间里不存在的窗户、落地窗、阳台门、墙体、隔断、门洞、柱子、电视墙或大件家具；也不能删除、移动或大幅改造原房间中已经存在的主要门窗、墙体、柜体和家具。',
    '沙发一致性硬性限制：生成图中的沙发必须和用户上传的沙发图片保持一致，包括整体外形、比例、正面轮廓、扶手形态、靠背高度、坐垫结构、材质纹理、颜色、脚架和缝线细节。严禁生成另一款沙发、改变沙发类型、改变主要结构、改变颜色材质，或只保留大致风格。',
    '沙发展示角度硬性限制：无论远景、中近景还是近景，都必须展示沙发正面或轻微三分之二正面，让用户能看清正面轮廓、靠背、扶手、坐垫和主体材质。严格禁止只展示沙发侧面、背面、侧后方，或让沙发主体被角度遮挡到无法判断正面特征。',
    '强制摆放规则：无论用户选择远景、中近景还是近景，这条摆放规则都必须遵守，镜头视角只能改变拍摄机位和取景范围，不能改变沙发的固定落位。单人沙发应该固定放在窗户边、落地窗边、阳台门边或阳台区域内/旁边；如果房间图中存在窗户、落地窗、阳台门或阳台区域，就必须把沙发布置在这些采光区域附近，严禁放到房间中央、通道中、电视前方、柜门前方、远离窗户/阳台的墙边或其他不靠近采光面的地方。只有当窗边或阳台位置会严重挡住通道、门、柜体开启或造成明显不可能摆放时，才允许在同一采光区域附近微调位置。',
    '核心要求：生成结果必须像真实室内摄影，而不是把沙发抠图后贴到房间照片上。沙发需要被重新渲染进原房间环境中。相机机位不必完全照搬用户房间图，可以为了更好展示沙发适度调整高度、焦距、朝向和构图，但房间结构、装修风格、材质、采光方向和整体空间关系必须保持一致。',
    '落地要求：必须先判断房间地面平面和墙地交界线，再把沙发底部、脚架或底座稳定放在地面或地毯上。沙发与地面之间必须有真实接触点、接触阴影、环境遮挡和受力感，严禁悬空、漂浮、穿模、半透明、错位或像贴纸一样覆盖在画面上。',
    '融合要求：沙发边缘不能有硬抠图边、发光边、白边、锯齿边或不一致清晰度；沙发的亮部、暗部、投影方向、地面反射和被家具遮挡的关系都要跟原房间一致。必要时让沙发局部被原有家具或空间结构自然遮挡，以增强真实感。',
    '请基于第一张房间图片和第二张沙发图片，生成一张真实可信的室内沙发摆放效果图。',
    '摆放逻辑必须像真实室内设计师在现场布置：先判断房间窗户、阳台、电视墙、通道、已有沙发/茶几/柜体的位置，再选择一个合理落位。若房间有大窗户、落地窗或阳台，优先把单人沙发放在窗边、阳台边或采光区附近，并保持朝向自然、方便使用；不要把沙发随意放在房间中央、通道中央、电视前方、柜门前方或会阻挡动线的位置。',
    '沙发必须真实落在地面或地毯上，底部与地面有稳定接触，不能悬空、漂浮、穿模、压到茶几或与墙体家具不合理重叠。必须生成符合房间光源方向的接触阴影、地面反射、遮挡关系和透视比例，让沙发像原本就在这个房间里，而不是简单贴图。',
    '请把沙发融入房间环境：远景、中近景、近景都是镜头语言，不是摆放位置。生成图不要求完全匹配原图相机视角，近景时尤其可以换到更适合展示沙发正面的机位，但必须保持与房间环境一致的空间逻辑、布局关系、装修风格、光照关系、曝光、色温、窗边自然光、高光和阴影；沙发边缘要自然，不能有抠图感、硬边、发光边或不一致的清晰度。',
    '用户上传的沙发是单人沙发。只需要把这张单人沙发自然放入房间中，不要添加任何其他新家具、新软装、新装饰物或额外道具。',
    `场景视角：${scene}。${viewInstructions[scene] || viewInstructions.远景图}`,
    `目标清晰度：${resolution}。画面比例：${ratio}。`,
    '严格保留房间原有结构、门窗、墙地面、采光、装修风格和已有物品；将单人沙发自然摆放到合理位置，比例、透视、阴影和光照必须真实。',
    '严格参考沙发图片的外形、材质、颜色、扶手、靠背、坐垫、脚架和缝线细节，不要生成不相关的新沙发；必须优先选择能展示沙发正面的机位，不能只展示侧面。',
    needsModel
      ? '除这张单人沙发和一位真实坐在沙发上的模特之外，不要新增茶几、地毯、抱枕、绿植、灯具、画作或其他任何物体；模特不得改变房间和沙发主体。'
      : '除这张单人沙发之外，不要新增茶几、地毯、抱枕、绿植、灯具、画作、人物或其他任何物体。',
    '不要添加文字、水印、logo、边框、拼贴版式或说明标注。',
    '',
    `房间分析：${fields.roomAnalysis || ''}`,
    '',
    `沙发分析：${fields.sofaAnalysis || ''}`
  ].join('\n');

  const result = await generateFromParts([
    { text: prompt },
    fileToInlineData(files.roomImage),
    fileToInlineData(files.sofaImage)
  ], IMAGE_MODEL);

  if (!result.image) {
    throw new Error(result.text || '模型没有返回图片，请稍后重试或调整参数。');
  }

  sendJson(res, 200, {
    image: result.image,
    note: result.text,
    params: { scene, needsModel, resolution, ratio }
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true, analysisModel: ANALYSIS_MODEL, imageModel: IMAGE_MODEL });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/analyze-room') {
      await handleAnalyzeRoom(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/analyze-sofa') {
      await handleAnalyzeSofa(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/generate') {
      await handleGenerate(req, res);
      return;
    }

    if (req.method === 'GET') {
      serveStatic(req, res);
      return;
    }

    res.writeHead(405);
    res.end('Method not allowed');
  } catch (error) {
    sendError(res, error);
  }
});

server.listen(PORT, () => {
  console.log(`Sofa placement app is running at http://localhost:${PORT}`);
});
