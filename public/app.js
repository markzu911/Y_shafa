const state = {
  currentStep: 1,
  roomFile: null,
  sofaFile: null,
  roomAnalysis: '',
  sofaAnalysis: '',
  scene: '远景图',
  resolution: '1K',
  ratio: '4:3',
  history: []
};

const els = {
  modelStatus: document.querySelector('#modelStatus'),
  steps: [...document.querySelectorAll('.step')],
  panels: [...document.querySelectorAll('.panel')],
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
    button.dataset.originalText = button.textContent;
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

async function postForm(url, formData) {
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || '请求失败，请稍后重试。');
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

function addHistoryItem(payload) {
  state.history.unshift({
    image: payload.image,
    label: `${state.scene} · ${state.resolution} · ${state.ratio}`
  });
  state.history = state.history.slice(0, 12);
  renderHistory();
}

els.roomInput.addEventListener('change', () => {
  const file = els.roomInput.files?.[0];
  if (!file) return;
  state.roomFile = file;
  state.roomAnalysis = '';
  els.roomAnalysisBox.hidden = true;
  els.analyzeRoomBtn.disabled = false;
  previewFile(file, els.roomPreview);
});

els.sofaInput.addEventListener('change', () => {
  const file = els.sofaInput.files?.[0];
  if (!file) return;
  state.sofaFile = file;
  state.sofaAnalysis = '';
  els.sofaAnalysisBox.hidden = true;
  els.analyzeSofaBtn.disabled = false;
  previewFile(file, els.sofaPreview);
});

els.analyzeRoomBtn.addEventListener('click', async () => {
  if (!state.roomFile) return;

  try {
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
    els.analyzeRoomBtn.disabled = !state.roomFile;
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
  if (!state.roomFile || !state.sofaFile || !state.roomAnalysis || !state.sofaAnalysis) {
    showToast('请先完成房间和沙发分析。');
    return;
  }

  const formData = new FormData();
  formData.append('roomImage', state.roomFile);
  formData.append('sofaImage', state.sofaFile);
  formData.append('roomAnalysis', state.roomAnalysis);
  formData.append('sofaAnalysis', state.sofaAnalysis);
  formData.append('scene', state.scene);
  formData.append('resolution', state.resolution);
  formData.append('ratio', state.ratio);

  try {
    setBusy(els.generateBtn, '正在生成效果图...', true);
    els.generationArea.hidden = true;
    const payload = await postForm('/api/generate', formData);
    els.generatedImage.src = payload.image;
    els.generatedImage.classList.add('has-image');
    els.downloadLink.href = payload.image;
    els.generationNote.textContent = payload.note || `${state.scene} · ${state.resolution} · ${state.ratio}`;
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
    state[group.dataset.group] = button.dataset.value;

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

fetch('/api/health')
  .then((response) => response.json())
  .then((payload) => {
    els.modelStatus.textContent = payload.ok
      ? `分析：${payload.analysisModel} · 生图：${payload.imageModel}`
      : '模型状态异常';
  })
  .catch(() => {
    els.modelStatus.textContent = '服务未连接';
  });
