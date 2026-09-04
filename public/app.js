const state = {
  currentStep: 1,
  expertWorkflow: 'placement',
  roomMode: 'upload',
  virtualStyle: '现代简约',
  roomFile: null,
  sofaFile: null,
  roomAnalysis: '',
  sofaAnalysis: '',
  scene: '远景图',
  needsModel: false,
  modelDescription: '',
  resolution: '1K',
  ratio: '4:3',
  history: [],
  productStep: 1,
  productSofaFile: null,
  productSofaAnalysis: '',
  productReferenceFile: null,
  productView: '沙发正面',
  productResolution: '1K',
  productRatio: '1:1',
  productHistory: [],
  posterStep: 1,
  posterSofaFile: null,
  posterSofaAnalysis: '',
  posterReferenceFile: null,
  posterNeedsModel: false,
  posterResolution: '1K',
  posterRatio: '3:4',
  posterPrompt: '',
  posterPrice: '',
  posterHistory: [],
  saas: {
    userId: '',
    toolId: '',
    userIntegral: null,
    toolIntegral: null,
    launchUrl: '/api/tool/launch',
    verifyUrl: '/api/tool/verify',
    consumeUrl: '/api/tool/consume',
    uploadTokenUrl: '/api/upload/direct-token',
    uploadCommitUrl: '/api/upload/commit'
  },
  mode: 'agent',
  agentStep: 'welcome',
  chatMessages: [],
  chatLoading: false
};

const els = {
  creditStatus: document.querySelector('#creditStatus'),
  steps: [...document.querySelectorAll('.step[data-step-target]')],
  panels: [...document.querySelectorAll('.panel[data-step]')],
  expertWorkflowTabs: [...document.querySelectorAll('[data-expert-workflow]')],
  placementWorkflow: document.querySelector('#workflow'),
  productWorkflow: document.querySelector('#productWorkflow'),
  posterWorkflow: document.querySelector('#posterWorkflow'),
  productSteps: [...document.querySelectorAll('.step[data-product-step-target]')],
  productPanels: [...document.querySelectorAll('.panel[data-product-step]')],
  posterSteps: [...document.querySelectorAll('.step[data-poster-step-target]')],
  posterPanels: [...document.querySelectorAll('.panel[data-poster-step]')],
  roomStepTitle: document.querySelector('#roomStepTitle'),
  roomStepDescription: document.querySelector('#roomStepDescription'),
  uploadRoomPane: document.querySelector('#uploadRoomPane'),
  virtualRoomPane: document.querySelector('#virtualRoomPane'),
  roomInput: document.querySelector('#roomInput'),
  sofaInput: document.querySelector('#sofaInput'),
  roomPreview: document.querySelector('#roomPreview'),
  sofaPreview: document.querySelector('#sofaPreview'),
  analyzeRoomBtn: document.querySelector('#analyzeRoomBtn'),
  analyzeSofaBtn: document.querySelector('#analyzeSofaBtn'),
  roomLoading: document.querySelector('#roomLoading'),
  sofaLoading: document.querySelector('#sofaLoading'),
  generateBtn: document.querySelector('#generateBtn'),
  roomAnalysisBox: document.querySelector('#roomAnalysisBox'),
  sofaAnalysisBox: document.querySelector('#sofaAnalysisBox'),
  generationArea: document.querySelector('#generationArea'),
  generatedImage: document.querySelector('#generatedImage'),
  downloadLink: document.querySelector('#downloadLink'),
  generationNote: document.querySelector('#generationNote'),
  historyArea: document.querySelector('#historyArea'),
  historyGrid: document.querySelector('#historyGrid'),
  productSofaInput: document.querySelector('#productSofaInput'),
  productSofaPreview: document.querySelector('#productSofaPreview'),
  analyzeProductSofaBtn: document.querySelector('#analyzeProductSofaBtn'),
  productSofaLoading: document.querySelector('#productSofaLoading'),
  productSofaAnalysisBox: document.querySelector('#productSofaAnalysisBox'),
  generateProductBtn: document.querySelector('#generateProductBtn'),
  productGenerationArea: document.querySelector('#productGenerationArea'),
  productGeneratedImage: document.querySelector('#productGeneratedImage'),
  productDownloadLink: document.querySelector('#productDownloadLink'),
  productGenerationNote: document.querySelector('#productGenerationNote'),
  productHistoryArea: document.querySelector('#productHistoryArea'),
  productHistoryGrid: document.querySelector('#productHistoryGrid'),
  productReferenceInput: document.querySelector('#productReferenceInput'),
  productReferencePreviewWrap: document.querySelector('#productReferencePreviewWrap'),
  productReferencePreview: document.querySelector('#productReferencePreview'),
  productReferenceName: document.querySelector('#productReferenceName'),
  productReferenceUploadTitle: document.querySelector('#productReferenceUploadTitle'),
  productReferenceClearBtn: document.querySelector('#productReferenceClearBtn'),
  posterSofaInput: document.querySelector('#posterSofaInput'),
  posterSofaPreview: document.querySelector('#posterSofaPreview'),
  analyzePosterSofaBtn: document.querySelector('#analyzePosterSofaBtn'),
  posterSofaLoading: document.querySelector('#posterSofaLoading'),
  posterSofaAnalysisBox: document.querySelector('#posterSofaAnalysisBox'),
  posterReferenceInput: document.querySelector('#posterReferenceInput'),
  posterReferencePreviewWrap: document.querySelector('#posterReferencePreviewWrap'),
  posterReferencePreview: document.querySelector('#posterReferencePreview'),
  posterReferenceName: document.querySelector('#posterReferenceName'),
  posterReferenceUploadTitle: document.querySelector('#posterReferenceUploadTitle'),
  posterReferenceClearBtn: document.querySelector('#posterReferenceClearBtn'),
  posterPromptInput: document.querySelector('#posterPromptInput'),
  posterPromptCount: document.querySelector('#posterPromptCount'),
  posterPriceInput: document.querySelector('#posterPriceInput'),
  generatePosterBtn: document.querySelector('#generatePosterBtn'),
  posterGenerationProgress: document.querySelector('#posterGenerationProgress'),
  posterProgressTitle: document.querySelector('#posterProgressTitle'),
  posterProgressDetail: document.querySelector('#posterProgressDetail'),
  posterGenerationArea: document.querySelector('#posterGenerationArea'),
  posterGeneratedImage: document.querySelector('#posterGeneratedImage'),
  posterDownloadLink: document.querySelector('#posterDownloadLink'),
  posterGenerationNote: document.querySelector('#posterGenerationNote'),
  posterCopyPreview: document.querySelector('#posterCopyPreview'),
  posterCopyHeadline: document.querySelector('#posterCopyHeadline'),
  posterCopySubtitle: document.querySelector('#posterCopySubtitle'),
  posterCopySellingPoints: document.querySelector('#posterCopySellingPoints'),
  posterHistoryArea: document.querySelector('#posterHistoryArea'),
  posterHistoryGrid: document.querySelector('#posterHistoryGrid'),
  imageModal: document.querySelector('#imageModal'),
  modalImage: document.querySelector('#modalImage'),
  modalClose: document.querySelector('#modalClose'),
  toast: document.querySelector('#toast'),
  modeToggle: document.querySelector('#modeToggle'),
  expertPanel: document.querySelector('#expertPanel'),
  agentPanel: document.querySelector('#agentPanel'),
  chatMessages: document.querySelector('#chatMessages'),
  chatInput: document.querySelector('#chatInput'),
  chatSendBtn: document.querySelector('#chatSendBtn'),
  chatInputBar: document.querySelector('#chatInputBar'),
  agentRoomInput: document.querySelector('#agentRoomInput'),
  agentSofaInput: document.querySelector('#agentSofaInput')
};

const virtualStyleDescriptions = {
  现代简约: '现代简约：干净线条、克制配色、简洁墙面和自然采光，房间空间清爽有秩序。',
  北欧风: '北欧风：浅木色、白墙、柔和织物、自然光和轻盈温暖的居家氛围。',
  新中式: '新中式：木质格栅、雅致留白、东方比例、温润材质和含蓄的装饰细节。',
  奶油风: '奶油风：低饱和奶油色、柔和墙面、圆润软装和温暖细腻的自然光。',
  寂宅风: '寂宅风：安静留白、微水泥或自然肌理、低饱和色彩和沉静克制的空间感。',
  轻奢风: '轻奢风：精致材质、金属或石材点缀、干净高级的线条和明亮通透的采光。'
};

const MAX_SOURCE_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_TOOL_IMAGE_BYTES = 800 * 1024;
const MAX_TOOL_IMAGE_EDGE = 1600;
const TOOL_IMAGE_JPEG_QUALITY = 0.85;
const MIN_TOOL_IMAGE_EDGE = 960;

function showToast(message) {
  const text = String(message || '请求失败，请稍后重试。');
  els.toast.textContent = text;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  const duration = Math.min(Math.max(text.length * 90, 4200), 12000);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, duration);
}

function setBusy(button, busyText, isBusy) {
  if (isBusy) {
    if (!button.classList.contains('is-busy')) {
      button.dataset.originalText = button.textContent;
    }
    button.textContent = busyText;
    button.disabled = true;
    button.classList.add('is-busy');
    return;
  }

  button.textContent = button.dataset.originalText || button.textContent;
  button.disabled = false;
  button.classList.remove('is-busy');
}

function setAnalysisLoading(element, isLoading) {
  element.hidden = !isLoading;
}

function cleanSaasValue(value) {
  const text = String(value || '').trim();
  return text && text !== 'null' && text !== 'undefined' ? text : '';
}

function hasSaasContext() {
  return Boolean(state.saas.userId && state.saas.toolId);
}

function updateCreditStatus(text) {
  if (text) {
    els.creditStatus.textContent = text;
    return;
  }

  if (state.saas.userIntegral !== null && state.saas.userIntegral !== undefined && state.saas.userIntegral !== '') {
    els.creditStatus.textContent = `积分：${state.saas.userIntegral}`;
    return;
  }

  els.creditStatus.textContent = hasSaasContext() ? '积分：读取中' : '积分：--';
}

