const state = {
  currentStep: 1,
  roomMode: 'upload',
  virtualStyle: '现代简约',
  roomFile: null,
  sofaFile: null,
  roomAnalysis: '',
  sofaAnalysis: '',
  scene: '远景图',
  needsModel: false,
  resolution: '1K',
  ratio: '4:3',
  history: [],
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
  }
};

const els = {
  creditStatus: document.querySelector('#creditStatus'),
  steps: [...document.querySelectorAll('.step')],
  panels: [...document.querySelectorAll('.panel')],
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
  imageModal: document.querySelector('#imageModal'),
  modalImage: document.querySelector('#modalImage'),
  modalClose: document.querySelector('#modalClose'),
  toast: document.querySelector('#toast')
};

const virtualStyleDescriptions = {
  现代简约: '现代简约：干净线条、克制配色、简洁墙面和自然采光，房间空间清爽有秩序。',
  北欧风: '北欧风：浅木色、白墙、柔和织物、自然光和轻盈温暖的居家氛围。',
  新中式: '新中式：木质格栅、雅致留白、东方比例、温润材质和含蓄的装饰细节。',
  奶油风: '奶油风：低饱和奶油色、柔和墙面、圆润软装和温暖细腻的自然光。',
  寂宅风: '寂宅风：安静留白、微水泥或自然肌理、低饱和色彩和沉静克制的空间感。',
  轻奢风: '轻奢风：精致材质、金属或石材点缀、干净高级的线条和明亮通透的采光。'
};

const MAX_TOOL_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_TOOL_IMAGE_EDGE = 1600;
const TOOL_IMAGE_JPEG_QUALITY = 0.85;
const MAX_RESULT_UPLOAD_BYTES = 1800 * 1024;
const MAX_RESULT_UPLOAD_EDGE = 1600;

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

async function compressDataUrlImage(dataUrl, maxBytes, maxEdge) {
  const originalBlob = await imageDataUrlToBlob(dataUrl);
  if (originalBlob.size <= maxBytes) return originalBlob;

  const image = await dataUrlToImageElement(dataUrl);
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let blob = null;

  for (const quality of [0.82, 0.72, 0.62]) {
    blob = await renderCompressedBlob(image, width, height, quality);
    if (blob && blob.size <= maxBytes) break;
  }

  while (blob && blob.size > maxBytes && Math.max(width, height) > 960) {
    width = Math.max(1, Math.round(width * 0.84));
    height = Math.max(1, Math.round(height * 0.84));
    blob = await renderCompressedBlob(image, width, height, 0.68);
  }

  return blob || originalBlob;
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

async function uploadGeneratedImage(imageDataUrl) {
  if (!hasSaasContext()) return null;

  const blob = await compressDataUrlImage(imageDataUrl, MAX_RESULT_UPLOAD_BYTES, MAX_RESULT_UPLOAD_EDGE);
  const mimeType = blob.type || imageDataUrl.match(/^data:([^;]+)/)?.[1] || 'image/png';
  const extension = getImageExtension(mimeType);
  const fileName = `sofa-placement-${Date.now()}.${extension}`;
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

async function renderCompressedBlob(image, width, height, quality) {
  return (await renderImageBlob(image, width, height, 'image/webp', quality)) || renderImageBlob(image, width, height, 'image/jpeg', quality);
}

async function renderJpegBlob(image, width, height, quality) {
  return renderImageBlob(image, width, height, 'image/jpeg', quality);
}

async function prepareToolImage(file) {
  if (!file?.type?.startsWith('image/')) return file;

  const image = await loadImageElement(file);
  const scale = Math.min(1, MAX_TOOL_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));

  let width = Math.max(1, Math.round(image.naturalWidth * scale));
  let height = Math.max(1, Math.round(image.naturalHeight * scale));
  let blob = await renderJpegBlob(image, width, height, TOOL_IMAGE_JPEG_QUALITY);

  while (blob && blob.size > MAX_TOOL_IMAGE_BYTES && Math.max(width, height) > 800) {
    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
    blob = await renderJpegBlob(image, width, height, TOOL_IMAGE_JPEG_QUALITY);
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
  const styleDescription = virtualStyleDescriptions[state.virtualStyle] || virtualStyleDescriptions.现代简约;
  return [
    `虚拟房间模式：用户未上传房间图片，需要根据“${state.virtualStyle}”创建一个新的虚拟室内房间。`,
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
  group.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    group.querySelectorAll('button').forEach((item) => {
      item.classList.toggle('is-selected', item === button);
    });
    state[group.dataset.group] =
      group.dataset.group === 'needsModel' ? button.dataset.value === 'true' : button.dataset.value;

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
  });
});

document.querySelectorAll('[data-back]').forEach((button) => {
  button.addEventListener('click', () => goToStep(Number(button.dataset.back)));
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
