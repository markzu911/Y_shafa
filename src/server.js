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
const SAAS_API_BASE = process.env.SAAS_API_BASE || 'http://aibigtree.com';

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

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Security-Policy', 'frame-ancestors *');
}

function isSaasProxyPath(pathname) {
  return pathname.startsWith('/api/tool/') || pathname.startsWith('/api/upload/');
}

async function proxySaasRequest(req, res, pathnameWithSearch) {
  try {
    const targetUrl = new URL(pathnameWithSearch, SAAS_API_BASE);
    const headers = {};
    const contentType = req.headers['content-type'];

    if (contentType) {
      headers['Content-Type'] = contentType;
    }

    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await readBody(req);
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });
    const buffer = Buffer.from(await response.arrayBuffer());

    setCorsHeaders(res);
    res.writeHead(response.status, {
      'Content-Type': response.headers.get('content-type') || 'application/json; charset=utf-8',
      'Content-Length': buffer.length
    });
    res.end(buffer);
  } catch (error) {
    console.error(error);
    setCorsHeaders(res);
    sendJson(res, 502, { success: false, message: 'SaaS 接口代理失败，请稍后重试。' });
  }
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
        '请用中文分析这张房间图片。聚焦于：1. 空间布局和动线；2. 当前家具位置与尺寸关系；3. 墙面、地面、采光和装修风格；4. 明确窗户、落地窗、阳台门、阳台区域和阳光/自然光照射区的位置；5. 适合把单人沙发摆放到窗边或阳台采光区的具体落点、朝向、尺度建议；6. 需要避开的遮挡、门窗、插座或通道问题。请输出结构化、可执行的分析。'
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
  const roomMode = fields.roomMode === 'virtual' ? 'virtual' : 'upload';
  const virtualStyle = fields.virtualStyle || '现代简约';
  const isVirtualRoom = roomMode === 'virtual';
  const scene = fields.scene || '远景图';
  const needsModel = fields.needsModel === 'true' || scene === '模特';
  const resolution = fields.resolution || '1K';
  const ratio = fields.ratio || '4:3';
  const virtualStyleInstructions = {
    现代简约: '现代简约虚拟房间：干净利落的线条，白色、浅灰、木色等克制配色，少量必要家具，空间明亮通透。',
    北欧风: '北欧风虚拟房间：浅木色、白墙、柔和织物、自然光、简洁温暖的居家氛围。',
    新中式: '新中式虚拟房间：木质格栅、雅致留白、东方比例、温润材质和含蓄装饰，不要过度繁复。',
    奶油风: '奶油风虚拟房间：低饱和奶油色、柔和墙面、圆润线条、温暖细腻的自然采光。',
    寂宅风: '寂宅风虚拟房间：安静留白、微水泥或自然肌理、低饱和色彩、克制家具和沉静空间感。',
    轻奢风: '轻奢风虚拟房间：精致材质、金属或石材点缀、干净高级的线条、明亮通透但不过度堆砌。'
  };
  const selectedStyleInstruction = virtualStyleInstructions[virtualStyle] || virtualStyleInstructions.现代简约;
  const globalRules = isVirtualRoom
    ? [
        `最高优先级全局规则：当前为虚拟房间模式，用户未上传房间图片。以下 4 条规则适用于所有生成图片，无论用户选择远景图、中近景还是近景，都必须严格遵守；后续所有场景视角、构图、模特、比例和美化要求都不能覆盖这 4 条。`,
        `1. 房间生成方式：必须根据用户选择的“${virtualStyle}”创建一个新的虚拟室内房间，并让房间整体符合该风格：${selectedStyleInstruction} 虚拟房间需要真实、完整、可居住，不能像展板、拼贴、广告页或纯背景棚拍。`,
        '2. 沙发固定落位：沙发必须摆放在虚拟房间的窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光的位置，同时不能遮挡房间内的主要物品、门窗、柜体、通道、电视墙或关键家具。任何镜头视角、构图、展示正面、比例、动线或模特需求都不能改变沙发必须在窗边/阳台采光区的落位。',
        '3. 房间和沙发一致性：沙发必须保持和用户上传沙发图片一致，不得改变沙发外形、材质、颜色、比例、扶手、靠背、坐垫、脚架和缝线细节。虚拟房间可以按所选风格生成必要的墙面、地面、窗户、阳台、窗帘、灯光、柜体或少量软装，但不能新增与风格无关的多余物品，不能生成第二张沙发或其他抢主体的家具。',
        '4. 场景视角定义：远景图、中近景、近景表示的是机位、镜头距离、取景范围和视角，不表示把沙发摆放到远处或近处。可以选择最适合展示沙发正面和整体效果的机位与视角；但只能移动相机和改变取景，不能移动沙发落位。'
      ]
    : [
        '最高优先级全局规则：以下 4 条规则适用于所有生成图片，无论用户选择远景图、中近景还是近景，都必须严格遵守；后续所有场景视角、构图、模特、比例和美化要求都不能覆盖这 4 条。',
        '1. 房间生成方式：必须根据模型分析到的用户上传房间信息重新生成一个环境一致的房间场景，再把沙发自然融入其中；不允许直接把用户上传的房间原图当作底图进行局部修改、涂抹、覆盖、贴入沙发或简单拼贴，避免沙发生硬地贴在房间中。',
        '2. 沙发固定落位：沙发必须摆放在窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光的位置，同时不能遮挡房间内的主要物品、门窗、柜体、通道、电视墙或关键家具。任何镜头视角、构图、展示正面、比例、动线或模特需求都不能改变沙发必须在窗边/阳台采光区的落位。',
        '3. 房间和沙发一致性：房间和沙发必须保持和用户上传图片一致。严禁新增用户原图里没有的窗户、落地窗、阳台、阳台门、墙体、隔断、门洞、柱子、电视墙、家具、茶几、地毯、绿植、灯具、画作、摆件或其他物品；严禁为了方便摆放沙发而私自新增窗户或阳台；严禁改变房屋布局、墙体结构、门窗数量和位置、装修风格、已有家具位置、已有装饰物和其他可见物品。',
        '4. 场景视角定义：远景图、中近景、近景表示的是机位、镜头距离、取景范围和视角，不表示把沙发摆放到远处或近处。可以选择最适合展示沙发正面和整体效果的机位与视角，不必和用户上传房间图片的原始机位视角一致；但只能移动相机和改变取景，不能移动沙发落位，不能改变房间布局。'
      ];
  const viewInstructions = {
    远景图: '这是镜头视角要求，不是沙发摆放位置要求。使用较广角的室内远景构图，完整呈现房间布局、主要家具关系和沙发所在的窗边/阳台采光区固定位置；可以调整拍摄机位，不必复刻用户原图机位，但沙发必须展示正面或正面三分之二视角，不能只展示侧面。',
    中近景: '这是镜头视角要求，不是沙发摆放位置要求。中近景只允许参考产品场景图的镜头距离、低到中等机位、正面轻微偏侧角度和沙发画面占比，不能参考其中的摆放位置或室内内容。必须先把用户上传的沙发固定落在目标房间的窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光的位置，再让相机去这个窗边/阳台位置寻找最适合展示沙发正面的角度；严禁为了让沙发成为主体而把沙发挪到房间中央、通道、普通墙边、远离窗户/阳台的墙边或其他非采光区域。中近景画面必须同时满足两件事：第一，沙发是主体并展示正面或轻微三分之二正面；第二，画面里必须清楚看见沙发紧邻窗户/阳台的证据，例如窗框、落地窗边缘、阳台门边、窗帘、窗台、阳光从窗边落到沙发旁地面，或沙发背后/侧边紧邻主要采光面。若为了中近景构图导致看不见窗边/阳台证据，必须放宽取景或调整相机角度，不能移动沙发。中近景必须保留足够的地面、窗户/阳台、墙面边界和已有家具作为比例参照，确保沙发大小与房间尺度真实匹配；背景房间必须保持房间来源一致。',
    近景: '这是镜头视角要求，不是沙发摆放位置要求。近景是把镜头拉近、改变焦距或收紧取景范围，严格禁止为了做近景而把沙发往画面前方、房间中央、通道或不合理位置移动。沙发仍必须放在窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光的位置，不能放到房间其他位置。近景可以参考单人沙发产品场景图的角度和距离：低到中等机位、正面或轻微三分之二正面视角、沙发占画面主体、距离较近，能清楚看到沙发正面轮廓、靠背、扶手、坐垫和材质细节；严格禁止生成只展示侧面、背面或侧后方的沙发。近景画面即使裁得更紧，也必须保留明确的窗边/阳台落位证据，例如窗框、落地窗边缘、阳台门边、窗帘、窗边强自然光、阳光照射地面或紧邻采光面的墙地交界；如果画面看不出沙发靠近窗户或阳台，该近景结果无效。可以明显改变机位、焦距和取景范围，灵活选出最适合展示沙发的视角，但环境不能照搬参考图，背景房间必须保持目标房间的布局逻辑、装修风格、材质、采光方向和空间关系一致。'
  };

  const prompt = [
    ...globalRules,
    `视角解释：本次用户选择的“${scene}”只表示最终效果图的镜头视角、取景范围、焦距感和构图远近，不表示沙发要摆在远处、中间或近处，也不表示对房间图片做简单放大、裁切或缩小。无论选择远景、中近景还是近景，沙发的唯一合法落位都是窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光的位置。切换场景时可以切换相机机位和镜头视角，${isVirtualRoom ? '虚拟房间没有上传机位，可以自由选择最适合展示沙发的机位' : '不必完全按照用户上传房间图片的原始机位'}，但必须找到最适合展示沙发正面的机位。尤其选择中近景或近景时，只能通过把镜头拉近、改变相机机位、调整焦距或收紧取景范围来形成更近的画面效果，严格禁止把沙发往近处放、往画面前景挪、放到房间中央或放到任何不在窗边/阳台采光区的位置。可以为了更好展示沙发而改变拍摄机位、镜头朝向、相机高度、焦距和取景范围；近景不必完全按照原始机位，只要生成出的房间布局逻辑、装修风格、材质、采光方向和整体空间关系与${isVirtualRoom ? '所选虚拟房间风格' : '用户房间'}保持一致。`,
    needsModel
      ? '模特图规则：用户选择需要模特，模特必须真实坐在沙发上，身体重量要落在坐垫上，臀部、大腿和沙发坐面之间要有明确接触关系，姿态要符合坐姿，不能站在旁边、靠在旁边、坐在扶手上、漂浮在沙发上方，或者只是出现在沙发附近。'
      : '模特图规则：用户选择不需要模特，画面中不要添加人物或人体局部。',
    isVirtualRoom
      ? `生成原则：当前没有用户上传的房间图片，必须按“${virtualStyle}”重新创建一个真实可信的虚拟室内房间；房间可以包含该风格必要的窗户、阳台、墙面、地面、窗帘、灯光、柜体或少量软装，但必须让用户上传的沙发自然融入其中。`
      : '生成原则：绝对不要把用户上传的房间图片当作底图直接修改、覆盖、局部涂抹或贴入沙发。房间图片只用于分析空间布局、家具关系、装修风格、材质和采光；最终效果图必须根据这些分析结果重新生成一个环境一致的房间场景，再把沙发自然融入进去。',
    isVirtualRoom
      ? `虚拟房间风格硬性限制：房间必须清楚呈现“${virtualStyle}”风格，整体空间、材质、色彩和光照都要符合该风格。允许生成必要的房间背景元素，但不得生成第二张沙发、无关大件家具、广告文字、产品分栏、展示海报或抢占主体的装饰。`
      : '房间一致性硬性限制：无论用户选择远景、中近景还是近景，都不能改变用户上传房间的布局、基本样式、装修风格、墙地面关系、门窗位置、已有家具位置、已有装饰物和主要空间结构。严禁生成原房间里不存在的窗户、落地窗、阳台门、墙体、隔断、门洞、柱子、电视墙、大件家具、茶几、地毯、绿植、灯具、挂画、摆件或其他物品；也不能删除、移动或大幅改造原房间中已经存在的主要门窗、墙体、柜体、家具和其他可见物品。',
    '沙发一致性硬性限制：生成图中的沙发必须和用户上传的沙发图片保持一致，包括整体外形、比例、正面轮廓、扶手形态、靠背高度、坐垫结构、材质纹理、颜色、脚架和缝线细节。严禁生成另一款沙发、改变沙发类型、改变主要结构、改变颜色材质，或只保留大致风格。',
    '沙发展示角度硬性限制：无论远景、中近景还是近景，都必须展示沙发正面或轻微三分之二正面，让用户能看清正面轮廓、靠背、扶手、坐垫和主体材质。严格禁止只展示沙发侧面、背面、侧后方，或让沙发主体被角度遮挡到无法判断正面特征。',
    '比例尺寸硬性限制：生成前必须根据房间地面平面、墙地交界线、门窗高度、柜体/茶几/已有家具尺寸和透视关系估算真实比例。单人沙发的宽度、高度、坐深和扶手尺度必须符合真实单人沙发与房间的比例，不能过大到压迫房间、遮挡过多已有家具或占满通道，也不能过小像儿童椅或装饰摆件。中近景和近景可以让沙发在画面中更突出，但只能通过相机更近、焦距变化或取景更紧实现，不能放大沙发实体尺寸。',
    '强制摆放规则：无论用户选择远景、中近景还是近景，这条摆放规则都必须遵守，镜头视角只能改变拍摄机位和取景范围，不能改变沙发的固定落位。单人沙发必须放在窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光照射的位置，画面中必须能看出它紧邻窗户、阳台或主要采光面。只要房间图中存在窗户、落地窗、阳台门、阳台区域或明显阳光照射区，就必须把沙发布置在这些采光位置，严禁出现在房间的其他位置，包括房间中央、通道中、电视前方、柜门前方、远离窗户/阳台的墙边、暗角或任何不靠近采光面的地方。不能因为构图、视角、展示正面、比例或动线理由把沙发移出窗边/阳台采光区；如果窗边/阳台落位与中近景或近景构图冲突，必须优先保证窗边/阳台落位，允许放宽取景或调整相机，绝不能移动沙发到房间其他区域。',
    isVirtualRoom
      ? '核心要求：生成结果必须像真实室内摄影，而不是产品棚拍、广告拼贴或纯背景图。沙发需要被重新渲染进虚拟房间环境中，相机机位可以为了更好展示沙发适度调整高度、焦距、朝向和构图，但虚拟房间风格、材质、采光方向和整体空间关系必须统一。'
      : '核心要求：生成结果必须像真实室内摄影，而不是把沙发抠图后贴到房间照片上。沙发需要被重新渲染进原房间环境中。相机机位不必完全照搬用户房间图，可以为了更好展示沙发适度调整高度、焦距、朝向和构图，但房间结构、装修风格、材质、采光方向和整体空间关系必须保持一致。',
    '落地要求：必须先判断房间地面平面和墙地交界线，再把沙发底部、脚架或底座稳定放在地面或地毯上。沙发与地面之间必须有真实接触点、接触阴影、环境遮挡和受力感，严禁悬空、漂浮、穿模、半透明、错位或像贴纸一样覆盖在画面上。',
    '融合要求：沙发边缘不能有硬抠图边、发光边、白边、锯齿边或不一致清晰度；沙发的亮部、暗部、投影方向、地面反射和被家具遮挡的关系都要跟原房间一致。必要时让沙发局部被原有家具或空间结构自然遮挡，以增强真实感。',
    isVirtualRoom
      ? '请基于用户上传的沙发图片和选择的虚拟房间风格，生成一张真实可信的室内沙发摆放效果图。'
      : '请基于第一张房间图片和第二张沙发图片，生成一张真实可信的室内沙发摆放效果图。',
    isVirtualRoom
      ? '摆放逻辑必须像真实室内设计师在虚拟房间里布置：先创建符合风格的窗边、落地窗边、阳台门边或阳台采光区，再把单人沙发放在这个采光区附近，并保持朝向自然、方便使用；不要把沙发放在房间中央、通道中央、电视前方、柜门前方、远离窗户/阳台的位置或其他非采光区域。'
      : '摆放逻辑必须像真实室内设计师在现场布置：先判断房间窗户、阳台、电视墙、通道、已有沙发/茶几/柜体的位置，再选择窗边或阳台采光区内的落位。若房间有大窗户、落地窗或阳台，必须把单人沙发放在窗边、阳台边或有阳光/自然光的采光区附近，并保持朝向自然、方便使用；不要把沙发放在房间中央、通道中央、电视前方、柜门前方、远离窗户/阳台的位置或其他非采光区域。',
    '沙发必须真实落在地面或地毯上，底部与地面有稳定接触，不能悬空、漂浮、穿模、压到茶几或与墙体家具不合理重叠。必须生成符合房间光源方向的接触阴影、地面反射、遮挡关系和透视比例，让沙发像原本就在这个房间里，而不是简单贴图。',
    '请把沙发融入房间环境：远景、中近景、近景都是镜头语言，不是摆放位置。生成图不要求完全匹配原图相机视角，近景时尤其可以换到更适合展示沙发正面的机位，但必须保持与房间环境一致的空间逻辑、布局关系、装修风格、光照关系、曝光、色温、窗边自然光、高光和阴影；沙发边缘要自然，不能有抠图感、硬边、发光边或不一致的清晰度。',
    isVirtualRoom
      ? '用户上传的沙发是单人沙发。只需要把这张单人沙发自然放入虚拟房间中，房间背景元素必须服务于所选风格和空间真实感，不要添加抢主体的其他新家具或额外道具。'
      : '用户上传的沙发是单人沙发。只需要把这张单人沙发自然放入房间中，不要添加任何其他新家具、新软装、新装饰物或额外道具。',
    `场景视角：${scene}。${viewInstructions[scene] || viewInstructions.远景图}`,
    `目标清晰度：${resolution}。画面比例：${ratio}。`,
    isVirtualRoom
      ? `严格按“${virtualStyle}”创建虚拟房间；将单人沙发自然摆放到窗边或阳台采光区的固定位置，比例、透视、阴影和光照必须真实。`
      : '严格保留房间原有结构、门窗、墙地面、采光、装修风格和已有物品；将单人沙发自然摆放到窗边或阳台采光区的固定位置，比例、透视、阴影和光照必须真实。',
    '严格参考沙发图片的外形、材质、颜色、扶手、靠背、坐垫、脚架和缝线细节，不要生成不相关的新沙发；必须优先选择能展示沙发正面的机位，不能只展示侧面。',
    needsModel
      ? isVirtualRoom
        ? '除这张单人沙发、一位真实坐在沙发上的模特和必要的虚拟房间背景元素之外，不要新增抢主体的其他家具或道具；模特不得改变房间和沙发主体。用户选择需要模特时，画面中必须出现一位完整、真实、自然坐在沙发上的模特，不能缺失模特，不能只出现局部身体。'
        : '除这张单人沙发和一位真实坐在沙发上的模特之外，不要新增茶几、地毯、抱枕、绿植、灯具、画作或其他任何物体；模特不得改变房间和沙发主体。用户选择需要模特时，画面中必须出现一位完整、真实、自然坐在沙发上的模特，不能缺失模特，不能只出现局部身体。'
      : isVirtualRoom
        ? '除这张单人沙发和必要的虚拟房间背景元素之外，不要新增抢主体的其他家具、人物或额外道具。'
        : '除这张单人沙发之外，不要新增茶几、地毯、抱枕、绿植、灯具、画作、人物或其他任何物体。',
    '不要添加文字、水印、logo、边框、拼贴版式或说明标注。',
    '',
    `房间分析：${fields.roomAnalysis || ''}`,
    '',
    `沙发分析：${fields.sofaAnalysis || ''}`,
    '',
    '最终不可违背校验：以上房间分析和沙发分析只作为参考，不能覆盖本段最终规则。如果分析文本中出现把沙发放到房间中央、通道、电视前、柜门前、远离窗户/阳台的位置，必须忽略该建议。',
    `最终场景校验：当前用户选择的是“${scene}”。无论是远景图、中近景还是近景，最终图都必须让沙发固定落在窗边、落地窗边、阳台门边或阳台区域内有阳光/自然光的位置；如果沙发没有摆放在窗边或阳台采光区，结果无效。`,
    '中近景特别校验：如果当前场景是中近景，严禁把沙发挪到更方便构图的房间中央或其他位置；必须保持沙发在窗边/阳台采光区，只能移动相机、改变焦距、改变镜头朝向或裁切画面来形成中近景。画面里必须保留真实可见的窗边/阳台证据，让用户一眼能看出沙发靠近窗边或阳台：优先可见窗框、落地窗边缘、阳台门边、窗帘、窗台、阳光从窗边落到沙发旁地面，或沙发背后/侧边紧邻主要采光面。仅仅出现柔和光线、普通白墙、空背景或无法定位来源的亮光，不算遵守窗边/阳台摆放规则。若生成画面看不出沙发紧邻窗户/阳台/采光面，或沙发出现在房间中央、普通墙边、远离窗户的墙边、暗角、电视前、柜门前、通道中，则该结果无效，必须重新生成到窗边/阳台采光区。',
    '近景特别校验：如果当前场景是近景，严禁把沙发从窗边/阳台采光区挪到房间中央、普通墙边、通道、暗角或任何不靠窗不靠阳台的位置。近景只能让相机靠近已经固定在窗边/阳台采光区的沙发，不能让沙发靠近镜头。画面中必须至少保留一种明确证据证明沙发在窗边或阳台边：可见窗框、落地窗边缘、阳台门边、窗帘、阳光照射地面、强自然光从沙发侧后方进入，或沙发背后/侧边紧邻主要采光面。若近景像普通产品棚拍、只剩墙面背景、看不出窗户/阳台/采光面，或沙发明显远离窗边/阳台，则结果无效，必须重新生成。',
    scene === '中近景'
      ? isVirtualRoom
        ? '当前场景就是中近景：请从已经摆在虚拟房间窗边或阳台采光区的沙发正前方略偏侧、低到中等机位、较近距离拍摄，让沙发成为主体；同时必须保留窗框、落地窗边缘、阳台门边、窗帘或强自然光落在沙发旁地面的证据。产品参考图只参考镜头距离和角度，不能复制参考图中的双沙发、人物、文字、底部分栏、茶几、柜体、窗景、装修或任何具体物品。最重要的是，沙发必须仍然摆在虚拟房间的窗边或阳台采光区，镜头去找沙发，不能把沙发移到镜头前。'
        : '当前场景就是中近景：请从已经摆在用户房间窗边或阳台采光区的沙发正前方略偏侧、低到中等机位、较近距离拍摄，让沙发成为主体；同时必须保留原房间已有窗户、落地窗边缘、阳台门边、窗帘或强自然光落在沙发旁地面的证据。产品参考图只参考镜头距离和角度，不能复制参考图中的双沙发、人物、文字、底部分栏、茶几、柜体、窗景、装修或任何具体物品。最重要的是，沙发必须仍然摆在用户房间的窗边或阳台采光区，镜头去找沙发，不能把沙发移到镜头前，也不能新增原图没有的窗户或阳台。'
      : '',
    scene === '近景'
      ? isVirtualRoom
        ? '当前场景就是近景：请从已经摆在虚拟房间窗边或阳台采光区的沙发正前方略偏侧靠近拍摄，保留窗框、窗帘、阳台门边或强自然光证据；不能把沙发移动到更方便拍摄的墙边、房间中央或纯背景前。'
        : '当前场景就是近景：请从已经摆在用户房间窗边或阳台采光区的沙发正前方略偏侧靠近拍摄，保留原房间已有窗户、窗帘、阳台门边或强自然光证据；不能把沙发移动到更方便拍摄的墙边、房间中央或纯背景前，也不能新增原图没有的窗户或阳台。'
      : '',
    '落位优先级校验：窗边/阳台采光区落位的优先级高于中近景构图、高于近景构图、高于沙发占画面比例、高于展示角度。为了保证窗边/阳台落位，可以让中近景或近景稍微更宽、保留更多窗边背景或让相机角度更灵活；绝不能为了中近景或近景效果而改变沙发落位。',
    '比例校验：如果沙发尺寸相对门窗、墙地交界线、柜体、茶几或已有家具显得过大或过小，结果无效；必须重新按真实单人沙发与房间尺度生成。',
    isVirtualRoom
      ? `最终虚拟房间校验：所有视角都必须是“${virtualStyle}”虚拟房间，房间必须真实完整、有自然采光，并让沙发位于窗边或阳台采光区。若结果像广告拼贴、产品详情页、纯背景棚拍，或复制参考图中的文字/分栏/双沙发/人物/具体家具，则结果无效，必须按所选风格重新生成。`
      : '最终房间一致性校验：所有视角都必须保持用户上传房间的原始布局、门窗数量和位置、墙体结构、装修风格、已有家具、已有装饰物和其他可见物品。若结果出现原图没有的窗户、墙体、门洞、家具、茶几、地毯、绿植、灯具、画作、摆件或其他新增物品，或缺失/移动/改造原图已有主要物品，则结果无效，必须按原房间重新生成。',
    needsModel
      ? '最终模特校验：用户已选择“需要模特”，最终图必须出现一位真实完整的模特，并且模特必须自然坐在这张单人沙发上，臀部和大腿与坐垫有明确接触，身体重量落在沙发上。若画面没有模特、只有人体局部、模特站在旁边、靠在旁边、漂浮、坐在扶手上或没有与坐垫真实接触，则结果无效，必须重新生成带有坐在沙发上的模特。'
      : '最终人物校验：用户选择“不需要模特”，最终图中不得出现人物、人体局部、倒影人物或照片里的人。'
  ].join('\n');

  if (!files.sofaImage) {
    throw new Error('缺少上传沙发图片。');
  }

  if (!isVirtualRoom && !files.roomImage) {
    throw new Error('缺少上传房间图片。');
  }

  const imageParts = isVirtualRoom
    ? [fileToInlineData(files.sofaImage)]
    : [fileToInlineData(files.roomImage), fileToInlineData(files.sofaImage)];

  const result = await generateFromParts([
    { text: prompt },
    ...imageParts
  ], IMAGE_MODEL);

  if (!result.image) {
    throw new Error(result.text || '模型没有返回图片，请稍后重试或调整参数。');
  }

  sendJson(res, 200, {
    image: result.image,
    note: result.text,
    params: { roomMode, virtualStyle: isVirtualRoom ? virtualStyle : '', scene, needsModel, resolution, ratio }
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      sendJson(res, 200, { ok: true, analysisModel: ANALYSIS_MODEL, imageModel: IMAGE_MODEL });
      return;
    }

    if (isSaasProxyPath(url.pathname)) {
      await proxySaasRequest(req, res, `${url.pathname}${url.search}`);
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