function applySaasPayload(data = {}) {
  const userIntegral = data.user?.integral ?? data.currentIntegral;
  const toolIntegral = data.tool?.integral ?? data.requiredIntegral ?? data.consumedIntegral;

  if (userIntegral !== undefined && userIntegral !== null) {
    state.saas.userIntegral = userIntegral;
  }

  if (toolIntegral !== undefined && toolIntegral !== null) {
    state.saas.toolIntegral = toolIntegral;
  }

  updateCreditStatus();
}

function applySaasConfig(config = {}) {
  const next = {
    userId: cleanSaasValue(config.userId) || state.saas.userId,
    toolId: cleanSaasValue(config.toolId) || state.saas.toolId,
    launchUrl: cleanSaasValue(config.launchUrl) || state.saas.launchUrl,
    verifyUrl: cleanSaasValue(config.verifyUrl) || state.saas.verifyUrl,
    consumeUrl: cleanSaasValue(config.consumeUrl || config.callbackUrl) || state.saas.consumeUrl,
    uploadTokenUrl: cleanSaasValue(config.uploadTokenUrl) || state.saas.uploadTokenUrl,
    uploadCommitUrl: cleanSaasValue(config.uploadCommitUrl) || state.saas.uploadCommitUrl
  };

  Object.assign(state.saas, next);
  updateCreditStatus();
}

function getSaasRequestBody() {
  return {
    userId: state.saas.userId,
    toolId: state.saas.toolId
  };
}

function getHttpErrorMessage(response, payload = {}, action = '请求') {
  const serverMessage = payload.error || payload.message;
  if (serverMessage) return serverMessage;

  const status = response.status;
  if (status === 413) return '上传图片过大：请更换图片，或将图片压缩后再重试。';
  if (status === 429) return '请求过于频繁：当前服务繁忙，请稍后再试。';
  if (status === 502) return `${action}失败：服务网关异常，可能是上游 AI 接口暂时不可用，请稍后重试。`;
  if (status === 503) return `${action}失败：服务暂时不可用（HTTP 503），可能是平台工具实例未启动、正在重启、上游 AI 服务繁忙或部署代理超时，请稍后重试。`;
  if (status === 504) return `${action}失败：服务响应超时（HTTP 504），AI 生成耗时过长，请稍后重试。`;
  if (status >= 500) return `${action}失败：服务器处理异常（HTTP ${status}），请稍后重试。`;
  return `${action}失败（HTTP ${status}），请检查后重试。`;
}

function getNetworkErrorMessage(error, action = '请求') {
  if (error?.name === 'AbortError') return `${action}失败：请求已超时，请稍后重试。`;
  return `${action}失败：网络连接异常或服务无法访问，请检查网络/部署状态后重试。`;
}

async function postJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error));
  }

  const payload = await response.json().catch(() => ({}));
  const ok = response.ok && (payload.success === true || payload.valid === true);
  if (!ok) {
    const error = new Error(getHttpErrorMessage(response, payload));
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function loadSaasLaunch() {
  if (!hasSaasContext()) return;

  updateCreditStatus('积分：读取中');
  try {
    const payload = await postJson(state.saas.launchUrl, getSaasRequestBody());
    applySaasPayload(payload.data || {});
  } catch (error) {
    updateCreditStatus('积分：获取失败');
  }
}

async function ensureCreditsAvailable() {
  if (!hasSaasContext()) return true;

  try {
    const payload = await postJson(state.saas.verifyUrl, getSaasRequestBody());
    applySaasPayload(payload.data || {});
    return true;
  } catch (error) {
    showToast(error.status === 402 || error.payload?.insufficient === true ? '您的积分不足' : error.message);
    return false;
  }
}

async function consumeCredits() {
  if (!hasSaasContext()) return null;

  const payload = await postJson(state.saas.consumeUrl, getSaasRequestBody());
  applySaasPayload(payload.data || {});
  return payload;
}

async function imageDataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

async function dataUrlToImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('生成图片读取失败。'));
    image.src = dataUrl;
  });
}

function getImageExtension(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/webp') return 'webp';
  return 'png';
}

async function putGeneratedBlob(token, blob, mimeType) {
  const candidates = [token.uploadUrl, token.proxyUploadUrl, token.ossUploadUrl].filter(Boolean);
  const uniqueCandidates = [...new Set(candidates)];
  let lastError = null;

  for (const uploadUrl of uniqueCandidates) {
    try {
      const response = await fetch(uploadUrl, {
        method: token.method || 'PUT',
        headers: token.headers || { 'Content-Type': mimeType },
        body: blob
      });

      if (response.ok) return;

      lastError = new Error(`生成图片上传失败（HTTP ${response.status}）。`);
      if (response.status !== 413) break;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('生成图片上传失败。');
}

async function uploadGeneratedImage(imageDataUrl, filePrefix = 'sofa-placement') {
  if (!hasSaasContext()) return null;

  const blob = await imageDataUrlToBlob(imageDataUrl);
  const mimeType = blob.type || imageDataUrl.match(/^data:([^;]+)/)?.[1] || 'image/png';
  const extension = getImageExtension(mimeType);
  const fileName = `${filePrefix}-${Date.now()}.${extension}`;
  const token = await postJson(state.saas.uploadTokenUrl, {
    ...getSaasRequestBody(),
    source: 'result',
    fileName,
    mimeType,
    fileSize: blob.size
  });
  if (!(token.uploadUrl || token.proxyUploadUrl || token.ossUploadUrl) || !token.objectKey) {
    throw new Error('图片上传签名返回异常。');
  }

  await putGeneratedBlob(token, blob, mimeType);

  const commit = await postJson(state.saas.uploadCommitUrl, {
    ...getSaasRequestBody(),
    source: 'result',
    objectKey: token.objectKey,
    fileSize: blob.size
  });

  if (commit.savedToRecords !== true && commit.image?.savedToRecords !== true) {
    throw new Error('生成图片未成功入库。');
  }

  return commit;
}

function goToStep(step) {
  state.currentStep = step;
  els.panels.forEach((panel) => {
    panel.classList.toggle('is-active', Number(panel.dataset.step) === step);
  });
  els.steps.forEach((button) => {
    const buttonStep = Number(button.dataset.stepTarget);
    button.classList.toggle('is-active', buttonStep === step);
    button.disabled =
      (buttonStep === 2 && !state.roomAnalysis) ||
      (buttonStep === 3 && (!state.roomAnalysis || !state.sofaAnalysis));
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToProductStep(step) {
  state.productStep = step;
  els.productPanels.forEach((panel) => {
    panel.classList.toggle('is-active', Number(panel.dataset.productStep) === step);
  });
  els.productSteps.forEach((button) => {
    const buttonStep = Number(button.dataset.productStepTarget);
    button.classList.toggle('is-active', buttonStep === step);
    button.disabled = buttonStep === 2 && !state.productSofaAnalysis;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToPosterStep(step) {
  state.posterStep = step;
  els.posterPanels.forEach((panel) => {
    panel.classList.toggle('is-active', Number(panel.dataset.posterStep) === step);
  });
  els.posterSteps.forEach((button) => {
    const buttonStep = Number(button.dataset.posterStepTarget);
    button.classList.toggle('is-active', buttonStep === step);
    button.disabled = buttonStep === 2 && !state.posterSofaAnalysis;
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchExpertWorkflow(workflow) {
  state.expertWorkflow = ['placement', 'product', 'poster'].includes(workflow) ? workflow : 'placement';
  const isProduct = state.expertWorkflow === 'product';
  const isPoster = state.expertWorkflow === 'poster';

  els.placementWorkflow.hidden = isProduct || isPoster;
  els.productWorkflow.hidden = !isProduct;
  els.posterWorkflow.hidden = !isPoster;
  els.expertWorkflowTabs.forEach((button) => {
    const isSelected = button.dataset.expertWorkflow === state.expertWorkflow;
    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-selected', String(isSelected));
    button.tabIndex = isSelected ? 0 : -1;
  });

  if (isProduct) {
    goToProductStep(state.productSofaAnalysis ? 2 : 1);
  } else if (isPoster) {
    goToPosterStep(state.posterSofaAnalysis ? 2 : 1);
  } else {
    goToStep(state.currentStep);
  }
}

function previewFile(file, img) {
  const url = URL.createObjectURL(file);
  img.src = url;
  img.classList.add('has-image');
}

function getImageFileName(file, extension) {
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
  return `${baseName}.${extension}`;
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败，请更换图片后重试。'));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

async function renderImageBlob(image, width, height, mimeType, quality) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (mimeType === 'image/jpeg') {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(image, 0, 0, width, height);
  return canvasToBlob(canvas, mimeType, quality);
}

async function renderJpegBlob(image, width, height, quality) {
  return renderImageBlob(image, width, height, 'image/jpeg', quality);
}

async function prepareToolImage(file) {
  if (!file?.type?.startsWith('image/')) return file;
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('图片超过 20MB，请更换或压缩后再上传。');
  }

  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_TOOL_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));

  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let blob = null;

  for (const quality of [TOOL_IMAGE_JPEG_QUALITY, 0.78, 0.7, 0.62]) {
    blob = await renderJpegBlob(image, width, height, quality);
    if (blob && blob.size <= MAX_TOOL_IMAGE_BYTES) break;
  }

  while (blob && blob.size > MAX_TOOL_IMAGE_BYTES && Math.max(width, height) > MIN_TOOL_IMAGE_EDGE) {
    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
    for (const quality of [0.76, 0.68, 0.6]) {
      blob = await renderJpegBlob(image, width, height, quality);
      if (blob && blob.size <= MAX_TOOL_IMAGE_BYTES) break;
    }
  }

  if (blob && blob.size > MAX_TOOL_IMAGE_BYTES) {
    blob = await renderJpegBlob(image, width, height, 0.52);
  }

  if (!blob) return file;
  return new File([blob], getImageFileName(file, 'jpg'), { type: 'image/jpeg' });
}

async function postForm(url, formData) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error, 'AI 处理'));
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(getHttpErrorMessage(response, payload, url.includes('/api/generate') ? '图片生成' : '图片分析'));
  }
  return payload;
}

async function postFormStream(url, formData, onProgress) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    throw new Error(getNetworkErrorMessage(error, '海报生成'));
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(getHttpErrorMessage(response, payload, '图片生成'));
  }
  if (!response.body) {
    throw new Error('浏览器无法读取海报生成进度，请升级浏览器后重试。');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let resultPayload = null;

  const processLine = (line) => {
    const text = line.trim();
    if (!text) return;
    let event;
    try {
      event = JSON.parse(text);
    } catch {
      throw new Error('海报生成进度响应格式无效。');
    }
    if (event.type === 'progress') {
      onProgress?.(event);
    } else if (event.type === 'error') {
      throw new Error(event.error || '海报生成失败，请重试。');
    } else if (event.type === 'result') {
      resultPayload = event.payload;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.forEach(processLine);
    if (done) break;
  }
  processLine(buffer);

  if (!resultPayload) {
    throw new Error('海报生成结束，但没有返回通过内容校验的图片。');
  }
  return resultPayload;
}

function makeImageForm(fieldName, file) {
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
}

function openHistoryPreview(src) {
  els.modalImage.src = src;
  els.imageModal.hidden = false;
  document.body.classList.add('is-modal-open');
}

function closeHistoryPreview() {
  els.imageModal.hidden = true;
  els.modalImage.removeAttribute('src');
  document.body.classList.remove('is-modal-open');
}

function renderHistory() {
  els.historyGrid.innerHTML = '';
  els.historyArea.hidden = state.history.length === 0;

  state.history.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'history-thumb';
    button.type = 'button';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `查看第 ${state.history.length - index} 张生成图`);

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '生成效果图缩略图';

    const meta = document.createElement('span');
    meta.textContent = item.label;

    button.append(img, meta);
    els.historyGrid.append(button);
  });
}

function getVirtualRoomAnalysis() {
  const styleDescription = virtualStyleDescriptions[state.virtualStyle]
    || `自定义风格：${state.virtualStyle}。根据风格名称的理解，生成符合该描述的室内房间设计。`;
  return [
    `虚拟房间模式：用户未上传房间图片，需要根据”${state.virtualStyle}”创建一个新的虚拟室内房间。`,
    styleDescription,
    '房间必须包含自然采光来源，例如窗户、落地窗、阳台门或阳台区域；单人沙发必须摆放在窗边或阳台采光区，并且不能遮挡主要通道、门窗、柜体或关键家具。',
    '房间背景可以包含符合该风格的必要墙面、地面、窗帘、灯光、柜体或少量软装，但不能改变用户上传沙发的外形、颜色、材质和比例。'
  ].join('\n');
}

function resetRoomContext() {
  state.roomAnalysis = '';
  els.roomAnalysisBox.hidden = true;
  els.roomAnalysisBox.textContent = '';
  goToStep(1);
}

function updateRoomModeUI() {
  const isVirtual = state.roomMode === 'virtual';
  els.uploadRoomPane.hidden = isVirtual;
  els.virtualRoomPane.hidden = !isVirtual;
  els.roomStepTitle.textContent = isVirtual ? '选择虚拟房间风格' : '上传房间图片';
  els.roomStepDescription.textContent = isVirtual
    ? '无需上传房间图，选择一个虚拟房间风格，生成时会按该风格创建房间。'
    : '模型会分析空间布局、家具关系、装修风格和适合摆放沙发的位置。';
  els.analyzeRoomBtn.textContent = isVirtual ? '确认虚拟房间风格，下一步' : '分析房间';
  els.analyzeRoomBtn.disabled = isVirtual ? false : !state.roomFile;
}

function getParamsLabel() {
  const modelLabel = state.needsModel ? '需要模特' : '不需要模特';
  const roomLabel = state.roomMode === 'virtual' ? `虚拟${state.virtualStyle}` : '上传房间';
  return `${roomLabel} · ${state.scene} · ${modelLabel} · ${state.resolution} · ${state.ratio}`;
}

function addHistoryItem(payload) {
  state.history.unshift({
    image: payload.image,
    label: getParamsLabel()
  });
  state.history = state.history.slice(0, 12);
  renderHistory();
}

function getProductParamsLabel(usedReference = Boolean(state.productReferenceFile)) {
  const referenceLabel = usedReference ? '参考图驱动 · ' : '';
  return `产品图 · ${referenceLabel}${state.productView} · ${state.productResolution} · ${state.productRatio}`;
}

function renderProductHistory() {
  els.productHistoryGrid.innerHTML = '';
  els.productHistoryArea.hidden = state.productHistory.length === 0;

  state.productHistory.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'history-thumb';
    button.type = 'button';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `查看第 ${state.productHistory.length - index} 张产品图`);

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = '沙发产品图缩略图';

    const meta = document.createElement('span');
    meta.textContent = item.label;

    button.append(img, meta);
    els.productHistoryGrid.append(button);
  });
}

