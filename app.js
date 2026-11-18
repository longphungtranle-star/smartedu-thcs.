// app.js - Nền Tảng Hỗ Trợ Học Tập Thông Minh SmartEdu AI

// Fallback sớm đảm bảo không bao giờ bị lỗi 'function not defined' khi người dùng click nhanh
window.loadSpecificLessonById = window.loadSpecificLessonById || function(key) {
  window._pendingLessonKey = key;
};

document.addEventListener('DOMContentLoaded', () => {
  // ================= STATE MANAGEMENT =================
  const state = {
    // API Key Rotation Pool
    apiKeys: [], // [{ key: string, status: 'ready'|'rate_limited'|'error', successCount: number }]
    currentKeyIndex: 0,
    selectedModel: 'gemini-3.5-flash-lite',

    // Document Data
    currentDoc: {
      title: '',
      text: '',
      type: '', // 'word' | 'pdf' | 'image' | 'text' | 'multiple'
      imageBase64: null,
      images: [], // Danh sách ảnh base64 khi nạp nhiều ảnh
      wordCount: 0
    },
    uploadedFiles: [], // Danh sách đa tài liệu [{ id, name, type, text, wordCount, size, imageBase64, isOcrDone }]

    // Tab Data
    mindmapMarkdown: '',
    markmapInstance: null,
    
    summaryData: null,
    
    quizData: [],
    quizUserAnswers: {}, // { [questionId]: optionIndex }
    quizSubmitted: false,
    quizTimerInterval: null,
    quizTimeLeft: 15 * 60, // 15 minutes in seconds

    beamData: [],
    focusBeamIndex: 0,

    // Audio Speech
    ttsEnabled: true,
    speechSynth: window.speechSynthesis || null,

    // Abort Controller & Async Process State
    activeAbortController: null,
    loadingTimerInterval: null,
    userAbortedOperation: false
  };

  // ================= DEVICE & PLATFORM DETECTION (IOS / ANDROID / SAFARI / PWA) =================
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isIos;
  const isInAppBrowser = /FBAN|FBAV|Zalo|Line|Instagram|BytedanceWebview/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // ================= DOM ELEMENTS =================
  const dom = {
    // Top Bar (Dành riêng cho Cấp 2 - THCS)
    loadSampleToan9Btn: document.getElementById('load-sample-toan9-btn'),
    loadSampleKhtn9Btn: document.getElementById('load-sample-khtn9-btn'),
    loadSampleKhtn7Btn: document.getElementById('load-sample-khtn7-btn'),
    loadSampleKhtn8Btn: document.getElementById('load-sample-khtn8-btn'),
    openKeyModalBtn: document.getElementById('open-key-modal-btn'),
    openKeyModalBtnDesktop: document.getElementById('open-key-modal-btn-desktop'),
    keySummaryText: document.getElementById('key-summary-text'),
    keyPing: document.getElementById('key-ping'),
    keyDot: document.getElementById('key-dot'),

    // Upload & Input
    btnModeFile: document.getElementById('btn-mode-file'),
    btnModeText: document.getElementById('btn-mode-text'),
    dropZoneContainer: document.getElementById('drop-zone-container'),
    textInputContainer: document.getElementById('text-input-container'),
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    cameraInput: document.getElementById('camera-input'),
    rawTextInput: document.getElementById('raw-text-input'),
    applyTextBtn: document.getElementById('apply-text-btn'),
    
    // Doc Preview Card
    docPreviewCard: document.getElementById('doc-preview-card'),
    docIconBadge: document.getElementById('doc-icon-badge'),
    docTitle: document.getElementById('doc-title'),
    docBadgeType: document.getElementById('doc-badge-type'),
    docStats: document.getElementById('doc-stats'),
    btnEnterLesson: document.getElementById('btn-enter-lesson'),
    btnOcrImage: document.getElementById('btn-ocr-image'),
    ocrBtnText: document.getElementById('ocr-btn-text'),
    btnViewExtracted: document.getElementById('btn-view-extracted'),
    btnReadDoc: document.getElementById('btn-read-doc'),
    btnClearDoc: document.getElementById('btn-clear-doc'),
    uploadedFilesContainer: document.getElementById('uploaded-files-container'),
    uploadedFilesCount: document.getElementById('uploaded-files-count'),
    uploadedFilesItems: document.getElementById('uploaded-files-items'),
    btnAddMoreFiles: document.getElementById('btn-add-more-files'),
    btnAddMoreCamera: document.getElementById('btn-add-more-camera'),

    // Tabs
    tabButtons: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),

    // Tab 1: Mindmap
    generateMindmapBtn: document.getElementById('generate-mindmap-btn'),
    markmapSvg: document.getElementById('markmap-svg'),
    mindmapEmptyState: document.getElementById('mindmap-empty-state'),
    mindmapWrapper: document.getElementById('mindmap-wrapper'),
    mindmapEditorSidebar: document.getElementById('mindmap-editor-sidebar'),
    btnToggleEditor: document.getElementById('btn-toggle-editor'),
    markdownInput: document.getElementById('markdown-input'),
    applyMarkdownBtn: document.getElementById('apply-markdown-btn'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),
    btnZoomFit: document.getElementById('btn-zoom-fit'),
    btnFullscreenMindmap: document.getElementById('btn-fullscreen-mindmap'),
    btnExitFullscreen: document.getElementById('btn-exit-fullscreen'),
    mindmapFullscreenBar: document.getElementById('mindmap-fullscreen-bar'),
    btnFsFit: document.getElementById('btn-fs-fit'),
    btnFsZoomIn: document.getElementById('btn-fs-zoom-in'),
    btnFsZoomOut: document.getElementById('btn-fs-zoom-out'),
    btnDownloadPng: document.getElementById('btn-download-png'),
    btnDownloadSvg: document.getElementById('btn-download-svg'),
    btnSaveMindmap: document.getElementById('btn-save-mindmap'),
    btnOpenMindmapLibrary: document.getElementById('btn-open-mindmap-library'),
    savedMindmapsCount: document.getElementById('saved-mindmaps-count'),
    modalMindmapLibrary: document.getElementById('modal-mindmap-library'),
    btnCloseMindmapLibrary: document.getElementById('btn-close-mindmap-library'),
    btnDoneMindmapLibrary: document.getElementById('btn-done-mindmap-library'),
    mindmapLibraryList: document.getElementById('mindmap-library-list'),
    mindmapLibraryEmpty: document.getElementById('mindmap-library-empty'),
    mindmapLibraryStatus: document.getElementById('mindmap-library-status'),

    // Tab 2: Summary
    generateSummaryBtn: document.getElementById('generate-summary-btn'),
    summaryEmptyState: document.getElementById('summary-empty-state'),
    sectionTakeaways: document.getElementById('section-takeaways'),
    listTakeaways: document.getElementById('list-takeaways'),
    sectionTerms: document.getElementById('section-terms'),
    tableTermsBody: document.getElementById('table-terms-body'),
    sectionStrategies: document.getElementById('section-strategies'),
    feynmanText: document.getElementById('feynman-text'),
    mnemonicsText: document.getElementById('mnemonics-text'),
    spacedList: document.getElementById('spaced-list'),
    btnCopySummary: document.getElementById('btn-copy-summary'),
    btnPrintSummary: document.getElementById('btn-print-summary'),
    btnTtsSummary: document.getElementById('btn-tts-summary'),
    btnStopTtsSummary: document.getElementById('btn-stop-tts-summary'),

    // Tab 3: Quiz
    generateQuizBtn: document.getElementById('generate-quiz-btn'),
    quizCountSelect: document.getElementById('quiz-count-select'),
    btnViewInteractive: document.getElementById('btn-view-interactive'),
    btnViewPrint: document.getElementById('btn-view-print'),
    btnPrintExam: document.getElementById('btn-print-exam'),
    quizEmptyState: document.getElementById('quiz-empty-state'),
    interactiveQuizContainer: document.getElementById('interactive-quiz-container'),
    quizProgressBar: document.getElementById('quiz-progress-bar'),
    quizProgressText: document.getElementById('quiz-progress-text'),
    quizTimerDisplay: document.getElementById('quiz-timer-display'),
    quizQuestionsList: document.getElementById('quiz-questions-list'),
    quizSubmitBar: document.getElementById('quiz-submit-bar'),
    btnSubmitQuiz: document.getElementById('btn-submit-quiz'),
    quizResultCard: document.getElementById('quiz-result-card'),
    quizResultTitle: document.getElementById('quiz-result-title'),
    quizResultScore: document.getElementById('quiz-result-score'),
    quizResultSummary: document.getElementById('quiz-result-summary'),
    scoreEasy: document.getElementById('score-easy'),
    scoreMedium: document.getElementById('score-medium'),
    scoreHard: document.getElementById('score-hard'),
    btnRetryQuiz: document.getElementById('btn-retry-quiz'),
    btnNewQuiz: document.getElementById('btn-new-quiz'),
    printableExamContainer: document.getElementById('printable-exam-container'),
    printExamTitle: document.getElementById('print-exam-title'),
    printQuestionsArea: document.getElementById('print-questions-area'),
    printAnswersArea: document.getElementById('print-answers-area'),

    // Tab 4: Beams
    generateBeamsBtn: document.getElementById('generate-beams-btn'),
    btnExportBeamsPdf: document.getElementById('btn-export-beams-pdf'),
    printableBeamsContainer: document.getElementById('printable-beams-container'),
    printBeamsTitle: document.getElementById('print-beams-title'),
    printableBeamsGrid: document.getElementById('printable-beams-grid'),
    btnToggleTts: document.getElementById('btn-toggle-tts'),
    btnStopTts: document.getElementById('btn-stop-tts'),
    beamMasteryCount: document.getElementById('beam-mastery-count'),
    beamMasteryBar: document.getElementById('beam-mastery-bar'),
    btnBeamGrid: document.getElementById('btn-beam-grid'),
    btnBeamFocus: document.getElementById('btn-beam-focus'),
    beamEmptyState: document.getElementById('beam-empty-state'),
    beamCardsGrid: document.getElementById('beam-cards-grid'),
    beamFocusModal: document.getElementById('beam-focus-modal'),
    focusCounter: document.getElementById('focus-counter'),
    focusFlipInner: document.getElementById('focus-flip-inner'),
    focusBadge: document.getElementById('focus-badge'),
    focusTitle: document.getElementById('focus-title'),
    focusQuestion: document.getElementById('focus-question'),
    focusAnswer: document.getElementById('focus-answer'),
    focusAction: document.getElementById('focus-action'),
    btnCloseFocus: document.getElementById('btn-close-focus'),
    btnFocusPrev: document.getElementById('btn-focus-prev'),
    btnFocusNext: document.getElementById('btn-focus-next'),
    btnFocusTts: document.getElementById('btn-focus-tts'),
    btnFocusStopTts: document.getElementById('btn-focus-stop-tts'),
    btnFocusMastered: document.getElementById('btn-focus-mastered'),

    // Key Modal
    keyModal: document.getElementById('key-modal'),
    btnCloseKeyModal: document.getElementById('btn-close-key-modal'),
    inputMultipleKeys: document.getElementById('input-multiple-keys'),
    btnAddKeys: document.getElementById('btn-add-keys'),
    selectGeminiModel: document.getElementById('select-gemini-model'),
    keyPoolCount: document.getElementById('key-pool-count'),
    keysTableBody: document.getElementById('keys-table-body'),
    btnTestAllKeys: document.getElementById('btn-test-all-keys'),
    btnSaveKeyModal: document.getElementById('btn-save-key-modal'),

    // Extracted Text Modal
    extractedTextModal: document.getElementById('extracted-text-modal'),
    btnCloseExtractedModal: document.getElementById('btn-close-extracted-modal'),
    extractedTextArea: document.getElementById('extracted-text-area'),
    extractedWordCount: document.getElementById('extracted-word-count'),
    btnSaveExtractedText: document.getElementById('btn-save-extracted-text'),

    // Loading & Toast
    loadingOverlay: document.getElementById('loading-overlay'),
    loadingTitle: document.getElementById('loading-title'),
    loadingSubtitle: document.getElementById('loading-subtitle'),
    loadingTimerBadge: document.getElementById('loading-timer-badge'),
    loadingTimerText: document.getElementById('loading-timer-text'),
    btnCancelLoading: document.getElementById('btn-cancel-loading'),
    toastContainer: document.getElementById('toast-container')
  };

  // ================= TOAST & LOADING HELPERS =================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      info: 'bg-indigo-600 text-white',
      success: 'bg-emerald-600 text-white',
      warning: 'bg-amber-500 text-white',
      error: 'bg-rose-600 text-white'
    };
    const icons = {
      info: 'fa-circle-info',
      success: 'fa-circle-check',
      warning: 'fa-triangle-exclamation',
      error: 'fa-circle-xmark'
    };

    toast.className = `toast px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> <span>${message}</span>`;
    
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function showLoading(title = 'Đang xử lý bằng AI...', subtitle = 'Đang phân tích cấu trúc bài học') {
    dom.loadingTitle.textContent = title;
    dom.loadingSubtitle.textContent = subtitle;
    dom.loadingOverlay.classList.remove('hidden');

    if (state.loadingTimerInterval) {
      clearInterval(state.loadingTimerInterval);
    }
    let seconds = 0;
    if (dom.loadingTimerBadge && dom.loadingTimerText) {
      dom.loadingTimerBadge.classList.remove('hidden');
      dom.loadingTimerText.textContent = 'Thời gian: 0s';
      state.loadingTimerInterval = setInterval(() => {
        seconds++;
        dom.loadingTimerText.textContent = `Thời gian: ${seconds}s`;
      }, 1000);
    }
  }

  function hideLoading() {
    if (state.loadingTimerInterval) {
      clearInterval(state.loadingTimerInterval);
      state.loadingTimerInterval = null;
    }
    if (dom.loadingTimerBadge) {
      dom.loadingTimerBadge.classList.add('hidden');
    }
    dom.loadingOverlay.classList.add('hidden');
  }

  // ================= API KEY ROTATION POOL LOGIC =================
  // Đưa Gemini 3.5 Flash Lite lên số 1: Tối ưu thông lượng cao nhất, tạo đề thi & trích xuất siêu nhanh
  const CASCADE_MODELS = [
    'gemini-3.5-flash-lite',    // Ưu tiên số 1: Tạo đề nhanh nhất, chuẩn xác nhất, thông lượng cao
    'gemini-flash-lite-latest' // Dự phòng cấp 1: Bản cập nhật flash-lite mới nhất
  ];

  function getModelCandidates(preferred) {
    if (!preferred || preferred === 'auto' || !CASCADE_MODELS.includes(preferred)) {
      return [...CASCADE_MODELS];
    }
    const list = [preferred];
    CASCADE_MODELS.forEach(m => {
      if (m !== preferred && !list.includes(m)) list.push(m);
    });
    return list;
  }

  // BỘ PHÂN TÍCH & TỰ ĐỘNG SỬA LỖI JSON AN TOÀN CHO CÔNG THỨC TOÁN LATEX & DỮ LIỆU CẮT DỞ
  function safeParseJson(rawStr) {
    if (!rawStr) throw new Error("Dữ liệu phản hồi từ AI rỗng.");
    
    // 1. Loại bỏ markdown code blocks
    let cleaned = rawStr.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    // 2. Thử parse trực tiếp
    try {
      return JSON.parse(cleaned);
    } catch (e1) {
      // Tiếp tục tự động sửa lỗi
    }

    // 3. Hàm chuẩn hóa và sửa chữa toàn diện ký tự Escape đặc thù của LaTeX & Tiếng Việt
    function fixJsonEscapes(str) {
      if (!str) return '';
      // Loại bỏ các ký tự điều khiển ẩn (trừ \t \n \r)
      let s = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');

      // Xử lý triệt để ký tự gạch chéo ngược \:
      // - Giữ nguyên: \" (escaped quote), \\ (escaped backslash), \/ (escaped slash)
      // - Giữ nguyên unicode chuẩn: \u[0-9a-fA-F]{4}
      // - Giữ nguyên escape ký tự điều khiển chuẩn đơn lẻ: \n, \r, \t
      // - Tất cả các từ LaTeX (\frac, \sqrt, \Delta, \times, \right, \text, \begin, \underline, \Omega, \pm, \cdot, v.v.):
      //   BẮT BUỘC biến thành \\ (double backslash) để JSON.parse hợp lệ 100%!
      s = s.replace(/\\(?:([a-zA-Z]+)|([^"\\/]))/g, (match, word, char) => {
        if (word) {
          if (/^u[0-9a-fA-F]{4}$/.test(word)) {
            return '\\' + word;
          }
          if (word === 'n' || word === 'r' || word === 't') {
            return '\\' + word;
          }
          return '\\\\' + word;
        }
        if (char) {
          return '\\\\' + char;
        }
        return match;
      });

      return s;
    }

    // 4. Thử parse sau khi đã sửa chữa escape
    try {
      const repaired = fixJsonEscapes(cleaned);
      return JSON.parse(repaired);
    } catch (e2) {}

    // 5. Trích xuất substring giữa mảng [ ... ] hoặc object { ... }
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      const arraySub = cleaned.substring(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(fixJsonEscapes(arraySub));
      } catch (e3) {}
    }

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const objSub = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(fixJsonEscapes(objSub));
      } catch (e4) {}
    }

    // 6. Cứu hộ trường hợp JSON mảng bị cắt ngang ở câu cuối (Truncated JSON do giới hạn token)
    if (firstBracket !== -1) {
      let partial = cleaned.substring(firstBracket);
      const lastObjClose = partial.lastIndexOf('}');
      if (lastObjClose !== -1) {
        partial = partial.substring(0, lastObjClose + 1) + ']';
        try {
          const res = JSON.parse(fixJsonEscapes(partial));
          if (Array.isArray(res) && res.length > 0) {
            console.warn(`JSON đã được giải cứu từ phản hồi dở dang (${res.length} câu hoàn chỉnh).`);
            return res;
          }
        } catch (e5) {}
      }
    }

    // 7. Cứu nguy cuối cùng: làm sạch ký tự điều khiển và parse
    const superCleaned = fixJsonEscapes(cleaned);
    return JSON.parse(superCleaned);
  }

  function loadApiKeysFromStorage() {
    try {
      const stored = localStorage.getItem('smartedu_api_keys');
      if (stored) {
        state.apiKeys = JSON.parse(stored);
      }
      const storedModel = localStorage.getItem('smartedu_selected_model');
      if (storedModel && (storedModel === 'auto' || CASCADE_MODELS.includes(storedModel))) {
        state.selectedModel = storedModel;
      } else {
        state.selectedModel = 'gemini-flash-lite-latest';
        localStorage.setItem('smartedu_selected_model', 'gemini-flash-lite-latest');
      }
      if (dom.selectGeminiModel) {
        dom.selectGeminiModel.value = state.selectedModel;
      }

      // Tự động khôi phục key về trạng thái sẵn sàng với mô hình Flash Lite Siêu Tốc
      state.apiKeys.forEach(k => {
        k.status = 'ready';
        k.workingModel = 'gemini-flash-lite-latest';
        k.errorDetail = '';
      });
      localStorage.setItem('smartedu_api_keys', JSON.stringify(state.apiKeys));
    } catch (e) {
      console.error('Error loading API keys:', e);
      state.apiKeys = [];
    }
    updateKeyPoolUI();
  }

  function saveApiKeysToStorage() {
    localStorage.setItem('smartedu_api_keys', JSON.stringify(state.apiKeys));
    localStorage.setItem('smartedu_selected_model', state.selectedModel);
    updateKeyPoolUI();
  }

  function updateKeyPoolUI() {
    const total = state.apiKeys.length;
    const activeKeys = state.apiKeys.filter(k => k.status !== 'error' && k.status !== 'rate_limited');
    
    dom.keyPoolCount.textContent = total;
    if (total === 0) {
      dom.keySummaryText.textContent = 'Kho API Key (0)';
      dom.keyDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400';
      dom.keyPing.className = 'hidden';
    } else {
      dom.keySummaryText.textContent = `Kho Key: ${activeKeys.length}/${total} Khả dụng`;
      dom.keyDot.className = 'relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500';
      dom.keyPing.className = 'animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75';
    }

    // Render table
    dom.keysTableBody.innerHTML = '';
    if (state.apiKeys.length === 0) {
      dom.keysTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="py-4 text-center text-slate-400 italic">
            Chưa có API key nào. Hãy nhập key vào ô bên trên để kích hoạt xoay vòng tự động!
          </td>
        </tr>`;
      return;
    }

    state.apiKeys.forEach((item, index) => {
      const row = document.createElement('tr');
      const isCurrent = (index === state.currentKeyIndex);
      
      const statusBadges = {
        ready: `<div class="flex flex-col"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block w-fit">Sẵn sàng</span>${item.workingModel ? `<span class="text-[9px] font-mono text-emerald-600 mt-0.5">${item.workingModel}</span>` : ''}</div>`,
        active: `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">Đang xoay tới</span>`,
        rate_limited: `<div class="flex flex-col"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-block w-fit" title="Đã chạm hạn ngạch 429">Quá tải (429)</span><span class="text-[9px] text-amber-600 mt-0.5">Hết ngạch tạm thời</span></div>`,
        error: `<div class="flex flex-col"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block w-fit" title="${item.errorDetail || 'Lỗi kiểm tra key'}">${item.errorDetail && (item.errorDetail.includes('400') || item.errorDetail.includes('API_KEY_INVALID')) ? 'Sai mã Key' : (item.errorDetail && item.errorDetail.includes('403') ? 'Bị khóa quyền (403)' : (item.errorDetail && item.errorDetail.includes('401') ? 'Lỗi xác thực (401)' : 'Lỗi kết nối'))}</span>${item.errorDetail ? `<span class="text-[9px] text-rose-500 mt-0.5 max-w-[200px] truncate block" title="${item.errorDetail}">${item.errorDetail}</span>` : ''}</div>`
      };

      const maskedKey = item.key.slice(0, 7) + '...' + item.key.slice(-4);

      row.innerHTML = `
        <td class="py-2.5 px-3 font-mono font-bold text-slate-500">${index + 1}</td>
        <td class="py-2.5 px-3 font-mono text-slate-800 flex items-center gap-1.5">
          ${isCurrent ? '<i class="fa-solid fa-arrow-right text-indigo-600 text-xs"></i>' : ''}
          ${maskedKey}
        </td>
        <td class="py-2.5 px-3">${statusBadges[item.status] || statusBadges.ready}</td>
        <td class="py-2.5 px-3 text-center font-bold text-slate-700">${item.successCount || 0}</td>
        <td class="py-2.5 px-3 text-right">
          <div class="flex items-center justify-end gap-1">
            <button class="test-single-key p-1 text-slate-500 hover:text-indigo-600 rounded" data-index="${index}" title="Kiểm tra kết nối">
              <i class="fa-solid fa-vial text-xs"></i>
            </button>
            <button class="delete-single-key p-1 text-slate-400 hover:text-rose-600 rounded" data-index="${index}" title="Xóa key">
              <i class="fa-solid fa-trash-can text-xs"></i>
            </button>
          </div>
        </td>
      `;
      dom.keysTableBody.appendChild(row);
    });

    // Add row listeners
    dom.keysTableBody.querySelectorAll('.delete-single-key').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-index'));
        state.apiKeys.splice(idx, 1);
        if (state.currentKeyIndex >= state.apiKeys.length) {
          state.currentKeyIndex = 0;
        }
        saveApiKeysToStorage();
        showToast('Đã xóa API Key khỏi kho!', 'info');
      });
    });

    dom.keysTableBody.querySelectorAll('.test-single-key').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        await testSingleKey(idx);
      });
    });
  }

  async function testSingleKey(index) {
    const item = state.apiKeys[index];
    if (!item) return;

    if (dom.selectGeminiModel && dom.selectGeminiModel.value) {
      state.selectedModel = dom.selectGeminiModel.value;
      localStorage.setItem('smartedu_selected_model', state.selectedModel);
    }

    const cleanKey = item.key ? item.key.trim() : '';
    if (!cleanKey) {
      showToast('Key rỗng hoặc không hợp lệ!', 'error');
      return;
    }

    const candidates = getModelCandidates(state.selectedModel);
    showLoading('Đang kiểm tra kết nối API Key...', `Thử nghiệm Key #${index + 1} qua bộ lọc tự động nhận diện model...`);

    let isSuccess = false;
    let finalError = '';

    for (const modelCandidate of candidates) {
      const controller = new AbortController();
      state.activeAbortController = controller;
      const timeoutId = setTimeout(() => controller.abort('TIMEOUT'), 8000);

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelCandidate}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Chào bạn! Hãy trả lời đúng 2 từ: Sẵn sàng." }] }],
            generationConfig: { maxOutputTokens: 10 }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        state.activeAbortController = null;

        if (res.ok) {
          isSuccess = true;
          item.status = 'ready';
          item.workingModel = modelCandidate;
          item.errorDetail = '';
          saveApiKeysToStorage();
          showToast(`Key #${index + 1} (${cleanKey.slice(0, 6)}...): Nhận diện thành công [${modelCandidate}]!`, 'success');
          break;
        }

        const errJson = await res.json().catch(() => ({}));
        const rawErrMsg = errJson.error?.message || `Lỗi HTTP ${res.status}`;
        finalError = `[HTTP ${res.status}] ${rawErrMsg}`;

        // 💡 Cơ chế Failover tự động: Nếu model gặp 404, 503, 500
        // Tự động chuyển ngay sang model kế tiếp trong 0.1 giây mà không gián đoạn
        if (res.status === 404 || res.status === 503 || res.status === 500) {
          console.info(`Model ${modelCandidate} mã ${res.status}. Tự động Failover sang model kế tiếp trong 0.1s...`);
          continue;
        }

        // Nếu lỗi 429 (Hết ngạch)
        if (res.status === 429) {
          item.status = 'rate_limited';
          item.errorDetail = 'Hết hạn ngạch 429 (Too Many Requests)';
          saveApiKeysToStorage();
          showToast(`Key #${index + 1} chạm giới hạn ngạch 429.`, 'warning');
          break;
        }

        // Nếu lỗi 400, 401 hoặc 403 (Sai mã key hoặc chưa cấp quyền)
        if (res.status === 400 || res.status === 401 || res.status === 403) {
          item.status = 'error';
          item.errorDetail = `Lỗi ${res.status}: ${rawErrMsg}`;
          saveApiKeysToStorage();
          showToast(`Key #${index + 1}: ${rawErrMsg}`, 'error');
          break;
        }

      } catch (err) {
        clearTimeout(timeoutId);
        state.activeAbortController = null;
        if (err.name === 'AbortError' || err === 'TIMEOUT' || err.message === 'TIMEOUT') {
          continue; // Timeout trên model này, thử ngay model tiếp theo
        } else {
          finalError = `Lỗi mạng: ${err.message}`;
        }
      }
    }

    hideLoading();

    if (!isSuccess && item.status !== 'rate_limited') {
      item.status = 'error';
      item.errorDetail = finalError || 'Không kết nối được với Google';
      saveApiKeysToStorage();
      showToast(`Key #${index + 1}: ${item.errorDetail}`, 'error');
    }
  }

  // CORE CALL FUNCTION WITH AUTOMATIC KEY ROTATION & HIGH-SPEED FAILOVER (0.1S)
  async function callGeminiWithRotation(prompt, inlineImageBase64 = null, options = {}) {
    if (state.apiKeys.length === 0) {
      dom.keyModal.classList.remove('hidden');
      throw new Error("Chưa có API Key nào trong kho. Hãy dán ít nhất 1 Google Gemini API Key để tiếp tục!");
    }

    if (dom.selectGeminiModel && dom.selectGeminiModel.value) {
      state.selectedModel = dom.selectGeminiModel.value;
    }

    const { isJson = false, maxTokens = 4000, taskName = 'Đang xử lý bằng AI...', timeoutMs = 25000 } = options;
    const maxAttempts = state.apiKeys.length;
    let attempts = 0;
    let lastErrorMessage = '';
    state.userAbortedOperation = false;

    // Lấy danh sách mô hình ưu tiên theo tầng bảo hiểm (Cascade list)
    const baseCandidates = getModelCandidates(state.selectedModel);

    while (attempts < maxAttempts) {
      if (state.userAbortedOperation) {
        hideLoading();
        throw new Error("Thao tác đã bị dừng theo yêu cầu của bạn.");
      }

      const keyIndex = state.currentKeyIndex;
      const keyItem = state.apiKeys[keyIndex];
      state.currentKeyIndex = (state.currentKeyIndex + 1) % state.apiKeys.length;

      // Nếu key này đã từng chạy thành công với một model cụ thể, ưu tiên model đó lên đầu
      const keyCandidates = keyItem.workingModel
        ? [keyItem.workingModel, ...baseCandidates.filter(m => m !== keyItem.workingModel)]
        : baseCandidates;

      // Thử tuần tự các model theo thứ tự ưu tiên (Failover 0.1s không làm gián đoạn)
      for (const activeModel of keyCandidates) {
        if (state.userAbortedOperation) break;

        const controller = new AbortController();
        state.activeAbortController = controller;
        const timeoutId = setTimeout(() => {
          controller.abort('TIMEOUT');
        }, timeoutMs);

        try {
          showLoading(taskName, `Sử dụng Key #${keyIndex + 1} (${keyItem.key.slice(0, 6)}...${keyItem.key.slice(-3)}) [Model: ${activeModel}]`);

          const contentsParts = [{ text: prompt }];
          if (inlineImageBase64) {
            const imgList = Array.isArray(inlineImageBase64) ? inlineImageBase64 : [inlineImageBase64];
            imgList.forEach(img => {
              if (typeof img === 'string') {
                const match = img.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                if (match) {
                  contentsParts.push({
                    inlineData: {
                      mimeType: match[1],
                      data: match[2]
                    }
                  });
                }
              }
            });
          }

          const generationConfig = {
            temperature: 0.2,
            maxOutputTokens: maxTokens
          };
          if (isJson) {
            generationConfig.responseMimeType = "application/json";
          }

          const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${encodeURIComponent(keyItem.key.trim())}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: contentsParts }],
              generationConfig
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          state.activeAbortController = null;

          if (response.ok) {
            const data = await response.json();
            keyItem.status = 'ready';
            keyItem.workingModel = activeModel;
            keyItem.successCount = (keyItem.successCount || 0) + 1;
            keyItem.errorDetail = '';
            saveApiKeysToStorage();
            hideLoading();

            const candidates = data.candidates || [];
            if (!candidates.length) {
              throw new Error("Không nhận được nội dung trả lời từ AI (có thể do bộ lọc an toàn).");
            }
            const parts = candidates[0].content?.parts || [];
            // Lọc bỏ thought parts nếu có (đối với thinking models)
            const nonThought = parts.filter(p => !p.thought);
            const text = (nonThought.length ? nonThought.map(p => p.text || '').join('') : (parts[0]?.text || '')).trim();

            if (!text) {
              throw new Error("Nội dung trả lời từ AI rỗng.");
            }
            return text;
          }

          const errJson = await response.json().catch(() => ({}));
          const rawErrMsg = errJson.error?.message || `Lỗi HTTP ${response.status}`;
          lastErrorMessage = rawErrMsg;

          // 💡 Cơ chế Failover tự động: Quá tải cục bộ (503), lỗi máy chủ (500) hoặc Model 404
          // Hệ thống tự động chuyển sang model kế tiếp trong 0.1s mà không làm gián đoạn hay báo lỗi ra màn hình
          if (response.status === 404 || response.status === 503 || response.status === 500) {
            console.info(`Model ${activeModel} gặp mã ${response.status}. Failover sang model kế tiếp trong 0.1s...`);
            continue;
          }

          // Rate Limit (429): Key này hết ngạch -> xoay sang Key kế tiếp
          if (response.status === 429) {
            keyItem.status = 'rate_limited';
            saveApiKeysToStorage();
            showToast(`Key #${keyIndex + 1} chạm giới hạn ngạch 429. Đang chuyển sang key tiếp theo...`, 'warning');
            break; // sang key tiếp theo trong bể xoay vòng
          }

          // Sai mã key hoặc bị cấm quyền (400, 401, 403)
          if (response.status === 400 || response.status === 401 || response.status === 403) {
            keyItem.status = 'error';
            keyItem.errorDetail = `Lỗi ${response.status}: ${rawErrMsg}`;
            saveApiKeysToStorage();
            showToast(`Key #${keyIndex + 1}: ${rawErrMsg}. Đang chuyển key tiếp theo...`, 'warning');
            break; // sang key tiếp theo trong bể xoay vòng
          }

          continue;

        } catch (err) {
          clearTimeout(timeoutId);
          state.activeAbortController = null;

          if (state.userAbortedOperation) {
            hideLoading();
            throw new Error("Thao tác đã bị dừng theo yêu cầu của bạn.");
          }

          if (err.name === 'AbortError' || err === 'TIMEOUT' || err.message === 'TIMEOUT') {
            console.warn(`Model ${activeModel} timeout ${Math.round(timeoutMs/1000)}s. Failover sang model kế tiếp...`);
            continue;
          }

          console.warn(`Model ${activeModel} error:`, err);
          continue;
        }
      }

      attempts++;
    }

    hideLoading();
    throw new Error(`Không thể hoàn thành yêu cầu: ${lastErrorMessage || 'Tất cả các API Key hoặc Model trong bể xoay vòng đều bận'}`);
  }

  // ================= FILE PARSING LOGIC (HỖ TRỢ ĐA TÀI LIỆU WORD, PDF, NHIỀU ẢNH BÀI HỌC) =================
  function countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  }

  // Tối ưu ảnh chụp bài học / camera tự động bằng Canvas (Độ phân giải chuẩn nét, dung lượng nhẹ)
  function processImageFileToOptimizedBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target.result;
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          const maxDim = 1280; // Chuẩn nét sắc sảo cho OCR công thức Toán, Lý, Hóa & Hình vẽ

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          resolve(optimizedBase64);
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // Phân tích từng file đơn lẻ (Word, PDF, hoặc Ảnh)
  async function parseSingleFile(file) {
    const name = file.name || 'Tai_lieu';
    const lowerName = name.toLowerCase();
    const isImage = (file.type && file.type.startsWith('image/')) || /\.(jpg|jpeg|png|webp|gif|bmp|heic|svg|jfif)$/i.test(lowerName);

    // 1. File Word (.docx / .doc)
    if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const text = result.value ? result.value.trim() : '';
        return {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'word',
          text: text || `[File Word: ${name} (Không có văn bản trích xuất được)]`,
          wordCount: countWords(text),
          size: file.size,
          imageBase64: null,
          isOcrDone: true
        };
      } catch (err) {
        console.warn('Mammoth parse error:', err);
        return {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'word',
          text: `[Lỗi đọc file Word: ${err.message}]`,
          wordCount: 0,
          size: file.size,
          imageBase64: null,
          isOcrDone: true
        };
      }
    }

    // 2. File PDF
    if (lowerName.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageStrings = textContent.items.map(item => item.str);
          fullText += `\n--- TRANG ${i} ---\n` + pageStrings.join(' ');
        }
        const cleanText = fullText.trim();
        return {
          id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'pdf',
          text: cleanText || `[File PDF scan ảnh: ${name}]`,
          wordCount: countWords(cleanText),
          size: file.size,
          imageBase64: null,
          isOcrDone: true
        };
      } catch (err) {
        console.warn('PDF.js parse error:', err);
        return {
          id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'pdf',
          text: `[Lỗi đọc file PDF: ${err.message}]`,
          wordCount: 0,
          size: file.size,
          imageBase64: null,
          isOcrDone: true
        };
      }
    }

    // 3. Ảnh bài học / Chụp từ camera
    if (isImage) {
      const base64 = await processImageFileToOptimizedBase64(file);
      const text = `[Ảnh chụp bài học: ${name}]\n(Ảnh đã được nạp thành công. Hãy bấm "Nhận diện OCR" để AI đọc chữ, công thức Toán - Lý - Hóa và phân tích hình vẽ, hoặc bấm trực tiếp Tạo Sơ đồ tư duy / Tóm tắt / Đề thi!)`;
      return {
        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        name: name,
        type: 'image',
        text: text,
        wordCount: countWords(text),
        size: file.size,
        imageBase64: base64,
        isOcrDone: false
      };
    }

    return null;
  }

  // Cập nhật và đồng bộ trạng thái khi có một hoặc nhiều tài liệu được tải lên
  function refreshMultiDocumentsState() {
    stopAllSpeech();

    if (!state.uploadedFiles || state.uploadedFiles.length === 0) {
      state.currentDoc = { title: '', text: '', type: '', imageBase64: null, images: [], wordCount: 0 };
      if (dom.docPreviewCard) dom.docPreviewCard.classList.add('hidden');
      if (dom.uploadedFilesContainer) dom.uploadedFilesContainer.classList.add('hidden');
      return;
    }

    const totalFiles = state.uploadedFiles.length;
    const allImages = state.uploadedFiles.filter(f => f.imageBase64).map(f => f.imageBase64);

    if (totalFiles === 1) {
      const single = state.uploadedFiles[0];
      state.currentDoc.title = single.name;
      state.currentDoc.text = single.text;
      state.currentDoc.type = single.type;
      state.currentDoc.imageBase64 = single.imageBase64;
      state.currentDoc.images = single.imageBase64 ? [single.imageBase64] : [];
      state.currentDoc.wordCount = single.wordCount;
    } else {
      // Gộp nội dung của tất cả các tài liệu / ảnh thành một bài học hoàn chỉnh
      const combinedText = state.uploadedFiles.map((f, idx) => {
        return `=== [TÀI LIỆU #${idx + 1}: ${f.name} (${f.type.toUpperCase()})] ===\n${f.text || ''}`;
      }).join('\n\n');

      state.currentDoc.title = `${totalFiles} tài liệu đã gộp (${state.uploadedFiles[0].name}...)`;
      state.currentDoc.text = combinedText;
      state.currentDoc.type = 'multiple';
      state.currentDoc.images = allImages;
      state.currentDoc.imageBase64 = allImages[0] || null;
      state.currentDoc.wordCount = countWords(combinedText);
    }

    // Reset dữ liệu tóm tắt cũ để học sinh luôn làm việc với tài liệu mới
    state.summaryData = null;
    if (dom.summaryEmptyState) dom.summaryEmptyState.classList.remove('hidden');
    if (dom.sectionTakeaways) dom.sectionTakeaways.classList.add('hidden');
    if (dom.sectionTerms) dom.sectionTerms.classList.add('hidden');
    if (dom.sectionStrategies) dom.sectionStrategies.classList.add('hidden');

    // Cập nhật giao diện Preview Card
    if (dom.docPreviewCard) dom.docPreviewCard.classList.remove('hidden');
    if (dom.docTitle) dom.docTitle.textContent = state.currentDoc.title;
    
    if (dom.docBadgeType) {
      dom.docBadgeType.textContent = totalFiles > 1 ? `GỘP ${totalFiles} FILE` : state.currentDoc.type.toUpperCase();
    }

    const imageCount = allImages.length;
    const imageInfo = imageCount > 0 ? ` • ${imageCount} ảnh bài học` : '';
    if (dom.docStats) {
      dom.docStats.textContent = `${state.currentDoc.wordCount} từ${imageInfo} • Sẵn sàng phân tích & khảo thí`;
    }

    // Biểu tượng loại tài liệu
    const iconMap = {
      word: 'fa-file-word bg-blue-600',
      pdf: 'fa-file-pdf bg-red-600',
      image: 'fa-file-image bg-emerald-600',
      multiple: 'fa-layer-group bg-indigo-600',
      text: 'fa-file-lines bg-indigo-600'
    };
    if (dom.docIconBadge) {
      const cls = iconMap[state.currentDoc.type] || iconMap.multiple;
      dom.docIconBadge.className = `w-10 h-10 rounded-lg text-white flex items-center justify-center text-lg font-bold shrink-0 ${cls}`;
      dom.docIconBadge.innerHTML = `<i class="fa-solid ${cls.split(' ')[0]}"></i>`;
    }

    // Nút Nhận diện OCR: Hiện lên nếu có ít nhất 1 ảnh
    if (dom.btnOcrImage) {
      if (imageCount > 0) {
        dom.btnOcrImage.classList.remove('hidden');
        if (dom.ocrBtnText) {
          const unOcrCount = state.uploadedFiles.filter(f => f.imageBase64 && !f.isOcrDone).length;
          dom.ocrBtnText.textContent = unOcrCount > 0 
            ? (totalFiles > 1 ? `Nhận diện OCR ${unOcrCount} ảnh bài học` : 'Nhận diện OCR ảnh & hình vẽ')
            : 'Đã nhận diện OCR xong';
        }
      } else {
        dom.btnOcrImage.classList.add('hidden');
      }
    }

    // Hiển thị danh sách các tài liệu con đã gộp
    if (dom.uploadedFilesContainer && dom.uploadedFilesItems) {
      dom.uploadedFilesContainer.classList.remove('hidden');
      if (dom.uploadedFilesCount) dom.uploadedFilesCount.textContent = totalFiles;

      dom.uploadedFilesItems.innerHTML = state.uploadedFiles.map(item => {
        const itemIcon = item.type === 'word' ? 'fa-file-word text-blue-600' :
                         (item.type === 'pdf' ? 'fa-file-pdf text-red-600' : 'fa-image text-emerald-600');
        const statusText = item.imageBase64 
          ? (item.isOcrDone ? '<span class="text-emerald-600 font-bold">Đã OCR</span>' : '<span class="text-amber-600 font-semibold">Chờ OCR</span>')
          : `<span class="text-slate-500">${item.wordCount} từ</span>`;

        return `
          <div class="inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-indigo-100 rounded-lg shadow-2xs text-xs max-w-full">
            <i class="fa-solid ${itemIcon} shrink-0 text-sm"></i>
            <span class="font-medium text-slate-800 truncate max-w-[130px] sm:max-w-[190px]" title="${item.name}">${item.name}</span>
            <span class="text-[11px]">${statusText}</span>
            <button onclick="window.removeUploadedFileItem('${item.id}')" class="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors" title="Xóa file này">
              <i class="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        `;
      }).join('');
    }
  }

  // Xóa 1 tài liệu con khỏi danh sách gộp
  window.removeUploadedFileItem = function(id) {
    state.uploadedFiles = state.uploadedFiles.filter(f => f.id !== id);
    refreshMultiDocumentsState();
    showToast('Đã bỏ bớt tài liệu khỏi danh sách gộp!', 'info');
  };

  // Hàm xử lý nạp nhiều file cùng một lúc (Word, PDF, Ảnh bài học)
  async function handleMultipleUploadedFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    showLoading(`Đang xử lý ${files.length} tài liệu...`, 'Đang phân tích cấu trúc & tối ưu hóa...');

    let loadedCount = 0;
    for (const file of files) {
      try {
        const parsed = await parseSingleFile(file);
        if (parsed) {
          state.uploadedFiles.push(parsed);
          loadedCount++;
        }
      } catch (err) {
        console.warn(`Lỗi khi đọc file ${file.name}:`, err);
      }
    }

    hideLoading();

    if (loadedCount > 0) {
      refreshMultiDocumentsState();
      showToast(`Đã nạp thành công ${loadedCount} tài liệu!`, 'success');
    } else {
      showToast('Không có file nào hợp lệ (.docx, .pdf hoặc ảnh)!', 'warning');
    }
  }

  function setActiveDocument(title, text, type, imageBase64 = null, isSample = false) {
    state.uploadedFiles = [{
      id: 'doc_' + Date.now(),
      name: title,
      type: type,
      text: text,
      wordCount: countWords(text),
      size: 0,
      imageBase64: imageBase64,
      isOcrDone: type !== 'image'
    }];
    refreshMultiDocumentsState();
    if (isSample) {
      showToast(`Đã mở bài mẫu: ${title}`, 'success');
    }
  }

  // ================= OCR WITH GEMINI VISION (NHẬN DIỆN CÔNG THỨC TOÁN - LÝ - HÓA & HÌNH VẼ CHI TIẾT) =================
  async function runOcrOnCurrentImage() {
    const unOcrImages = state.uploadedFiles.filter(f => f.imageBase64 && !f.isOcrDone);
    const targetImages = unOcrImages.length > 0 ? unOcrImages : state.uploadedFiles.filter(f => f.imageBase64);

    if (targetImages.length === 0 && !state.currentDoc.imageBase64) {
      showToast('Không tìm thấy ảnh bài học nào để nhận diện OCR!', 'warning');
      return;
    }

    const itemsToProcess = targetImages.length > 0 ? targetImages : [{
      id: 'single_img',
      name: state.currentDoc.title || 'Ảnh bài học',
      imageBase64: state.currentDoc.imageBase64
    }];

    try {
      showLoading(`Đang nhận diện OCR qua AI...`, `Đang trích xuất công thức Toán - Lý - Hóa và phân tích hình vẽ từ ${itemsToProcess.length} ảnh bài học...`);

      const prompt = `Bạn là chuyên gia nhận diện văn bản (OCR) và phiên giải tài liệu học tập ĐẶC BIỆT LÀ TOÁN HỌC, VẬT LÝ, HÓA HỌC & KHOA HỌC TỰ NHIÊN (Cả Cấp 2 THCS & Cấp 3 THPT).
Hãy đọc cẩn thận bức ảnh bài học này và trích xuất TOÀN BỘ nội dung ra văn bản tiếng Việt rõ ràng, mạch lạc, giữ nguyên tiêu đề và cấu trúc bài học:

1. QUY TẮC NHẬN DẠNG CÔNG THỨC TOÁN, LÝ, HÓA CHUẨN XÁC:
- Chuyển TẤT CẢ công thức Toán, biểu thức đại số, hình học, công thức Vật lý, phương trình Hóa học sang định dạng LaTeX/KaTeX kẹp giữa dấu $ (công thức trong dòng $...$) hoặc $$ (công thức riêng dòng $$...$$).
- Phân số & căn thức: \\frac{a}{b}, \\frac{x + 1}{x - 2}, \\sqrt{A}, \\sqrt[n]{A}.
- Lũy thừa, chỉ số: x^2, x_1, x_2, (a+b)^2, \\log_a b, e^x.
- Hệ phương trình & ngoặc: \\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}.
- Hình học & Giải tích THCS/THPT: \\triangle ABC, \\widehat{ABC}, \\perp, \\parallel, \\sim, ^\\circ, \\vec{u}(x;y;z).
- Vật lý: \\vec{F}, I = \\frac{U}{R}, P = U \\cdot I, Q = I^2 R t, x = A\\cos(\\omega t + \\varphi), \\lambda = \\frac{v}{f}, \\Omega, \\mu.
- Hóa học: Phương trình phản ứng (\\rightarrow, \\rightleftharpoons), điều kiện nhiệt độ (\\xrightarrow{t^\\circ}), ion (\\text{SO}_4^{2-}, \\text{Fe}^{3+}), kết tủa (\\downarrow), bay hơi (\\uparrow), công thức hữu cơ (\\text{CH}_3\\text{COOH}).

2. PHÂN TÍCH VÀ MÔ TẢ CHI TIẾT HÌNH VẼ, SƠ ĐỒ, ĐỒ THỊ, BẢNG BIỂU (RẤT QUAN TRỌNG):
- Nếu bài học có HÌNH VẼ HÌNH HỌC (tam giác, đường tròn, góc, tiếp tuyến, đường cao): Mô tả chi tiết hình vẽ, các điểm, góc, cạnh bằng nhau, số đo và chuyển thành giả thiết toán học rõ ràng.
- Nếu có SƠ ĐỒ MẠCH ĐIỆN VẬT LÝ (nguồn điện, ampe kế, vôn kế, các điện trở nối tiếp hay song song): Liệt kê chính xác sơ đồ mạch điện (ví dụ: (R1 // R2) nt R3) cùng các thông số ghi trên hình.
- Nếu có HÌNH VẼ THÍ NGHIỆM HÓA HỌC / KHOA HỌC TỰ NHIÊN (bình tam giác, ống nghiệm, chất phản ứng, ngọn lửa đèn cồn, hiện tượng sủi bọt, kết tủa): Mô tả cụ thể dụng cụ, hóa chất tham gia, điều kiện và hiện tượng quan sát được.
- Nếu có ĐỒ THỊ / BIỂU ĐỒ: Đọc rõ các trục tọa độ, xu hướng biến thiên và giá trị tại các điểm đặc biệt.

Chỉ trả về nội dung bài học và phần phân tích hình vẽ đã nhận diện, không kèm lời chào.`;

      for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        showLoading(`Đang nhận diện ảnh ${i + 1}/${itemsToProcess.length}...`, item.name);

        const extracted = await callGeminiWithRotation(prompt, item.imageBase64, {
          isJson: false,
          maxTokens: 3500,
          taskName: `Đang nhận diện OCR ảnh ${i + 1}/${itemsToProcess.length}: ${item.name}...`
        });

        item.text = extracted;
        item.wordCount = countWords(extracted);
        item.isOcrDone = true;
      }

      hideLoading();
      refreshMultiDocumentsState();

      // Show in extracted text modal for verification
      dom.extractedTextArea.value = state.currentDoc.text;
      dom.extractedWordCount.textContent = `${state.currentDoc.wordCount} từ`;
      dom.extractedTextModal.classList.remove('hidden');

      showToast(`Đã nhận diện OCR thành công ${itemsToProcess.length} ảnh (${state.currentDoc.wordCount} từ)!`, 'success');
    } catch (e) {
      hideLoading();
      showToast(e.message, 'error');
    }
  }

  // ================= TAB NAVIGATION LOGIC =================
  dom.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      
      // Update Tab Buttons UI
      dom.tabButtons.forEach(b => {
        b.classList.remove('active', 'text-indigo-600', 'border-indigo-600', 'bg-white', 'shadow-xs');
        b.classList.add('border-transparent', 'text-slate-500');
      });
      btn.classList.add('active', 'text-indigo-600', 'border-indigo-600', 'bg-white', 'shadow-xs');
      btn.classList.remove('border-transparent', 'text-slate-500');

      // Update Panes
      dom.tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      // If switched to Mindmap and instance exists, fit & center view
      if (targetId === 'tab-mindmap' && state.markmapInstance) {
        setTimeout(() => state.markmapInstance.fit(), 80);
        setTimeout(() => state.markmapInstance.fit(), 250);
        setTimeout(() => state.markmapInstance.fit(), 450);
      }
    });
  });

  // ================= KATEX TOÁN HỌC & CÔNG THỨC KHOA HỌC =================
  function renderAllMath(targetEl) {
    const el = targetEl || document.body;
    const doRender = () => {
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(el, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn('KaTeX render warning:', e);
        }
      }
    };

    if (window.renderMathInElement) {
      doRender();
    } else {
      setTimeout(doRender, 200);
      setTimeout(doRender, 600);
    }
  }

  // ================= TAB 1: SƠ ĐỒ TƯ DUY (MINDMAP) =================
  // Bộ phân giải Markdown sang cây Markmap tự thân (Hoạt động 100% offline & không phụ thuộc Transformer ngoài)
  function markdownToMarkmapTree(markdown) {
    if (!markdown || typeof markdown !== 'string') return { content: 'Sơ đồ tư duy', children: [] };
    const lines = markdown.split(/\r?\n/);
    let root = null;
    let stack = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let level = 0;
      let text = '';

      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        level = headingMatch[1].length;
        text = headingMatch[2].trim();
      } else {
        const listMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
        if (listMatch) {
          const indent = listMatch[1].length;
          level = 7 + Math.floor(indent / 2);
          text = listMatch[2].trim();
        }
      }

      if (text) {
        const node = { content: text, children: [] };
        if (!root) {
          root = node;
          stack = [{ level: level, node: node }];
          return;
        }

        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length > 0) {
          stack[stack.length - 1].node.children.push(node);
          stack.push({ level: level, node: node });
        } else {
          root.children.push(node);
          stack.push({ level: level, node: node });
        }
      }
    });

    return root || { content: 'Sơ đồ tư duy', children: [] };
  }

  // ================= FALLBACK: BỘ VẼ SƠ ĐỒ SVG THUẦN (100% OFFLINE & ĐỘC LẬP) =================
  const svgMindmapState = {
    zoom: 1,
    panX: 40,
    panY: 40,
    isDragging: false,
    startX: 0,
    startY: 0,
    tree: null,
    collapsed: new Set()
  };

  function renderBuiltInSvgMindmap(tree, svgEl) {
    if (!tree || !svgEl) return;
    svgMindmapState.tree = tree;

    const branchColors = [
      { stroke: '#4f46e5', bg: '#eef2ff', text: '#312e81', border: '#818cf8' },
      { stroke: '#0284c7', bg: '#f0f9ff', text: '#0c4a6e', border: '#38bdf8' },
      { stroke: '#059669', bg: '#ecfdf5', text: '#064e3b', border: '#34d399' },
      { stroke: '#d97706', bg: '#fffbeb', text: '#78350f', border: '#fbbf24' },
      { stroke: '#dc2626', bg: '#fef2f2', text: '#7f1d1d', border: '#f87171' },
      { stroke: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95', border: '#a78bfa' },
      { stroke: '#0891b2', bg: '#ecfeff', text: '#164e63', border: '#22d3ee' },
      { stroke: '#ea580c', bg: '#fff7ed', text: '#7c2d12', border: '#fb923c' }
    ];

    const nodeHeight = 36;
    const verticalGap = 16;
    const levelSpacing = 250;
    let curY = 40;

    function layoutNode(node, depth, branchIdx) {
      node.depth = depth;
      node.branchIdx = branchIdx;
      const textLen = (node.content || '').length;
      node.width = Math.min(380, Math.max(90, textLen * 9.5 + 30));
      node.height = depth === 0 ? 42 : nodeHeight;

      const isCollapsed = svgMindmapState.collapsed.has(node);
      const hasChildren = node.children && node.children.length > 0 && !isCollapsed;

      if (!hasChildren) {
        node.y = curY;
        curY += node.height + verticalGap;
      } else {
        node.children.forEach((child, idx) => {
          const bIdx = depth === 0 ? idx : branchIdx;
          layoutNode(child, depth + 1, bIdx);
        });
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        node.y = (firstChild.y + lastChild.y) / 2;
      }
      node.x = depth * levelSpacing + 40;
    }

    curY = 40;
    layoutNode(tree, 0, 0);

    svgEl.innerHTML = '';

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="svg-node-shadow" x="-10%" y="-10%" width="125%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.08"/>
      </filter>
    `;
    svgEl.appendChild(defs);

    const rootG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    rootG.id = 'builtin-svg-mindmap-root';
    svgEl.appendChild(rootG);

    // Vẽ đường nối cong (Cubic Bezier curves)
    function drawLinks(node) {
      const isCollapsed = svgMindmapState.collapsed.has(node);
      if (node.children && node.children.length > 0 && !isCollapsed) {
        node.children.forEach(child => {
          const colorObj = branchColors[child.branchIdx % branchColors.length];
          const x1 = node.x + node.width;
          const y1 = node.y + node.height / 2;
          const x2 = child.x;
          const y2 = child.y + child.height / 2;
          const dx = (x2 - x1) * 0.5;

          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
          path.setAttribute('stroke', colorObj.stroke);
          path.setAttribute('stroke-width', node.depth === 0 ? '3.2' : '2.4');
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke-linecap', 'round');
          path.setAttribute('opacity', '0.88');
          rootG.appendChild(path);

          drawLinks(child);
        });
      }
    }
    drawLinks(tree);

    // Vẽ các thẻ node
    function drawNodes(node) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'mindmap-node cursor-pointer');
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

      const colorObj = node.depth === 0
        ? { stroke: '#4f46e5', bg: '#4f46e5', text: '#ffffff', border: '#4338ca' }
        : branchColors[node.branchIdx % branchColors.length];

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', node.width);
      rect.setAttribute('height', node.height);
      rect.setAttribute('rx', node.depth === 0 ? '12' : '8');
      rect.setAttribute('fill', node.depth === 0 ? colorObj.bg : (node.depth === 1 ? colorObj.bg : '#ffffff'));
      rect.setAttribute('stroke', colorObj.stroke);
      rect.setAttribute('stroke-width', node.depth === 0 ? '2.5' : (node.depth === 1 ? '2' : '1.5'));
      rect.setAttribute('filter', 'url(#svg-node-shadow)');
      g.appendChild(rect);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 14);
      text.setAttribute('y', node.height / 2);
      text.setAttribute('dominant-baseline', 'central');
      text.setAttribute('fill', node.depth === 0 ? '#ffffff' : (node.depth === 1 ? colorObj.text : '#1e293b'));
      text.setAttribute('font-size', node.depth === 0 ? '14px' : (node.depth === 1 ? '13px' : '12px'));
      text.setAttribute('font-weight', node.depth <= 1 ? '700' : '600');
      text.setAttribute('font-family', "'Be Vietnam Pro', system-ui, sans-serif");
      text.textContent = node.content;
      g.appendChild(text);

      if (node.children && node.children.length > 0) {
        const toggleCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        toggleCircle.setAttribute('cx', node.width);
        toggleCircle.setAttribute('cy', node.height / 2);
        toggleCircle.setAttribute('r', '6.5');
        toggleCircle.setAttribute('fill', colorObj.stroke);
        toggleCircle.setAttribute('stroke', '#ffffff');
        toggleCircle.setAttribute('stroke-width', '2');
        g.appendChild(toggleCircle);

        g.addEventListener('click', (e) => {
          e.stopPropagation();
          if (svgMindmapState.collapsed.has(node)) {
            svgMindmapState.collapsed.delete(node);
          } else {
            svgMindmapState.collapsed.add(node);
          }
          renderBuiltInSvgMindmap(svgMindmapState.tree, svgEl);
        });
      }

      rootG.appendChild(g);

      const isCollapsed = svgMindmapState.collapsed.has(node);
      if (node.children && node.children.length > 0 && !isCollapsed) {
        node.children.forEach(child => drawNodes(child));
      }
    }
    drawNodes(tree);

    function updateTransform() {
      rootG.setAttribute('transform', `translate(${svgMindmapState.panX}, ${svgMindmapState.panY}) scale(${svgMindmapState.zoom})`);
    }

    // Đặt vị trí ban đầu an toàn ngay lập tức
    svgMindmapState.zoom = 0.9;
    svgMindmapState.panX = 40;
    svgMindmapState.panY = 50;
    updateTransform();

    function fitView() {
      try {
        const bbox = rootG.getBBox();
        const svgRect = svgEl.getBoundingClientRect();
        const svgW = svgRect.width || 900;
        const svgH = svgRect.height || 580;

        if (bbox && bbox.width > 0 && bbox.height > 0) {
          const scaleX = (svgW - 80) / bbox.width;
          const scaleY = (svgH - 80) / bbox.height;
          svgMindmapState.zoom = Math.min(1.05, Math.max(0.4, Math.min(scaleX, scaleY)));
          svgMindmapState.panX = Math.max(20, (svgW - bbox.width * svgMindmapState.zoom) / 2 - bbox.x * svgMindmapState.zoom);
          svgMindmapState.panY = Math.max(20, (svgH - bbox.height * svgMindmapState.zoom) / 2 - bbox.y * svgMindmapState.zoom);
          updateTransform();
        }
      } catch (err) {
        updateTransform();
      }
    }

    state.markmapInstance = {
      fit: fitView,
      setData: (newTree) => renderBuiltInSvgMindmap(newTree, svgEl),
      rescale: (scale) => {
        svgMindmapState.zoom = Math.max(0.2, Math.min(3, svgMindmapState.zoom * scale));
        updateTransform();
      }
    };

    fitView();
    setTimeout(fitView, 50);
    setTimeout(fitView, 200);

    svgEl.onmousedown = (e) => {
      svgMindmapState.isDragging = true;
      svgMindmapState.startX = e.clientX - svgMindmapState.panX;
      svgMindmapState.startY = e.clientY - svgMindmapState.panY;
      svgEl.style.cursor = 'grabbing';
    };

    window.onmousemove = (e) => {
      if (!svgMindmapState.isDragging) return;
      svgMindmapState.panX = e.clientX - svgMindmapState.startX;
      svgMindmapState.panY = e.clientY - svgMindmapState.startY;
      updateTransform();
    };

    window.onmouseup = () => {
      svgMindmapState.isDragging = false;
      if (svgEl) svgEl.style.cursor = 'grab';
    };

    svgEl.onwheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 1.1 : 0.9;
      svgMindmapState.zoom = Math.max(0.2, Math.min(3, svgMindmapState.zoom * delta));
      updateTransform();
    };
  }

  function renderMindmap(markdown, retryCount = 0) {
    if (!markdown) return;
    state.mindmapMarkdown = markdown;
    if (dom.markdownInput) dom.markdownInput.value = markdown;

    // Luôn ẩn hộp rỗng khi có nội dung sơ đồ tư duy
    if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.add('hidden');

    let markmapDrawn = false;

    // Chỉ dùng Markmap ngoài NẾU CẢ Transformer VÀ Markmap ĐỀU TỒN TẠI VÀ CHUYỂN ĐỔI THÀNH CÔNG
    if (window.markmap && window.markmap.Transformer && (window.markmap.Markmap || window.Markmap)) {
      try {
        const MarkmapClass = window.markmap.Markmap || window.Markmap;
        const transformer = new window.markmap.Transformer();
        const res = transformer.transform(markdown);
        if (res && res.root) {
          const modernPalette = ['#4f46e5', '#0284c7', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#ea580c'];
          const options = {
            duration: 300,
            colorFreezeLevel: 2,
            paddingX: 20,
            spacingHorizontal: 65,
            spacingVertical: 14,
            color: (node) => {
              if (node.depth === 0) return '#4f46e5';
              const idx = (node.order || 0) % modernPalette.length;
              return modernPalette[idx];
            }
          };

          if (!state.markmapInstance || !state.markmapInstance.setData) {
            state.markmapInstance = MarkmapClass.create(dom.markmapSvg, options, res.root);
          } else {
            state.markmapInstance.setData(res.root);
          }

          if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.add('hidden');

          [50, 150, 300, 600, 1000].forEach(delay => {
            setTimeout(() => {
              if (state.markmapInstance && state.markmapInstance.fit) state.markmapInstance.fit();
            }, delay);
          });
          markmapDrawn = true;
        }
      } catch (e) {
        console.warn('Lỗi khi vẽ qua Markmap library:', e);
      }
    }

    // NẾU MARKMAP CHƯA RENDER ĐƯỢC -> DÙNG NGAY BỘ VẼ PURE-SVG TỰ THÂN ĐẢM BẢO 100% HIỂN THỊ!
    if (!markmapDrawn) {
      const tree = markdownToMarkmapTree(markdown);
      renderBuiltInSvgMindmap(tree, dom.markmapSvg);
      if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.add('hidden');
    }
  }

  // Helper lấy ảnh gửi AI Vision (hỗ trợ 1 ảnh hoặc mảng nhiều ảnh bài học) khi người dùng chưa chạy OCR
  function getImagesToSend() {
    const hasImages = (state.currentDoc.images && state.currentDoc.images.length > 0) || state.currentDoc.imageBase64;
    const isPlaceholderText = !state.currentDoc.text || state.currentDoc.text.includes('[Ảnh chụp bài học:');
    if (hasImages && isPlaceholderText) {
      if (state.currentDoc.images && state.currentDoc.images.length > 0) {
        return state.currentDoc.images;
      }
      return state.currentDoc.imageBase64 ? [state.currentDoc.imageBase64] : null;
    }
    return null;
  }

  async function generateMindmapWithAi() {
    if (!state.currentDoc.text && !state.currentDoc.imageBase64 && (!state.currentDoc.images || state.currentDoc.images.length === 0)) {
      showToast('Vui lòng tải lên tài liệu học tập trước!', 'warning');
      return;
    }

    const prompt = `Bạn là một chuyên gia sư phạm và thiết kế Sơ đồ tư duy (Mindmap) chuẩn quốc tế (Tony Buzan) cho học sinh THCS (Lớp 6, 7, 8, 9).
Dựa trên nội dung bài học sau đây, hãy xây dựng một Sơ đồ tư duy phân cấp CỰC KỲ ĐẸP MẮT, BẮT MẮT, SINH ĐỘNG VÀ DỄ HIỂU theo định dạng Markdown tiêu chuẩn.

QUY TẮC THIẾT KẾ SƠ ĐỒ TƯ DUY HIỆN ĐẠI (CHỐNG DÀI DÒNG, TĂNG TÍNH THẨM MỸ):
1. BẮT BUỘC gắn Emoji sinh động trực quan ở ĐẦU MỖI NHÁNH (Ví dụ: # 📘 Tiêu đề chính, ## 🎯 I. Khái niệm cốt lõi, ### 💡 1. Đặc điểm nổi bật, - ⚡ Ý chính...).
2. Từ khóa cô đọng súc tích: Mỗi gạch đầu dòng (-) chỉ ghi TỪ KHÓA NGẮN GỌN (từ 3 đến 8 từ), TUYỆT ĐỐI KHÔNG viết cả một câu văn dài lê thê làm chữ bị dính chùm vào đường kẻ. Dùng **in đậm** cho các từ khóa cốt lõi.
3. Tỏa nhánh hình cây: Nếu có nhiều ý con, hãy tách thành các dấu gạch đầu dòng con lùi vào trong để sơ đồ bung rộng tỏa nhánh cân xứng, đẹp mắt.
4. Viết công thức Toán/KHTN dưới dạng LaTeX kẹp giữa $ (Ví dụ: $ax^2 + bx + c = 0$, $\\Delta = b^2 - 4ac$, $I = \\frac{U}{R}$).
5. ĐẶC BIỆT LƯU Ý HÌNH VẼ & SƠ ĐỒ MINH HỌA: Nếu bài học có hình vẽ hình học, sơ đồ mạch điện, thí nghiệm hóa học hoặc đồ thị, hãy trích xuất và đưa các dữ kiện then chốt từ hình vẽ vào các nhánh kiến thức tương ứng.
6. CHỈ TRẢ VỀ DUY NHẤT ĐOẠN MÃ MARKDOWN CỦA SƠ ĐỒ TƯ DUY, KHÔNG CÓ BẤT KỲ LỜI DẪN NÀO KHÁC.

NỘI DUNG BÀI HỌC CẤP 2:
${state.currentDoc.text}`;

    try {
      const imgToSend = getImagesToSend();
      const aiResponse = await callGeminiWithRotation(prompt, imgToSend, {
        isJson: false,
        maxTokens: 1500,
        taskName: 'Đang tạo Sơ đồ tư duy AI...'
      });
      // Clean up markdown block quotes if present
      const cleanMarkdown = aiResponse.replace(/```markdown/gi, '').replace(/```/g, '').trim();
      renderMindmap(cleanMarkdown);
      showToast('Đã tạo xong Sơ đồ tư duy AI!', 'success');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  // ================= TAB 2: TÓM TẮT & GỢI Ý HỌC TẬP =================
  function renderSummary(summaryObj) {
    state.summaryData = summaryObj;
    dom.summaryEmptyState.classList.add('hidden');

    // 1. Takeaways
    dom.listTakeaways.innerHTML = '';
    (summaryObj.coreTakeaways || []).forEach(item => {
      const li = document.createElement('li');
      li.className = 'flex items-start gap-2.5';
      li.innerHTML = `
        <i class="fa-solid fa-circle-check text-indigo-600 text-sm mt-0.5 shrink-0"></i>
        <span class="leading-relaxed">${item}</span>
      `;
      dom.listTakeaways.appendChild(li);
    });
    dom.sectionTakeaways.classList.remove('hidden');

    // 2. Terms Table
    dom.tableTermsBody.innerHTML = '';
    (summaryObj.terms || []).forEach(t => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50/80 transition-colors';
      tr.innerHTML = `
        <td class="py-2.5 px-4 font-bold text-indigo-900 bg-indigo-50/30">${t.term}</td>
        <td class="py-2.5 px-4 leading-relaxed">${t.definition}</td>
      `;
      dom.tableTermsBody.appendChild(tr);
    });
    dom.sectionTerms.classList.remove('hidden');

    // 3. Strategies
    if (summaryObj.studyStrategy) {
      dom.feynmanText.textContent = summaryObj.studyStrategy.feynmanTechnique || 'Không có';
      dom.mnemonicsText.textContent = summaryObj.studyStrategy.mnemonics || 'Không có';

      dom.spacedList.innerHTML = '';
      (summaryObj.studyStrategy.spacedSchedule || []).forEach(step => {
        const div = document.createElement('div');
        div.className = 'p-2 rounded-lg bg-emerald-50/60 border border-emerald-100';
        div.innerHTML = `<span class="font-bold text-emerald-900 block">${step.day}:</span> <span class="text-slate-600">${step.task}</span>`;
        dom.spacedList.appendChild(div);
      });
      dom.sectionStrategies.classList.remove('hidden');
    }

    // Render KaTeX cho công thức toán & khoa học trong phần Tóm tắt
    setTimeout(() => {
      renderAllMath(dom.tabSummary);
    }, 50);
  }

  async function generateSummaryWithAi() {
    if (!state.currentDoc.text && !state.currentDoc.imageBase64 && (!state.currentDoc.images || state.currentDoc.images.length === 0)) {
      showToast('Vui lòng tải lên tài liệu học tập trước!', 'warning');
      return;
    }

    const prompt = `Bạn là một cố vấn giáo dục và chuyên gia tối ưu hóa phương pháp học tập dành riêng cho HỌC SINH CẤP 2 (THCS: Lớp 6, 7, 8, 9, độ tuổi 11 - 15).
Dựa vào bài học cấp 2 sau, hãy tạo bản tóm tắt nội dung cô đọng và gợi ý học tập thông minh, sinh động, dễ tiếp thu.
QUAN TRỌNG VỀ CÔNG THỨC TOÁN & KHOA HỌC: Bắt buộc viết các công thức toán, lý, hóa dưới dạng LaTeX kẹp giữa dấu $ (ví dụ: $ax^2 + bx + c = 0$, $\\Delta = b^2 - 4ac$, $I = \\frac{U}{R}$, $P = U \\cdot I$, $Q = I^2 R t$).
ĐẶC BIỆT LƯU Ý HÌNH VẼ & SƠ ĐỒ MINH HỌA: Nếu bài học có hình vẽ hình học, sơ đồ mạch điện, dụng cụ thí nghiệm hóa học hoặc đồ thị, hãy giải thích và đưa vào phần tóm tắt cốt lõi.
Trả về dữ liệu dưới dạng JSON thuần túy (không bọc text ngoài lề) theo đúng cấu trúc sau:
{
  "coreTakeaways": [
    "Ý cốt lõi 1 (ngắn gọn, dễ hiểu cho học sinh cấp 2)...",
    "Ý cốt lõi 2...",
    "Ý cốt lõi 3..."
  ],
  "terms": [
    { "term": "Tên thuật ngữ", "definition": "Định nghĩa đơn giản và ví dụ thực tế đời sống" }
  ],
  "studyStrategy": {
    "feynmanTechnique": "Giải thích toàn bộ bài này theo cách trực quan, vui vẻ, ví dụ đời thường để bạn bè cùng lớp 6-9 hiểu ngay trong 2 câu...",
    "mnemonics": "Mẹo ghi nhớ siêu tốc, câu vần điệu, thơ vui hoặc từ viết tắt liên tưởng...",
    "spacedSchedule": [
      { "day": "Hôm nay (Sau 1h)", "task": "..." },
      { "day": "Ngày 3", "task": "..." },
      { "day": "Ngày 7", "task": "..." }
    ]
  }
}

NỘI DUNG BÀI HỌC CẤP 2:
${state.currentDoc.text}`;

    try {
      const imgToSend = getImagesToSend();
      const rawRes = await callGeminiWithRotation(prompt, imgToSend, {
        isJson: true,
        maxTokens: 1500,
        taskName: 'Đang tạo Tóm tắt & Gợi ý học tập AI...'
      });
      const parsed = safeParseJson(rawRes);
      renderSummary(parsed);
      showToast('Đã tạo xong Tóm tắt & Chiến lược học thông minh!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi tạo tóm tắt: ' + e.message, 'error');
    }
  }

  // ================= TAB 3: TẠO ĐỀ THI 3 MỨC ĐỘ =================
  function renderQuiz(quizArray) {
    state.quizData = quizArray;
    state.quizUserAnswers = {};
    state.quizSubmitted = false;

    dom.quizEmptyState.classList.add('hidden');
    dom.interactiveQuizContainer.classList.remove('hidden');
    dom.quizResultCard.classList.add('hidden');
    dom.quizSubmitBar.classList.remove('hidden');

    // Reset Progress & Timer
    updateQuizProgress();
    startQuizTimer();

    // Render interactive cards
    dom.quizQuestionsList.innerHTML = '';
    quizArray.forEach((q, qIndex) => {
      const card = document.createElement('div');
      card.id = `quiz-card-${q.id}`;
      card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 transition-all';

      const tierBadge = {
        easy: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-leaf"></i> Mức Dễ (Nhận biết)</span>',
        medium: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800"><i class="fa-solid fa-chart-simple"></i> Trung Bình (Thông hiểu)</span>',
        hard: '<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800"><i class="fa-solid fa-fire-flame-curved"></i> Mức Khó (Vận dụng cao)</span>'
      };

      const optionsHtml = q.options.map((opt, optIndex) => `
        <label class="quiz-option-label flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all text-xs sm:text-sm text-slate-800" data-qid="${q.id}" data-opt="${optIndex}">
          <input type="radio" name="question-${q.id}" value="${optIndex}" class="mt-0.5 text-indigo-600 focus:ring-indigo-500">
          <span class="leading-relaxed">${opt}</span>
        </label>
      `).join('');

      card.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-100">
          <span class="font-extrabold text-sm text-slate-900">Câu ${qIndex + 1}</span>
          ${tierBadge[q.tier] || tierBadge.easy}
        </div>
        <p class="text-sm font-semibold text-slate-800 leading-relaxed">${q.question}</p>
        <div class="space-y-2 pt-1 options-group">
          ${optionsHtml}
        </div>
        <div id="explanation-${q.id}" class="hidden p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed mt-2">
          <span class="font-bold block text-slate-900 mb-1"><i class="fa-solid fa-circle-info text-indigo-600"></i> Lời giải chi tiết:</span>
          <p>${q.explanation || 'Không có giải thích chi tiết.'}</p>
        </div>
      `;

      dom.quizQuestionsList.appendChild(card);
    });

    // Add radio click listeners
    dom.quizQuestionsList.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const qId = parseInt(e.target.name.replace('question-', ''));
        const optIndex = parseInt(e.target.value);
        state.quizUserAnswers[qId] = optIndex;
        updateQuizProgress();

        // Highlight selected option
        const parentCard = document.getElementById(`quiz-card-${qId}`);
        parentCard.querySelectorAll('.quiz-option-label').forEach(label => {
          label.classList.remove('bg-indigo-50', 'border-indigo-500', 'ring-1', 'ring-indigo-500');
        });
        const selectedLabel = parentCard.querySelector(`[data-opt="${optIndex}"]`);
        if (selectedLabel) {
          selectedLabel.classList.add('bg-indigo-50', 'border-indigo-500', 'ring-1', 'ring-indigo-500');
        }
      });
    });

    // Also populate printable exam sheet
    populatePrintableExam();

    // Render KaTeX cho câu hỏi trắc nghiệm & công thức toán
    setTimeout(() => {
      renderAllMath(dom.quizQuestionsList);
    }, 50);
  }

  function updateQuizProgress() {
    const total = state.quizData.length;
    const answered = Object.keys(state.quizUserAnswers).length;
    const pct = total > 0 ? (answered / total) * 100 : 0;
    
    dom.quizProgressBar.style.width = `${pct}%`;
    dom.quizProgressText.textContent = `${answered}/${total} câu`;
  }

  function startQuizTimer() {
    if (state.quizTimerInterval) clearInterval(state.quizTimerInterval);
    state.quizTimeLeft = 15 * 60;

    state.quizTimerInterval = setInterval(() => {
      if (state.quizTimeLeft <= 0) {
        clearInterval(state.quizTimerInterval);
        showToast('Hết thời gian làm bài!', 'warning');
        submitQuizAnswers();
        return;
      }
      state.quizTimeLeft--;
      const m = Math.floor(state.quizTimeLeft / 60).toString().padStart(2, '0');
      const s = (state.quizTimeLeft % 60).toString().padStart(2, '0');
      dom.quizTimerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function submitQuizAnswers() {
    if (state.quizSubmitted) return;
    state.quizSubmitted = true;
    if (state.quizTimerInterval) clearInterval(state.quizTimerInterval);

    let correctTotal = 0;
    const tierScores = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    state.quizData.forEach(q => {
      const userChoice = state.quizUserAnswers[q.id];
      const isCorrect = (userChoice === q.correctIndex);
      
      const tierKey = q.tier || 'easy';
      if (!tierScores[tierKey]) tierScores[tierKey] = { correct: 0, total: 0 };
      tierScores[tierKey].total++;

      if (isCorrect) {
        correctTotal++;
        tierScores[tierKey].correct++;
      }

      // Highlight options on card & bảo lưu nút radio chấm tròn của người dùng
      const card = document.getElementById(`quiz-card-${q.id}`);
      if (card) {
        const labels = card.querySelectorAll('.quiz-option-label');
        labels.forEach((lbl, idx) => {
          // Khóa không cho đổi đáp án sau khi nộp
          lbl.style.pointerEvents = 'none';
          
          const radio = lbl.querySelector('input[type="radio"]');
          if (radio) {
            radio.disabled = true;
            // Bắt buộc giữ dấu check chấm tròn cho đáp án mà học sinh đã chọn
            if (idx === userChoice) {
              radio.checked = true;
            } else {
              radio.checked = false;
            }
          }

          if (idx === q.correctIndex) {
            lbl.className = 'quiz-option-label flex items-start gap-3 p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/80 text-xs sm:text-sm font-semibold text-emerald-900';
            if (!lbl.querySelector('.quiz-result-badge')) {
              const badge = document.createElement('span');
              badge.className = 'quiz-result-badge ml-auto text-emerald-600 font-bold shrink-0';
              badge.innerHTML = `<i class="fa-solid fa-check"></i> ${idx === userChoice ? 'Đúng' : 'Đáp án đúng'}`;
              lbl.appendChild(badge);
            }
          } else if (idx === userChoice && !isCorrect) {
            lbl.className = 'quiz-option-label flex items-start gap-3 p-3 rounded-xl border-2 border-rose-500 bg-rose-50/80 text-xs sm:text-sm text-rose-900';
            if (!lbl.querySelector('.quiz-result-badge')) {
              const badge = document.createElement('span');
              badge.className = 'quiz-result-badge ml-auto text-rose-600 font-bold shrink-0';
              badge.innerHTML = `<i class="fa-solid fa-xmark"></i> Bạn đã chọn (Sai)`;
              lbl.appendChild(badge);
            }
          } else {
            lbl.className = 'quiz-option-label flex items-start gap-3 p-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-500 opacity-60';
          }
        });

        // Show explanation
        const expBox = document.getElementById(`explanation-${q.id}`);
        if (expBox) expBox.classList.remove('hidden');
      }
    });

    // Render KaTeX cho lời giải chi tiết (chứa công thức toán / lý / hóa)
    setTimeout(() => {
      renderAllMath(dom.quizQuestionsList);
    }, 50);

    // Score on scale of 10
    const totalQ = state.quizData.length;
    const finalScore = totalQ > 0 ? ((correctTotal / totalQ) * 10).toFixed(1) : 0;

    // Show Results
    dom.quizResultScore.textContent = `${finalScore} / 10 Điểm`;
    dom.quizResultSummary.textContent = `Làm đúng ${correctTotal}/${totalQ} câu hỏi (${Math.round((correctTotal/totalQ)*100)}%)`;
    dom.scoreEasy.textContent = `${tierScores.easy.correct}/${tierScores.easy.total}`;
    dom.scoreMedium.textContent = `${tierScores.medium.correct}/${tierScores.medium.total}`;
    dom.scoreHard.textContent = `${tierScores.hard.correct}/${tierScores.hard.total}`;

    dom.quizResultCard.classList.remove('hidden');
    dom.quizSubmitBar.classList.add('hidden');
    dom.quizResultCard.scrollIntoView({ behavior: 'smooth' });

    // Confetti celebration if score >= 8
    if (finalScore >= 8 && window.confetti) {
      window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }

    // Save quiz attempt to history (Learning Analytics & Progress)
    try {
      const historyRecord = {
        id: Date.now(),
        date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        title: state.currentDoc.title || 'Bài tập khảo thí',
        score: parseFloat(finalScore),
        correctTotal: correctTotal,
        totalQ: totalQ,
        percentage: Math.round((correctTotal / totalQ) * 100)
      };
      const existingHistory = JSON.parse(localStorage.getItem('smartedu_quiz_history') || '[]');
      existingHistory.unshift(historyRecord);
      if (existingHistory.length > 50) existingHistory.length = 50; // Lưu tối đa 50 lần gần nhất
      localStorage.setItem('smartedu_quiz_history', JSON.stringify(existingHistory));
    } catch (e) {
      console.warn('Không thể lưu lịch sử khảo thí vào localStorage:', e);
    }
  }

  function populatePrintableExam() {
    dom.printExamTitle.textContent = state.currentDoc.title ? `Đề Thi Ôn Tập: ${state.currentDoc.title}` : 'Đề Thi Ôn Tập Tổng Hợp';
    dom.printQuestionsArea.innerHTML = '';
    dom.printAnswersArea.innerHTML = '';

    state.quizData.forEach((q, idx) => {
      // 1. Question item for student
      const qDiv = document.createElement('div');
      qDiv.className = 'space-y-1.5 leading-relaxed';
      const optText = q.options.join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
      qDiv.innerHTML = `
        <p class="font-bold">Câu ${idx + 1} [${q.tierLabel || q.tier}]: ${q.question}</p>
        <div class="pl-4 text-xs sm:text-sm text-slate-700 space-y-1">
          ${q.options.map(opt => `<div>${opt}</div>`).join('')}
        </div>
      `;
      dom.printQuestionsArea.appendChild(qDiv);

      // 2. Answer key row
      const aDiv = document.createElement('div');
      aDiv.className = 'p-2 rounded bg-slate-50 border border-slate-200';
      aDiv.innerHTML = `
        <span class="font-bold text-slate-900">Câu ${idx + 1}: ${q.options[q.correctIndex]}</span>
        <p class="text-slate-600 mt-0.5">↳ <em>Giải thích:</em> ${q.explanation}</p>
      `;
      dom.printAnswersArea.appendChild(aDiv);
    });

    // Render KaTeX cho đề in giấy giáo viên
    setTimeout(() => {
      renderAllMath(dom.printableExamContainer);
    }, 50);
  }

  async function generateQuizWithAi() {
    if (!state.currentDoc.text && !state.currentDoc.imageBase64 && (!state.currentDoc.images || state.currentDoc.images.length === 0)) {
      showToast('Vui lòng tải lên tài liệu học tập trước!', 'warning');
      return;
    }

    const count = parseInt(dom.quizCountSelect.value) || 10;
    
    // Distribution calculation
    const easyCount = Math.max(1, Math.round(count * 0.4));
    const medCount = Math.max(1, Math.round(count * 0.4));
    const hardCount = Math.max(1, count - easyCount - medCount);

    const prompt = `Bạn là một chuyên gia ra đề thi và khảo thí giáo dục THCS chuyên nghiệp (Chương trình GDPT 2018 Cấp 2: Lớp 6, 7, 8, 9).
Dựa trên tài liệu bài học cấp 2 sau, hãy tạo một bộ đề thi trắc nghiệm gồm ĐÚNG ${count} câu hỏi, chia chuẩn theo 3 mức độ nhận thức phù hợp lứa tuổi học sinh THCS:
- ${easyCount} câu mức Dễ (tier: "easy" - Nhận biết, sự kiện, định nghĩa cơ bản trong SGK).
- ${medCount} câu mức Trung bình (tier: "medium" - Thông hiểu, so sánh, giải thích hiện tượng đời sống).
- ${hardCount} câu mức Khó (tier: "hard" - Vận dụng cao, tư duy logic, câu hỏi bẫy, bài toán hoặc thí nghiệm thực tế cấp 2).

QUAN TRỌNG VỀ CÔNG THỨC TOÁN & KHOA HỌC: Bắt buộc viết các công thức toán, lý, hóa trong câu hỏi, đáp án và giải thích dưới dạng LaTeX kẹp giữa dấu $ (ví dụ: $ax^2 + bx + c = 0$, $\\Delta = b^2 - 4ac$, $I = \\frac{U}{R}$, $P = U \\cdot I$, $Q = I^2 R t$).
LƯU Ý KỸ THUẬT VỀ ĐỊNH DẠNG JSON: Mọi công thức LaTeX trong chuỗi JSON PHẢI dùng 2 dấu gạch chéo ngược \\\\ (ví dụ \\\\frac{U}{R}, \\\\sqrt{x}, \\\\Delta, \\\\cdot, \\\\Omega, \\\\pm) để đảm bảo chuỗi JSON hợp lệ 100%.
ĐẶC BIỆT LƯU Ý HÌNH VẼ & SƠ ĐỒ MINH HỌA: Nếu bài học có hình vẽ hình học, sơ đồ mạch điện, thí nghiệm hóa học hoặc đồ thị, hãy sáng tạo ít nhất 2-3 câu hỏi khai thác trực tiếp từ các dữ kiện trên hình vẽ (ví dụ: "Dựa vào hình vẽ/sơ đồ mạch điện, hãy tính...", "Hiện tượng quan sát được trong thí nghiệm là...").
Mỗi câu hỏi có 4 đáp án (A, B, C, D) với đúng 1 đáp án chính xác.
Trả về dữ liệu dưới dạng JSON thuần túy (KHÔNG có văn bản nào ngoài JSON) theo cấu trúc mảng sau:
[
  {
    "id": 1,
    "tier": "easy",
    "tierLabel": "Dễ (Nhận biết)",
    "question": "Nội dung câu hỏi...",
    "options": [
      "A. Lựa chọn 1",
      "B. Lựa chọn 2",
      "C. Lựa chọn 3",
      "D. Lựa chọn 4"
    ],
    "correctIndex": 0,
    "explanation": "Giải thích ngắn gọn 1-2 câu trọng tâm vì sao đáp án này đúng để học sinh cấp 2 hiểu ngay."
  }
]

NỘI DUNG BÀI HỌC CẤP 2:
${state.currentDoc.text.slice(0, 8000)}`;

    try {
      const imgToSend = getImagesToSend();
      const rawRes = await callGeminiWithRotation(prompt, imgToSend, {
        isJson: true,
        maxTokens: count >= 15 ? 8192 : (count >= 10 ? 6000 : 3500),
        timeoutMs: 45000,
        taskName: `Đang tạo bộ đề thi ${count} câu AI...`
      });
      const parsed = safeParseJson(rawRes);
      renderQuiz(parsed);
      showToast(`Đã tạo xong bộ đề thi ${count} câu phân hóa 3 mức độ!`, 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi tạo đề thi: ' + e.message, 'error');
    }
  }

  // ================= TAB 4: BEAM HỌC TẬP (FLASHCARDS) =================
  function renderBeams(beamsArray) {
    state.beamData = beamsArray;
    dom.beamEmptyState.classList.add('hidden');
    dom.beamCardsGrid.classList.remove('hidden');

    updateBeamMasteryUI();

    dom.beamCardsGrid.innerHTML = '';
    beamsArray.forEach((beam, bIndex) => {
      const cardContainer = document.createElement('div');
      cardContainer.className = 'h-72 perspective-1000 select-none';

      const inner = document.createElement('div');
      inner.className = 'flip-card-inner cursor-pointer shadow-md rounded-2xl';
      inner.id = `beam-inner-${beam.id}`;

      // Front Face
      const front = document.createElement('div');
      front.className = 'flip-card-front bg-white p-5 border border-slate-200 flex flex-col justify-between';
      front.innerHTML = `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">${beam.badge || `Thẻ ${bIndex + 1}`}</span>
            <button class="tts-beam-btn text-slate-400 hover:text-indigo-600 p-1" data-index="${bIndex}" title="Nghe đọc thẻ này">
              <i class="fa-solid fa-volume-high text-xs"></i>
            </button>
          </div>
          <h4 class="text-sm font-bold text-slate-900 mt-2">${beam.title}</h4>
          <p class="text-xs text-slate-500 mt-1 italic">💡 30s Takeaway: ${beam.takeaway || ''}</p>
          <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <p class="text-xs font-semibold text-slate-800 leading-relaxed">${beam.frontQuestion}</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          <span>Bấm để lật xem đáp án</span>
          <i class="fa-solid fa-rotate text-xs"></i>
        </div>
      `;

      // Back Face
      const back = document.createElement('div');
      back.className = 'flip-card-back bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-5 flex flex-col justify-between';
      back.innerHTML = `
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">ĐÁP ÁN & CỐT LÕI</span>
            <button class="mark-mastered-btn p-1 px-2 text-[10px] rounded bg-emerald-500 hover:bg-emerald-600 font-bold text-white transition-all" data-index="${bIndex}">
              ${beam.mastered ? '✓ Đã thuộc' : '+ Đánh dấu thuộc'}
            </button>
          </div>
          <div class="mt-3 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-xs leading-relaxed max-h-36 overflow-y-auto">
            <p>${beam.backAnswer.replace(/\n/g, '<br>')}</p>
          </div>
          ${beam.actionPrompt ? `<p class="text-[11px] text-indigo-200 mt-2 italic">🎯 ${beam.actionPrompt}</p>` : ''}
        </div>
        <div class="flex items-center justify-between text-[11px] text-indigo-200 pt-2 border-t border-white/10">
          <span>Bấm để quay lại mặt trước</span>
          <i class="fa-solid fa-rotate text-xs"></i>
        </div>
      `;

      inner.appendChild(front);
      inner.appendChild(back);
      cardContainer.appendChild(inner);

      // Card flip on click
      inner.addEventListener('click', (e) => {
        // Prevent flip if clicking TTS or Mastered button
        if (e.target.closest('.tts-beam-btn') || e.target.closest('.mark-mastered-btn')) return;
        inner.classList.toggle('is-flipped');
      });

      dom.beamCardsGrid.appendChild(cardContainer);
    });

    // TTS Listeners
    dom.beamCardsGrid.querySelectorAll('.tts-beam-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'));
        speakBeam(state.beamData[idx]);
      });
    });

    // Mastered Listeners
    dom.beamCardsGrid.querySelectorAll('.mark-mastered-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-index'));
        state.beamData[idx].mastered = !state.beamData[idx].mastered;
        btn.textContent = state.beamData[idx].mastered ? '✓ Đã thuộc' : '+ Đánh dấu thuộc';
        updateBeamMasteryUI();
      });
    });

    // Render KaTeX cho thẻ Beams
    setTimeout(() => {
      renderAllMath(dom.beamCardsGrid);
    }, 50);
  }

  function updateBeamMasteryUI() {
    const total = state.beamData.length;
    const masteredCount = state.beamData.filter(b => b.mastered).length;
    const pct = total > 0 ? (masteredCount / total) * 100 : 0;
    
    dom.beamMasteryCount.textContent = `${masteredCount}/${total}`;
    dom.beamMasteryBar.style.width = `${pct}%`;
  }

  // ================= CHUẨN HÓA & PHÁT ÂM TIẾNG VIỆT TỰ NHIÊN =================
  let activeSpeechAudio = null;
  let isSpeaking = false;

  function cleanVietnameseForSpeech(text) {
    if (!text) return '';
    let s = text;

    // 1. Loại bỏ các block code, cú pháp markdown, thẻ HTML, tên file & đuôi mở rộng file
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/<[^>]+>/g, ' ');
    s = s.replace(/`[^`]+`/g, ' ');
    s = s.replace(/\b[a-zA-Z0-9_\-]+\.(docx|pdf|png|jpg|jpeg|txt|pptx|xlsx)\b/gi, ' ');
    s = s.replace(/\b(tên file|tập tin|file name|document):\s*/gi, ' ');

    // 2. LOẠI BỎ TRIỆT ĐỂ TẤT CẢ EMOJI & BIỂU TƯỢNG UNICODE (tránh việc TTS đọc "biểu tượng bóng đèn", "tia chớp"...)
    s = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{FE00}-\u{FE0F}]/gu, ' ');

    // 3. Loại bỏ ký hiệu đầu dòng (bullet points) để tuyệt đối không bị đọc thành "trừ", "chấm", "gạch", "sao"
    s = s.replace(/(^|\n|\.\s*)[-–—•*+◦▪▫►▶✓✔✕✖★☆]\s+/g, '$1 ');
    s = s.replace(/[-–—•◦▪▫►▶✓✔✕✖★☆]/g, ' ');

    // 4. Chuẩn hóa tên môn học & cấp học THCS
    s = s.replace(/Toán\s*9/gi, 'Toán chín');
    s = s.replace(/Toán\s*8/gi, 'Toán tám');
    s = s.replace(/Toán\s*7/gi, 'Toán bảy');
    s = s.replace(/Toán\s*6/gi, 'Toán sáu');
    s = s.replace(/KHTN\s*9/gi, 'Khoa học tự nhiên chín');
    s = s.replace(/KHTN\s*8/gi, 'Khoa học tự nhiên tám');
    s = s.replace(/KHTN\s*7/gi, 'Khoa học tự nhiên bảy');
    s = s.replace(/KHTN\s*6/gi, 'Khoa học tự nhiên sáu');
    s = s.replace(/\bTHCS\b/gi, 'Trung học cơ sở');

    // 5. XỬ LÝ CÔNG THỨC TOÁN HỌC & KHOA HỌC TỰ NHIÊN THCS THÀNH LỜI ĐỌC TỰ NHIÊN
    // Hệ phương trình: \begin{cases} ... \end{cases}
    s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/gi, (m, content) => {
      const equations = content.split(/\\\\/).map(eq => eq.trim()).filter(Boolean);
      return ' Hệ phương trình gồm: ' + equations.join('; và ') + '. ';
    });

    s = s.replace(/\\Delta'/g, ' Đen-ta phẩy ');
    s = s.replace(/\\Delta/g, ' Đen-ta ');
    s = s.replace(/Δ'/g, ' Đen-ta phẩy ');
    s = s.replace(/Δ/g, ' Đen-ta ');

    // Ký hiệu góc hình học: \widehat{ABC}, \angle ABC, ^\circ
    s = s.replace(/\\widehat\{([a-zA-Z0-9]+)\}/g, ' góc $1 ');
    s = s.replace(/\\angle\s*([a-zA-Z0-9]+)/g, ' góc $1 ');
    s = s.replace(/(\d+)\^\\circ|(\d+)\s*°/g, '$1 độ');
    s = s.replace(/\^\\circ|°/g, ' độ ');

    // Tam giác: \triangle ABC
    s = s.replace(/\\triangle\s*([a-zA-Z0-9]+)/g, ' tam giác $1 ');

    // Quan hệ hình học: vuông góc, song song, đồng dạng
    s = s.replace(/\\perp|\\bot/g, ' vuông góc với ');
    s = s.replace(/\\parallel|\\\/\\\//g, ' song song với ');
    s = s.replace(/\\sim\b/g, ' đồng dạng với ');

    // Ký hiệu tập hợp: \in, \notin, \subset, \cup, \cap, \emptyset
    s = s.replace(/\\notin/g, ' không thuộc ');
    s = s.replace(/\\in\b/g, ' thuộc ');
    s = s.replace(/\\subset/g, ' là tập con của ');
    s = s.replace(/\\cup/g, ' hợp ');
    s = s.replace(/\\cap/g, ' giao ');
    s = s.replace(/\\emptyset|\\empty/g, ' tập rỗng ');

    // Trị tuyệt đối: |x|
    s = s.replace(/\|([a-zA-Z0-9\+\-\s]+)\|/g, ' giá trị tuyệt đối của $1 ');

    // Số Pi: \pi, π
    s = s.replace(/\\pi\b|π/g, ' pi ');

    // Phân số: \frac{a}{b} -> a trên b
    s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, ' $1 trên $2 ');

    // Căn bậc hai: \sqrt{a} -> căn bậc hai của a
    s = s.replace(/\\sqrt\{([^}]+)\}/g, ' căn bậc hai của $1 ');
    s = s.replace(/\\sqrt\s*([a-zA-Z0-9]+)/g, ' căn bậc hai của $1 ');
    s = s.replace(/√([a-zA-Z0-9]+)/g, ' căn bậc hai của $1 ');

    // Dấu cộng trừ: \pm, ±
    s = s.replace(/\\pm|±/g, ' cộng trừ ');

    // Lũy thừa: x^2 -> x bình phương; x^3 -> x mũ ba
    s = s.replace(/([a-zA-Z0-9\(\)]+)\^2\b/g, ' $1 bình phương ');
    s = s.replace(/([a-zA-Z0-9\(\)]+)\^3\b/g, ' $1 mũ ba ');
    s = s.replace(/([a-zA-Z0-9\(\)]+)\^\{?([0-9a-zA-Z]+)\}?/g, ' $1 mũ $2 ');

    // Chỉ số dưới (Subscript): x_1, x_2
    s = s.replace(/x_\{?1,2\}?/gi, ' x một, hai ');
    s = s.replace(/x_\{?1\}?/gi, ' x một ');
    s = s.replace(/x_\{?2\}?/gi, ' x hai ');
    s = s.replace(/_\{?([0-9a-zA-Z]+)\}?/g, ' $1 ');

    // Quan hệ & Toán tử so sánh
    s = s.replace(/\\neq|≠/g, ' khác ');
    s = s.replace(/\\ge(q)?|≥/g, ' lớn hơn hoặc bằng ');
    s = s.replace(/\\le(q)?|≤/g, ' nhỏ hơn hoặc bằng ');
    s = s.replace(/\\approx|≈/g, ' xấp xỉ ');
    s = s.replace(/\\Leftrightarrow|⇔/g, ' tương đương ');
    s = s.replace(/\\Rightarrow|⇒/g, ' suy ra ');
    s = s.replace(/\\cdot|\\times/g, ' nhân ');

    // Đơn vị khoa học KHTN
    s = s.replace(/1\s*kWh/gi, ' một ki-lô-oát giờ ');
    s = s.replace(/kWh/gi, ' ki-lô-oát giờ ');
    s = s.replace(/(\d+)\s*kW\b/gi, '$1 ki-lô-oát');
    s = s.replace(/(\d+)\s*Ω|(\d+)\s*Ôm/gi, '$1 Ôm');
    s = s.replace(/\\Omega|Ω/g, ' Ôm ');
    s = s.replace(/(\d+)\s*V\b/g, '$1 Vôn');
    s = s.replace(/(\d+)\s*A\b/g, '$1 Am-pe');
    s = s.replace(/(\d+)\s*W\b/g, '$1 Oát');
    s = s.replace(/(\d+)\s*J\b/g, '$1 Jun');

    // Ký hiệu phép tính số học giữa các đại lượng
    s = s.replace(/(\d+|[a-zA-Z\)])\s*\+\s*(\d+|[a-zA-Z\(])/g, '$1 cộng $2');
    s = s.replace(/(\d+|[a-zA-Z\)])\s*-\s*(\d+|[a-zA-Z\(])/g, '$1 trừ $2');
    s = s.replace(/(\d+|[a-zA-Z\)])\s*=\s*(\d+|[a-zA-Z\(])/g, '$1 bằng $2');

    // 6. LOẠI BỎ TOÀN BỘ KÝ TỰ ĐẶC BIỆT CÒN LẠI ĐỂ CHỈ ĐỌC NỘI DUNG VĂN BẢN THUẦN TÚY:
    // - Dấu ngoặc đơn, ngoặc vuông, ngoặc nhọn: thay bằng dấu phẩy để giọng đọc ngắt câu tự nhiên thay vì phát âm "mở ngoặc", "đóng ngoặc"
    s = s.replace(/[\(\)\[\]\{\}]/g, ', ');
    // - Dấu gạch chéo /, \: thay bằng khoảng trắng
    s = s.replace(/[\/\\]/g, ' ');
    // - Các ký tự Markdown & đặc biệt: #, *, _, ~, >, |, @, $, ^, &, %, +, =, <, >
    s = s.replace(/[%]/g, ' phần trăm ');
    s = s.replace(/[&]/g, ' và ');
    s = s.replace(/[#*_`~>|@$^+=<>]/g, ' ');
    // - Dấu ngoặc kép, nháy đơn
    s = s.replace(/["'“”‘’«»]/g, ' ');
    // - Dấu chấm lửng ...
    s = s.replace(/\.{2,}/g, '. ');

    // 7. Làm sạch các dấu phẩy, chấm lặp và khoảng trắng dư thừa
    s = s.replace(/,\s*,+/g, ',');
    s = s.replace(/\.\s*\.+/g, '.');
    s = s.replace(/,\s*\./g, '.');
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  }

  // ================= BỘ GIỌNG ĐỌC AI TỰ NHIÊN & TRUYỀN CẢM =================
  let cachedVoices = [];
  function refreshVoices() {
    if ('speechSynthesis' in window) {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    }
  }
  if ('speechSynthesis' in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  // Thuật toán chọn giọng AI truyền cảm và tự nhiên nhất (Ưu tiên Hoài My, Nam Minh, Google Natural)
  function getBestVoice(langType) {
    refreshVoices();
    if (!cachedVoices || cachedVoices.length === 0) return null;

    if (langType === 'vi') {
      // 1. Giọng nữ ngọt ngào Hoài My (Microsoft Neural / Natural trên Edge/Windows)
      let match = cachedVoices.find(v => (v.name.includes('HoaiMy') || v.name.includes('Hoài My')) && (v.lang.startsWith('vi') || v.lang.includes('VN')));
      if (match) return match;

      // 2. Giọng Apple Linh bản địa trên iPhone / iPad / macOS
      match = cachedVoices.find(v => (v.name.includes('Linh') || v.name.toLowerCase().includes('vietnamese')) && (v.lang || '').startsWith('vi'));
      if (match) return match;

      // 3. Giọng nam ấm áp Nam Minh (Microsoft Neural / Natural)
      match = cachedVoices.find(v => (v.name.includes('NamMinh') || v.name.includes('Nam Minh')) && (v.lang.startsWith('vi') || v.lang.includes('VN')));
      if (match) return match;

      // 4. Giọng Google Tiếng Việt (Chrome nếu có)
      match = cachedVoices.find(v => v.name.toLowerCase().includes('google') && (v.lang.startsWith('vi') || v.name.toLowerCase().includes('tiếng việt')));
      if (match) return match;

      // 5. Bất kỳ giọng nào có mã ngôn ngữ vi-VN hoặc vi
      match = cachedVoices.find(v => (v.lang || '').toLowerCase().startsWith('vi'));
      if (match) return match;

      // NẾU KHÔNG CÓ GIỌNG TIẾNG VIỆT THỰC SỰ: TRẢ VỀ NULL ĐỂ DÙNG GIỌNG CHỊ GOOGLE ONLINE CHUẨN 100%
      // TUYỆT ĐỐI KHÔNG DÙNG GIỌNG TIẾNG ANH (NHƯ MICROSOFT DAVID) ĐỂ ĐỌC TIẾNG VIỆT
      return null;

    } else {
      // Giọng tiếng Anh bản ngữ chuẩn Mỹ: Jenny, Aria, Guy, Google US English
      let match = cachedVoices.find(v => (v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Guy')) && (v.name.includes('Natural') || v.name.includes('Neural')));
      if (match) return match;

      match = cachedVoices.find(v => v.name.toLowerCase().includes('google') && v.lang.toLowerCase().startsWith('en'));
      if (match) return match;

      return cachedVoices.find(v => v.lang.toLowerCase() === 'en-us') || cachedVoices.find(v => v.lang.toLowerCase().startsWith('en')) || null;
    }
  }

  let activeSpeechUtterance = null;
  let activeSpeechUtterances = []; // Giữ tham chiếu toàn cục chống V8 Garbage Collection giữa chừng
  let speechKeepAliveInterval = null;
  let isReadingAllBeams = false; // Trạng thái đọc chuỗi toàn bộ thẻ học tập Flashcards

  function stopAllSpeech() {
    isSpeaking = false;
    isReadingAllBeams = false;
    if (speechKeepAliveInterval) {
      clearInterval(speechKeepAliveInterval);
      speechKeepAliveInterval = null;
    }
    if (activeSpeechAudio) {
      try {
        activeSpeechAudio.pause();
        activeSpeechAudio.currentTime = 0;
      } catch (e) {}
      activeSpeechAudio = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    activeSpeechUtterance = null;
    activeSpeechUtterances = [];

    if (dom.btnStopTts) dom.btnStopTts.classList.add('hidden');
    if (dom.btnStopTtsSummary) dom.btnStopTtsSummary.classList.add('hidden');

    // Khôi phục nút Nghe đọc tóm tắt
    if (dom.btnTtsSummary) {
      dom.btnTtsSummary.classList.remove('bg-indigo-600', 'text-white');
      dom.btnTtsSummary.classList.add('bg-indigo-50', 'text-indigo-700');
      const ic = dom.btnTtsSummary.querySelector('i');
      if (ic) ic.className = 'fa-solid fa-volume-high text-indigo-600';
    }

    // Khôi phục nút Nghe đọc toàn bộ thẻ học tập
    if (dom.btnToggleTts) {
      dom.btnToggleTts.classList.remove('bg-indigo-600', 'text-white');
      dom.btnToggleTts.classList.add('bg-white', 'text-slate-700');
      const ic = dom.btnToggleTts.querySelector('i');
      if (ic) ic.className = 'fa-solid fa-volume-high text-indigo-600';
      const span = dom.btnToggleTts.querySelector('span');
      if (span) span.textContent = 'Nghe đọc toàn bộ';
    }
  }

  // MẶC ĐỊNH LUÔN LÀ TIẾNG VIỆT (Nền tảng học tập THCS Việt Nam).
  // Chỉ chuyển sang tiếng Anh khi bài học/nội dung HOÀN TOÀN là câu tiếng Anh (không có bất kỳ dấu tiếng Việt nào).
  function isTextEnglish(text) {
    if (!text) return false;

    // 1. Nếu có BẤT KỲ ký tự tiếng Việt có dấu nào -> 100% là Tiếng Việt!
    const hasViDiacritics = /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/.test(text);
    if (hasViDiacritics) {
      return false;
    }

    // 2. Nếu có các từ tiếng Việt không dấu phổ biến trong học tập -> 100% là Tiếng Việt!
    const viKeywords = /\b(bai|hoc|tom|tat|de|thi|cau|hoi|dap|an|giai|thich|diem|cot|loi|khai|niem|thuat|ngu|meo|nho|cong|thuc|phuong|trinh|toan|khtn|thcs|lop|nghiem|he|so|khoa|sinh|su|dia|van)\b/i;
    if (viKeywords.test(text)) {
      return false;
    }

    // 3. Chỉ nhận diện là Tiếng Anh khi nội dung chứa các cấu trúc câu Tiếng Anh đặc trưng
    const enPatterns = /\b(the|this is|that is|these are|those are|which of the|where is|what is|how to|listen and|choose the|correct answer|fill in the|following passage)\b/i;
    return enPatterns.test(text);
  }

  function cleanEnglishForSpeech(text) {
    if (!text) return '';
    let s = text;
    s = s.replace(/```[\s\S]*?```/g, '');
    s = s.replace(/<[^>]+>/g, ' ');
    s = s.replace(/`[^`]+`/g, ' ');
    s = s.replace(/\b[a-zA-Z0-9_\-]+\.(docx|pdf|png|jpg|jpeg|txt|pptx|xlsx)\b/gi, ' ');
    s = s.replace(/\b(file name|document):\s*/gi, ' ');

    // Loại bỏ emoji & symbols
    s = s.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{FE00}-\u{FE0F}]/gu, ' ');

    // Loại bỏ bullets
    s = s.replace(/(^|\n|\.\s*)[-–—•*+◦▪▫►▶✓✔✕✖★☆]\s+/g, '$1 ');
    s = s.replace(/[-–—•◦▪▫►▶✓✔✕✖★☆]/g, ' ');

    s = s.replace(/\bQ(\d+)\b/gi, 'Question $1');
    s = s.replace(/\bQuestion\s*(\d+)[\.:]/gi, 'Question $1. ');
    s = s.replace(/\bA\.\s*/g, 'Option A: ');
    s = s.replace(/\bB\.\s*/g, 'Option B: ');
    s = s.replace(/\bC\.\s*/g, 'Option C: ');
    s = s.replace(/\bD\.\s*/g, 'Option D: ');
    s = s.replace(/\bvs\.\b/gi, 'versus');
    s = s.replace(/%/g, ' percent ');
    s = s.replace(/&/g, ' and ');

    s = s.replace(/[\(\)\[\]\{\}]/g, ', ');
    s = s.replace(/[\/\\]/g, ' ');
    s = s.replace(/[#*_`~>|@$^+=<>]/g, ' ');
    s = s.replace(/["'“”‘’«»]/g, ' ');
    s = s.replace(/\.{2,}/g, '. ');

    s = s.replace(/,\s*,+/g, ',');
    s = s.replace(/\s+/g, ' ');
    return s.trim();
  }

  // Quản lý phong cách & tốc độ giọng đọc (Chống buồn ngủ, tăng cường sự tươi vui & tập trung)
  state.ttsSpeed = 1.16;
  state.voiceModeIndex = 0;
  const voiceModes = [
    { label: 'Hoạt bát (1.16x)', speed: 1.16, pitch: 1.06, desc: 'Tươi vui, hoạt bát, không buồn ngủ' },
    { label: 'Cấp tốc (1.28x)', speed: 1.28, pitch: 1.08, desc: 'Nhanh nhẹn, ôn bài cấp tốc' },
    { label: 'Tiêu chuẩn (1.05x)', speed: 1.05, pitch: 1.02, desc: 'Chuẩn mực, rõ ràng từng chữ' }
  ];

  function cycleVoiceMode() {
    state.voiceModeIndex = (state.voiceModeIndex + 1) % voiceModes.length;
    const mode = voiceModes[state.voiceModeIndex];
    state.ttsSpeed = mode.speed;

    const lbl1 = document.getElementById('voice-speed-label');
    const lbl2 = document.getElementById('voice-speed-label-tab4');
    if (lbl1) lbl1.textContent = mode.label;
    if (lbl2) lbl2.textContent = mode.label;

    showToast(`🎙️ Đã đổi phong cách giọng: ${mode.label} (${mode.desc})`, 'success');
  }

  // Khởi tạo và mở khóa âm thanh trên điện thoại ngay từ lần chạm đầu tiên
  function unlockMobileAudio() {
    // Trên Android mở khóa bằng utterance câm, trên iOS WebKit tránh phát utterance rỗng làm nghẽn hàng đợi
    if (!isIos && 'speechSynthesis' in window && !window._speechUnlocked) {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        u.rate = 10;
        window.speechSynthesis.speak(u);
        window._speechUnlocked = true;
      } catch (e) {}
    }
    if (!window._audioContextUnlocked) {
      try {
        const a = new Audio();
        a.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        a.volume = 0;
        a.play().then(() => { window._audioContextUnlocked = true; }).catch(() => {});
      } catch (e) {}
    }
  }
  document.addEventListener('touchstart', unlockMobileAudio, { passive: true });
  document.addEventListener('click', unlockMobileAudio, { passive: true });

  // Tách văn bản thành các câu tự nhiên, tránh lỗi Lookbehind trên thiết bị di động
  function splitTextIntoSpeechSentences(text) {
    if (!text) return [];
    // Tách theo các dấu kết thúc câu hoặc xuống dòng
    const rawTokens = text.split(/[\r\n]+|[.?!;]+[\s]+/);
    const result = [];

    rawTokens.forEach(token => {
      let s = token.trim();
      s = s.replace(/^[,\.\s]+|[,\.\s]+$/g, '').trim();
      if (!s) return;

      // Độ dài tối ưu cho mỗi lần phát âm: 40 - 160 ký tự
      if (s.length <= 160) {
        result.push(s);
      } else {
        // Tách câu quá dài theo dấu phẩy hoặc liên từ để giọng đọc mượt mà
        const sub = s.split(/,\s+|\s+và\s+|\s+hoặc\s+/);
        let buf = '';
        sub.forEach(part => {
          const p = part.trim();
          if (!p) return;
          if ((buf + ', ' + p).length > 140) {
            if (buf.trim()) result.push(buf.trim());
            buf = p;
          } else {
            buf = buf ? (buf + ', ' + p) : p;
          }
        });
        if (buf.trim()) result.push(buf.trim());
      }
    });

    return result.length > 0 ? result : [text.trim()];
  }

  // Phát âm trực tuyến (hỗ trợ qua Proxy /api/tts để chống chặn Referer trên Vercel)
  function playOnlineAudioStream(chunks, lang = 'vi', onDone = null, isSequence = false) {
    if (!chunks || chunks.length === 0) {
      if (!isSequence) stopAllSpeech();
      if (onDone) onDone();
      return;
    }

    let index = 0;
    const audio = activeSpeechAudio || new Audio();
    activeSpeechAudio = audio;

    function playNextAudio() {
      if (!isSpeaking || index >= chunks.length) {
        if (!isSequence) stopAllSpeech();
        if (onDone) onDone();
        return;
      }

      const chunk = chunks[index++];
      const cleanChunk = chunk.replace(/[,\.;:!\?]+$/, '').trim();
      if (!cleanChunk) {
        playNextAudio();
        return;
      }

      const proxyUrl = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(cleanChunk)}`;
      audio.src = proxyUrl;
      audio.playbackRate = state.ttsSpeed || 1.15;

      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        if (isSpeaking) setTimeout(playNextAudio, 70);
      };

      audio.onended = advance;
      audio.onerror = (e) => {
        console.warn('Audio stream error on chunk, skipping:', cleanChunk, e);
        advance();
      };

      audio.play().catch(err => {
        console.warn('Audio play failed, skipping to next chunk:', err);
        advance();
      });
    }

    playNextAudio();
  }

  // Phát âm bằng Web Speech API (Hỗ trợ Watchdog Timer chống nuốt onend và chống V8 GC)
  function speakWithWebSpeech(chunks, voice, langCode, rate, pitch, onDone, isSequence = false) {
    if (!chunks || chunks.length === 0) {
      if (!isSequence) stopAllSpeech();
      if (onDone) onDone();
      return;
    }

    if (!('speechSynthesis' in window)) {
      playOnlineAudioStream(chunks, langCode.startsWith('en') ? 'en' : 'vi', onDone, isSequence);
      return;
    }

    // Đảm bảo speech synth không bị treo ở trạng thái pause
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}

    let chunkIndex = 0;
    let watchdogTimer = null;

    // Giữ nhịp thở cho Chromium (Tránh tự ngắt sau 14s). KHÔNG gọi pause() trên iOS Safari vì WebKit sẽ ngắt hẳn tiếng!
    if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
    speechKeepAliveInterval = setInterval(() => {
      if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
        try {
          if (!isIos) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          }
        } catch (e) {}
      }
    }, 3500);

    function playChunk() {
      if (watchdogTimer) {
        clearTimeout(watchdogTimer);
        watchdogTimer = null;
      }

      if (!isSpeaking || chunkIndex >= chunks.length) {
        if (!isSequence) {
          stopAllSpeech();
        }
        if (onDone) onDone();
        return;
      }

      const textChunk = chunks[chunkIndex++].trim();
      if (!textChunk) {
        playChunk();
        return;
      }

      try {
        const utterance = new SpeechSynthesisUtterance(textChunk);
        if (voice) utterance.voice = voice;
        utterance.lang = langCode || 'vi-VN';
        utterance.rate = rate || 1.15;
        utterance.pitch = pitch || 1.0;

        // Lưu vào mảng toàn cục để V8 Engine không Garbage Collect giữa chừng
        activeSpeechUtterances.push(utterance);
        if (activeSpeechUtterances.length > 8) {
          activeSpeechUtterances.shift();
        }

        let hasAdvanced = false;
        const advance = () => {
          if (hasAdvanced) return;
          hasAdvanced = true;
          if (watchdogTimer) {
            clearTimeout(watchdogTimer);
            watchdogTimer = null;
          }
          if (isSpeaking) {
            setTimeout(playChunk, 70);
          }
        };

        utterance.onend = () => {
          advance();
        };

        utterance.onerror = (e) => {
          console.warn('[SmartEdu TTS] Utterance error, advancing chunk:', e);
          advance();
        };

        // BẢO VỆ TUYỆT ĐỐI (WATCHDOG TIMER):
        // Trên Chrome Android, sự kiện onend hay bị nuốt chửng sau câu đầu tiên.
        // Bộ đếm thời gian này sẽ tự động chuyển sang câu tiếp theo nếu sau thời gian dự kiến onend không kích hoạt!
        const estimatedDurationMs = Math.max(2200, Math.round((textChunk.length * 115) / (rate || 1.15)) + 1800);
        watchdogTimer = setTimeout(() => {
          if (isSpeaking && !hasAdvanced) {
            console.warn('[SmartEdu TTS] Watchdog force advance chunk:', textChunk.slice(0, 25));
            advance();
          }
        }, estimatedDurationMs);

        // Kích hoạt phát âm
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);

      } catch (err) {
        console.warn('[SmartEdu TTS] Speak catch error:', err);
        playChunk();
      }
    }

    // Độ trễ 50ms để lệnh cancel() trước đó hoàn tất giải phóng bộ nhớ audio
    setTimeout(playChunk, 50);
  }

  // Phát âm thông minh: MẶC ĐỊNH LÀ TIẾNG VIỆT, chỉ đọc tiếng Anh khi thực sự là văn bản tiếng Anh
  function playSmartSpeech(title, content, onDone = null, isSequence = false) {
    if (!isSequence) {
      stopAllSpeech();
    }
    isSpeaking = true;

    if (dom.btnStopTts) dom.btnStopTts.classList.remove('hidden');
    if (dom.btnStopTtsSummary) dom.btnStopTtsSummary.classList.remove('hidden');

    // Tuyệt đối không đọc tên file hay tiêu đề tài liệu, chỉ đọc thẳng vào nội dung cốt lõi
    const rawText = content ? content.trim() : (title || '');
    const isEn = isTextEnglish(rawText);
    const lang = isEn ? 'en' : 'vi';

    const cleanedText = isEn ? cleanEnglishForSpeech(rawText) : cleanVietnameseForSpeech(rawText);
    const voice = getBestVoice(lang);
    const chunks = splitTextIntoSpeechSentences(cleanedText);

    const activeMode = voiceModes[state.voiceModeIndex] || voiceModes[0];

    // TRƯỜNG HỢP 1: BÀI TIẾNG VIỆT (MẶC ĐỊNH)
    if (!isEn) {
      // Ưu tiên 1: Web Speech API nếu thiết bị có sẵn giọng Tiếng Việt
      if (voice) {
        const voiceName = voice.name.replace(/Microsoft |Google /g, '').split(' - ')[0];
        if (!isSequence) showToast(`🔊 Đang đọc [${voiceName} - ${activeMode.label}]: "${title.slice(0, 30)}..."`, 'info');
        speakWithWebSpeech(chunks, voice, 'vi-VN', activeMode.speed, activeMode.pitch, onDone, isSequence);
      } else if ('speechSynthesis' in window && (/Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent))) {
        // Trên điện thoại (Android / iOS): Luôn có giọng hệ thống Tiếng Việt chuẩn
        if (!isSequence) showToast(`🔊 Đang đọc [Giọng Việt - ${activeMode.label}]: "${title.slice(0, 30)}..."`, 'info');
        speakWithWebSpeech(chunks, null, 'vi-VN', activeMode.speed, activeMode.pitch, onDone, isSequence);
      } else {
        // Trên máy tính hoặc thiết bị không có giọng Việt: dùng audio stream qua /api/tts
        if (!isSequence) showToast(`🔊 Đang đọc [Chị Google - ${activeMode.label}]: "${title.slice(0, 30)}..."`, 'info');
        playOnlineAudioStream(chunks, 'vi', onDone, isSequence);
      }
      return;
    }

    // TRƯỜNG HỢP 2: BÀI TIẾNG ANH (Thuần tiếng Anh không có dấu)
    if (!isSequence) showToast(`🔊 Đang đọc Tiếng Anh bản ngữ: "${title.slice(0, 30)}..."`, 'info');
    if (voice) {
      speakWithWebSpeech(chunks, voice, 'en-US', activeMode.speed, 1.0, onDone, isSequence);
    } else {
      speakWithWebSpeech(chunks, null, 'en-US', activeMode.speed, 1.0, () => {
        playOnlineAudioStream(chunks, 'en', onDone, isSequence);
      }, isSequence);
    }
  }

  const playVietnameseText = playSmartSpeech; // Alias tương thích ngược

  // Phát âm một Beam cụ thể (Tự động chuyển ngữ Tiếng Anh / Tiếng Việt)
  function speakBeam(beam) {
    if (isSpeaking) {
      stopAllSpeech();
      showToast('Đã dừng phát âm thẻ.', 'info');
      return;
    }
    const isEn = isTextEnglish((beam.title || '') + ' ' + (beam.frontQuestion || '') + ' ' + (beam.backAnswer || ''));
    const title = beam.title || (isEn ? 'Knowledge Card' : 'Thẻ kiến thức');
    const content = isEn
      ? `Question: ${beam.frontQuestion}. Answer: ${beam.backAnswer}. ${beam.takeaway ? 'Key takeaway: ' + beam.takeaway : ''}`
      : `Câu hỏi: ${beam.frontQuestion}. Lời giải: ${beam.backAnswer}. ${beam.takeaway ? 'Ghi nhớ ba mươi giây: ' + beam.takeaway : ''}`;
    playSmartSpeech(title, content);
  }

  // Focus Mode Carousel for Beams
  function openFocusMode(startIndex = 0) {
    if (state.beamData.length === 0) return;
    state.focusBeamIndex = startIndex;
    dom.beamFocusModal.classList.remove('hidden');
    updateFocusModalCard();
  }

  function updateFocusModalCard() {
    const b = state.beamData[state.focusBeamIndex];
    if (!b) return;

    dom.focusCounter.textContent = `Thẻ ${state.focusBeamIndex + 1} / ${state.beamData.length}`;
    dom.focusBadge.textContent = b.badge || `THẺ #${state.focusBeamIndex + 1}`;
    dom.focusTitle.textContent = b.title;
    dom.focusQuestion.textContent = b.frontQuestion;
    dom.focusAnswer.innerHTML = b.backAnswer.replace(/\n/g, '<br>');
    dom.focusAction.textContent = b.actionPrompt ? `🎯 ${b.actionPrompt}` : '';
    
    // Reset flip
    dom.focusFlipInner.classList.remove('is-flipped');

    // Render KaTeX cho thẻ Focus Mode
    setTimeout(() => {
      renderAllMath(dom.beamFocusModal);
    }, 50);
  }

  async function generateBeamsWithAi() {
    if (!state.currentDoc.text && !state.currentDoc.imageBase64 && (!state.currentDoc.images || state.currentDoc.images.length === 0)) {
      showToast('Vui lòng tải lên tài liệu học tập trước!', 'warning');
      return;
    }

    const prompt = `Bạn là một chuyên gia thiết kế trải nghiệm học tập vi mô (Micro-learning & Flashcards) dành riêng cho HỌC SINH CẤP 2 (THCS).
Hãy chia nhỏ toàn bộ nội dung bài học cấp 2 sau đây thành 5 đến 7 "Thẻ học tập" (Flashcards kiến thức then chốt).
Mỗi Thẻ học tập gồm thẻ lật Flashcard 3D: Mặt trước là câu hỏi kích thích tư duy / tình huống thực tế đời sống, Mặt sau là câu trả lời cô đọng và điểm cốt lõi trong 30 giây dễ nhớ với học sinh cấp 2.

QUAN TRỌNG VỀ CÔNG THỨC TOÁN & KHOA HỌC: Bắt buộc viết các công thức toán, lý, hóa dưới dạng LaTeX kẹp giữa dấu $ (ví dụ: $ax^2 + bx + c = 0$, $\\Delta = b^2 - 4ac$, $I = \\frac{U}{R}$, $P = U \\cdot I$, $Q = I^2 R t$, $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$).
ĐẶC BIỆT LƯU Ý HÌNH VẼ & SƠ ĐỒ MINH HỌA: Nếu bài học có hình vẽ hình học, sơ đồ mạch điện, thí nghiệm hóa học hoặc đồ thị, hãy tạo ít nhất 1 thẻ học tập xoay quanh cách đọc và vận dụng dữ kiện từ hình vẽ đó.
Trả về mảng JSON thuần túy theo cấu trúc:
[
  {
    "id": 1,
    "badge": "Thẻ 01 • Chủ đề nhỏ",
    "title": "Tiêu đề ngắn gọn của thẻ học tập",
    "takeaway": "Điểm cốt lõi cần nhớ trong 30 giây...",
    "frontQuestion": "Câu hỏi / Vấn đề ở mặt trước thẻ...",
    "backAnswer": "Lời giải thích cặn kẽ và trọng tâm ở mặt sau thẻ...",
    "actionPrompt": "Thử thách nhanh hoặc cách ứng dụng thực tế...",
    "mastered": false
  }
]

NỘI DUNG BÀI HỌC CẤP 2:
${state.currentDoc.text}`;

    try {
      const imgToSend = getImagesToSend();
      const rawRes = await callGeminiWithRotation(prompt, imgToSend, {
        isJson: true,
        maxTokens: 1800,
        taskName: 'Đang tạo bộ Thẻ học tập Flashcards AI...'
      });
      const parsed = safeParseJson(rawRes);
      renderBeams(parsed);
      showToast('Đã tạo xong Bộ Thẻ học tập AI!', 'success');
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi tạo Thẻ học tập: ' + e.message, 'error');
    }
  }

  // ================= EVENT LISTENERS =================

  // Mode Toggle (File Upload vs Direct Text)
  dom.btnModeFile.addEventListener('click', () => {
    dom.btnModeFile.className = 'px-3 py-1.5 rounded-lg bg-white text-indigo-700 shadow-xs font-semibold flex items-center gap-1.5 transition-all';
    dom.btnModeText.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-all';
    dom.dropZoneContainer.classList.remove('hidden');
    dom.textInputContainer.classList.add('hidden');
  });

  dom.btnModeText.addEventListener('click', () => {
    dom.btnModeText.className = 'px-3 py-1.5 rounded-lg bg-white text-indigo-700 shadow-xs font-semibold flex items-center gap-1.5 transition-all';
    dom.btnModeFile.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-all';
    dom.textInputContainer.classList.remove('hidden');
    dom.dropZoneContainer.classList.add('hidden');
  });

  // Drag & Drop (Hỗ trợ kéo thả một hoặc nhiều file/ảnh cùng lúc)
  dom.dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dom.dropZone.classList.add('border-indigo-600', 'bg-indigo-50');
  });

  dom.dropZone.addEventListener('dragleave', () => {
    dom.dropZone.classList.remove('border-indigo-600', 'bg-indigo-50');
  });

  dom.dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dom.dropZone.classList.remove('border-indigo-600', 'bg-indigo-50');
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleUploadedFiles(e.dataTransfer.files);
    }
  });

  dom.dropZone.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleUploadedFiles(e.target.files);
    }
  });

  dom.cameraInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleUploadedFiles(e.target.files);
    }
  });

  if (dom.btnAddMoreFiles) {
    dom.btnAddMoreFiles.addEventListener('click', () => dom.fileInput.click());
  }
  if (dom.btnAddMoreCamera) {
    dom.btnAddMoreCamera.addEventListener('click', () => dom.cameraInput.click());
  }

  // Text Direct Apply
  dom.applyTextBtn.addEventListener('click', () => {
    const text = dom.rawTextInput.value.trim();
    if (!text) {
      showToast('Vui lòng nhập nội dung văn bản!', 'warning');
      return;
    }
    const title = text.slice(0, 40).split('\n')[0] || 'Văn bản ghi chú';
    setActiveDocument(title, text, 'text');
  });

  // OCR button
  dom.btnOcrImage.addEventListener('click', runOcrOnCurrentImage);

  // Clear Doc (Xóa toàn bộ tài liệu & ảnh đã nạp)
  dom.btnClearDoc.addEventListener('click', () => {
    state.uploadedFiles = [];
    refreshMultiDocumentsState();
    dom.rawTextInput.value = '';
    showToast('Đã xóa toàn bộ tài liệu đã nạp!', 'info');
  });

  // View / Edit Extracted Text
  dom.btnViewExtracted.addEventListener('click', () => {
    dom.extractedTextArea.value = state.currentDoc.text;
    dom.extractedWordCount.textContent = `${countWords(state.currentDoc.text)} từ`;
    dom.extractedTextModal.classList.remove('hidden');
  });

  // Nghe đọc thông minh: Ưu tiên Bản tóm tắt kiến thức AI hoặc Thẻ học tập theo yêu cầu học sinh
  if (dom.btnReadDoc) {
    dom.btnReadDoc.addEventListener('click', () => {
      if (isSpeaking) {
        stopAllSpeech();
        showToast('Đã dừng phát âm.', 'info');
        return;
      }

      const title = state.currentDoc.title || 'Tài liệu học tập';
      let textToRead = '';
      let readType = 'summary';

      // 1. Ưu tiên 1: Đọc theo Bản tóm tắt kiến thức cốt lõi AI
      if (state.summaryData && ((state.summaryData.coreTakeaways && state.summaryData.coreTakeaways.length > 0) || (state.summaryData.terms && state.summaryData.terms.length > 0))) {
        readType = 'summary';
        const takeaways = (state.summaryData.coreTakeaways || []).join('. ');
        const terms = (state.summaryData.terms || []).map(t => `${t.term}: ${t.definition}`).join('. ');
        const strategy = state.summaryData.studyStrategy ? 
          (state.summaryData.studyStrategy.feynmanTechnique ? `Mẹo ghi nhớ: ${state.summaryData.studyStrategy.feynmanTechnique}. ` : '') : '';
        textToRead = `Điểm trọng tâm: ${takeaways}. Thuật ngữ quan trọng: ${terms}. ${strategy}`;
      } 
      // 2. Ưu tiên 2: Nếu chưa có tóm tắt nhưng có Thẻ học tập (Flashcards) AI
      else if (state.beamData && state.beamData.length > 0) {
        readType = 'flashcards';
        textToRead = state.beamData.map((b, i) => 
          `Thẻ ${i + 1}: Câu hỏi: ${b.frontQuestion}. Trả lời: ${b.backAnswer}. ${b.takeaway ? 'Ghi nhớ nhanh: ' + b.takeaway : ''}`
        ).join('. ');
      } 
      // 3. Ưu tiên 3: Nếu chưa có tóm tắt hay thẻ học tập, đọc nội dung bài học
      else if (state.currentDoc.text && state.currentDoc.text.trim()) {
        readType = 'doc';
        textToRead = state.currentDoc.text.slice(0, 3000);
      } else {
        if (state.currentDoc.type === 'image') {
          showToast('Tài liệu là ảnh. Hãy bấm "Nhận diện OCR" trước để trích xuất văn bản trước khi nghe đọc!', 'warning');
        } else {
          showToast('Chưa có nội dung văn bản để nghe đọc!', 'warning');
        }
        return;
      }

      dom.btnReadDoc.classList.add('bg-indigo-600', 'text-white');
      dom.btnReadDoc.classList.remove('bg-indigo-50', 'text-indigo-700');
      const icon = dom.btnReadDoc.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-volume-high text-white animate-bounce';

      if (readType === 'summary') {
        showToast(`🔊 Đang nghe đọc: Bản tóm tắt cốt lõi bài "${title.slice(0, 30)}..."`, 'info');
      } else if (readType === 'flashcards') {
        showToast(`🔊 Đang nghe đọc: Bộ thẻ học tập bài "${title.slice(0, 30)}..."`, 'info');
      } else {
        showToast(`🔊 Đang nghe đọc nội dung bài "${title.slice(0, 30)}..."`, 'info');
      }

      playSmartSpeech(title, textToRead, () => {
        if (dom.btnReadDoc) {
          dom.btnReadDoc.classList.remove('bg-indigo-600', 'text-white');
          dom.btnReadDoc.classList.add('bg-indigo-50', 'text-indigo-700');
          const ic = dom.btnReadDoc.querySelector('i');
          if (ic) ic.className = 'fa-solid fa-volume-high text-indigo-600';
        }
      });
    });
  }

  dom.btnCloseExtractedModal.addEventListener('click', () => dom.extractedTextModal.classList.add('hidden'));
  dom.btnSaveExtractedText.addEventListener('click', () => {
    const newText = dom.extractedTextArea.value;
    state.currentDoc.text = newText;
    state.currentDoc.wordCount = countWords(newText);
    dom.docStats.textContent = `${state.currentDoc.wordCount} từ • Sẵn sàng phân tích`;
    dom.extractedTextModal.classList.add('hidden');
    showToast('Đã cập nhật nội dung văn bản!', 'success');
  });

  // Tab 1 Mindmap Controls
  dom.generateMindmapBtn.addEventListener('click', generateMindmapWithAi);
  
  dom.btnToggleEditor.addEventListener('click', () => {
    dom.mindmapEditorSidebar.classList.toggle('hidden');
    if (dom.mindmapEditorSidebar.classList.contains('hidden')) {
      dom.mindmapWrapper.className = 'lg:col-span-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col relative overflow-hidden transition-all';
    } else {
      dom.mindmapWrapper.className = 'lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex flex-col relative overflow-hidden transition-all';
    }
    if (state.markmapInstance) {
      setTimeout(() => state.markmapInstance.fit(), 200);
    }
  });

  dom.applyMarkdownBtn.addEventListener('click', () => {
    const md = dom.markdownInput.value.trim();
    if (md) {
      renderMindmap(md);
      showToast('Đã cập nhật sơ đồ từ mã Markdown!', 'success');
    }
  });

  dom.btnZoomIn.addEventListener('click', () => {
    if (state.markmapInstance) state.markmapInstance.rescale(1.25);
  });
  dom.btnZoomOut.addEventListener('click', () => {
    if (state.markmapInstance) state.markmapInstance.rescale(0.8);
  });
  dom.btnZoomFit.addEventListener('click', () => {
    if (state.markmapInstance) state.markmapInstance.fit();
  });

  // Chế độ phóng to toàn màn hình (PC & Điện thoại / Tablet)
  function toggleMindmapFullscreen(enable) {
    if (!dom.mindmapWrapper) return;
    const isCurrentlyActive = dom.mindmapWrapper.classList.contains('mindmap-fullscreen-active');
    const targetState = typeof enable === 'boolean' ? enable : !isCurrentlyActive;

    if (targetState) {
      dom.mindmapWrapper.classList.add('mindmap-fullscreen-active');
      // Kích hoạt Fullscreen API trình duyệt (hoạt động tốt trên PC và Android Chrome)
      try {
        if (dom.mindmapWrapper.requestFullscreen) {
          dom.mindmapWrapper.requestFullscreen().catch(() => {});
        } else if (dom.mindmapWrapper.webkitRequestFullscreen) {
          dom.mindmapWrapper.webkitRequestFullscreen().catch(() => {});
        }
      } catch (err) {
        // Fallback: CSS fixed overlay đã đảm bảo tràn viền 100vw x 100vh trên iOS Safari
      }
    } else {
      dom.mindmapWrapper.classList.remove('mindmap-fullscreen-active');
      try {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen().catch(() => {});
          }
        }
      } catch (err) {}
    }

    // Tự động căn chỉnh vừa vặn sơ đồ theo kích thước khung hình mới
    setTimeout(() => {
      if (state.markmapInstance) state.markmapInstance.fit();
    }, 100);
    setTimeout(() => {
      if (state.markmapInstance) state.markmapInstance.fit();
    }, 350);
  }

  if (dom.btnFullscreenMindmap) {
    dom.btnFullscreenMindmap.addEventListener('click', () => toggleMindmapFullscreen(true));
  }
  if (dom.btnExitFullscreen) {
    dom.btnExitFullscreen.addEventListener('click', () => toggleMindmapFullscreen(false));
  }
  if (dom.btnFsFit) {
    dom.btnFsFit.addEventListener('click', () => {
      if (state.markmapInstance) state.markmapInstance.fit();
    });
  }
  if (dom.btnFsZoomIn) {
    dom.btnFsZoomIn.addEventListener('click', () => {
      if (state.markmapInstance) state.markmapInstance.rescale(1.25);
    });
  }
  if (dom.btnFsZoomOut) {
    dom.btnFsZoomOut.addEventListener('click', () => {
      if (state.markmapInstance) state.markmapInstance.rescale(0.8);
    });
  }

  // Tự động đồng bộ khi người dùng bấm ESC hoặc phím điều hướng thoát fullscreen
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && dom.mindmapWrapper && dom.mindmapWrapper.classList.contains('mindmap-fullscreen-active')) {
      toggleMindmapFullscreen(false);
    }
  });
  document.addEventListener('webkitfullscreenchange', () => {
    if (!document.webkitFullscreenElement && dom.mindmapWrapper && dom.mindmapWrapper.classList.contains('mindmap-fullscreen-active')) {
      toggleMindmapFullscreen(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dom.mindmapWrapper && dom.mindmapWrapper.classList.contains('mindmap-fullscreen-active')) {
      toggleMindmapFullscreen(false);
    }
  });

  // Helper lấy Bounding Box chuẩn xác của sơ đồ tư duy (đa tầng bảo đảm không bao giờ lỗi)
  function getMindmapBoundingBox(svgEl) {
    const rootG = svgEl.querySelector('g');
    if (rootG) {
      try {
        const bbox = rootG.getBBox();
        if (bbox && bbox.width > 20 && bbox.height > 20) {
          return {
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height
          };
        }
      } catch (e) {
        console.warn('rootG.getBBox failed:', e);
      }
    }

    // Fallback: Quét tọa độ thực tế của tất cả các nhánh để tính khung chữ nhật bao quanh
    try {
      const nodes = svgEl.querySelectorAll('g.markmap-node');
      if (nodes && nodes.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
          const transform = node.getAttribute('transform') || '';
          const m = /translate\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(transform);
          if (m) {
            const nx = parseFloat(m[1]);
            const ny = parseFloat(m[2]);
            let nw = 160, nh = 35;
            try {
              const nb = node.getBBox();
              if (nb && nb.width > 0) { nw = nb.width; nh = nb.height; }
            } catch (e) {}
            minX = Math.min(minX, nx);
            minY = Math.min(minY, ny - nh);
            maxX = Math.max(maxX, nx + nw);
            maxY = Math.max(maxY, ny + nh);
          }
        });
        if (isFinite(minX) && maxX > minX) {
          return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
          };
        }
      }
    } catch (err) {
      console.warn('Fallback node bbox error:', err);
    }

    const rect = svgEl.getBoundingClientRect();
    return {
      x: 0,
      y: 0,
      width: Math.max(800, rect.width || 1000),
      height: Math.max(600, rect.height || 600)
    };
  }

  // Chuẩn hóa SVG: Căn giữa, gỡ transform pan/zoom, nhúng font và style nét căng
  async function prepareNormalizedMindmapSvg(svgEl) {
    if (state.markmapInstance) {
      state.markmapInstance.fit();
    }
    await new Promise(r => setTimeout(r, 180));

    const bbox = getMindmapBoundingBox(svgEl);
    const pad = 65; // Lề an toàn xung quanh nội dung
    const minX = Math.round(bbox.x - pad);
    const minY = Math.round(bbox.y - pad);
    const vbW = Math.round(bbox.width + pad * 2);
    const vbH = Math.round(bbox.height + pad * 2);

    const clone = svgEl.cloneNode(true);
    const cloneG = clone.querySelector('g');
    if (cloneG) {
      cloneG.removeAttribute('transform');
    }

    clone.setAttribute('viewBox', `${minX} ${minY} ${vbW} ${vbH}`);
    clone.setAttribute('width', vbW);
    clone.setAttribute('height', vbH);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // Nền trắng tinh
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', minX);
    bgRect.setAttribute('y', minY);
    bgRect.setAttribute('width', vbW);
    bgRect.setAttribute('height', vbH);
    bgRect.setAttribute('fill', '#ffffff');
    clone.insertBefore(bgRect, clone.firstChild);

    // Nhúng style sắc nét và font chữ
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `
      text { font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important; font-weight: 600 !important; font-size: 14.5px !important; fill: #1e293b !important; }
      .markmap-node[data-depth="0"] text { font-size: 20px !important; font-weight: 800 !important; fill: #0f172a !important; }
      .markmap-node[data-depth="1"] text { font-size: 16px !important; font-weight: 700 !important; fill: #1e293b !important; }
      circle { r: 6.5px !important; stroke-width: 2.2px !important; stroke: #ffffff !important; }
      path.markmap-link { fill: none !important; stroke-width: 3px !important; stroke-linecap: round !important; }
    `;
    clone.insertBefore(styleEl, clone.firstChild);

    const svgString = new XMLSerializer().serializeToString(clone);
    const cleanName = (state.currentDoc.title || 'So_do_tu_duy').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');

    return {
      clone,
      svgString,
      vbW,
      vbH,
      minX,
      minY,
      cleanName
    };
  }

  // Kết xuất ảnh sơ đồ tư duy PNG: Chuẩn quy tắc căn chính giữa tâm hình chữ nhật rồi phóng to ra vừa vặn file ảnh
  async function exportMindmapAsHighResPng() {
    const svgEl = dom.markmapSvg;
    if (!svgEl) return;
    
    showLoading('Đang kết xuất ảnh chất lượng cao...', 'Căn giữa tâm hình chữ nhật và phóng to vừa vặn...');

    try {
      const { svgString, vbW, vbH, cleanName } = await prepareNormalizedMindmapSvg(svgEl);

      const fallbackSvgDownload = (svgXml) => {
        hideLoading();
        const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `So_do_tu_duy_${cleanName}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Đã xuất ảnh sơ đồ tư duy dưới định dạng Vector SVG siêu nét!', 'success');
      };

      const base64DataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      const img = new Image();
      img.crossOrigin = 'anonymous';

      const timeoutId = setTimeout(() => {
        fallbackSvgDownload(svgString);
      }, 3500);

      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');

          // 1. TÍNH TOÁN KÍCH THƯỚC KHUNG HÌNH CHỮ NHẬT SẮC NÉT (2.5K - 3.5K HD)
          const baseWidth = Math.max(2800, Math.min(3840, Math.round(vbW * 2.5)));
          // Chiều cao tự nhiên theo tỷ lệ của sơ đồ tư duy
          const naturalHeight = Math.round(baseWidth * (vbH / vbW));
          const footerBarHeight = 90; // Khu vực dải bản quyền chân trang
          const canvasW = baseWidth;
          const canvasH = Math.max(1600, Math.round(naturalHeight + footerBarHeight + 100));

          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 2. ĐỔ NỀN TRẮNG TOÀN BỘ HÌNH CHỮ NHẬT
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasW, canvasH);

          // 3. ÁP DỤNG QUY TẮC CỐT LÕI: NẰM GIỮA TÂM HÌNH CHỮ NHẬT RỒI PHÓNG TO RA VỪA VẶN
          const contentAreaHeight = canvasH - footerBarHeight;
          const rectCenterX = canvasW / 2;
          const rectCenterY = contentAreaHeight / 2;

          // Vùng nội dung tối đa cho phép sơ đồ hiển thị (chiếm 90% khung hình chữ nhật)
          const maxAllowedWidth = canvasW * 0.90;
          const maxAllowedHeight = contentAreaHeight * 0.90;

          // Hệ số phóng to: Nếu sơ đồ nhỏ thì phóng to lên, nếu to thì co vừa vặn
          const scale = Math.min(maxAllowedWidth / vbW, maxAllowedHeight / vbH);

          // Kích thước sau khi phóng to từ tâm
          const drawW = Math.round(vbW * scale);
          const drawH = Math.round(vbH * scale);

          // Tọa độ vẽ: Đảm bảo TÂM sơ đồ trùng khít với TÂM hình chữ nhật
          const drawX = Math.round(rectCenterX - (drawW / 2));
          const drawY = Math.round(rectCenterY - (drawH / 2));

          // Vẽ sơ đồ phóng to cân xứng từ tâm hình chữ nhật
          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // 4. CHÂN TRANG: ĐƯỜNG PHÂN CÁCH VÀ BẢN QUYỀN TÁC GIẢ
          const lineY = canvasH - footerBarHeight + 15;
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(Math.max(80, drawX), lineY);
          ctx.lineTo(Math.min(canvasW - 80, drawX + drawW), lineY);
          ctx.stroke();

          // Dòng chữ bên trái
          ctx.fillStyle = '#64748b';
          ctx.font = '600 22px "Be Vietnam Pro", -apple-system, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('SmartEdu THCS • Sơ đồ tư duy kiến thức bài học', Math.max(80, drawX), canvasH - 32);

          // Dòng chữ bên phải: Thiết kế bởi Trần Lê Long Phụng lớp 9a13 THCS Long Cang
          ctx.textAlign = 'right';
          ctx.font = '700 22px "Be Vietnam Pro", -apple-system, sans-serif';
          ctx.fillStyle = '#4f46e5';
          ctx.fillText('Thiết kế bởi Trần Lê Long Phụng lớp 9A13 - THCS Long Cang', Math.min(canvasW - 80, drawX + drawW), canvasH - 32);

          // 5. XUẤT FILE ẢNH PNG
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `So_do_tu_duy_${cleanName}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          hideLoading();
          showToast('Đã tải thành công ảnh sơ đồ tư duy PNG (căn đúng tâm, phóng to vừa vặn, siêu nét)!', 'success');
        } catch (canvasErr) {
          console.warn('Canvas render error, falling back to SVG', canvasErr);
          fallbackSvgDownload(svgString);
        }
      };

      img.onerror = (err) => {
        clearTimeout(timeoutId);
        console.warn('Image load error, fallback to SVG file download', err);
        fallbackSvgDownload(svgString);
      };

      img.src = base64DataUri;

    } catch (err) {
      hideLoading();
      console.error(err);
      showToast('Lỗi xuất ảnh: ' + err.message, 'error');
    }
  }

  dom.btnDownloadPng.addEventListener('click', () => {
    exportMindmapAsHighResPng();
  });

  dom.btnDownloadSvg.addEventListener('click', async () => {
    const svgEl = dom.markmapSvg;
    if (!svgEl) return;
    try {
      showLoading('Đang xuất file Vector SVG...', 'Chuẩn hóa căn giữa sơ đồ tư duy...');
      const { svgString, cleanName } = await prepareNormalizedMindmapSvg(svgEl);
      hideLoading();
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `So_do_tu_duy_${cleanName}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Đã xuất file SVG chuẩn tâm, sắc nét vô cực!', 'success');
    } catch (e) {
      hideLoading();
      console.error(e);
      showToast('Lỗi xuất file SVG!', 'error');
    }
  });

  // ================= THƯ VIỆN SƠ ĐỒ TƯ DUY CÁ NHÂN =================
  function getSavedMindmaps() {
    try {
      return JSON.parse(localStorage.getItem('smartedu_saved_mindmaps') || '[]');
    } catch (e) {
      return [];
    }
  }

  function setSavedMindmaps(list) {
    try {
      localStorage.setItem('smartedu_saved_mindmaps', JSON.stringify(list));
    } catch (e) {
      console.error('Không thể lưu vào localStorage:', e);
    }
  }

  function updateSavedMindmapsCount() {
    const list = getSavedMindmaps();
    if (dom.savedMindmapsCount) {
      dom.savedMindmapsCount.textContent = list.length;
    }
    if (dom.mindmapLibraryStatus) {
      dom.mindmapLibraryStatus.textContent = `Đã lưu ${list.length} sơ đồ trong máy`;
    }
  }

  function saveCurrentMindmap() {
    if (!state.mindmapMarkdown || !state.mindmapMarkdown.trim()) {
      showToast('Chưa có nội dung sơ đồ tư duy để lưu!', 'warning');
      return;
    }

    const title = (state.currentDoc.title && state.currentDoc.title !== 'Chưa tải tài liệu') 
      ? state.currentDoc.title 
      : 'Sơ đồ tư duy ' + new Date().toLocaleDateString('vi-VN');

    const lines = state.mindmapMarkdown.split('\n');
    const branchCount = lines.filter(l => l.trim().startsWith('#') || l.trim().startsWith('-')).length;

    const newEntry = {
      id: 'mm_' + Date.now(),
      title: title,
      markdown: state.mindmapMarkdown,
      savedAt: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      branchCount: branchCount
    };

    let list = getSavedMindmaps();
    const existingIndex = list.findIndex(item => item.title === title);
    if (existingIndex >= 0) {
      list[existingIndex] = newEntry; // Ghi đè phiên bản mới nhất
    } else {
      list.unshift(newEntry);
    }

    setSavedMindmaps(list);
    updateSavedMindmapsCount();
    showToast(`Đã lưu "${title}" vào Thư viện sơ đồ cá nhân!`, 'success');
  }

  function renderMindmapLibrary() {
    const list = getSavedMindmaps();
    if (!dom.mindmapLibraryList) return;

    dom.mindmapLibraryList.innerHTML = '';

    if (list.length === 0) {
      if (dom.mindmapLibraryEmpty) dom.mindmapLibraryEmpty.classList.remove('hidden');
      return;
    }

    if (dom.mindmapLibraryEmpty) dom.mindmapLibraryEmpty.classList.add('hidden');

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3';
      card.innerHTML = `
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
              <i class="fa-solid fa-diagram-project"></i>
            </span>
            <h4 class="font-bold text-xs sm:text-sm text-slate-900 truncate">${item.title}</h4>
          </div>
          <div class="flex items-center gap-3 text-[11px] text-slate-500 mt-1 pl-9">
            <span><i class="fa-regular fa-clock text-slate-400"></i> ${item.savedAt}</span>
            <span>•</span>
            <span><i class="fa-solid fa-code-branch text-indigo-500"></i> ${item.branchCount} nhánh kiến thức</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button data-id="${item.id}" class="btn-load-saved-mm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95" title="Mở sơ đồ này trên màn hình">
            <i class="fa-solid fa-eye text-xs"></i>
            <span>Mở xem</span>
          </button>
          <button data-id="${item.id}" class="btn-download-saved-md px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer" title="Tải về máy file Markdown (.md)">
            <i class="fa-solid fa-download text-xs"></i>
            <span class="hidden sm:inline">.md</span>
          </button>
          <button data-id="${item.id}" class="btn-delete-saved-mm p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs transition-colors cursor-pointer" title="Xóa sơ đồ này khỏi thư viện">
            <i class="fa-regular fa-trash-can text-xs"></i>
          </button>
        </div>
      `;
      dom.mindmapLibraryList.appendChild(card);
    });

    // Gắn sự kiện cho các nút trong danh sách thư viện
    dom.mindmapLibraryList.querySelectorAll('.btn-load-saved-mm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const found = list.find(m => m.id === id);
        if (found) {
          renderMindmap(found.markdown);
          setActiveDocument(found.title, found.markdown, 'text');
          closeMindmapLibraryModal();
          showToast(`Đã mở sơ đồ: ${found.title}!`, 'success');
        }
      });
    });

    dom.mindmapLibraryList.querySelectorAll('.btn-download-saved-md').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const found = list.find(m => m.id === id);
        if (found) {
          const blob = new Blob([found.markdown], { type: 'text/markdown;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${found.title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}_mindmap.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`Đã tải file Markdown của sơ đồ!`, 'info');
        }
      });
    });

    dom.mindmapLibraryList.querySelectorAll('.btn-delete-saved-mm').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const found = list.find(m => m.id === id);
        if (found && confirm(`Bạn có chắc muốn xóa sơ đồ "${found.title}" khỏi thư viện không?`)) {
          const updated = list.filter(m => m.id !== id);
          setSavedMindmaps(updated);
          updateSavedMindmapsCount();
          renderMindmapLibrary();
          showToast('Đã xóa sơ đồ khỏi thư viện!', 'info');
        }
      });
    });
  }

  function openMindmapLibraryModal() {
    renderMindmapLibrary();
    if (dom.modalMindmapLibrary) {
      dom.modalMindmapLibrary.classList.remove('hidden');
    }
  }

  function closeMindmapLibraryModal() {
    if (dom.modalMindmapLibrary) {
      dom.modalMindmapLibrary.classList.add('hidden');
    }
  }

  if (dom.btnSaveMindmap) dom.btnSaveMindmap.addEventListener('click', saveCurrentMindmap);
  if (dom.btnOpenMindmapLibrary) dom.btnOpenMindmapLibrary.addEventListener('click', openMindmapLibraryModal);
  if (dom.btnCloseMindmapLibrary) dom.btnCloseMindmapLibrary.addEventListener('click', closeMindmapLibraryModal);
  if (dom.btnDoneMindmapLibrary) dom.btnDoneMindmapLibrary.addEventListener('click', closeMindmapLibraryModal);
  if (dom.modalMindmapLibrary) {
    dom.modalMindmapLibrary.addEventListener('click', (e) => {
      if (e.target === dom.modalMindmapLibrary) closeMindmapLibraryModal();
    });
  }

  // Tab 2 Summary Controls
  dom.generateSummaryBtn.addEventListener('click', generateSummaryWithAi);
  dom.btnCopySummary.addEventListener('click', () => {
    if (!state.summaryData) {
      showToast('Chưa có nội dung tóm tắt để sao chép!', 'warning');
      return;
    }
    let copyText = `TÓM TẮT BÀI HỌC\n\n1. ĐIỂM CỐT LÕI:\n` + 
      (state.summaryData.coreTakeaways || []).map(t => `- ${t}`).join('\n') +
      `\n\n2. THUẬT NGỮ CHÍNH:\n` +
      (state.summaryData.terms || []).map(t => `- ${t.term}: ${t.definition}`).join('\n') +
      `\n\n3. KỸ THUẬT FEYNMAN:\n${state.summaryData.studyStrategy?.feynmanTechnique || ''}`;
    
    navigator.clipboard.writeText(copyText).then(() => {
      showToast('Đã sao chép nội dung tóm tắt vào clipboard!', 'success');
    });
  });

  dom.btnPrintSummary.addEventListener('click', () => {
    window.print();
  });

  // Lắng nghe nút Nghe đọc tóm tắt & Dừng đọc (Tự động thích ứng Anh / Việt)
  if (dom.btnTtsSummary) {
    dom.btnTtsSummary.addEventListener('click', () => {
      if (!state.summaryData) {
        if (state.currentDoc.text || state.currentDoc.imageBase64) {
          showToast('Đang tạo bản tóm tắt bài học để đọc cho bạn, vui lòng đợi trong giây lát...', 'info');
          generateSummaryWithAi().then(() => {
            if (state.summaryData && dom.btnTtsSummary) {
              setTimeout(() => dom.btnTtsSummary.click(), 300);
            }
          });
          return;
        } else {
          showToast('Vui lòng tải lên tài liệu học tập trước khi nghe đọc!', 'warning');
          return;
        }
      }

      // Nếu đang đọc thì bấm lại sẽ dừng
      if (isSpeaking) {
        stopAllSpeech();
        showToast('Đã dừng đọc tóm tắt.', 'info');
        return;
      }

      const title = state.currentDoc.title || 'Tóm tắt bài học';
      const sampleTextForDetection = title + ' ' + 
        (state.summaryData.coreTakeaways || []).join(' ') + ' ' + 
        (state.summaryData.terms || []).map(t => t.term + ' ' + t.definition).join(' ');
      const isEn = isTextEnglish(sampleTextForDetection);

      let speechContent = '';

      if (isEn) {
        speechContent = '';
        if (state.summaryData.coreTakeaways && state.summaryData.coreTakeaways.length > 0) {
          speechContent += `Core Takeaways. ${state.summaryData.coreTakeaways.join('. ')}. `;
        }
        if (state.summaryData.terms && state.summaryData.terms.length > 0) {
          speechContent += `Key Terms and Definitions. ${state.summaryData.terms.map(t => `${t.term}: ${t.definition}`).join('. ')}. `;
        }
        if (state.summaryData.studyStrategy) {
          if (state.summaryData.studyStrategy.feynmanTechnique) {
            speechContent += `Feynman Technique: ${state.summaryData.studyStrategy.feynmanTechnique}. `;
          }
          if (state.summaryData.studyStrategy.mnemonics) {
            speechContent += `Memory Tip: ${state.summaryData.studyStrategy.mnemonics}. `;
          }
        }
      } else {
        speechContent = '';
        if (state.summaryData.coreTakeaways && state.summaryData.coreTakeaways.length > 0) {
          speechContent += `Điểm cốt lõi. ${state.summaryData.coreTakeaways.join('. ')}. `;
        }
        if (state.summaryData.terms && state.summaryData.terms.length > 0) {
          speechContent += `Thuật ngữ quan trọng. ${state.summaryData.terms.map(t => `${t.term}: ${t.definition}`).join('. ')}. `;
        }
        if (state.summaryData.studyStrategy) {
          if (state.summaryData.studyStrategy.feynmanTechnique) {
            speechContent += `Mẹo giải thích dễ hiểu. ${state.summaryData.studyStrategy.feynmanTechnique}. `;
          }
          if (state.summaryData.studyStrategy.mnemonics) {
            speechContent += `Ghi nhớ siêu tốc. ${state.summaryData.studyStrategy.mnemonics}. `;
          }
        }
      }

      // Cập nhật giao diện nút đang phát âm
      dom.btnTtsSummary.classList.add('bg-indigo-600', 'text-white');
      dom.btnTtsSummary.classList.remove('bg-indigo-50', 'text-indigo-700');
      const icon = dom.btnTtsSummary.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-volume-high text-white animate-bounce';

      playSmartSpeech(title, speechContent, () => {
        if (dom.btnTtsSummary) {
          dom.btnTtsSummary.classList.remove('bg-indigo-600', 'text-white');
          dom.btnTtsSummary.classList.add('bg-indigo-50', 'text-indigo-700');
          const ic = dom.btnTtsSummary.querySelector('i');
          if (ic) ic.className = 'fa-solid fa-volume-high text-indigo-600';
        }
      });
    });
  }

  if (dom.btnStopTtsSummary) {
    dom.btnStopTtsSummary.addEventListener('click', () => {
      stopAllSpeech();
      showToast('Đã dừng phát âm tóm tắt!', 'info');
    });
  }

  // Nút đổi tốc độ & phong cách giọng đọc (Hoạt bát / Cấp tốc / Tiêu chuẩn)
  const btnVoiceSpeed = document.getElementById('btn-voice-speed');
  const btnVoiceSpeedTab4 = document.getElementById('btn-voice-speed-tab4');
  if (btnVoiceSpeed) btnVoiceSpeed.addEventListener('click', cycleVoiceMode);
  if (btnVoiceSpeedTab4) btnVoiceSpeedTab4.addEventListener('click', cycleVoiceMode);

  // Tab 3 Quiz Controls
  dom.generateQuizBtn.addEventListener('click', generateQuizWithAi);
  dom.btnSubmitQuiz.addEventListener('click', submitQuizAnswers);
  
  dom.btnRetryQuiz.addEventListener('click', () => {
    if (state.quizData.length > 0) {
      renderQuiz(state.quizData);
      showToast('Đã khởi tạo lại bài làm!', 'info');
    }
  });

  dom.btnNewQuiz.addEventListener('click', generateQuizWithAi);

  dom.btnViewInteractive.addEventListener('click', () => {
    dom.btnViewInteractive.className = 'px-3 py-1.5 rounded-lg bg-white text-indigo-700 shadow-xs font-semibold flex items-center gap-1.5';
    dom.btnViewPrint.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5';
    dom.interactiveQuizContainer.classList.remove('hidden');
    dom.printableExamContainer.classList.add('hidden');
  });

  dom.btnViewPrint.addEventListener('click', () => {
    dom.btnViewPrint.className = 'px-3 py-1.5 rounded-lg bg-white text-indigo-700 shadow-xs font-semibold flex items-center gap-1.5';
    dom.btnViewInteractive.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center gap-1.5';
    dom.printableExamContainer.classList.remove('hidden');
    dom.interactiveQuizContainer.classList.add('hidden');
    populatePrintableExam();
  });

  dom.btnPrintExam.addEventListener('click', () => {
    dom.btnViewPrint.click();
    setTimeout(() => window.print(), 200);
  });

  // Tab 4 Beams Controls
  dom.generateBeamsBtn.addEventListener('click', generateBeamsWithAi);

  // Xuất toàn bộ thẻ học tập Flashcards thành file PDF / Bản in A4 chuẩn TRỰC TIẾP TRÊN TRANG (Không mở tab mới)
  function exportBeamsAsPdf() {
    if (!state.beamData || state.beamData.length === 0) {
      showToast('Chưa có thẻ học tập nào để xuất PDF!', 'warning');
      return;
    }

    const title = state.currentDoc.title || 'Bộ Thẻ Học Tập THCS';
    if (dom.printBeamsTitle) dom.printBeamsTitle.textContent = `Thẻ Học Tập: ${title}`;

    if (dom.printableBeamsGrid) {
      dom.printableBeamsGrid.innerHTML = state.beamData.map((beam, i) => `
        <div class="beam-cut-card p-3 rounded-xl border-2 border-dashed border-indigo-300 bg-white shadow-xs space-y-2">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Thẻ #${i + 1} • ${beam.badge || 'Trọng tâm'}
            </span>
            <span class="text-xs font-bold text-slate-900">${beam.title || ''}</span>
          </div>
          <div class="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span class="font-bold text-slate-800 block text-[11px] mb-0.5">❓ Câu hỏi / Khái niệm:</span>
            <div class="text-slate-700 leading-relaxed">${beam.frontQuestion || ''}</div>
          </div>
          <div class="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs">
            <span class="font-bold text-emerald-900 block text-[11px] mb-0.5">💡 Lời giải / Trọng tâm:</span>
            <div class="text-emerald-800 leading-relaxed">${beam.backAnswer || ''}</div>
          </div>
          ${beam.takeaway ? `
            <div class="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              ⚡ <strong>Ghi nhớ 30s:</strong> ${beam.takeaway}
            </div>
          ` : ''}
        </div>
      `).join('');
    }

    // Kích hoạt chế độ in trực tiếp trên trang hiện tại, KHÔNG mở tab mới
    document.body.classList.add('printing-beams-active');
    if (dom.printableBeamsContainer) dom.printableBeamsContainer.classList.remove('hidden');
    if (dom.beamCardsGrid) dom.beamCardsGrid.classList.add('hidden');

    if (dom.printableBeamsContainer) {
      renderAllMath(dom.printableBeamsContainer);
    }

    showToast('📄 Đang mở hộp thoại lưu PDF / in thẻ học tập...', 'info');

    const cleanUpPrintBeams = () => {
      document.body.classList.remove('printing-beams-active');
      if (dom.printableBeamsContainer) dom.printableBeamsContainer.classList.add('hidden');
      if (dom.beamCardsGrid) dom.beamCardsGrid.classList.remove('hidden');
      window.removeEventListener('afterprint', cleanUpPrintBeams);
    };

    window.addEventListener('afterprint', cleanUpPrintBeams);

    setTimeout(() => {
      window.print();
      // Khôi phục dự phòng sau khi in hoặc đóng hộp thoại
      setTimeout(cleanUpPrintBeams, 600);
    }, 250);
  }

  if (dom.btnExportBeamsPdf) {
    dom.btnExportBeamsPdf.addEventListener('click', exportBeamsAsPdf);
  }
  
  dom.btnBeamFocus.addEventListener('click', () => openFocusMode(0));
  dom.btnCloseFocus.addEventListener('click', () => dom.beamFocusModal.classList.add('hidden'));
  
  dom.focusFlipInner.addEventListener('click', () => {
    dom.focusFlipInner.classList.toggle('is-flipped');
  });

  dom.btnFocusPrev.addEventListener('click', () => {
    if (state.focusBeamIndex > 0) {
      state.focusBeamIndex--;
      updateFocusModalCard();
    }
  });

  dom.btnFocusNext.addEventListener('click', () => {
    if (state.focusBeamIndex < state.beamData.length - 1) {
      state.focusBeamIndex++;
      updateFocusModalCard();
    }
  });

  dom.btnFocusTts.addEventListener('click', () => {
    if (state.beamData[state.focusBeamIndex]) {
      speakBeam(state.beamData[state.focusBeamIndex]);
    }
  });

  if (dom.btnFocusStopTts) {
    dom.btnFocusStopTts.addEventListener('click', () => {
      stopAllSpeech();
      showToast('Đã dừng phát âm thanh Thẻ học tập!', 'info');
    });
  }

  if (dom.btnStopTts) {
    dom.btnStopTts.addEventListener('click', () => {
      stopAllSpeech();
      showToast('Đã dừng phát âm thanh Thẻ học tập!', 'info');
    });
  }

  if (dom.btnToggleTts) {
    dom.btnToggleTts.addEventListener('click', () => {
      // Nếu đang đọc thì bấm nút sẽ dừng ngay lập tức
      if (isReadingAllBeams || isSpeaking) {
        stopAllSpeech();
        showToast('Đã dừng nghe đọc thẻ học tập!', 'info');
        return;
      }

      if (!state.beamData || state.beamData.length === 0) {
        showToast('Chưa có thẻ học tập nào để đọc!', 'warning');
        return;
      }

      isReadingAllBeams = true;
      isSpeaking = true;

      // Cập nhật giao diện nút đang phát
      dom.btnToggleTts.classList.remove('bg-white', 'text-slate-700');
      dom.btnToggleTts.classList.add('bg-indigo-600', 'text-white');
      const ic = dom.btnToggleTts.querySelector('i');
      if (ic) ic.className = 'fa-solid fa-volume-high text-white animate-bounce';
      const span = dom.btnToggleTts.querySelector('span');

      let currentIdx = 0;

      function playNextBeam() {
        if (!isReadingAllBeams || currentIdx >= state.beamData.length) {
          stopAllSpeech();
          if (currentIdx >= state.beamData.length) {
            showToast('Đã nghe đọc xong toàn bộ các thẻ học tập!', 'success');
          }
          return;
        }

        const b = state.beamData[currentIdx];
        currentIdx++;
        if (span) span.textContent = `Đang đọc Thẻ ${currentIdx}/${state.beamData.length}`;
        showToast(`🔊 Đang đọc Thẻ ${currentIdx}/${state.beamData.length}: ${b.title}`, 'info');

        const isEn = isTextEnglish((b.title || '') + ' ' + (b.frontQuestion || '') + ' ' + (b.backAnswer || ''));
        const speechText = isEn
          ? `Card ${currentIdx}. ${b.title}. Question: ${b.frontQuestion}. Answer: ${b.backAnswer}. ${b.takeaway ? 'Key takeaway: ' + b.takeaway : ''}`
          : `Thẻ số ${currentIdx}. ${b.title}. Câu hỏi: ${b.frontQuestion}. Lời giải: ${b.backAnswer}. ${b.takeaway ? 'Ghi nhớ ba mươi giây: ' + b.takeaway : ''}`;

        playSmartSpeech(`Thẻ ${currentIdx}`, speechText, () => {
          if (isReadingAllBeams) {
            setTimeout(playNextBeam, 650);
          }
        }, true /* isSequence = true để không bị stopAllSpeech ngắt cờ giữa chừng */);
      }

      playNextBeam();
    });
  }

  if (dom.btnCancelLoading) {
    dom.btnCancelLoading.addEventListener('click', () => {
      state.userAbortedOperation = true;
      if (state.activeAbortController) {
        try {
          state.activeAbortController.abort('USER_CANCELLED');
        } catch (e) {}
        state.activeAbortController = null;
      }
      hideLoading();
      showToast('Đã hủy bỏ thao tác.', 'info');
    });
  }

  dom.btnFocusMastered.addEventListener('click', () => {
    const b = state.beamData[state.focusBeamIndex];
    if (b) {
      b.mastered = true;
      updateBeamMasteryUI();
      showToast(`Đã đánh dấu thuộc Thẻ ${state.focusBeamIndex + 1}!`, 'success');
      if (state.focusBeamIndex < state.beamData.length - 1) {
        state.focusBeamIndex++;
        updateFocusModalCard();
      }
    }
  });

  // Keyboard navigation for Focus Mode
  document.addEventListener('keydown', (e) => {
    if (!dom.beamFocusModal.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') dom.btnFocusPrev.click();
      if (e.key === 'ArrowRight') dom.btnFocusNext.click();
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        dom.focusFlipInner.classList.toggle('is-flipped');
      }
      if (e.key === 'Escape') dom.btnCloseFocus.click();
    }
  });

  // Key Manager Modal
  window.openKeyModal = function() {
    if (dom.keyModal) {
      dom.keyModal.classList.remove('hidden');
      updateKeyPoolUI();
    }
  };

  if (dom.openKeyModalBtn) {
    dom.openKeyModalBtn.addEventListener('click', window.openKeyModal);
  }
  if (dom.openKeyModalBtnDesktop) {
    dom.openKeyModalBtnDesktop.addEventListener('click', window.openKeyModal);
  }

  if (dom.selectGeminiModel) {
    dom.selectGeminiModel.addEventListener('change', (e) => {
      state.selectedModel = e.target.value;
      localStorage.setItem('smartedu_selected_model', state.selectedModel);
      showToast(`Đã chọn mô hình: ${state.selectedModel}`, 'info');
    });
  }

  dom.btnCloseKeyModal.addEventListener('click', () => dom.keyModal.classList.add('hidden'));
  dom.btnSaveKeyModal.addEventListener('click', () => {
    state.selectedModel = dom.selectGeminiModel.value;
    saveApiKeysToStorage();
    dom.keyModal.classList.add('hidden');
    showToast('Đã lưu cấu hình API Key!', 'success');
  });

  dom.btnAddKeys.addEventListener('click', () => {
    const raw = dom.inputMultipleKeys.value.trim();
    if (!raw) {
      showToast('Vui lòng dán ít nhất 1 API Key!', 'warning');
      return;
    }

    // Split by newline or comma
    const rawList = raw.split(/[\n,]+/).map(k => k.trim()).filter(k => k.length > 10);
    if (rawList.length === 0) {
      showToast('Không tìm thấy API Key hợp lệ!', 'warning');
      return;
    }

    let addedCount = 0;
    rawList.forEach(k => {
      // Check duplicate
      if (!state.apiKeys.some(existing => existing.key === k)) {
        state.apiKeys.push({
          key: k,
          status: 'ready',
          successCount: 0
        });
        addedCount++;
      }
    });

    dom.inputMultipleKeys.value = '';
    saveApiKeysToStorage();
    showToast(`Đã thêm thành công ${addedCount} API Key vào kho!`, 'success');
  });

  dom.btnTestAllKeys.addEventListener('click', async () => {
    for (let i = 0; i < state.apiKeys.length; i++) {
      await testSingleKey(i);
    }
  });

  // ================= LOAD SAMPLE LESSON (DEMO CẤP 2 - THCS) =================
  function loadSpecificLesson(demo, label = '', autoScroll = false, notify = true) {
    if (!demo) {
      if (notify) showToast('Không tìm thấy dữ liệu bài học mẫu!', 'error');
      return;
    }

    setActiveDocument(demo.title, demo.rawContent, 'text', null, true);

    // Load sample Mindmap
    renderMindmap(demo.mindmapMarkdown);

    // Load sample Summary
    renderSummary(demo.summary);

    // Load sample Quiz
    renderQuiz(demo.quiz);

    // Load sample Beams
    renderBeams(demo.beams);

    // Render toàn bộ công thức KaTeX trên toàn trang
    setTimeout(() => {
      renderAllMath();
    }, 100);

    // Đảm bảo trang web luôn hiển thị trọn vẹn từ đỉnh (Header, Bài mẫu, Upload, Tabs)
    window.scrollTo(0, 0);
    if (state.markmapInstance) {
      setTimeout(() => state.markmapInstance.fit(), 350);
    }

    if (notify) {
      showToast(`Đã mở bài mẫu: ${demo.title}!`, 'success');
    }
  }

  // Expose global helper for inline onclick & reliable access (KHÔNG cuộn trang để giữ nguyên giao diện đỉnh)
  window.loadSpecificLessonById = function(key) {
    const demo = window.SAMPLE_LESSONS?.[key];
    if (demo) {
      loadSpecificLesson(demo, demo.title, false, true);
    } else {
      showToast('Đang tải dữ liệu bài học...', 'info');
      setTimeout(() => {
        const retry = window.SAMPLE_LESSONS?.[key];
        if (retry) loadSpecificLesson(retry, retry.title, false, true);
      }, 300);
    }
  };

  if (dom.loadSampleToan9Btn) {
    dom.loadSampleToan9Btn.addEventListener('click', () => {
      const toan9 = window.SAMPLE_LESSONS?.toan9;
      loadSpecificLesson(toan9, 'Toán 9 (THCS)', false, true);
    });
  }

  if (dom.loadSampleKhtn9Btn) {
    dom.loadSampleKhtn9Btn.addEventListener('click', () => {
      const khtn9 = window.SAMPLE_LESSONS?.khtn9;
      loadSpecificLesson(khtn9, 'KHTN 9 (THCS)', false, true);
    });
  }

  if (dom.loadSampleKhtn8Btn) {
    dom.loadSampleKhtn8Btn.addEventListener('click', () => {
      const khtn8 = window.SAMPLE_LESSONS?.khtn8;
      loadSpecificLesson(khtn8, 'KHTN 8 (THCS)', false, true);
    });
  }

  if (dom.loadSampleKhtn7Btn) {
    dom.loadSampleKhtn7Btn.addEventListener('click', () => {
      const khtn7 = window.SAMPLE_LESSONS?.khtn7 || window.SAMPLE_LESSON;
      loadSpecificLesson(khtn7, 'KHTN 7 (THCS)', false, true);
    });
  }

  if (dom.btnEnterLesson) {
    dom.btnEnterLesson.addEventListener('click', () => {
      const tabsNav = document.querySelector('.tab-buttons-container');
      if (tabsNav) {
        tabsNav.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  // ================= PWA SERVICE WORKER REGISTRATION =================
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('[SmartEdu PWA] Service Worker đăng ký thành công:', reg.scope);
        })
        .catch(err => {
          console.warn('[SmartEdu PWA] Đăng ký Service Worker thất bại:', err);
        });
    });
  }

  // ================= PWA INSTALLATION (BEFOREINSTALLPROMPT & MOBILE BANNER & IOS) =================
  let deferredInstallPrompt = null;
  const btnInstallPwa = document.getElementById('btn-install-pwa');
  const btnInstallPwaMobile = document.getElementById('btn-install-pwa-mobile');
  const pwaInstallBanner = document.getElementById('pwa-install-banner');
  const btnPwaBannerInstall = document.getElementById('btn-pwa-banner-install');
  const btnPwaBannerDismiss = document.getElementById('btn-pwa-banner-dismiss');
  const iosInstallModal = document.getElementById('ios-install-modal');
  const btnCloseIosModal = document.getElementById('btn-close-ios-modal');
  const androidInstallModal = document.getElementById('android-install-modal');
  const btnCloseAndroidModal = document.getElementById('btn-close-android-modal');
  const zaloBrowserWarning = document.getElementById('zalo-browser-warning');
  const iosInappWarning = document.getElementById('ios-inapp-warning');

  function showInstallUi() {
    if (isStandalone) return;
    if (btnInstallPwa) {
      btnInstallPwa.classList.remove('hidden');
      btnInstallPwa.classList.add('flex');
    }
    if (btnInstallPwaMobile) {
      btnInstallPwaMobile.classList.remove('hidden');
      btnInstallPwaMobile.classList.add('flex');
    }

    // Gợi ý cài đặt dạng thanh banner nổi trên điện thoại nếu người dùng chưa bấm đóng trong phiên
    if (isMobile && pwaInstallBanner && !sessionStorage.getItem('smartedu_pwa_banner_dismissed')) {
      setTimeout(() => {
        if (!isStandalone && pwaInstallBanner) {
          pwaInstallBanner.classList.remove('hidden');
        }
      }, 1500);
    }
  }

  // Khi trình duyệt (Chrome/Edge/Android) kích hoạt sự kiện cho phép cài đặt PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    showInstallUi();
  });

  // Đối với iOS hoặc các trình duyệt di động
  if (!isStandalone) {
    if (isIos || isMobile) {
      showInstallUi();
    }
  }

  async function handleInstallClick() {
    // 1. Nếu trình duyệt đã kích hoạt native prompt (Chrome Android / Edge)
    if (deferredInstallPrompt) {
      try {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          showToast('Đang cài đặt SmartEdu THCS lên màn hình chính...', 'success');
          if (btnInstallPwa) btnInstallPwa.classList.add('hidden');
          if (btnInstallPwaMobile) btnInstallPwaMobile.classList.add('hidden');
          if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
        }
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
      deferredInstallPrompt = null;
      return;
    }

    // 2. Nếu đang dùng thiết bị Apple (iPhone / iPad / iOS Safari)
    if (isIos) {
      if (iosInstallModal) {
        if (iosInappWarning) {
          if (isInAppBrowser) {
            iosInappWarning.classList.remove('hidden');
          } else {
            iosInappWarning.classList.add('hidden');
          }
        }
        iosInstallModal.classList.remove('hidden');
      }
      return;
    }

    // 3. Nếu đang dùng Android hoặc trình duyệt khác khi chưa có native prompt
    if (androidInstallModal) {
      if (zaloBrowserWarning) {
        if (isInAppBrowser) {
          zaloBrowserWarning.classList.remove('hidden');
        } else {
          zaloBrowserWarning.classList.add('hidden');
        }
      }
      androidInstallModal.classList.remove('hidden');
    } else {
      showToast('Bấm nút menu (⋮) ở góc trên trình duyệt rồi chọn "Cài đặt ứng dụng" hoặc "Thêm vào MH chính"!', 'info');
    }
  }

  if (btnInstallPwa) btnInstallPwa.addEventListener('click', handleInstallClick);
  if (btnInstallPwaMobile) btnInstallPwaMobile.addEventListener('click', handleInstallClick);
  if (btnPwaBannerInstall) btnPwaBannerInstall.addEventListener('click', handleInstallClick);

  if (btnPwaBannerDismiss) {
    btnPwaBannerDismiss.addEventListener('click', () => {
      sessionStorage.setItem('smartedu_pwa_banner_dismissed', '1');
      if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
    });
  }

  if (btnCloseIosModal && iosInstallModal) {
    btnCloseIosModal.addEventListener('click', () => {
      iosInstallModal.classList.add('hidden');
    });
  }

  if (iosInstallModal) {
    iosInstallModal.addEventListener('click', (e) => {
      if (e.target === iosInstallModal) iosInstallModal.classList.add('hidden');
    });
  }

  if (btnCloseAndroidModal && androidInstallModal) {
    btnCloseAndroidModal.addEventListener('click', () => {
      androidInstallModal.classList.add('hidden');
    });
  }

  if (androidInstallModal) {
    androidInstallModal.addEventListener('click', (e) => {
      if (e.target === androidInstallModal) androidInstallModal.classList.add('hidden');
    });
  }

  window.addEventListener('appinstalled', () => {
    console.log('[SmartEdu PWA] Đã cài đặt PWA thành công');
    showToast('🎉 Đã cài đặt SmartEdu THCS vào màn hình chính!', 'success');
    if (btnInstallPwa) btnInstallPwa.classList.add('hidden');
    if (btnInstallPwaMobile) btnInstallPwaMobile.classList.add('hidden');
    if (pwaInstallBanner) pwaInstallBanner.classList.add('hidden');
    deferredInstallPrompt = null;
  });

  // ================= SHARE QR CODE MODAL =================
  const btnShareQr = document.getElementById('btn-share-qr');
  const btnShareQrMobile = document.getElementById('btn-share-qr-mobile');
  const modalShareQr = document.getElementById('modal-share-qr');
  const btnCloseQrModal = document.getElementById('btn-close-qr-modal');
  const qrModalImg = document.getElementById('qr-modal-img');
  const shareQrUrlInput = document.getElementById('share-qr-url-input');
  const btnCopyShareUrl = document.getElementById('btn-copy-share-url');

  function openShareQrModal() {
    if (!modalShareQr) return;
    const currentUrl = window.location.href.split('#')[0];
    if (shareQrUrlInput) shareQrUrlInput.value = currentUrl;
    if (qrModalImg) {
      const encodedUrl = encodeURIComponent(currentUrl);
      qrModalImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=10&data=${encodedUrl}`;
    }
    modalShareQr.classList.remove('hidden');
  }

  function closeShareQrModal() {
    if (modalShareQr) modalShareQr.classList.add('hidden');
  }

  if (btnShareQr) btnShareQr.addEventListener('click', openShareQrModal);
  if (btnShareQrMobile) btnShareQrMobile.addEventListener('click', openShareQrModal);
  if (btnCloseQrModal) btnCloseQrModal.addEventListener('click', closeShareQrModal);
  if (modalShareQr) {
    modalShareQr.addEventListener('click', (e) => {
      if (e.target === modalShareQr) closeShareQrModal();
    });
  }

  if (btnCopyShareUrl) {
    btnCopyShareUrl.addEventListener('click', () => {
      if (shareQrUrlInput) {
        shareQrUrlInput.select();
        navigator.clipboard.writeText(shareQrUrlInput.value).then(() => {
          showToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
        }).catch(() => {
          document.execCommand('copy');
          showToast('Đã sao chép liên kết!', 'success');
        });
      }
    });
  }

  // ================= QUIZ HISTORY & PROGRESS MODAL =================
  const btnQuizHistory = document.getElementById('btn-quiz-history');
  const modalQuizHistory = document.getElementById('modal-quiz-history');
  const btnCloseQuizHistory = document.getElementById('btn-close-quiz-history-modal');
  const btnDoneQuizHistory = document.getElementById('btn-done-quiz-history');
  const btnClearQuizHistory = document.getElementById('btn-clear-quiz-history');
  const quizHistoryTableBody = document.getElementById('quiz-history-table-body');
  const quizHistoryEmpty = document.getElementById('quiz-history-empty');

  const statTotalTests = document.getElementById('quiz-stat-total-tests');
  const statMaxScore = document.getElementById('quiz-stat-max-score');
  const statAvgScore = document.getElementById('quiz-stat-avg-score');
  const statTotalCorrect = document.getElementById('quiz-stat-total-correct');

  function renderQuizHistory() {
    if (!quizHistoryTableBody) return;
    const history = JSON.parse(localStorage.getItem('smartedu_quiz_history') || '[]');
    
    if (history.length === 0) {
      quizHistoryTableBody.innerHTML = '';
      if (quizHistoryEmpty) quizHistoryEmpty.classList.remove('hidden');
      if (statTotalTests) statTotalTests.textContent = '0';
      if (statMaxScore) statMaxScore.textContent = '0.0';
      if (statAvgScore) statAvgScore.textContent = '0.0';
      if (statTotalCorrect) statTotalCorrect.textContent = '0';
      return;
    }

    if (quizHistoryEmpty) quizHistoryEmpty.classList.add('hidden');

    let totalScore = 0;
    let maxScore = 0;
    let totalCorrect = 0;

    quizHistoryTableBody.innerHTML = history.map(item => {
      const scoreNum = parseFloat(item.score) || 0;
      totalScore += scoreNum;
      if (scoreNum > maxScore) maxScore = scoreNum;
      totalCorrect += (item.correctTotal || 0);

      const scoreBadgeColor = scoreNum >= 8 
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
        : (scoreNum >= 5 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300');

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="p-2.5 sm:px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">${item.date}</td>
          <td class="p-2.5 sm:px-3 font-medium text-slate-800 max-w-[180px] sm:max-w-xs truncate" title="${item.title}">${item.title}</td>
          <td class="p-2.5 sm:px-3 text-center font-semibold text-slate-700">${item.correctTotal}/${item.totalQ} (${item.percentage}%)</td>
          <td class="p-2.5 sm:px-3 text-right">
            <span class="inline-block px-2 py-0.5 rounded-md font-bold text-xs border ${scoreBadgeColor}">
              ${scoreNum.toFixed(1)} đ
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const avgScore = (totalScore / history.length).toFixed(1);

    if (statTotalTests) statTotalTests.textContent = history.length;
    if (statMaxScore) statMaxScore.textContent = maxScore.toFixed(1);
    if (statAvgScore) statAvgScore.textContent = avgScore;
    if (statTotalCorrect) statTotalCorrect.textContent = totalCorrect;
  }

  function openQuizHistoryModal() {
    renderQuizHistory();
    if (modalQuizHistory) modalQuizHistory.classList.remove('hidden');
  }

  function closeQuizHistoryModal() {
    if (modalQuizHistory) modalQuizHistory.classList.add('hidden');
  }

  if (btnQuizHistory) btnQuizHistory.addEventListener('click', openQuizHistoryModal);
  if (btnCloseQuizHistory) btnCloseQuizHistory.addEventListener('click', closeQuizHistoryModal);
  if (btnDoneQuizHistory) btnDoneQuizHistory.addEventListener('click', closeQuizHistoryModal);
  if (modalQuizHistory) {
    modalQuizHistory.addEventListener('click', (e) => {
      if (e.target === modalQuizHistory) closeQuizHistoryModal();
    });
  }

  if (btnClearQuizHistory) {
    btnClearQuizHistory.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử làm bài thi trên máy này không?')) {
        localStorage.removeItem('smartedu_quiz_history');
        renderQuizHistory();
        showToast('Đã xóa toàn bộ lịch sử khảo thí!', 'info');
      }
    });
  }

  // Initialize
  loadApiKeysFromStorage();
  updateSavedMindmapsCount();

  // Tự động nhận diện API Key từ biến môi trường Vercel nếu có
  async function fetchKeyFromVercelEnv() {
    try {
      const res = await fetch('/api/key');
      if (res.ok) {
        const data = await res.json();
        if (data && data.key && typeof data.key === 'string' && data.key.trim().length > 0) {
          const rawKeys = data.key.split(/[,\n]+/).map(k => k.trim()).filter(Boolean);
          let added = false;
          rawKeys.forEach(k => {
            if (!state.apiKeys.some(existing => existing.key === k)) {
              state.apiKeys.push({
                key: k,
                status: 'ready',
                successCount: 0,
                errorCount: 0,
                errorDetail: 'Từ Vercel Environment'
              });
              added = true;
            }
          });
          if (added) {
            saveApiKeysToStorage();
            updateKeyPoolUI();
          }
        }
      }
    } catch (e) {
      // Bỏ qua nếu chạy offline hoặc môi trường local không có /api/key
    }
  }
  fetchKeyFromVercelEnv();

  // Tự động nạp ngay bài học mẫu cấp 2 tiêu biểu (Toán 9) khi mở trang
  const triggerDefaultLesson = () => {
    if (!state.currentDoc.text) {
      const defaultLesson = window.SAMPLE_LESSONS?.toan9 || window.SAMPLE_LESSONS?.khtn9 || window.SAMPLE_LESSON;
      if (defaultLesson) {
        loadSpecificLesson(defaultLesson, 'Toán 9 (THCS)', false, false);
      }
    }
  };

  if (window._pendingLessonKey && window.SAMPLE_LESSONS?.[window._pendingLessonKey]) {
    loadSpecificLesson(window.SAMPLE_LESSONS[window._pendingLessonKey], window._pendingLessonKey.toUpperCase(), false, true);
    window._pendingLessonKey = null;
  } else {
    triggerDefaultLesson();
    setTimeout(triggerDefaultLesson, 60);
    setTimeout(triggerDefaultLesson, 300);
  }

});