function addProductHistoryItem(payload) {
  state.productHistory.unshift({
    image: payload.image,
    label: getProductParamsLabel(payload.params?.usedReference)
  });
  state.productHistory = state.productHistory.slice(0, 12);
  renderProductHistory();
}

function getPosterParamsLabel(usedReference = Boolean(state.posterReferenceFile), price = state.posterPrice) {
  const modelLabel = state.posterNeedsModel ? '需要模特' : '不需要模特';
  const referenceLabel = usedReference ? '参考图驱动 · ' : '';
  const priceLabel = price ? ` · ¥${price}` : '';
  return `海报 · ${referenceLabel}AI 自动角度 · ${modelLabel} · ${state.posterResolution} · ${state.posterRatio}${priceLabel}`;
}

function renderPosterCopyPreview(copy) {
  els.posterCopyHeadline.textContent = copy.headline;
  els.posterCopySubtitle.textContent = copy.subtitle;
  els.posterCopySellingPoints.innerHTML = '';
  const featurePoints = [
    ...(copy.verticalSellingPoints || []),
    ...(copy.horizontalSellingPoints || [])
  ];
  const displayPoints = featurePoints.length > 0 ? featurePoints : (copy.sellingPoints || []);
  displayPoints.forEach((point) => {
    const item = document.createElement('li');
    item.textContent = typeof point === 'string'
      ? point
      : `${point.title}${point.description ? ` · ${point.description}` : ''}`;
    els.posterCopySellingPoints.append(item);
  });
  els.posterCopySellingPoints.hidden = displayPoints.length === 0;
  els.posterCopyPreview.hidden = false;
}

function renderPosterHistory() {
  els.posterHistoryGrid.innerHTML = '';
  els.posterHistoryArea.hidden = state.posterHistory.length === 0;

  state.posterHistory.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'history-thumb';
    button.type = 'button';
    button.dataset.index = String(index);
    button.setAttribute('aria-label', `查看第 ${state.posterHistory.length - index} 张海报`);

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = '沙发促销海报缩略图';

    const meta = document.createElement('span');
    meta.textContent = item.label;
    button.append(image, meta);
    els.posterHistoryGrid.append(button);
  });
}

function addPosterHistoryItem(payload) {
  state.posterHistory.unshift({
    image: payload.image,
    label: getPosterParamsLabel(payload.params?.usedReference, payload.params?.price)
  });
  state.posterHistory = state.posterHistory.slice(0, 12);
  renderPosterHistory();
}

/* ===================================================================
   Agent Mode — Chat Engine
   =================================================================== */

let chatMsgId = 0;

function nextChatId() {
  chatMsgId += 1;
  return `msg-${chatMsgId}`;
}

function addChatMessage(role, type, content, extra = {}) {
  state.chatMessages.push({
    id: nextChatId(),
    role,
    type,
    content,
    ...extra,
    timestamp: Date.now()
  });
}

function removeChatLoading() {
  state.chatMessages = state.chatMessages.filter(function (m) { return m.type !== 'loading'; });
  state.chatLoading = false;
}

function addChatLoading(content) {
  removeChatLoading();
  state.chatLoading = true;
  state.chatMessages.push({
    id: nextChatId(),
    role: 'assistant',
    type: 'loading',
    content: content || '正在思考…',
    timestamp: Date.now()
  });
}

function scrollChatToBottom() {
  var container = els.chatMessages;
  if (container) {
    requestAnimationFrame(function () {
      container.scrollTop = container.scrollHeight;
    });
  }
}

function formatTime(ts) {
  var d = new Date(ts);
  var h = d.getHours();
  var m = d.getMinutes();
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatContent(text) {
  return escapeHtml(text)
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function renderChatMessages() {
  if (!els.chatMessages) return;
  els.chatMessages.innerHTML = '';

  state.chatMessages.forEach(function (msg) {
    var row = document.createElement('div');
    row.className = 'msg-row msg--' + msg.role;
    if (msg.type === 'error') {
      row.className += ' msg--error';
    }
    if (msg.type === 'loading') {
      row.className += ' msg--loading';
    }

    // 头像
    var avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    if (msg.role === 'assistant') {
      avatar.textContent = '🤖';
    } else {
      avatar.textContent = '👤';
    }

    // 消息体（气泡 + 时间）
    var body = document.createElement('div');
    body.className = 'msg-body';

    var bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (msg.type === 'loading') {
      bubble.innerHTML = '<div class="typing-dots"><i></i><i></i><i></i></div>';
    } else if (msg.type === 'text' || msg.type === 'error') {
      bubble.innerHTML = '<p>' + formatContent(msg.content) + '</p>';
    } else if (msg.type === 'options') {
      bubble.innerHTML = '<p>' + formatContent(msg.content) + '</p>';
      if (msg.options && msg.options.length) {
        var chips = document.createElement('div');
        chips.className = 'chat-chips';
        msg.options.forEach(function (opt) {
          var chip = document.createElement('button');
          chip.className = 'chat-chip';
          chip.type = 'button';
          chip.textContent = opt.label;
          chip.dataset.action = opt.action;
          chip.dataset.payload = opt.payload || '';
          chips.appendChild(chip);
        });
        bubble.appendChild(chips);
      }
    } else if (msg.type === 'image-upload') {
      bubble.innerHTML = '<p>' + formatContent(msg.content) + '</p>';
      var zone = document.createElement('div');
      zone.className = 'chat-upload-zone';
      zone.dataset.target = msg.target || '';
      zone.innerHTML =
        '<span class="upload-icon-inline">+</span>' +
        '<strong>' + escapeHtml(msg.uploadLabel || '点击上传图片') + '</strong>' +
        '<small>' + escapeHtml(msg.uploadHint || '支持 JPG、PNG、WebP，最大 20MB') + '</small>';
      bubble.appendChild(zone);
    } else if (msg.type === 'image-preview') {
      bubble.innerHTML = '<p>' + formatContent(msg.content) + '</p>';
      if (msg.imageUrl) {
        var preview = document.createElement('div');
        preview.className = 'chat-image-preview';
        var img = document.createElement('img');
        img.src = msg.imageUrl;
        img.alt = '上传的图片预览';
        img.addEventListener('click', function () {
          openHistoryPreview(msg.imageUrl);
        });
        preview.appendChild(img);
        bubble.appendChild(preview);
      }
    } else if (msg.type === 'result-card') {
      bubble.innerHTML = '<p>' + formatContent(msg.content) + '</p>';
      if (msg.imageUrl) {
        var card = document.createElement('div');
        card.className = 'result-card';
        var cardImg = document.createElement('img');
        cardImg.src = msg.imageUrl;
        cardImg.alt = '生成效果图';
        cardImg.addEventListener('click', function () {
          openHistoryPreview(msg.imageUrl);
        });
        card.appendChild(cardImg);

        var footer = document.createElement('div');
        footer.className = 'result-card-footer';
        var meta = document.createElement('span');
        meta.className = 'result-meta';
        meta.textContent = msg.meta || '';
        var dl = document.createElement('a');
        dl.className = 'download-link-inline';
        dl.href = msg.imageUrl;
        dl.download = 'sofa-placement.png';
        dl.textContent = '⬇ 下载图片';
        dl.addEventListener('click', function (e) { e.stopPropagation(); });
        footer.appendChild(meta);
        footer.appendChild(dl);
        card.appendChild(footer);
        bubble.appendChild(card);
      }
    }

    body.appendChild(bubble);

    if (msg.type !== 'loading') {
      var time = document.createElement('div');
      time.className = 'msg-time';
      time.textContent = formatTime(msg.timestamp);
      body.appendChild(time);
    }

    row.appendChild(avatar);
    row.appendChild(body);
    els.chatMessages.appendChild(row);
  });

  scrollChatToBottom();
}

/* ===================================================================
   Agent Mode — Guided Flow Engine
   =================================================================== */

function isAgentStepDone() {
  return state.agentStep === 'done';
}

function getCurrentAgentContext() {
  return {
    hasRoom: Boolean(state.roomAnalysis),
    hasSofa: Boolean(state.sofaAnalysis && state.sofaFile),
    roomMode: state.roomMode,
    hasRoomFile: Boolean(state.roomFile),
    hasSofaFile: Boolean(state.sofaFile),
    paramsSet: true
  };
}

function handleAgentOptionClick(action, payload, skipUserMessage, userLabel) {
  if (state.chatLoading) return;

  if (!skipUserMessage) {
    addChatMessage('user', 'text', userLabel || payload || action);
  }

  switch (action) {
    case 'pick-room-source':
      if (payload === 'upload') {
        state.roomMode = 'upload';
        state.roomAnalysis = '';
        state.roomFile = null;
        if (state.agentStep === 'awaiting-room-source') {
          addChatMessage('assistant', 'image-upload',
            '好的，请上传你的**房间照片** 📷\n\n我会分析空间布局、采光和适合摆放沙发的位置。',
            { target: 'agentRoomInput', uploadLabel: '点击上传房间照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
          state.agentStep = 'awaiting-room-upload';
        } else {
          addChatMessage('assistant', 'image-upload',
            '好的，切换为**上传真实房间照片**模式 📷\n\n请重新上传房间照片，我会重新分析。',
            { target: 'agentRoomInput', uploadLabel: '点击上传房间照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
          state.agentStep = 'awaiting-room-upload';
        }
      } else if (payload === 'virtual') {
        state.roomMode = 'virtual';
        state.roomAnalysis = '';
        state.roomFile = null;
        addChatMessage('assistant', 'options',
          '好的，请选择一个你喜欢的**虚拟房间风格** 🏠',
          {
            options: [
              { label: '现代简约', action: 'pick-style', payload: '现代简约' },
              { label: '北欧风', action: 'pick-style', payload: '北欧风' },
              { label: '新中式', action: 'pick-style', payload: '新中式' },
              { label: '奶油风', action: 'pick-style', payload: '奶油风' },
              { label: '寂宅风', action: 'pick-style', payload: '寂宅风' },
              { label: '轻奢风', action: 'pick-style', payload: '轻奢风' }
            ]
          });
        state.agentStep = 'awaiting-style-select';
      }
      break;

    case 'pick-style':
      state.virtualStyle = payload;
      state.roomAnalysis = getVirtualRoomAnalysis();
      if (state.agentStep === 'awaiting-style-select') {
        addChatMessage('assistant', 'text',
          '✅ 已选择 **' + payload + '** 风格。\n\n接下来请上传你的**沙发图片** 🛋️，我会分析沙发的外形、材质和颜色。');
        addChatMessage('assistant', 'image-upload',
          '请上传沙发照片',
          { target: 'agentSofaInput', uploadLabel: '点击上传沙发照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
        state.agentStep = 'awaiting-sofa-upload';
      } else {
        addChatMessage('assistant', 'text',
          '✅ 已切换为 **' + payload + '** 风格，房间分析已更新。');
        addChatMessage('assistant', 'image-upload',
          '请上传沙发照片 🛋️',
          { target: 'agentSofaInput', uploadLabel: '点击上传沙发照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
      }
      break;

    case 'pick-custom-style':
      state.virtualStyle = payload;
      state.roomAnalysis = getVirtualRoomAnalysis();
      addChatMessage('assistant', 'text',
        '✅ 已选择自定义风格 **' + payload + '**。\n\n接下来请上传你的**沙发图片** 🛋️。');
      addChatMessage('assistant', 'image-upload',
        '请上传沙发照片',
        { target: 'agentSofaInput', uploadLabel: '点击上传沙发照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
      state.agentStep = 'awaiting-sofa-upload';
      break;

    case 'pick-scene':
    case 'pick-model':
    case 'pick-resolution':
    case 'pick-ratio':
    case 'pick-custom-model':
      handleParamSelect(action, payload);
      break;

    case 'generate':
      handleAgentGenerate();
      break;

    case 'restart':
      resetAgentChat();
      break;

    default:
      addChatMessage('assistant', 'text', '收到你的消息。请按上方的选项继续操作，或者切换回「专家模式」使用完整参数面板。');
      break;
  }

  renderChatMessages();
}

function handleParamSelect(action, payload) {
  switch (action) {
    case 'pick-scene':
      state.scene = payload;
      addChatMessage('assistant', 'text', '✅ 场景图：**' + payload + '**');
      askModelOption();
      break;
    case 'pick-model':
      state.needsModel = payload === 'true';
      state.modelDescription = '';
      addChatMessage('assistant', 'text', '✅ 模特：**' + (state.needsModel ? '需要' : '不需要') + '**');
      askResolutionOption();
      break;
    case 'pick-custom-model':
      state.needsModel = true;
      state.modelDescription = payload;
      addChatMessage('assistant', 'text', '✅ 模特：**' + payload + '**');
      askResolutionOption();
      break;
    case 'pick-resolution':
      state.resolution = payload;
      addChatMessage('assistant', 'text', '✅ 清晰度：**' + payload + '**');
      askRatioOption();
      break;
    case 'pick-ratio':
      state.ratio = payload;
      addChatMessage('assistant', 'text', '✅ 比例：**' + payload + '**');
      var summary = '✅ 参数已全部确认：\n\n' +
        '• 场景图：**' + state.scene + '**\n' +
        '• 模特：**' + (state.needsModel ? '需要' : '不需要') + '**\n' +
        '• 清晰度：**' + state.resolution + '**\n' +
        '• 比例：**' + state.ratio + '**\n\n' +
        '一切就绪！点击下方按钮开始生成 👇';
      addChatMessage('assistant', 'options', summary, {
        options: [
          { label: '🚀 开始生成效果图', action: 'generate', payload: '' }
        ]
      });
      state.agentStep = 'ready-to-generate';
      break;
  }
}

async function handleAgentGenerate() {
  var hasRoomContext = state.roomMode === 'virtual'
    ? Boolean(state.roomAnalysis && state.virtualStyle)
    : Boolean(state.roomFile && state.roomAnalysis);

  if (!hasRoomContext || !state.sofaFile || !state.sofaAnalysis) {
    addChatMessage('assistant', 'error', '⚠️ 请先完成房间和沙发分析再生成。');
    renderChatMessages();
    return;
  }

  addChatLoading('正在校验积分…');
  renderChatMessages();

  if (!(await ensureCreditsAvailable())) {
    removeChatLoading();
    addChatMessage('assistant', 'error', '❌ 积分不足，无法执行该操作。请充值后重试。');
    renderChatMessages();
    return;
  }

  removeChatLoading();
  addChatLoading('正在生成效果图…这可能需要 30-60 秒 ⏳');
  renderChatMessages();

  var formData = new FormData();
  if (state.roomMode === 'upload') {
    formData.append('roomImage', state.roomFile);
  }
  formData.append('sofaImage', state.sofaFile);
  formData.append('roomMode', state.roomMode);
  formData.append('virtualStyle', state.virtualStyle);
  formData.append('roomAnalysis', state.roomAnalysis);
  formData.append('sofaAnalysis', state.sofaAnalysis);
  formData.append('scene', state.scene);
  formData.append('needsModel', String(state.needsModel));
  formData.append('modelDescription', state.modelDescription || '');
  formData.append('resolution', state.resolution);
  formData.append('ratio', state.ratio);

  try {
    var payload = await postForm('/api/generate', formData);

    removeChatLoading();
    await consumeCredits();

    try {
      await uploadGeneratedImage(payload.image);
    } catch (uploadError) {
      // non-fatal
    }

    addChatMessage('assistant', 'result-card',
      '🎉 效果图已生成！以下是你的沙发摆放方案：',
      { imageUrl: payload.image, meta: getParamsLabel() });

    addChatMessage('assistant', 'options',
      '还需要生成其他方案吗？',
      {
        options: [
          { label: '🔄 重新开始', action: 'restart', payload: '' },
          { label: '⚙️ 切换到专家模式', action: 'switch-expert', payload: '' }
        ]
      });

    addHistoryItem(payload);
    state.agentStep = 'done';
  } catch (error) {
    removeChatLoading();
    addChatMessage('assistant', 'error', '❌ 生成失败：' + escapeHtml(error.message));
  }

  renderChatMessages();
}

async function handleAgentFileUpload(target, file) {
  if (!file) return;

  try {
    var prepared = await prepareToolImage(file);

    if (target === 'agentRoomInput') {
      state.roomFile = prepared;
      var previewUrl = URL.createObjectURL(file);
      addChatMessage('user', 'image-preview', '已上传房间照片', { imageUrl: previewUrl });

      addChatLoading('正在分析房间…');
      renderChatMessages();

      if (!(await ensureCreditsAvailable())) {
        removeChatLoading();
        addChatMessage('assistant', 'error', '❌ 积分不足，无法执行该操作。请充值后重试。');
        renderChatMessages();
        return;
      }

      var roomPayload = await postForm('/api/analyze-room', makeImageForm('image', state.roomFile));
      state.roomAnalysis = roomPayload.analysis || '模型没有返回文字分析。';

      removeChatLoading();
      addChatMessage('assistant', 'text',
        '✅ 房间分析完成！\n\n' +
        '接下来请上传你的**沙发图片** 🛋️，我会分析沙发的外形、材质和颜色。');
      addChatMessage('assistant', 'image-upload',
        '请上传沙发照片',
        { target: 'agentSofaInput', uploadLabel: '点击上传沙发照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
      state.agentStep = 'awaiting-sofa-upload';
    } else if (target === 'agentSofaInput') {
      state.sofaFile = prepared;
      var sofaPreviewUrl = URL.createObjectURL(file);
      addChatMessage('user', 'image-preview', '已上传沙发照片', { imageUrl: sofaPreviewUrl });

      addChatLoading('正在分析沙发…');
      renderChatMessages();

      var sofaPayload = await postForm('/api/analyze-sofa', makeImageForm('image', state.sofaFile));
      state.sofaAnalysis = sofaPayload.analysis || '模型没有返回文字分析。';

      removeChatLoading();
      addChatMessage('assistant', 'text', '✅ 沙发分析完成！');
      showParamOptions();
      state.agentStep = 'awaiting-params';
    }

    renderChatMessages();
  } catch (error) {
    removeChatLoading();
    addChatMessage('assistant', 'error', '❌ ' + escapeHtml(error.message));
    renderChatMessages();
  }
}

function showParamOptions() {
  askSceneOption();
}

function askSceneOption() {
  addChatMessage('assistant', 'options',
    '请选择**场景图类型**（远景 / 中近景 / 近景）：',
    {
      options: [
        { label: '🏞️ 远景图', action: 'pick-scene', payload: '远景图' },
        { label: '📐 中近景', action: 'pick-scene', payload: '中近景' },
        { label: '🔍 近景', action: 'pick-scene', payload: '近景' }
      ]
    });
}

function askModelOption() {
  addChatMessage('assistant', 'options',
    '是否需要**模特**入镜？你也可以直接描述想要的模特，比如"亚裔女模特"、"欧美男模特"等。',
    {
      options: [
        { label: '👤 需要模特', action: 'pick-model', payload: 'true' },
        { label: '🚫 不需要', action: 'pick-model', payload: 'false' }
      ]
    });
}

function askResolutionOption() {
  addChatMessage('assistant', 'options',
    '请选择**清晰度**：',
    {
      options: [
        { label: '1K', action: 'pick-resolution', payload: '1K' },
        { label: '2K', action: 'pick-resolution', payload: '2K' },
        { label: '4K', action: 'pick-resolution', payload: '4K' }
      ]
    });
}

function askRatioOption() {
  addChatMessage('assistant', 'options',
    '请选择**画面比例**：',
    {
      options: [
        { label: '4:3 横版', action: 'pick-ratio', payload: '4:3' },
        { label: '3:4 竖版', action: 'pick-ratio', payload: '3:4' }
      ]
    });
}

function resetAgentChat() {
  state.chatMessages = [];
  state.agentStep = 'welcome';
  state.chatLoading = false;
  initAgentChat();
}

function initAgentChat() {
  if (state.chatMessages.length > 0) return;

  addChatMessage('assistant', 'text',
    '你好！我是你的 **AI 沙发摆放助手** 🛋️\n\n我会一步步帮你完成沙发摆放效果图的制作。首先，请选择房间来源：');

  addChatMessage('assistant', 'options',
    '请选择：',
    {
      options: [
        { label: '📷 上传房间照片', action: 'pick-room-source', payload: 'upload' },
        { label: '🏠 虚拟房间', action: 'pick-room-source', payload: 'virtual' }
      ]
    });

  state.agentStep = 'awaiting-room-source';
  renderChatMessages();
}

/* ===================================================================
   Agent Mode — Mode Switching
   =================================================================== */

function switchMode(mode) {
  if (mode === state.mode) return;
  hideSplash();
  enterMode(mode);
}

function syncExpertToAgent() {
  if (state.roomAnalysis && state.sofaAnalysis && state.sofaFile) {
    addChatMessage('assistant', 'text',
      '📋 已从专家模式同步你的进度。\n\n' +
      '• 房间模式：**' + (state.roomMode === 'virtual' ? '虚拟' + state.virtualStyle : '上传房间') + '**\n' +
      '• 房间和沙发分析已完成 ✅\n\n' +
      '接下来请确认生成参数：');
    showParamOptions();
    state.agentStep = 'awaiting-params';
  } else if (state.roomAnalysis) {
    addChatMessage('assistant', 'text',
      '📋 已从专家模式同步你的进度。\n\n• 房间分析已完成 ✅\n\n接下来请上传沙发图片 🛋️');
    addChatMessage('assistant', 'image-upload',
      '请上传沙发照片',
      { target: 'agentSofaInput', uploadLabel: '点击上传沙发照片', uploadHint: '支持 JPG、PNG、WebP，最大 20MB' });
    state.agentStep = 'awaiting-sofa-upload';
  } else {
    initAgentChat();
  }
  renderChatMessages();
}

els.expertWorkflowTabs.forEach((button, index) => {
  button.addEventListener('click', () => {
    switchExpertWorkflow(button.dataset.expertWorkflow);
  });
  button.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const offset = event.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (index + offset + els.expertWorkflowTabs.length) % els.expertWorkflowTabs.length;
    els.expertWorkflowTabs[nextIndex].focus();
    switchExpertWorkflow(els.expertWorkflowTabs[nextIndex].dataset.expertWorkflow);
  });
});

els.productSofaInput.addEventListener('change', async () => {
  const file = els.productSofaInput.files?.[0];
  if (!file) return;
  try {
    state.productSofaFile = await prepareToolImage(file);
    state.productSofaAnalysis = '';
    els.productSofaAnalysisBox.hidden = true;
    els.productSofaAnalysisBox.textContent = '';
    els.productGenerationArea.hidden = true;
    els.analyzeProductSofaBtn.disabled = false;
    previewFile(file, els.productSofaPreview);
    goToProductStep(1);
  } catch (error) {
    showToast(error.message);
  }
});

els.analyzeProductSofaBtn.addEventListener('click', async () => {
  if (!state.productSofaFile) return;

  try {
    setBusy(els.analyzeProductSofaBtn, '正在分析沙发...', true);
    setAnalysisLoading(els.productSofaLoading, true);
    els.productSofaAnalysisBox.hidden = true;
    const payload = await postForm('/api/analyze-sofa', makeImageForm('image', state.productSofaFile));
    state.productSofaAnalysis = payload.analysis || '模型没有返回文字分析。';
    els.productSofaAnalysisBox.textContent = state.productSofaAnalysis;
    els.productSofaAnalysisBox.hidden = false;
    goToProductStep(2);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(els.analyzeProductSofaBtn, '分析沙发', false);
    setAnalysisLoading(els.productSofaLoading, false);
    els.analyzeProductSofaBtn.disabled = !state.productSofaFile;
  }
});

function clearProductReference() {
  state.productReferenceFile = null;
  els.productReferenceInput.value = '';
  els.productReferencePreview.removeAttribute('src');
  els.productReferencePreview.classList.remove('has-image');
  els.productReferencePreviewWrap.hidden = true;
  els.productReferenceName.textContent = '';
  els.productReferenceUploadTitle.textContent = '上传参考图片';
  els.productGenerationArea.hidden = true;
}

els.productReferenceInput.addEventListener('change', async () => {
  const file = els.productReferenceInput.files?.[0];
  if (!file) return;

  try {
    const preparedFile = await prepareToolImage(file);
    state.productReferenceFile = preparedFile;
    previewFile(file, els.productReferencePreview);
    els.productReferenceName.textContent = file.name;
    els.productReferencePreviewWrap.hidden = false;
    els.productReferenceUploadTitle.textContent = '更换参考图片';
    els.productGenerationArea.hidden = true;
  } catch (error) {
    clearProductReference();
    showToast(error.message);
  }
});

els.productReferenceClearBtn.addEventListener('click', clearProductReference);

els.generateProductBtn.addEventListener('click', async () => {
  if (!state.productSofaFile || !state.productSofaAnalysis) {
    showToast('请先上传并分析沙发图片。');
    return;
  }

  const formData = new FormData();
  formData.append('sofaImage', state.productSofaFile);
  formData.append('sofaAnalysis', state.productSofaAnalysis);
  formData.append('view', state.productView);
  formData.append('resolution', state.productResolution);
  formData.append('ratio', state.productRatio);
  if (state.productReferenceFile) {
    formData.append('referenceImage', state.productReferenceFile);
  }

  try {
    setBusy(els.generateProductBtn, '正在校验积分...', true);
    if (!(await ensureCreditsAvailable())) return;

    setBusy(
      els.generateProductBtn,
      state.productReferenceFile ? '正在分析参考并生成...' : '正在生成产品图...',
      true
    );
    els.productGenerationArea.hidden = true;
    const payload = await postForm('/api/generate-product', formData);
    setBusy(els.generateProductBtn, '正在扣除积分...', true);
    await consumeCredits();

    try {
      setBusy(els.generateProductBtn, '正在保存图片...', true);
      await uploadGeneratedImage(payload.image, 'sofa-product');
    } catch (uploadError) {
      showToast(`图片已生成并扣除积分，但保存到我的图片失败：${uploadError.message}`);
    }

    els.productGeneratedImage.src = payload.image;
    els.productGeneratedImage.classList.add('has-image');
    els.productDownloadLink.href = payload.image;
    els.productGenerationNote.textContent = payload.note || getProductParamsLabel(payload.params?.usedReference);
    els.productGenerationArea.hidden = false;
    addProductHistoryItem(payload);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(els.generateProductBtn, '生成产品图', false);
  }
});

els.posterSofaInput.addEventListener('change', async () => {
  const file = els.posterSofaInput.files?.[0];
  if (!file) return;
  try {
    state.posterSofaFile = await prepareToolImage(file);
    state.posterSofaAnalysis = '';
    els.posterSofaAnalysisBox.hidden = true;
    els.posterSofaAnalysisBox.textContent = '';
    els.posterGenerationArea.hidden = true;
    els.posterCopyPreview.hidden = true;
    els.analyzePosterSofaBtn.disabled = false;
    previewFile(file, els.posterSofaPreview);
    goToPosterStep(1);
  } catch (error) {
    showToast(error.message);
  }
});

els.analyzePosterSofaBtn.addEventListener('click', async () => {
  if (!state.posterSofaFile) return;

  try {
    setBusy(els.analyzePosterSofaBtn, '正在分析沙发...', true);
    setAnalysisLoading(els.posterSofaLoading, true);
    els.posterSofaAnalysisBox.hidden = true;
    const payload = await postForm('/api/analyze-poster-sofa', makeImageForm('image', state.posterSofaFile));
    state.posterSofaAnalysis = payload.analysis || '模型没有返回文字分析。';
    els.posterSofaAnalysisBox.textContent = state.posterSofaAnalysis;
    els.posterSofaAnalysisBox.hidden = false;
    goToPosterStep(2);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(els.analyzePosterSofaBtn, '分析沙发', false);
    setAnalysisLoading(els.posterSofaLoading, false);
    els.analyzePosterSofaBtn.disabled = !state.posterSofaFile;
  }
});

function clearPosterReference() {
  state.posterReferenceFile = null;
  els.posterReferenceInput.value = '';
  els.posterReferencePreview.removeAttribute('src');
  els.posterReferencePreview.classList.remove('has-image');
  els.posterReferencePreviewWrap.hidden = true;
  els.posterReferenceName.textContent = '';
  els.posterReferenceUploadTitle.textContent = '上传参考海报';
  els.posterGenerationArea.hidden = true;
  els.posterCopyPreview.hidden = true;
}

els.posterReferenceInput.addEventListener('change', async () => {
  const file = els.posterReferenceInput.files?.[0];
  if (!file) return;

  try {
    const preparedFile = await prepareToolImage(file);
    state.posterReferenceFile = preparedFile;
    previewFile(file, els.posterReferencePreview);
    els.posterReferenceName.textContent = file.name;
    els.posterReferencePreviewWrap.hidden = false;
    els.posterReferenceUploadTitle.textContent = '更换参考海报';
    els.posterGenerationArea.hidden = true;
    els.posterCopyPreview.hidden = true;
  } catch (error) {
    clearPosterReference();
    showToast(error.message);
  }
});

els.posterReferenceClearBtn.addEventListener('click', clearPosterReference);

els.posterPromptInput.addEventListener('input', () => {
  const value = Array.from(els.posterPromptInput.value).slice(0, 100).join('');
  if (value !== els.posterPromptInput.value) {
    els.posterPromptInput.value = value;
  }
  state.posterPrompt = value;
  els.posterPromptCount.textContent = `${Array.from(value).length} / 100`;
});

els.posterPriceInput.addEventListener('input', () => {
  const digits = els.posterPriceInput.value.replace(/\D/g, '').slice(0, 8);
  const normalized = digits.replace(/^0+(?=\d)/, '');
  els.posterPriceInput.value = normalized;
  state.posterPrice = normalized;
});

els.generatePosterBtn.addEventListener('click', async () => {
  if (!state.posterSofaFile || !state.posterSofaAnalysis) {
    showToast('请先上传并分析沙发图片。');
    return;
  }

  const posterPrice = els.posterPriceInput.value.trim();
  if (posterPrice && !/^[1-9]\d{0,7}$/.test(posterPrice)) {
    showToast('商品价格只能填写 1 至 8 位正整数。');
    els.posterPriceInput.focus();
    return;
  }
  state.posterPrice = posterPrice;

  const posterPrompt = els.posterPromptInput.value.trim();
  if (Array.from(posterPrompt).length > 100) {
    showToast('创意提示词最多填写 100 个字符。');
    els.posterPromptInput.focus();
    return;
  }
  state.posterPrompt = posterPrompt;

  const formData = new FormData();
  formData.append('sofaImage', state.posterSofaFile);
  formData.append('sofaAnalysis', state.posterSofaAnalysis);
  formData.append('needsModel', String(state.posterNeedsModel));
  formData.append('resolution', state.posterResolution);
  formData.append('ratio', state.posterRatio);
  formData.append('prompt', state.posterPrompt);
  formData.append('price', state.posterPrice);
  if (state.posterReferenceFile) {
    formData.append('referenceImage', state.posterReferenceFile);
  }

  try {
    setBusy(els.generatePosterBtn, '正在校验积分...', true);
    if (!(await ensureCreditsAvailable())) return;

    const planningLabel = state.posterReferenceFile
      ? 'AI 正在校验参考海报...'
      : state.posterPrompt
        ? 'AI 正在理解创意需求...'
        : 'AI 正在策划海报...';
    setBusy(els.generatePosterBtn, planningLabel, true);
    els.posterGenerationArea.hidden = true;
    els.posterCopyPreview.hidden = true;
    setAnalysisLoading(els.posterGenerationProgress, true);
    els.posterProgressTitle.textContent = state.posterReferenceFile
      ? '正在结合参考图策划海报'
      : state.posterPrompt
        ? '正在根据创意需求策划海报'
        : '正在根据沙发策划海报';
    els.posterProgressDetail.textContent = state.posterPrompt
      ? 'AI 正在把需求转化为场景、构图、配色与中文文案'
      : 'AI 正在自由决定场景、构图、配色、灯光、展示角度与中文文案';
    const payload = await postFormStream('/api/generate-poster', formData, (event) => {
      els.posterProgressTitle.textContent = event.title || '正在生成海报';
      els.posterProgressDetail.textContent = event.detail || '请稍候';
      setBusy(els.generatePosterBtn, event.title || '正在生成海报...', true);
    });
    const finalPayload = payload;

    setBusy(els.generatePosterBtn, '正在扣除积分...', true);
    await consumeCredits();

    try {
      setBusy(els.generatePosterBtn, '正在保存海报...', true);
      await uploadGeneratedImage(finalPayload.image, 'sofa-poster');
    } catch (uploadError) {
      showToast(`海报已生成并扣除积分，但保存到我的图片失败：${uploadError.message}`);
    }

    els.posterGeneratedImage.src = finalPayload.image;
    els.posterGeneratedImage.classList.add('has-image');
    els.posterGeneratedImage.parentElement.style.aspectRatio = 'auto';
    els.posterDownloadLink.href = finalPayload.image;
    renderPosterCopyPreview(finalPayload.copy);
    const concept = payload.artDirection?.concept || 'AI 自由创意海报';
    const validationAttempts = payload.params?.validationAttempts || 1;
    els.posterGenerationNote.textContent = `${concept} · 内容校验第 ${validationAttempts}/3 次通过 · ${getPosterParamsLabel(payload.params?.usedReference, payload.params?.price)}`;
    els.posterGenerationArea.hidden = false;
    addPosterHistoryItem(finalPayload);
  } catch (error) {
    showToast(error.message);
  } finally {
    setAnalysisLoading(els.posterGenerationProgress, false);
    setBusy(els.generatePosterBtn, '生成海报', false);
  }
});

els.roomInput.addEventListener('change', async () => {
  const file = els.roomInput.files?.[0];
  if (!file) return;
  try {
    state.roomFile = await prepareToolImage(file);
    state.roomAnalysis = '';
    els.roomAnalysisBox.hidden = true;
    updateRoomModeUI();
    previewFile(file, els.roomPreview);
  } catch (error) {
    showToast(error.message);
  }
});

els.sofaInput.addEventListener('change', async () => {
  const file = els.sofaInput.files?.[0];
  if (!file) return;
  try {
    state.sofaFile = await prepareToolImage(file);
    state.sofaAnalysis = '';
    els.sofaAnalysisBox.hidden = true;
    els.analyzeSofaBtn.disabled = false;
    previewFile(file, els.sofaPreview);
  } catch (error) {
    showToast(error.message);
  }
});

els.analyzeRoomBtn.addEventListener('click', async () => {
  try {
    setBusy(els.analyzeRoomBtn, '正在校验积分...', true);
    if (!(await ensureCreditsAvailable())) return;

    if (state.roomMode === 'virtual') {
      state.roomAnalysis = getVirtualRoomAnalysis();
      els.roomAnalysisBox.textContent = state.roomAnalysis;
      els.roomAnalysisBox.hidden = false;
      goToStep(2);
      return;
    }

    if (!state.roomFile) return;

    setBusy(els.analyzeRoomBtn, '正在分析房间...', true);
    setAnalysisLoading(els.roomLoading, true);
    els.roomAnalysisBox.hidden = true;
    const payload = await postForm('/api/analyze-room', makeImageForm('image', state.roomFile));
    state.roomAnalysis = payload.analysis || '模型没有返回文字分析。';
    els.roomAnalysisBox.textContent = state.roomAnalysis;
    els.roomAnalysisBox.hidden = false;
    goToStep(2);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(els.analyzeRoomBtn, '分析房间', false);
    setAnalysisLoading(els.roomLoading, false);
    updateRoomModeUI();
  }
});

els.analyzeSofaBtn.addEventListener('click', async () => {
  if (!state.sofaFile) return;

  try {
    setBusy(els.analyzeSofaBtn, '正在分析沙发...', true);
    setAnalysisLoading(els.sofaLoading, true);
    els.sofaAnalysisBox.hidden = true;
    const payload = await postForm('/api/analyze-sofa', makeImageForm('image', state.sofaFile));
    state.sofaAnalysis = payload.analysis || '模型没有返回文字分析。';
    els.sofaAnalysisBox.textContent = state.sofaAnalysis;
    els.sofaAnalysisBox.hidden = false;
    goToStep(3);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(els.analyzeSofaBtn, '分析沙发', false);
    setAnalysisLoading(els.sofaLoading, false);
    els.analyzeSofaBtn.disabled = !state.sofaFile;
  }
});

els.generateBtn.addEventListener('click', async () => {
  const hasRoomContext =
    state.roomMode === 'virtual' ? Boolean(state.roomAnalysis && state.virtualStyle) : Boolean(state.roomFile && state.roomAnalysis);

  if (!hasRoomContext || !state.sofaFile || !state.sofaAnalysis) {
    showToast('请先完成房间和沙发分析。');
    return;
  }

  const formData = new FormData();
  if (state.roomMode === 'upload') {
    formData.append('roomImage', state.roomFile);
  }
  formData.append('sofaImage', state.sofaFile);
  formData.append('roomMode', state.roomMode);
  formData.append('virtualStyle', state.virtualStyle);
  formData.append('roomAnalysis', state.roomAnalysis);
  formData.append('sofaAnalysis', state.sofaAnalysis);
  formData.append('scene', state.scene);
  formData.append('needsModel', String(state.needsModel));
  formData.append('modelDescription', state.modelDescription || '');
  formData.append('resolution', state.resolution);
  formData.append('ratio', state.ratio);

  try {
    setBusy(els.generateBtn, '正在校验积分...', true);
    if (!(await ensureCreditsAvailable())) return;

    setBusy(els.generateBtn, '正在生成效果图...', true);
    els.generationArea.hidden = true;
    const payload = await postForm('/api/generate', formData);
    setBusy(els.generateBtn, '正在扣除积分...', true);
    await consumeCredits();

    try {
      setBusy(els.generateBtn, '正在保存图片...', true);
      await uploadGeneratedImage(payload.image);
    } catch (uploadError) {
      showToast(`图片已生成并扣除积分，但保存到我的图片失败：${uploadError.message}`);
    }

    els.generatedImage.src = payload.image;
    els.generatedImage.classList.add('has-image');
    els.downloadLink.href = payload.image;
    els.generationNote.textContent = payload.note || getParamsLabel();
    els.generationArea.hidden = false;
    addHistoryItem(payload);
  } catch (error) {
    showToast(error.message);
  } finally {
    setBusy(els.generateBtn, '生成效果图', false);
  }
});

document.querySelectorAll('.segmented').forEach((group) => {
  group.querySelectorAll('button').forEach((item) => {
    item.setAttribute('aria-pressed', String(item.classList.contains('is-selected')));
  });
  group.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    group.querySelectorAll('button').forEach((item) => {
      item.classList.toggle('is-selected', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    state[group.dataset.group] = ['needsModel', 'posterNeedsModel'].includes(group.dataset.group)
      ? button.dataset.value === 'true'
      : button.dataset.value;

    if (group.dataset.group === 'roomMode') {
      resetRoomContext();
      updateRoomModeUI();
    }

    if (group.dataset.group === 'virtualStyle' && state.roomMode === 'virtual') {
      state.roomAnalysis = '';
      els.roomAnalysisBox.hidden = true;
      els.roomAnalysisBox.textContent = '';
      updateRoomModeUI();
    }

    if (group.dataset.group === 'ratio') {
      els.generatedImage.parentElement.style.aspectRatio =
        button.dataset.value === '3:4' ? '3 / 4' : '4 / 3';
    }

    if (group.dataset.group === 'productRatio') {
      const aspectRatios = { '4:3': '4 / 3', '3:4': '3 / 4', '1:1': '1 / 1' };
      els.productGeneratedImage.parentElement.style.aspectRatio = aspectRatios[button.dataset.value];
    }

    if (group.dataset.group === 'posterRatio') {
      const aspectRatios = { '4:3': '4 / 3', '3:4': '3 / 4', '1:1': '1 / 1' };
      els.posterGeneratedImage.parentElement.style.aspectRatio =
        els.posterGeneratedImage.classList.contains('has-image') ? 'auto' : aspectRatios[button.dataset.value];
    }
  });
});

document.querySelectorAll('[data-back]').forEach((button) => {
  button.addEventListener('click', () => goToStep(Number(button.dataset.back)));
});

document.querySelectorAll('[data-product-back]').forEach((button) => {
  button.addEventListener('click', () => goToProductStep(Number(button.dataset.productBack)));
});

document.querySelectorAll('[data-poster-back]').forEach((button) => {
  button.addEventListener('click', () => goToPosterStep(Number(button.dataset.posterBack)));
});

els.historyGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.history-thumb');
  if (!button) return;
  const item = state.history[Number(button.dataset.index)];
  if (item) {
    openHistoryPreview(item.image);
  }
});

els.generatedImage.addEventListener('click', () => {
  if (els.generatedImage.src) {
    openHistoryPreview(els.generatedImage.src);
  }
});

els.productHistoryGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.history-thumb');
  if (!button) return;
  const item = state.productHistory[Number(button.dataset.index)];
  if (item) {
    openHistoryPreview(item.image);
  }
});

els.productGeneratedImage.addEventListener('click', () => {
  if (els.productGeneratedImage.src) {
    openHistoryPreview(els.productGeneratedImage.src);
  }
});

els.posterHistoryGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.history-thumb');
  if (!button) return;
  const item = state.posterHistory[Number(button.dataset.index)];
  if (item) {
    openHistoryPreview(item.image);
  }
});

els.posterGeneratedImage.addEventListener('click', () => {
  if (els.posterGeneratedImage.src) {
    openHistoryPreview(els.posterGeneratedImage.src);
  }
});

els.modalClose.addEventListener('click', closeHistoryPreview);

els.imageModal.addEventListener('click', (event) => {
  if (event.target === els.imageModal) {
    closeHistoryPreview();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !els.imageModal.hidden) {
    closeHistoryPreview();
  }
});

els.steps.forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.disabled) {
      goToStep(Number(button.dataset.stepTarget));
    }
  });
});

els.productSteps.forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.disabled) {
      goToProductStep(Number(button.dataset.productStepTarget));
    }
  });
});

els.posterSteps.forEach((button) => {
  button.addEventListener('click', () => {
    if (!button.disabled) {
      goToPosterStep(Number(button.dataset.posterStepTarget));
    }
  });
});

function initSaasFromUrl() {
  const params = new URLSearchParams(window.location.search);
  applySaasConfig({
    userId: params.get('userId'),
    toolId: params.get('toolId'),
    launchUrl: params.get('launchUrl'),
    verifyUrl: params.get('verifyUrl'),
    consumeUrl: params.get('consumeUrl'),
    uploadTokenUrl: params.get('uploadTokenUrl'),
    uploadCommitUrl: params.get('uploadCommitUrl')
  });
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'SAAS_INIT') return;

  applySaasConfig(data);
  loadSaasLaunch();
});

initSaasFromUrl();
loadSaasLaunch();

updateRoomModeUI();

/* ===================================================================
   Agent Mode — Event Handlers
   =================================================================== */

document.querySelector('#expertToAgent')?.addEventListener('click', function () {
  switchMode('agent');
});

document.querySelector('#productToAgent')?.addEventListener('click', function () {
  switchMode('agent');
});

document.querySelector('#posterToAgent')?.addEventListener('click', function () {
  switchMode('agent');
});

document.querySelector('#topbarToAgent')?.addEventListener('click', function () {
  switchMode('agent');
});

document.querySelector('#topbarToExpert')?.addEventListener('click', function () {
  switchMode('expert');
});

var chatNewBtn = document.querySelector('#chatNewBtn');
if (chatNewBtn) {
  chatNewBtn.addEventListener('click', function () {
    resetAgentChat();
    renderChatMessages();
  });
}

function parseUserInput(text) {
  var t = text.replace(/\s+/g, '').toLowerCase();
  var step = state.agentStep;

  // 全局命令 — 随时可用
  if (/专家|切换/.test(t)) return { action: 'switch-expert', payload: '' };
  if (/重新|再来|重来|从头/.test(t)) return { action: 'restart', payload: '' };

  // 房间来源 — 随时可切换
  if (/上传房间|拍照|真实|实拍|房间照片|本地上传/.test(t)) {
    if (state.roomMode !== 'upload' || step === 'awaiting-room-source') {
      return { action: 'pick-room-source', payload: 'upload' };
    }
  }
  if (/虚拟房间|虚拟|生成房间/.test(t)) {
    if (state.roomMode !== 'virtual' || step === 'awaiting-room-source') {
      return { action: 'pick-room-source', payload: 'virtual' };
    }
  }

  // 风格选择 — 随时可切换（虚拟房间模式下）
  if (state.roomMode === 'virtual' || step === 'awaiting-style-select') {
    if (/现代简约/.test(t)) return { action: 'pick-style', payload: '现代简约' };
    if (/北欧风?$|北欧(?!房间)/.test(t)) return { action: 'pick-style', payload: '北欧风' };
    if (/新中式/.test(t)) return { action: 'pick-style', payload: '新中式' };
    if (/奶油风/.test(t)) return { action: 'pick-style', payload: '奶油风' };
    if (/寂宅风|侘寂/.test(t)) return { action: 'pick-style', payload: '寂宅风' };
    if (/轻奢风/.test(t)) return { action: 'pick-style', payload: '轻奢风' };
    // 如果是虚拟模式且在选风格步骤，没有匹配到预设，视为自定义风格
    if (step === 'awaiting-style-select' && text.length > 0 && text.length < 30) {
      return { action: 'pick-custom-style', payload: text };
    }
  }

  // 按步骤匹配
  if (step === 'awaiting-room-source') {
    if (/上传|拍照|真实|实拍|房间照片/.test(t)) return { action: 'pick-room-source', payload: 'upload' };
    if (/虚拟|生成/.test(t)) return { action: 'pick-room-source', payload: 'virtual' };
  }

  if (step === 'awaiting-room-upload') {
    return { action: 'upload-room', payload: '' };
  }

  if (step === 'awaiting-sofa-upload') {
    return { action: 'upload-sofa', payload: '' };
  }

  if (step === 'awaiting-params' || step === 'ready-to-generate' || step === 'awaiting-sofa-upload' || step === 'done') {
    if (/远景|远景图|全景/.test(t)) return { action: 'pick-scene', payload: '远景图' };
    if (/中近景/.test(t)) return { action: 'pick-scene', payload: '中近景' };
    if (/近景(?!图)/.test(t)) return { action: 'pick-scene', payload: '近景' };
    if (/需要模特|有模特|要模特|带模特|有人/.test(t)) return { action: 'pick-model', payload: 'true' };
    if (/不要模特|不需要模特|无模特|没人/.test(t)) return { action: 'pick-model', payload: 'false' };
    // 如果不在参数选择步骤且输入不是预定义关键词，可能是在描述自定义模特
    if (step === 'awaiting-params' && text.length > 0 && text.length < 40 &&
        !/远景|中近景|近景|4K|2K|1K|4:3|3:4|横|竖|生成|开始|确认|好了/.test(t)) {
      return { action: 'pick-custom-model', payload: text };
    }
    if (/4K|4k|超清/.test(t)) return { action: 'pick-resolution', payload: '4K' };
    if (/2K|2k|高清/.test(t)) return { action: 'pick-resolution', payload: '2K' };
    if (/1K|1k|标清/.test(t)) return { action: 'pick-resolution', payload: '1K' };
    if (/4:3|横|横版|横图/.test(t)) return { action: 'pick-ratio', payload: '4:3' };
    if (/3:4|竖|竖版|竖图/.test(t)) return { action: 'pick-ratio', payload: '3:4' };
    if (/生成|开始|确认|好了|可以|做吧|go|ok|行|好/.test(t)) return { action: 'generate', payload: '' };
  }

  return null;
}

function getStepHint() {
  var hints = {
    'awaiting-room-source': '请选择房间来源：输入"上传"使用真实照片，或输入"虚拟"创建虚拟房间。',
    'awaiting-style-select': '请选择你喜欢的风格，例如：现代简约、北欧风、新中式、奶油风、寂宅风、轻奢风。',
    'awaiting-room-upload': '请上传一张房间照片，点击上方上传区域或直接拖拽图片。',
    'awaiting-sofa-upload': '请上传一张沙发照片，点击上方上传区域或直接拖拽图片。',
    'awaiting-params': '请选择参数，例如："远景图"、"需要模特"、"4K"、"4:3横版"，然后说"开始生成"。',
    'ready-to-generate': '参数已就绪！输入"生成"开始，或继续调整参数。',
    'done': '效果图已生成！输入"重新开始"再来一次，或"切换专家模式"。'
  };
  return hints[state.agentStep] || '请按上方选项继续操作，或输入"切换专家模式"使用完整参数面板。';
}

els.chatSendBtn.addEventListener('click', function () {
  var text = els.chatInput.value.trim();
  if (!text || state.chatLoading) return;

  addChatMessage('user', 'text', text);
  els.chatInput.value = '';
  els.chatInput.style.height = 'auto';

  var parsed = parseUserInput(text);

  if (parsed) {
    if (parsed.action === 'switch-expert') {
      switchMode('expert');
      renderChatMessages();
      return;
    }
    if (parsed.action === 'upload-room') {
      els.agentRoomInput.click();
      renderChatMessages();
      return;
    }
    if (parsed.action === 'upload-sofa') {
      els.agentSofaInput.click();
      renderChatMessages();
      return;
    }
    handleAgentOptionClick(parsed.action, parsed.payload, true);
  } else {
    addChatMessage('assistant', 'text', '我没有理解你的意思 🤔\n\n' + getStepHint());
    renderChatMessages();
  }
});

els.chatInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    els.chatSendBtn.click();
  }
});

els.chatInput.addEventListener('input', function () {
  els.chatInput.style.height = 'auto';
  els.chatInput.style.height = els.chatInput.scrollHeight + 'px';
});

els.chatMessages.addEventListener('click', function (event) {
  var chip = event.target.closest('.chat-chip');
  if (chip) {
    event.preventDefault();
    var action = chip.dataset.action;
    var payload = chip.dataset.payload;

    if (action === 'switch-expert') {
      switchMode('expert');
      return;
    }

    chip.classList.add('is-selected');
    handleAgentOptionClick(action, payload, false, chip.textContent.trim());
    return;
  }

  var zone = event.target.closest('.chat-upload-zone');
  if (zone) {
    event.preventDefault();
    var target = zone.dataset.target;
    if (target === 'agentRoomInput') {
      els.agentRoomInput.click();
    } else if (target === 'agentSofaInput') {
      els.agentSofaInput.click();
    }
    return;
  }
});

els.agentRoomInput.addEventListener('change', async function () {
  var file = els.agentRoomInput.files?.[0];
  if (!file) return;
  await handleAgentFileUpload('agentRoomInput', file);
  els.agentRoomInput.value = '';
});

els.agentSofaInput.addEventListener('change', async function () {
  var file = els.agentSofaInput.files?.[0];
  if (!file) return;
  await handleAgentFileUpload('agentSofaInput', file);
  els.agentSofaInput.value = '';
});

var modeSplash = document.querySelector('#modeSplash');

function showSplash() {
  if (modeSplash) modeSplash.hidden = false;
  els.expertPanel.hidden = true;
  els.agentPanel.hidden = true;
}

function hideSplash() {
  if (modeSplash) modeSplash.hidden = true;
}

function enterMode(mode) {
  hideSplash();
  state.mode = mode;

  var topbarToExpert = document.querySelector('#topbarToExpert');
  var topbarToAgent = document.querySelector('#topbarToAgent');
  if (mode === 'agent') {
    els.expertPanel.hidden = true;
    els.agentPanel.hidden = false;
    els.agentPanel.classList.add('is-active');
    if (topbarToExpert) topbarToExpert.hidden = false;
    if (topbarToAgent) topbarToAgent.hidden = true;
    if (state.chatMessages.length === 0) {
      initAgentChat();
    } else {
      renderChatMessages();
    }
    scrollChatToBottom();
  } else {
    els.agentPanel.hidden = true;
    els.agentPanel.classList.remove('is-active');
    els.expertPanel.hidden = false;
    if (topbarToExpert) topbarToExpert.hidden = true;
    if (topbarToAgent) topbarToAgent.hidden = false;
    if (state.expertWorkflow === 'product') {
      switchExpertWorkflow('product');
    } else if (state.expertWorkflow === 'poster') {
      switchExpertWorkflow('poster');
    } else {
      updateRoomModeUI();
      if (state.sofaFile) els.analyzeSofaBtn.disabled = false;
      if (state.roomAnalysis) { els.roomAnalysisBox.textContent = state.roomAnalysis; els.roomAnalysisBox.hidden = false; }
      if (state.sofaAnalysis) { els.sofaAnalysisBox.textContent = state.sofaAnalysis; els.sofaAnalysisBox.hidden = false; }
      if (state.roomAnalysis && state.sofaAnalysis) state.currentStep = 3;
      else if (state.roomAnalysis) state.currentStep = 2;
      else state.currentStep = 1;
      switchExpertWorkflow('placement');
    }
  }
}

// 初始显示模式选择页
showSplash();

// 模式选择页点击
if (modeSplash) {
  modeSplash.addEventListener('click', function (event) {
    var btn = event.target.closest('.splash-card-item');
    if (!btn) return;
    enterMode(btn.dataset.mode);
  });
}

document.querySelector('.hero-link')?.addEventListener('click', function (e) {
  e.preventDefault();
  enterMode('expert');
});
