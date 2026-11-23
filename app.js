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

    // User Accounts & Progress Tracking
    accounts: [],
    activeAccountId: null,

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
  const isStandalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone === true);

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
    tabSummary: document.getElementById('tab-summary'),
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
      // - Giữ nguyên escape ký tự điều khiển chuẩn: \n, \r, \t, \b, \f
      // - Tất cả các từ LaTeX (\frac, \sqrt, \Delta, \times, \right, \text, \begin, \underline, \Omega, \pm, \cdot, v.v.):
      //   BẮT BUỘC biến thành \\ (double backslash) để JSON.parse hợp lệ 100%!
      s = s.replace(/\\(?:([a-zA-Z]+)|([^"\\/]))/g, (match, word, char) => {
        if (word) {
          if (/^u[0-9a-fA-F]{4}$/.test(word)) {
            return '\\' + word;
          }
          if (/^[nrtbf]$/.test(word)) {
            return '\\' + word;
          }
          return '\\\\' + word;
        }
        if (char) {
          return '\\\\' + char;
        }
        return match;
      });

      // Xóa các dấu phẩy thừa trước dấu đóng ngoặc (trailing comma): , } hoặc , ]
      s = s.replace(/,\s*([}\]])/g, '$1');

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

    // 6. Cứu hộ trường hợp JSON mảng bị cắt ngang ở câu cuối (Truncated JSON do tài liệu dài vượt token limit)
    // Dò lùi tìm các dấu } hợp lệ và đóng mảng ] an toàn
    if (firstBracket !== -1) {
      let partial = cleaned.substring(firstBracket);
      let lastObjClose = partial.lastIndexOf('}');
      while (lastObjClose !== -1 && lastObjClose > 0) {
        let candidate = partial.substring(0, lastObjClose + 1);
        candidate = candidate.replace(/,\s*$/, '') + ']';
        try {
          const res = JSON.parse(fixJsonEscapes(candidate));
          if (Array.isArray(res) && res.length > 0) {
            console.warn(`JSON mảng đã được giải cứu thành công từ phản hồi dở dang (${res.length} phần tử hoàn chỉnh).`);
            return res;
          }
        } catch (e5) {
          // Lùi lại tìm dấu } trước đó
          lastObjClose = partial.lastIndexOf('}', lastObjClose - 1);
        }
      }
    }

    // 7. Cứu hộ nếu là Object { ... bị cắt ngang
    if (firstBrace !== -1) {
      let partialObj = cleaned.substring(firstBrace);
      let lastObjEnd = partialObj.lastIndexOf('}');
      while (lastObjEnd !== -1 && lastObjEnd > 0) {
        let candidateObj = partialObj.substring(0, lastObjEnd + 1);
        candidateObj = candidateObj.replace(/,\s*$/, '') + '}';
        try {
          const resObj = JSON.parse(fixJsonEscapes(candidateObj));
          if (resObj && typeof resObj === 'object') {
            console.warn('JSON Object đã được giải cứu thành công.');
            return resObj;
          }
        } catch (e6) {
          lastObjEnd = partialObj.lastIndexOf('}', lastObjEnd - 1);
        }
      }
    }

    // 8. Cứu nguy cuối cùng: làm sạch ký tự điều khiển và parse
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
            temperature: 0.1, // Phản xạ nhanh, dứt khoát, giảm tối đa độ trễ suy nghĩ
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

  // ================= THUẬT TOÁN TỐI ƯU HÓA NGỮ CẢNH VĂN BẢN DÀI (SMART SEMANTIC TRUNCATION) =================
  // Giúp AI phản hồi siêu tốc sau 2-3s kể cả với tài liệu dài 5.000 - 15.000 từ
  function optimizeTextForAi(rawText, maxChars = 7500) {
    if (!rawText || typeof rawText !== 'string') return '';
    if (rawText.length <= maxChars) return rawText;

    // 1. Chuẩn hóa khoảng trắng và dòng trống
    let text = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length <= maxChars) return text;

    // 2. Trích lọc ưu tiên: Tiêu đề, Định lý, Công thức, Phần ghi nhớ
    const lines = text.split('\n');
    const priorityLines = [];
    let currentLength = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isHeading = /^#{1,4}\s+|^(chương|bài|phần|mục|i\.|ii\.|iii\.|iv\.|v\.|vi\.|1\.|2\.|3\.|4\.|a\.|b\.)/i.test(trimmed);
      const isMathOrFormula = /[$=+\-*/\\^_√ΔΩ△∠⟂∥]/.test(trimmed);
      const isKeyConcept = /ghi nhớ|tóm tắt|định lý|định luật|khái niệm|công thức|kết luận|chú ý|ví dụ|takeaway/i.test(trimmed);

      if (isHeading || isMathOrFormula || isKeyConcept || priorityLines.length < 30) {
        priorityLines.push(line);
        currentLength += line.length + 1;
        if (currentLength >= maxChars) break;
      } else if (currentLength + line.length + 1 < maxChars) {
        priorityLines.push(line);
        currentLength += line.length + 1;
      }
    }

    if (priorityLines.length >= 20 && currentLength >= 2000) {
      return priorityLines.join('\n');
    }

    // 3. Fallback: Cắt giữ đầu và đuôi cân đối (tránh mất phần tóm tắt ở cuối sách)
    const headLen = Math.floor(maxChars * 0.7);
    const tailLen = maxChars - headLen - 120;
    return text.slice(0, headLen) + '\n\n[... Trích lược nội dung bài học ...]\n\n' + text.slice(-tailLen);
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

  // 1. Trích xuất DOCX bằng JSZip (bắt trọn hộp văn bản w:txbxContent, bảng w:tc, và đoạn văn w:p)
  async function parseDocxWithJsZip(arrayBuffer) {
    if (!window.JSZip) return null;
    try {
      const zip = await window.JSZip.loadAsync(arrayBuffer);
      const docXmlFile = zip.file("word/document.xml");
      if (!docXmlFile) return null;
      const xmlText = await docXmlFile.async("string");

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      // Trích xuất toàn bộ các đoạn văn bản trong w:p
      // (Bao gồm cả text nằm trong hộp văn bản w:txbxContent, bảng biểu w:tc, hình vẽ w:drawing)
      const paragraphs = xmlDoc.getElementsByTagName("w:p");
      const lines = [];

      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        const tTags = p.getElementsByTagName("w:t");
        let pStr = '';
        for (let j = 0; j < tTags.length; j++) {
          pStr += tTags[j].textContent || '';
        }
        const trimmed = pStr.trim();
        if (trimmed) {
          lines.push(trimmed);
        }
      }

      // Đọc thêm ghi chú (footnotes/endnotes) nếu có
      const extraFiles = zip.file(/^word\/(footnotes|endnotes|header\d+|footer\d+)\.xml$/);
      for (const f of extraFiles) {
        try {
          const extraXml = await f.async("string");
          const extraDoc = parser.parseFromString(extraXml, "application/xml");
          const extraPs = extraDoc.getElementsByTagName("w:p");
          for (let i = 0; i < extraPs.length; i++) {
            const tTags = extraPs[i].getElementsByTagName("w:t");
            let pStr = '';
            for (let j = 0; j < tTags.length; j++) pStr += tTags[j].textContent || '';
            const trimmed = pStr.trim();
            if (trimmed && !lines.includes(trimmed)) {
              lines.push(trimmed);
            }
          }
        } catch (e) {}
      }

      const merged = lines.join('\n\n').trim();
      return merged || null;
    } catch (err) {
      console.warn('JSZip DOCX parse error:', err);
      return null;
    }
  }

  // 2. Trích xuất file .doc (Word 97-2003 hoặc HTML/MHTML/RTF xuất từ vnEdu/SMAS/Word)
  function parseDocBinaryOrHtml(arrayBuffer) {
    try {
      const decoderUtf8 = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoderUtf8.decode(arrayBuffer);

      // Trường hợp A: File .doc thực chất là HTML/MHTML/XML
      if (/<!DOCTYPE\s+html|<html|<body|<table|<\?xml|<w:wordDocument/i.test(rawText)) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawText, 'text/html');
        const bodyText = doc.body ? (doc.body.innerText || doc.body.textContent || '') : '';
        if (bodyText && countWords(bodyText) > 10) {
          return bodyText.trim();
        }
      }

      // Trường hợp B: File RTF (Rich Text Format) mang đuôi .doc
      if (rawText.startsWith('{\\rtf')) {
        const rtfClean = rawText
          .replace(/\\par[d]?/g, '\n')
          .replace(/\\[a-z0-9\-]+ ?/gi, '')
          .replace(/[{}]/g, '')
          .trim();
        if (rtfClean && countWords(rtfClean) > 10) return rtfClean;
      }

      // Trường hợp C: File Word 97-2003 nhị phân (CFB / OLE2)
      // Quét chuỗi Unicode (UTF-16LE) và ASCII
      const uint8 = new Uint8Array(arrayBuffer);
      let extractedStrings = [];
      let currentUnicode = [];

      for (let i = 0; i < uint8.length - 1; i += 2) {
        const code = uint8[i] | (uint8[i + 1] << 8);
        if ((code >= 32 && code <= 126) || (code >= 192 && code <= 0x1EF9) || code === 10 || code === 13) {
          currentUnicode.push(String.fromCharCode(code));
        } else {
          if (currentUnicode.length >= 8) {
            const str = currentUnicode.join('').trim();
            if (str.length > 5 && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(str)) {
              extractedStrings.push(str);
            }
          }
          currentUnicode = [];
        }
      }
      if (currentUnicode.length >= 8) {
        const str = currentUnicode.join('').trim();
        if (str.length > 5 && /[a-zA-Z0-9à-ỹÀ-Ỹ]/.test(str)) {
          extractedStrings.push(str);
        }
      }

      if (extractedStrings.length > 0) {
        const merged = extractedStrings.join('\n');
        if (countWords(merged) > 15) return merged;
      }
    } catch (e) {
      console.warn('Doc binary/html parse error:', e);
    }
    return null;
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
        let extractedText = '';

        // Bước A: Thử trích xuất chuyên sâu bằng JSZip (Hỗ trợ hộp văn bản Text Box, Bảng và Hình vẽ)
        const zipText = await parseDocxWithJsZip(arrayBuffer);

        // Bước B: Thử trích xuất bằng Mammoth
        let mammothText = '';
        if (window.mammoth) {
          try {
            const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            mammothText = result.value ? result.value.trim() : '';
          } catch (mErr) {
            console.warn('Mammoth parse error:', mErr);
          }
        }

        // Ưu tiên bản trích xuất có nội dung đầy đủ nhất (nhiều từ hơn)
        if (zipText && (!mammothText || countWords(zipText) >= countWords(mammothText))) {
          extractedText = zipText;
        } else if (mammothText) {
          extractedText = mammothText;
        }

        // Bước C: Nếu cả 2 đều không ra văn bản (hoặc file .doc nhị phân/HTML), dùng bộ giải mã nhị phân/HTML
        if (!extractedText || countWords(extractedText) < 15) {
          const docFallback = parseDocBinaryOrHtml(arrayBuffer);
          if (docFallback && countWords(docFallback) > countWords(extractedText)) {
            extractedText = docFallback;
          }
        }

        const cleanText = extractedText ? extractedText.trim() : '';
        const wordCount = countWords(cleanText);

        // Bước D: Kiểm tra nếu file Word là dạng dán ảnh scan bài học (rất ít chữ nhưng có nhiều ảnh trong word/media/)
        let docxImages = [];
        if (wordCount < 35 && window.JSZip) {
          try {
            const zip = await window.JSZip.loadAsync(arrayBuffer);
            const imageEntries = Object.keys(zip.files).filter(k => /^word\/media\/.+\.(png|jpeg|jpg|webp)$/i.test(k));
            const imagesToExtract = imageEntries.slice(0, 10); // Hỗ trợ tối đa 10 trang ảnh scan nhúng trong Word
            for (const imgPath of imagesToExtract) {
              const fileData = await zip.files[imgPath].async("base64");
              const ext = imgPath.split('.').pop().toLowerCase();
              const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
              docxImages.push(`data:${mime};base64,${fileData}`);
            }
          } catch (imgErr) {
            console.warn('Lỗi trích xuất ảnh nhúng trong docx:', imgErr);
          }
        }

        if (wordCount < 35 && docxImages.length > 0) {
          return {
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            type: 'word',
            text: `[File Word chứa ảnh chụp tài liệu / đề thi scan: ${name} (${docxImages.length} trang ảnh)]\n(Hệ thống đã nhận diện ${docxImages.length} trang ảnh bài học. Hãy bấm "Nhận diện OCR bằng AI" để AI Vision trích xuất toàn bộ công thức Toán - Lý - Hóa và phân tích hình vẽ!)`,
            wordCount: 0,
            size: file.size,
            imageBase64: docxImages[0],
            images: docxImages,
            isOcrDone: false
          };
        }

        return {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'word',
          text: cleanText || `[File Word: ${name} (Không có văn bản trích xuất được)]`,
          wordCount: wordCount,
          size: file.size,
          imageBase64: null,
          images: [],
          isOcrDone: true
        };
      } catch (err) {
        console.warn('Word parse error:', err);
        return {
          id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'word',
          text: `[Lỗi đọc file Word: ${err.message}]`,
          wordCount: 0,
          size: file.size,
          imageBase64: null,
          images: [],
          isOcrDone: true
        };
      }
    }

    // 2. File PDF (Hỗ trợ tiếng Việt đầy đủ CMaps và tự động Render ảnh nét cao cho PDF scan)
    if (lowerName.endsWith('.pdf')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        if (!window.pdfjsLib) {
          throw new Error('Thư viện PDF.js chưa sẵn sàng.');
        }

        // Cấu hình CMaps để giải mã font tiếng Việt đầy đủ
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/standard_fonts/',
          isEvalSupported: false
        });

        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;
        const pageTextList = [];
        let totalRealWords = 0;

        for (let i = 1; i <= totalPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent({ normalizeWhitespace: true });
            const pageStrings = textContent.items
              .map(item => item.str)
              .filter(s => s && s.trim());
            const pText = pageStrings.join(' ').trim();
            if (pText) {
              pageTextList.push(`--- TRANG ${i} ---\n` + pText);
              totalRealWords += countWords(pText);
            }
          } catch (pageErr) {
            console.warn(`Lỗi đọc văn bản trang ${i}:`, pageErr);
          }
        }

        const fullText = pageTextList.join('\n\n').trim();

        // Nhận diện file PDF dạng scan ảnh hoặc văn bản quá ít (< 35 từ trên toàn tài liệu)
        const isScannedPdf = totalRealWords < 35 || (totalPages > 1 && (totalRealWords / totalPages) < 15);

        // Render ảnh các trang thông minh:
        // - PDF kỹ thuật số (đã có text): Chỉ render duy nhất Trang 1 làm thumbnail xem trước (siêu tốc, chỉ mất 0.1s)
        // - PDF scan ảnh: Render tối đa 10 trang để hỗ trợ AI Multimodal Vision đọc chi tiết toàn bộ công thức & hình vẽ
        let pageImages = [];
        const pagesToRender = isScannedPdf ? Math.min(totalPages, 10) : 1;

        for (let i = 1; i <= pagesToRender; i++) {
          try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.2 }); // Scale 1.2 siêu sắc nét cho OCR nhưng nhẹ hơn 40% so với 1.5
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(viewport.width, 1280);
            canvas.height = Math.min(viewport.height, 1800);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport: viewport }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
            pageImages.push(dataUrl);
          } catch (renderErr) {
            console.warn(`Lỗi render canvas trang ${i}:`, renderErr);
          }
        }

        if (isScannedPdf && pageImages.length > 0) {
          const scanNotice = `[Tài liệu PDF ảnh scan / Sách giáo khoa: ${name} (${totalPages} trang)]\n` +
            (fullText ? `${fullText}\n\n` : '') +
            `(Hệ thống đã tự động kết xuất ${pageImages.length} trang ảnh chất lượng cao. Hãy bấm "Nhận diện OCR bằng AI" để AI Vision trích xuất toàn bộ công thức Toán - Lý - Hóa, văn bản và hình vẽ chi tiết!)`;

          return {
            id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: name,
            type: 'pdf',
            text: scanNotice,
            wordCount: totalRealWords > 15 ? totalRealWords : 0,
            size: file.size,
            imageBase64: pageImages[0],
            images: pageImages,
            isOcrDone: false, // Để hiện nút "Nhận diện OCR bằng AI"
            isScannedPdf: true
          };
        }

        // PDF có đầy đủ văn bản số
        return {
          id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: name,
          type: 'pdf',
          text: fullText || `[File PDF: ${name} (Không tìm thấy văn bản trích xuất)]`,
          wordCount: totalRealWords,
          size: file.size,
          imageBase64: pageImages[0] || null,
          images: pageImages,
          isOcrDone: true,
          isScannedPdf: false
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
          images: [],
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
        images: [base64],
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
    const allImages = state.uploadedFiles.flatMap(f => (f.images && f.images.length > 0) ? f.images : (f.imageBase64 ? [f.imageBase64] : []));

    if (totalFiles === 1) {
      const single = state.uploadedFiles[0];
      state.currentDoc.title = single.name;
      state.currentDoc.text = single.text;
      state.currentDoc.type = single.type;
      state.currentDoc.imageBase64 = single.imageBase64 || (single.images && single.images[0]) || null;
      state.currentDoc.images = (single.images && single.images.length > 0) ? single.images : (single.imageBase64 ? [single.imageBase64] : []);
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

    // Nút Nhận diện OCR: Hiện lên nếu có ít nhất 1 ảnh bài học hoặc trang PDF scan
    if (dom.btnOcrImage) {
      if (imageCount > 0) {
        dom.btnOcrImage.classList.remove('hidden');
        if (dom.ocrBtnText) {
          const unOcrCount = state.uploadedFiles.filter(f => (f.imageBase64 || (f.images && f.images.length > 0)) && !f.isOcrDone).length;
          dom.ocrBtnText.textContent = unOcrCount > 0 
            ? (totalFiles > 1 ? `Nhận diện OCR ${unOcrCount} tài liệu / ảnh` : 'Nhận diện OCR bằng AI Vision')
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

  // Đóng / mở khung hướng dẫn sử dụng nhanh
  window.toggleUserGuide = function() {
    const guideSection = document.getElementById('user-guide-section');
    const guideContent = document.getElementById('user-guide-content');
    const toggleText = document.getElementById('guide-toggle-text');
    const toggleIcon = document.getElementById('guide-toggle-icon');

    if (!guideContent) return;

    const isHidden = guideContent.classList.contains('hidden');
    if (isHidden) {
      guideContent.classList.remove('hidden');
      if (toggleText) toggleText.textContent = 'Thu gọn';
      if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-up text-[10px]';
      if (guideSection) {
        guideSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      guideContent.classList.add('hidden');
      if (toggleText) toggleText.textContent = 'Mở rộng';
      if (toggleIcon) toggleIcon.className = 'fa-solid fa-chevron-down text-[10px]';
    }
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
  }

  // ================= OCR WITH GEMINI VISION (NHẬN DIỆN CÔNG THỨC TOÁN - LÝ - HÓA & HÌNH VẼ CHI TIẾT) =================
  async function runOcrOnCurrentImage() {
    const unOcrFiles = state.uploadedFiles.filter(f => (f.imageBase64 || (f.images && f.images.length > 0)) && !f.isOcrDone);
    const targetFiles = unOcrFiles.length > 0 ? unOcrFiles : state.uploadedFiles.filter(f => f.imageBase64 || (f.images && f.images.length > 0));

    if (targetFiles.length === 0 && !state.currentDoc.imageBase64 && (!state.currentDoc.images || state.currentDoc.images.length === 0)) {
      showToast('Không tìm thấy ảnh hoặc trang tài liệu nào để nhận diện OCR!', 'warning');
      return;
    }

    // Thu thập tất cả các trang ảnh bài học cần OCR (bao gồm các trang PDF scan đã render)
    let itemsToProcess = [];
    if (targetFiles.length > 0) {
      targetFiles.forEach(f => {
        if (f.images && f.images.length > 0) {
          f.images.forEach((imgBase64, pageIdx) => {
            itemsToProcess.push({
              fileId: f.id,
              name: `${f.name} (Trang ${pageIdx + 1})`,
              imageBase64: imgBase64
            });
          });
        } else if (f.imageBase64) {
          itemsToProcess.push({
            fileId: f.id,
            name: f.name,
            imageBase64: f.imageBase64
          });
        }
      });
    } else if (state.currentDoc.images && state.currentDoc.images.length > 0) {
      state.currentDoc.images.forEach((imgBase64, pageIdx) => {
        itemsToProcess.push({
          fileId: 'currentDoc',
          name: `${state.currentDoc.title || 'Tài liệu'} (Trang ${pageIdx + 1})`,
          imageBase64: imgBase64
        });
      });
    } else {
      itemsToProcess.push({
        fileId: 'single_img',
        name: state.currentDoc.title || 'Ảnh bài học',
        imageBase64: state.currentDoc.imageBase64
      });
    }

    try {
      showLoading(`Đang nhận diện OCR qua AI...`, `Đang trích xuất công thức Toán - Lý - Hóa và phân tích hình vẽ từ ${itemsToProcess.length} trang ảnh bài học...`);

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

      let extractedFull = '';

      // ================= ĐỘT PHÁ TỐI ƯU HÓA OCR ĐA TRANG (PARALLEL BATCHING) =================
      // Thay vì chạy tuần tự từng trang gây chậm khi có 10 trang, hệ thống tự động:
      // 1. Nếu có 1 trang: Nhận diện trực tiếp.
      // 2. Nếu có từ 2 trang trở lên (đặc biệt tài liệu/ảnh 10 trang): Chia thành các cụm 5 trang và chạy SONG SONG đồng thời qua Promise.all.
      // Tốc độ tăng tốc gấp 8 - 10 lần (10 trang chỉ mất ~5-8 giây thay vì 60-80 giây)!
      if (itemsToProcess.length === 1) {
        const item = itemsToProcess[0];
        showLoading(`Đang nhận diện OCR...`, item.name);
        extractedFull = await callGeminiWithRotation(prompt, item.imageBase64, {
          isJson: false,
          maxTokens: 4000,
          taskName: `Đang nhận diện OCR: ${item.name}...`
        });
      } else {
        const chunkSize = 5; // Cụm tối ưu nhất cho Gemini Multimodal Vision (5 ảnh/request)
        const chunks = [];
        for (let i = 0; i < itemsToProcess.length; i += chunkSize) {
          chunks.push({
            chunkIndex: Math.floor(i / chunkSize) + 1,
            startPage: i + 1,
            endPage: Math.min(i + chunkSize, itemsToProcess.length),
            items: itemsToProcess.slice(i, i + chunkSize)
          });
        }

        showLoading(
          `Đang nhận diện song song siêu tốc ${itemsToProcess.length} trang ảnh...`,
          `Chia làm ${chunks.length} cụm trang (${chunks.map(c => `Trang ${c.startPage}-${c.endPage}`).join(', ')}) xử lý đồng thời qua Gemini Vision...`
        );

        const chunkPromises = chunks.map(async (chk) => {
          const chunkImages = chk.items.map(it => it.imageBase64).filter(Boolean);
          const chunkPrompt = `${prompt}

LƯU Ý ĐẶC BIỆT KHI NHẬN DIỆN CỤM TRANG BÀI HỌC (TỪ TRANG ${chk.startPage} ĐẾN TRANG ${chk.endPage}):
- Đây là ${chk.items.length} bức ảnh liên tiếp thuộc CÙNG MỘT BÀI HỌC được chụp tuần tự theo thứ tự từ Trang ${chk.startPage} đến Trang ${chk.endPage}.
- Hãy đọc cẩn thận và kết nối các phần kiến thức liền mạch từ trang đầu đến trang cuối thành một bài học hoàn chỉnh.
- Giữ nguyên toàn bộ tiêu đề, công thức Toán - Lý - Hóa dưới dạng KaTeX ($...$ hoặc $$...$$) và phần phân tích hình vẽ/mạch điện nếu có.`;

          try {
            const chunkResult = await callGeminiWithRotation(chunkPrompt, chunkImages, {
              isJson: false,
              maxTokens: 4000,
              taskName: `Đang nhận diện song song Cụm ${chk.chunkIndex}/${chunks.length} (Trang ${chk.startPage} - ${chk.endPage})...`
            });
            return {
              chunkIndex: chk.chunkIndex,
              startPage: chk.startPage,
              endPage: chk.endPage,
              text: chunkResult
            };
          } catch (batchErr) {
            console.warn(`Lỗi nhận diện gộp cụm ${chk.chunkIndex}, tự động fallback nhận diện từng trang:`, batchErr);
            const subParts = [];
            for (let j = 0; j < chk.items.length; j++) {
              const subItem = chk.items[j];
              const pRes = await callGeminiWithRotation(prompt, subItem.imageBase64, {
                isJson: false,
                maxTokens: 3500,
                taskName: `Đang nhận diện OCR trang ${chk.startPage + j}/${itemsToProcess.length}...`
              });
              subParts.push(`=== [TRANG ${chk.startPage + j}: ${subItem.name}] ===\n` + pRes);
            }
            return {
              chunkIndex: chk.chunkIndex,
              startPage: chk.startPage,
              endPage: chk.endPage,
              text: subParts.join('\n\n')
            };
          }
        });

        const results = await Promise.all(chunkPromises);
        results.sort((a, b) => a.chunkIndex - b.chunkIndex);

        extractedFull = results
          .map(r => chunks.length > 1 ? `=== [TÀI LIỆU TỪ TRANG ${r.startPage} ĐẾN TRANG ${r.endPage}] ===\n` + r.text : r.text)
          .join('\n\n');
      }

      // Cập nhật trạng thái cho tất cả file nguồn
      targetFiles.forEach(f => {
        f.isOcrDone = true;
        f.text = extractedFull;
        f.wordCount = countWords(extractedFull);
      });
      state.currentDoc.text = extractedFull;
      state.currentDoc.wordCount = countWords(extractedFull);

      hideLoading();
      refreshMultiDocumentsState();

      // Hiển thị ngay hộp thoại xác nhận nội dung trích xuất
      dom.extractedTextArea.value = state.currentDoc.text;
      dom.extractedWordCount.textContent = `${state.currentDoc.wordCount} từ`;
      dom.extractedTextModal.classList.remove('hidden');

      showToast(`Đã nhận diện OCR thành công ${itemsToProcess.length} trang ảnh (${state.currentDoc.wordCount} từ)!`, 'success');
    } catch (e) {
      hideLoading();
      showToast(e.message, 'error');
    }
  }

  // ================= TAB NAVIGATION LOGIC =================
  function switchTab(targetId) {
    if (!targetId) return;
    let cleanId = targetId;
    if (cleanId === 'mindmap') cleanId = 'tab-mindmap';
    if (cleanId === 'summary') cleanId = 'tab-summary';
    if (cleanId === 'quiz') cleanId = 'tab-quiz';
    if (cleanId === 'beam' || cleanId === 'flashcard') cleanId = 'tab-beam';
    if (!cleanId.startsWith('tab-')) cleanId = 'tab-' + cleanId;

    // Update Tab Buttons UI
    dom.tabButtons.forEach(b => {
      const bTab = b.getAttribute('data-tab');
      if (bTab === cleanId) {
        b.classList.add('active', 'text-indigo-600', 'border-indigo-600', 'bg-white', 'shadow-xs');
        b.classList.remove('border-transparent', 'text-slate-500');
      } else {
        b.classList.remove('active', 'text-indigo-600', 'border-indigo-600', 'bg-white', 'shadow-xs');
        b.classList.add('border-transparent', 'text-slate-500');
      }
    });

    // Update Panes
    dom.tabPanes.forEach(pane => {
      if (pane.id === cleanId) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });

    // If switched to Mindmap and instance exists, fit & center view
    if (cleanId === 'tab-mindmap' && state.markmapInstance) {
      setTimeout(() => state.markmapInstance.fit && state.markmapInstance.fit(), 80);
      setTimeout(() => state.markmapInstance.fit && state.markmapInstance.fit(), 250);
      setTimeout(() => state.markmapInstance.fit && state.markmapInstance.fit(), 450);
    }

    // If switched to Summary, trigger KaTeX math rendering immediately
    if (cleanId === 'tab-summary') {
      const sumEl = dom.tabSummary || document.getElementById('tab-summary');
      if (sumEl) {
        setTimeout(() => renderAllMath(sumEl), 40);
        setTimeout(() => renderAllMath(sumEl), 200);
      }
    }
  }
  window.switchTab = switchTab;

  dom.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      switchTab(targetId);
    });
  });

  // ================= BỘ CHUẨN HÓA CÔNG THỨC KHOA HỌC CHO SƠ ĐỒ TƯ DUY =================
  // Chuyển đổi công thức LaTeX trong Markdown sang dạng Unicode khoa học rõ đẹp trên các nhánh Sơ đồ tư duy
  // Giúp các nhánh sơ đồ hiển thị liền mạch, tránh vỡ layout và dồn cục công thức lên đỉnh (0, 0) của SVG
  function formatMathForMindmap(text) {
    if (!text || typeof text !== 'string') return '';
    let s = text;

    // 1. Khử môi trường cases (hệ phương trình)
    s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (_, inner) => {
      return '{ ' + inner.replace(/\\\\/g, '; ').replace(/&/g, ' ').replace(/\s+/g, ' ').trim() + ' }';
    });

    // 2. Khử ma trận / array nếu có
    s = s.replace(/\\begin\{[a-zA-Z]+\}([\s\S]*?)\\end\{[a-zA-Z]+\}/g, '$1');

    // 3. Phân số: \frac{a}{b} -> (a / b)
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
    s = s.replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');

    // 4. Căn bậc hai: \sqrt{a} -> √(a), \sqrt[n]{a} -> ⁿ√(a)
    s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, '$1√($2)');
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, '√($1)');

    // 5. Nội dung text trong công thức: \text{...}, \mathrm{...}, \mathbf{...}
    s = s.replace(/\\(text|mathrm|mathbf|mathit|textbf|textit)\{([^{}]+)\}/g, '$2');

    // 6. Ký hiệu Hy Lạp, Toán học & Khoa học thông dụng
    const mathSymbols = {
      '\\\\Delta': 'Δ', '\\\\pi': 'π', '\\\\alpha': 'α', '\\\\beta': 'β', '\\\\gamma': 'γ',
      '\\\\theta': 'θ', '\\\\lambda': 'λ', '\\\\omega': 'ω', '\\\\Omega': 'Ω', '\\\\mu': 'μ',
      '\\\\sigma': 'σ', '\\\\phi': 'φ', '\\\\varphi': 'φ', '\\\\AA': 'Å',
      '\\\\cdot': '·', '\\\\times': '×', '\\\\div': '÷',
      '\\\\neq': '≠', '\\\\ne': '≠', '\\\\leq': '≤', '\\\\le': '≤', '\\\\geq': '≥', '\\\\ge': '≥',
      '\\\\approx': '≈', '\\\\pm': '±', '\\\\mp': '∓', '\\\\infty': '∞',
      '\\\\degree': '°', '\\\\circ': '°',
      '\\\\Rightarrow': '⇒', '\\\\rightarrow': '→', '\\\\to': '→',
      '\\\\Leftarrow': '⇐', '\\\\leftarrow': '←',
      '\\\\leftrightarrow': '↔', '\\\\Leftrightarrow': '⇔',
      '\\\\parallel': '∥', '\\\\perp': '⊥', '\\\\angle': '∠',
      '\\\\in': '∈', '\\\\notin': '∉', '\\\\subset': '⊂', '\\\\cup': '∪', '\\\\cap': '∩'
    };
    for (const [pattern, repl] of Object.entries(mathSymbols)) {
      s = s.replace(new RegExp(pattern, 'g'), repl);
    }

    // 7. Chuyển đổi chỉ số dưới (Subscript) và số mũ (Superscript) sang Unicode
    const subMap = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
    const supMap = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','n':'ⁿ','m':'ᵐ','x':'ˣ' };

    s = s.replace(/_\{([0-9])\}/g, (_, d) => subMap[d] || d);
    s = s.replace(/_([0-9])/g, (_, d) => subMap[d] || d);
    s = s.replace(/\^\{([0-9+\-nmx])\}/g, (_, d) => supMap[d] || d);
    s = s.replace(/\^([0-9])/g, (_, d) => supMap[d] || d);

    // 8. Dọn dẹp các lệnh định dạng khoảng trắng & ngoặc của LaTeX
    s = s.replace(/\\[,;:!]/g, ' ');
    s = s.replace(/\\(left|right|quad|qquad|limits)/g, '');

    // 9. Bóc tách dấu $ và $$ để không còn kích hoạt auto-render KaTeX trên SVG
    s = s.replace(/\$\$([^\$]+)\$\$/g, '$1');
    s = s.replace(/\$([^\$]+)\$/g, '$1');

    return s;
  }

  // ================= KATEX TOÁN HỌC & CÔNG THỨC KHOA HỌC =================
  function renderAllMath(targetEl) {
    // 1. Chặn tuyệt đối nếu phần tử đích là SVG, nằm trong container Sơ đồ tư duy hoặc có class no-katex
    if (targetEl) {
      const isSvgOrMindmap = (
        (targetEl.tagName && targetEl.tagName.toLowerCase() === 'svg') ||
        (targetEl.id && targetEl.id.includes('markmap')) ||
        (targetEl.classList && (targetEl.classList.contains('markmap') || targetEl.classList.contains('no-katex'))) ||
        (typeof targetEl.closest === 'function' && targetEl.closest('#markmap-svg, .markmap-container, #mindmap-svg-container, .no-katex'))
      );
      if (isSvgOrMindmap) return;
    }

    const doRenderOnElement = (container) => {
      if (!container || !window.renderMathInElement) return;
      if (container.tagName && container.tagName.toLowerCase() === 'svg') return;
      if (typeof container.closest === 'function' && container.closest('#markmap-svg, .no-katex')) return;

      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          ignoredTags: [
            'script', 'noscript', 'style', 'textarea', 'pre', 'code', 'annotation', 'annotation-xml',
            'svg', 'foreignObject', 'text', 'tspan', 'g', 'path', 'circle', 'rect', 'line'
          ],
          ignoredClasses: [
            'katex', 'markmap', 'markmap-svg', 'markmap-node', 'markmap-foreign', 'mm-tree', 'no-katex'
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn('KaTeX render warning:', e);
      }
    };

    const doRender = () => {
      if (targetEl) {
        doRenderOnElement(targetEl);
      } else {
        // Chỉ quét các container học tập thực sự cần công thức Toán / Lý / Hóa, tuyệt đối KHÔNG quét document.body
        const targets = [
          dom.tabSummary || document.getElementById('tab-summary'),
          dom.listTakeaways || document.getElementById('list-takeaways'),
          dom.sectionTakeaways || document.getElementById('section-takeaways'),
          dom.sectionTerms || document.getElementById('section-terms'),
          dom.sectionStrategies || document.getElementById('section-strategies'),
          dom.quizQuestionsList,
          dom.beamCardsGrid,
          dom.beamFocusModal,
          dom.printableExamContainer,
          dom.printableBeamsContainer,
          document.getElementById('practice-workspace-modal'),
          document.getElementById('exam-modal'),
          document.getElementById('modal-detail')
        ].filter(Boolean);

        targets.forEach(tgt => doRenderOnElement(tgt));
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

    // Chuẩn hóa toàn bộ công thức toán học sang dạng Unicode khoa học chuẩn cho Sơ đồ tư duy
    // Vừa hiển thị siêu đẹp, vừa ngăn chặn 100% hiện tượng KaTeX HTML dồn cục lên toạ độ (0, 0) của SVG!
    const displayMarkdown = formatMathForMindmap(markdown);

    // Luôn ẩn hộp rỗng khi có nội dung sơ đồ tư duy
    if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.add('hidden');

    let markmapDrawn = false;
    const hasSvgDom = dom.markmapSvg && dom.markmapSvg.children.length > 0;
    if (!hasSvgDom) {
      state.markmapInstance = null;
    }

    // Chỉ dùng Markmap ngoài NẾU CẢ Transformer VÀ Markmap ĐỀU TỒN TẠI VÀ CHUYỂN ĐỔI THÀNH CÔNG
    if (window.markmap && window.markmap.Transformer && (window.markmap.Markmap || window.Markmap)) {
      try {
        const MarkmapClass = window.markmap.Markmap || window.Markmap;
        const transformer = new window.markmap.Transformer();
        const res = transformer.transform(displayMarkdown);
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

          if (!state.markmapInstance || !hasSvgDom || !state.markmapInstance.setData) {
            if (dom.markmapSvg) dom.markmapSvg.innerHTML = '';
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
          markmapDrawn = (dom.markmapSvg && dom.markmapSvg.children.length > 0);
        }
      } catch (e) {
        console.warn('Lỗi khi vẽ qua Markmap library:', e);
        state.markmapInstance = null;
      }
    }

    // NẾU MARKMAP CHƯA RENDER ĐƯỢC HOẶC SVG VẪN RỖNG -> DÙNG NGAY BỘ VẼ PURE-SVG TỰ THÂN ĐẢM BẢO 100% HIỂN THỊ!
    if (!markmapDrawn || !dom.markmapSvg || dom.markmapSvg.children.length === 0) {
      const tree = markdownToMarkmapTree(displayMarkdown);
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
${optimizeTextForAi(state.currentDoc.text, 6500)}`;

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
    const sumTab = dom.tabSummary || document.getElementById('tab-summary');
    const takeawaysList = dom.listTakeaways || document.getElementById('list-takeaways');
    if (takeawaysList) renderAllMath(takeawaysList);
    if (sumTab) renderAllMath(sumTab);
    setTimeout(() => {
      if (takeawaysList) renderAllMath(takeawaysList);
      if (sumTab) renderAllMath(sumTab);
    }, 60);
    setTimeout(() => {
      if (takeawaysList) renderAllMath(takeawaysList);
      if (sumTab) renderAllMath(sumTab);
    }, 250);
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
${optimizeTextForAi(state.currentDoc.text, 6500)}`;

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

    // Save quiz attempt to active user account profile (Learning Analytics & Progress)
    if (typeof recordQuizScoreToAccount === 'function') {
      recordQuizScoreToAccount({
        title: state.currentDoc.title || 'Bài tập khảo thí',
        score: parseFloat(finalScore),
        correctTotal: correctTotal,
        totalQ: totalQ,
        percentage: Math.round((correctTotal / totalQ) * 100),
        tierBreakdown: {
          easy: `${tierScores.easy.correct}/${tierScores.easy.total}`,
          medium: `${tierScores.medium.correct}/${tierScores.medium.total}`,
          hard: `${tierScores.hard.correct}/${tierScores.hard.total}`
        }
      });
    } else if (state.currentUser && typeof window.recordQuizScoreToAccount === 'function') {
      window.recordQuizScoreToAccount({
        title: state.currentDoc.title || 'Bài tập khảo thí',
        score: parseFloat(finalScore),
        correctTotal: correctTotal,
        totalQ: totalQ,
        percentage: Math.round((correctTotal / totalQ) * 100),
        tierBreakdown: {
          easy: `${tierScores.easy.correct}/${tierScores.easy.total}`,
          medium: `${tierScores.medium.correct}/${tierScores.medium.total}`,
          hard: `${tierScores.hard.correct}/${tierScores.hard.total}`
        }
      });
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
${optimizeTextForAi(state.currentDoc.text, 7500)}`;

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
  function renderBeams(rawBeams) {
    if (!rawBeams) return;
    let beamsArray = rawBeams;
    if (!Array.isArray(beamsArray)) {
      if (typeof beamsArray === 'object') {
        const extracted = beamsArray.flashcards || beamsArray.cards || beamsArray.beams || beamsArray.items || beamsArray.data || Object.values(beamsArray).find(v => Array.isArray(v));
        if (Array.isArray(extracted)) {
          beamsArray = extracted;
        } else {
          beamsArray = [beamsArray];
        }
      } else {
        beamsArray = [];
      }
    }
    state.beamData = beamsArray;
    dom.beamEmptyState.classList.add('hidden');
    dom.beamCardsGrid.classList.remove('hidden');

    updateBeamMasteryUI();

    dom.beamCardsGrid.innerHTML = '';
    beamsArray.forEach((beam, bIndex) => {
      const cardContainer = document.createElement('div');
      cardContainer.className = 'min-h-[380px] sm:min-h-[330px] h-[380px] sm:h-[330px] perspective-1000 select-none';

      const inner = document.createElement('div');
      inner.className = 'flip-card-inner cursor-pointer shadow-md rounded-2xl';
      inner.id = `beam-inner-${beam.id}`;

      // Front Face
      const front = document.createElement('div');
      front.className = 'flip-card-front bg-white p-5 border border-slate-200 flex flex-col justify-between overflow-y-auto';
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
          <div class="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 max-h-48 overflow-y-auto">
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
      back.className = 'flip-card-back bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-5 flex flex-col justify-between overflow-y-auto';
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
    // Chỉ loại bỏ gạch đầu dòng ở đầu câu/đầu dòng, bảo toàn dấu trừ (-) trong biểu thức toán học
    s = s.replace(/(^|\n|\.\s*)[–—•*+◦▪▫►▶✓✔✕✖★☆]\s*/g, '$1 ');
    s = s.replace(/(^|\n|\.\s*)-\s+/g, '$1 ');
    s = s.replace(/[–—•◦▪▫►▶✓✔✕✖★☆]/g, ' ');

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
    s = s.replace(/\s*\+\s*/g, ' cộng ');
    s = s.replace(/\s*-\s*/g, ' trừ ');
    s = s.replace(/\s*=\s*/g, ' bằng ');
    s = s.replace(/\s*>\s*/g, ' lớn hơn ');
    s = s.replace(/\s*<\s*/g, ' nhỏ hơn ');

    // 6. LOẠI BỎ TOÀN BỘ KÝ TỰ ĐẶC BIỆT CÒN LẠI ĐỂ CHỈ ĐỌC NỘI DUNG VĂN BẢN THUẦN TÚY:
    // - Dấu ngoặc đơn, ngoặc vuông, ngoặc nhọn: thay bằng dấu phẩy để giọng đọc ngắt câu tự nhiên thay vì phát âm "mở ngoặc", "đóng ngoặc"
    s = s.replace(/[\(\)\[\]\{\}]/g, ', ');
    // - Dấu gạch chéo /, \: thay bằng khoảng trắng
    s = s.replace(/[\/\\]/g, ' ');
    // - Các ký tự Markdown & đặc biệt
    s = s.replace(/[%]/g, ' phần trăm ');
    s = s.replace(/[&]/g, ' và ');
    s = s.replace(/[#*_`~|@$^]/g, ' ');
    // - Dấu ngoặc kép, nháy đơn
    s = s.replace(/["'“”‘’«»]/g, ' ');
    // - Dấu chấm lửng ...
    s = s.replace(/\.{2,}/g, '. ');

    // 7. TỐI ƯU HÓA NGỮ ÂM & PHÁT ÂM RÕ CHỮ, TRÁNH NUỐT TỪ (ĐẶC BIỆT LÀ CẶP TỪ NGHỀ NGHIỆP, KINH NGHIỆM)
    // Tách các cụm từ có phụ âm đầu lặp lại hoặc thanh điệu dễ bị lướt/nuốt khi đọc nhanh:
    s = s.replace(/\bnghề\s+nghiệp\b/gi, 'nghề, nghiệp');
    s = s.replace(/\bhướng\s+nghiệp\b/gi, 'hướng, nghiệp');
    s = s.replace(/\bchuyên\s+nghiệp\b/gi, 'chuyên, nghiệp');
    s = s.replace(/\bdoanh\s+nghiệp\b/gi, 'doanh, nghiệp');
    s = s.replace(/\bkinh\s+nghiệm\b/gi, 'kinh, nghiệm');
    s = s.replace(/\btrải\s+nghiệm\b/gi, 'trải, nghiệm');
    s = s.replace(/\bthực\s+nghiệm\b/gi, 'thực, nghiệm');
    s = s.replace(/\bxét\s+nghiệm\b/gi, 'xét, nghiệm');
    s = s.replace(/\btốt\s+nghiệp\b/gi, 'tốt, nghiệp');
    s = s.replace(/\bkhởi\s+nghiệp\b/gi, 'khởi, nghiệp');
    s = s.replace(/\bsự\s+nghiệp\b/gi, 'sự, nghiệp');
    s = s.replace(/\bthất\s+nghiệp\b/gi, 'thất, nghiệp');
    s = s.replace(/\bnông\s+nghiệp\b/gi, 'nông, nghiệp');
    s = s.replace(/\bcông\s+nghiệp\b/gi, 'công, nghiệp');
    s = s.replace(/\blâm\s+nghiệp\b/gi, 'lâm, nghiệp');
    s = s.replace(/\bngư\s+nghiệp\b/gi, 'ngư, nghiệp');
    s = s.replace(/\bhọc\s+nghề\b/gi, 'học, nghề');
    s = s.replace(/\bdạy\s+nghề\b/gi, 'dạy, nghề');
    s = s.replace(/\blàng\s+nghề\b/gi, 'làng, nghề');

    // 8. Làm sạch các dấu phẩy, chấm lặp và khoảng trắng dư thừa
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
    if (window._sharedTtsAudio) {
      try {
        window._sharedTtsAudio.pause();
        window._sharedTtsAudio.currentTime = 0;
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    activeSpeechUtterance = null;
    activeSpeechUtterances = [];
    if (window._activeSpeechUtterances) {
      window._activeSpeechUtterances = [];
    }

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

  // Quản lý phong cách & tốc độ giọng đọc (Mặc định: 1.0x Chuẩn mực, tròn vành rõ chữ, không nuốt từ)
  state.ttsSpeed = 1.0;
  state.voiceModeIndex = 0;
  const voiceModes = [
    { label: 'Tiêu chuẩn (1.0x)', speed: 1.0, pitch: 1.0, desc: 'Chuẩn mực, phát âm tròn vành rõ chữ từng từ' },
    { label: 'Hoạt bát (1.1x)', speed: 1.1, pitch: 1.04, desc: 'Tươi vui, hoạt bát, dễ nhớ bài' },
    { label: 'Cấp tốc (1.2x)', speed: 1.2, pitch: 1.06, desc: 'Nhanh nhẹn, ôn bài cấp tốc' }
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

  // Tách văn bản thành các đoạn phát âm tự nhiên, tròn vành rõ chữ, không sót bất kỳ từ nào
  function splitTextIntoSpeechSentences(text) {
    if (!text) return [];

    // 1. Tách văn bản theo các dấu kết thúc câu hoặc xuống dòng (. ? ! hoặc dòng mới)
    // Đòi hỏi sau dấu chấm phải có khoảng trắng hoặc xuống dòng để tránh tách nhầm 3.14 hay công thức
    const rawSentences = text.split(/(?:[\r\n]+|[.?!]+[\s\t]+)/);
    const chunks = [];
    let currentBuffer = '';

    rawSentences.forEach(sentence => {
      let s = sentence.trim();
      s = s.replace(/^[,\.\s;:]+|[,\.\s;:]+$/g, '').trim();
      if (!s) return;

      // Nếu câu quá dài (> 120 ký tự), chia câu theo các dấu ngắt câu tự nhiên (dấu phẩy, chấm phẩy, hai chấm)
      // TUYỆT ĐỐI KHÔNG chia theo từ (như "và", "hoặc") để bảo toàn 100% từ ngữ trong câu!
      let subParts = [];
      if (s.length > 120 && /[,;:]/.test(s)) {
        const rawParts = s.split(/[,;:]\s+/);
        rawParts.forEach(p => {
          const pt = p.trim();
          if (pt) subParts.push(pt);
        });
      } else if (s.length > 130) {
        // Nếu một câu không có dấu phẩy mà dài > 130 ký tự, tách theo từ an toàn
        const words = s.split(/\s+/);
        let wBuf = '';
        words.forEach(w => {
          if ((wBuf + ' ' + w).length <= 110) {
            wBuf = (wBuf ? wBuf + ' ' : '') + w;
          } else {
            if (wBuf) subParts.push(wBuf);
            wBuf = w;
          }
        });
        if (wBuf) subParts.push(wBuf);
      } else {
        subParts = [s];
      }

      subParts.forEach(part => {
        const p = part.trim();
        if (!p) return;

        // Gom các câu ngắn thành đoạn phát âm tự nhiên (khoảng 80 - 130 ký tự)
        // Kích thước này chuẩn xác tuyệt đối cho cả Google TTS và WebSpeech, không bao giờ bị cắt chữ hay ngắt ngang
        if (currentBuffer.length === 0) {
          currentBuffer = p;
        } else if ((currentBuffer + ', ' + p).length <= 130) {
          currentBuffer += ', ' + p;
        } else {
          chunks.push(currentBuffer.trim());
          currentBuffer = p;
        }
      });
    });

    if (currentBuffer.trim()) {
      chunks.push(currentBuffer.trim());
    }

    return chunks.length > 0 ? chunks : [text.trim()];
  }

  // Phát âm trực tuyến Chị Google HD (hỗ trợ qua Proxy /api/tts và direct Google TTS fallback kèm tải trước thông minh)
  function playOnlineAudioStream(chunks, lang = 'vi', onDone = null, isSequence = false) {
    if (!chunks || chunks.length === 0) {
      if (!isSequence) stopAllSpeech();
      if (onDone) onDone();
      return;
    }

    let index = 0;
    if (!window._sharedTtsAudio) {
      window._sharedTtsAudio = new Audio();
    }
    const audio = window._sharedTtsAudio;
    activeSpeechAudio = audio;

    function buildTtsUrl(text) {
      const cleanChunk = text.replace(/[,\.;:!\?]+$/, '').trim();
      let safeText = cleanChunk;
      if (safeText.length > 180) {
        const lastSpace = safeText.lastIndexOf(' ', 180);
        safeText = lastSpace > 100 ? safeText.slice(0, lastSpace) : safeText.slice(0, 180);
      }
      return `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(safeText)}`;
    }

    // Cơ chế tải trước (Preload) câu kế tiếp để khi câu hiện tại đọc xong là có sẵn âm thanh ngay lập tức
    let nextPreloadAudio = null;
    function preloadNextChunk(idx) {
      if (idx < chunks.length) {
        try {
          const url = buildTtsUrl(chunks[idx]);
          nextPreloadAudio = new Audio();
          nextPreloadAudio.src = url;
          nextPreloadAudio.preload = 'auto';
        } catch (e) {}
      }
    }

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

      let safeText = cleanChunk;
      if (safeText.length > 180) {
        const lastSpace = safeText.lastIndexOf(' ', 180);
        safeText = lastSpace > 100 ? safeText.slice(0, lastSpace) : safeText.slice(0, 180);
      }

      const primaryUrl = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(safeText)}`;
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(safeText)}`;

      // Bắt đầu tải trước câu tiếp theo ngay lập tức để chuyển câu mượt mà
      preloadNextChunk(index);

      audio.src = primaryUrl;
      audio.playbackRate = state.ttsSpeed || 1.0;

      let advanced = false;
      const advance = () => {
        if (advanced) return;
        advanced = true;
        if (isSpeaking) {
          playNextAudio();
        }
      };

      audio.onended = advance;
      audio.onerror = (e) => {
        console.warn('[SmartEdu TTS] Primary /api/tts failed, trying direct Google TTS fallback:', e);
        if (audio.src !== fallbackUrl) {
          audio.src = fallbackUrl;
          audio.play().catch(() => advance());
        } else {
          advance();
        }
      };

      audio.play().catch(err => {
        console.warn('[SmartEdu TTS] Audio play error, trying fallback:', err);
        if (audio.src !== fallbackUrl) {
          audio.src = fallbackUrl;
          audio.play().catch(() => advance());
        } else {
          advance();
        }
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
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}

    let chunkIndex = 0;
    let watchdogTimer = null;

    // Lưu mảng toàn cục trên window chống Garbage Collection của V8
    window._activeSpeechUtterances = window._activeSpeechUtterances || [];

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

        window._activeSpeechUtterances.push(utterance);
        if (window._activeSpeechUtterances.length > 10) {
          window._activeSpeechUtterances.shift();
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
            setTimeout(playChunk, 60);
          }
        };

        utterance.onend = () => {
          advance();
        };

        utterance.onerror = (e) => {
          console.warn('[SmartEdu TTS] WebSpeech error on chunk:', e);
          // Nếu gặp lỗi ở ngay câu đầu tiên trên thiết bị di động, tự động chuyển sang Online Audio Stream
          if (chunkIndex <= 1 && (!isSequence)) {
            console.warn('[SmartEdu TTS] First chunk error, falling back to online audio stream');
            playOnlineAudioStream(chunks, langCode.startsWith('en') ? 'en' : 'vi', onDone, isSequence);
            return;
          }
          advance();
        };

        // BẢO VỆ TUYỆT ĐỐI (WATCHDOG TIMER):
        // Nếu onend bị nuốt chửng bởi Android Chrome, bộ đếm này sẽ giải phóng và chuyển sang câu tiếp
        const safeTimeoutMs = Math.max(3000, Math.round((textChunk.length * 100) / (rate || 1.15)) + 3000);
        watchdogTimer = setTimeout(() => {
          if (isSpeaking && !hasAdvanced) {
            console.warn('[SmartEdu TTS] Watchdog force advancing chunk:', textChunk.slice(0, 30));
            try {
              if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
              }
            } catch (err) {}
            advance();
          }
        }, safeTimeoutMs);

        // Kích hoạt phát âm
        if (window.speechSynthesis.paused) {
          try { window.speechSynthesis.resume(); } catch (e) {}
        }
        window.speechSynthesis.speak(utterance);

      } catch (err) {
        console.warn('[SmartEdu TTS] speak catch error, fallback:', err);
        if (chunkIndex <= 1 && (!isSequence)) {
          playOnlineAudioStream(chunks, langCode.startsWith('en') ? 'en' : 'vi', onDone, isSequence);
        } else {
          playChunk();
        }
      }
    }

    // Cho 50ms để lệnh cancel trước đó giải phóng
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
      // 1. TRÊN ĐIỆN THOẠI DI ĐỘNG (ANDROID / IPHONE / TABLET):
      // Giọng WebSpeech nội bộ của điện thoại (Android Google TTS) thường rè, máy móc, nuốt âm và hay rớt chữ.
      // DÙNG NGAY GIỌNG CHỊ GOOGLE ONLINE HD (/api/tts):
      // Chuẩn tiếng Việt 100%, cực kỳ tròn vành rõ chữ, trong trẻo, không bao giờ bị rớt bất kỳ chữ nào!
      if (isMobile) {
        if (!isSequence) showToast(`🔊 Đang đọc [Chị Google HD - ${activeMode.label}]: "${title.slice(0, 30)}..."`, 'info');
        playOnlineAudioStream(chunks, 'vi', onDone, isSequence);
        return;
      }

      // 2. TRÊN MÁY TÍNH (DESKTOP):
      // Ưu tiên giọng Microsoft Hoài My (Edge/Windows) nếu có, vì đây là giọng Neural tự nhiên của máy tính
      if (voice && (voice.name.includes('HoaiMy') || voice.name.includes('Hoài My'))) {
        if (!isSequence) showToast(`🔊 Đang đọc [Hoài My Neural - ${activeMode.label}]: "${title.slice(0, 30)}..."`, 'info');
        speakWithWebSpeech(chunks, voice, 'vi-VN', activeMode.speed, activeMode.pitch, onDone, isSequence);
      } else {
        // Mọi trường hợp khác trên máy tính: Dùng Chị Google HD để đảm bảo chất lượng phát âm cao nhất
        if (!isSequence) showToast(`🔊 Đang đọc [Chị Google HD - ${activeMode.label}]: "${title.slice(0, 30)}..."`, 'info');
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

QUY TẮC CẤU TRÚC JSON BẮT BUỘC (CHỐNG LỖI KHI TÀI LIỆU CÓ DUNG LƯỢNG LỚN & NHIỀU CHỮ):
- Trả về đúng mảng JSON gồm 5 đến 7 thẻ học tập cô đọng.
- Các trường "takeaway", "frontQuestion", "backAnswer", "actionPrompt" viết câu văn súc tích (dưới 50 từ/trường), tuyệt đối không ngắt dòng ngang thô sơ trong chuỗi string (dùng \\n nếu cần xuống dòng).
- Bắt buộc đóng ngoặc vuông ] kết thúc mảng JSON hợp lệ.

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
${optimizeTextForAi(state.currentDoc.text, 6500)}`;

    try {
      const imgToSend = getImagesToSend();
      const rawRes = await callGeminiWithRotation(prompt, imgToSend, {
        isJson: true,
        maxTokens: 4000,
        taskName: 'Đang tạo bộ Thẻ học tập Flashcards AI...'
      });
      const parsed = safeParseJson(rawRes);
      renderBeams(parsed);
      showToast(`Đã tạo xong Bộ ${state.beamData.length} Thẻ học tập AI!`, 'success');
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

  // Nút 1: Chụp ảnh bằng Camera ngay (capture="environment")
  const btnCameraCapture = document.getElementById('btn-camera-capture');
  const cameraCaptureInput = document.getElementById('camera-capture-input');
  if (btnCameraCapture && cameraCaptureInput) {
    btnCameraCapture.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      cameraCaptureInput.click();
    });
    cameraCaptureInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleUploadedFiles(e.target.files);
      }
      e.target.value = '';
    });
  }

  // Nút 2: Chọn ảnh từ Bộ sưu tập / Album (Google Photos / iOS Album)
  const btnGalleryPick = document.getElementById('btn-gallery-pick');
  const galleryPickInput = document.getElementById('gallery-pick-input');
  if (btnGalleryPick && galleryPickInput) {
    btnGalleryPick.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      galleryPickInput.click();
    });
    galleryPickInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleUploadedFiles(e.target.files);
      }
      e.target.value = '';
    });
  }

  dom.dropZone.addEventListener('click', (e) => {
    if (e.target.closest('#btn-camera-capture') || e.target.closest('#btn-gallery-pick') || e.target.closest('#camera-capture-input') || e.target.closest('#gallery-pick-input') || e.target.closest('#btn-camera-action') || e.target.closest('#camera-input')) {
      return;
    }
    if (e.target === dom.fileInput) return;
    dom.fileInput.click();
  });

  dom.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleUploadedFiles(e.target.files);
    }
    e.target.value = '';
  });

  if (dom.cameraInput) {
    dom.cameraInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleUploadedFiles(e.target.files);
      }
      e.target.value = '';
    });
  }

  if (dom.btnAddMoreFiles) {
    dom.btnAddMoreFiles.addEventListener('click', () => dom.fileInput.click());
  }
  if (dom.btnAddMoreCamera) {
    dom.btnAddMoreCamera.addEventListener('click', () => {
      if (cameraCaptureInput) cameraCaptureInput.click();
      else if (dom.cameraInput) dom.cameraInput.click();
    });
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

  // ================= THƯ VIỆN SƠ ĐỒ TƯ DUY CÁ NHÂN (ĐỒNG BỘ TÀI KHOẢN ĐÁM MÂY) =================
  function openMindmapLibraryModal() {
    renderMindmapLibrary();
    if (dom.modalMindmapLibrary) dom.modalMindmapLibrary.classList.remove('hidden');
    const m = document.getElementById('modal-mindmap-library');
    if (m) m.classList.remove('hidden');
  }

  function closeMindmapLibraryModal() {
    if (dom.modalMindmapLibrary) dom.modalMindmapLibrary.classList.add('hidden');
    const m = document.getElementById('modal-mindmap-library');
    if (m) m.classList.add('hidden');
  }

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

    // Tự động chuyển sang Tab Sơ đồ tư duy và cuộn mượt xuống để học sinh thấy ngay kết quả
    switchTab('mindmap');
    setTimeout(() => {
      const targetScroll = document.getElementById('tabs-nav') || dom.tabMindmap;
      if (targetScroll) {
        targetScroll.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (state.markmapInstance && state.markmapInstance.fit) {
        state.markmapInstance.fit();
      }
    }, 200);

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
    if (btnInstallPwa && !isMobile) {
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

  // ================= CLOUD WEB STORAGE & AUTHENTICATION GATE =================
  const AVATAR_OPTIONS = ['👨‍🎓', '👩‍🎓', '🧑‍💻', '🦊', '🦁', '🚀', '🌟', '🎯', '💡', '🏆'];

  // DOM Elements for Auth Gate
  const modalAuthGate = document.getElementById('modal-auth-gate');
  const authTabBtnLogin = document.getElementById('auth-tab-btn-login');
  const authTabBtnRegister = document.getElementById('auth-tab-btn-register');
  const formAuthLogin = document.getElementById('form-auth-login');
  const formAuthRegister = document.getElementById('form-auth-register');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const loginRememberMe = document.getElementById('login-remember-me');
  const regFullname = document.getElementById('reg-fullname');
  const regGrade = document.getElementById('reg-grade');
  const regClass = document.getElementById('reg-class');
  const regSchool = document.getElementById('reg-school');
  const regUsername = document.getElementById('reg-username');
  const regPassword = document.getElementById('reg-password');
  const regAvatar = document.getElementById('reg-avatar');
  const regAvatarPicker = document.getElementById('reg-avatar-picker');
  const authCloudStatusText = document.getElementById('auth-cloud-status-text');

  // DOM Elements for Header Profile
  const btnUserAccountMobile = document.getElementById('btn-user-account-mobile');
  const btnUserAccountDesktop = document.getElementById('btn-user-account-desktop');
  const userAvatarMobile = document.getElementById('user-avatar-mobile');
  const userNameMobile = document.getElementById('user-name-mobile');
  const userAvatarDesktop = document.getElementById('user-avatar-desktop');
  const userNameDesktop = document.getElementById('user-name-desktop');
  const userSubtextDesktop = document.getElementById('user-subtext-desktop');
  const userBadgeCountDesktop = document.getElementById('user-badge-count-desktop');
  const btnLogoutHeader = document.getElementById('btn-logout-header');
  const btnLogoutMobile = document.getElementById('btn-logout-mobile');

  // DOM Elements for User Account Modal
  const modalUserAccount = document.getElementById('modal-user-account');
  const btnCloseUserAccount = document.getElementById('btn-close-user-account-modal');
  const btnDoneUserAccount = document.getElementById('btn-done-user-account');
  const tabBtnAccountProgress = document.getElementById('tab-btn-account-progress');
  const tabBtnAccountManage = document.getElementById('tab-btn-account-manage');
  const paneAccountProgress = document.getElementById('pane-account-progress');
  const paneAccountManage = document.getElementById('pane-account-manage');

  const modalUserAvatarLarge = document.getElementById('modal-user-avatar-large');
  const modalUserFullname = document.getElementById('modal-user-fullname');
  const modalUserGradeBadge = document.getElementById('modal-user-grade-badge');
  const modalUserSchoolClass = document.getElementById('modal-user-school-class');
  const btnEditCurrentProfile = document.getElementById('btn-edit-current-profile');

  const accStatTotalTests = document.getElementById('acc-stat-total-tests');
  const accStatMaxScore = document.getElementById('acc-stat-max-score');
  const accStatAvgScore = document.getElementById('acc-stat-avg-score');
  const accStatRatingBadge = document.getElementById('acc-stat-rating-badge');
  const accStatTotalCorrect = document.getElementById('acc-stat-total-correct');
  const accTrendComment = document.getElementById('acc-trend-comment');
  const accChartContainer = document.getElementById('acc-chart-container');
  const accBadgeUnlockedText = document.getElementById('acc-badge-unlocked-text');
  const accBadgesList = document.getElementById('acc-badges-list');
  const accFilterSubject = document.getElementById('acc-filter-subject');
  const accHistoryTableBody = document.getElementById('acc-history-table-body');
  const accHistoryEmpty = document.getElementById('acc-history-empty');
  const btnPrintStudentReport = document.getElementById('btn-print-student-report');

  const accFormContainer = document.getElementById('acc-form-container');
  const accFormTitle = document.getElementById('acc-form-title');
  const accFormUsernameDisplay = document.getElementById('acc-form-username-display');
  const formUserAccount = document.getElementById('form-user-account');
  const inputAccountId = document.getElementById('input-account-id');
  const inputAccountName = document.getElementById('input-account-name');
  const inputAccountSchool = document.getElementById('input-account-school');
  const inputAccountGrade = document.getElementById('input-account-grade');
  const inputAccountClass = document.getElementById('input-account-class');
  const inputAccountNewPassword = document.getElementById('input-account-new-password');
  const inputAccountAvatar = document.getElementById('input-account-avatar');
  const accAvatarPicker = document.getElementById('acc-avatar-picker');
  const btnExportAccountData = document.getElementById('btn-export-account-data');
  const inputImportAccountData = document.getElementById('input-import-account-data');

  // DOM Elements for Learning Libraries (Mindmap, Summary, Flashcards)
  const btnSaveMindmap = document.getElementById('btn-save-mindmap');
  const btnOpenMindmapLibrary = document.getElementById('btn-open-mindmap-library');
  const modalMindmapLibrary = document.getElementById('modal-mindmap-library');
  const btnCloseMindmapLibrary = document.getElementById('btn-close-mindmap-library');
  const btnDoneMindmapLibrary = document.getElementById('btn-done-mindmap-library');
  const mindmapLibraryList = document.getElementById('mindmap-library-list');
  const mindmapLibraryEmpty = document.getElementById('mindmap-library-empty');
  const mindmapLibraryStatus = document.getElementById('mindmap-library-status');

  const btnSaveSummary = document.getElementById('btn-save-summary');
  const btnOpenSummaryLibrary = document.getElementById('btn-open-summary-library');
  const modalSummaryLibrary = document.getElementById('modal-summary-library');
  const btnCloseSummaryLibrary = document.getElementById('btn-close-summary-library');
  const btnDoneSummaryLibrary = document.getElementById('btn-done-summary-library');
  const summaryLibraryList = document.getElementById('summary-library-list');
  const summaryLibraryEmpty = document.getElementById('summary-library-empty');
  const summaryLibraryStatus = document.getElementById('summary-library-status');

  const btnSaveBeams = document.getElementById('btn-save-beams');
  const btnOpenBeamsLibrary = document.getElementById('btn-open-beams-library');
  const modalBeamsLibrary = document.getElementById('modal-beams-library');
  const btnCloseBeamsLibrary = document.getElementById('btn-close-beams-library');
  const btnDoneBeamsLibrary = document.getElementById('btn-done-beams-library');
  const beamsLibraryList = document.getElementById('beams-library-list');
  const beamsLibraryEmpty = document.getElementById('beams-library-empty');
  const beamsLibraryStatus = document.getElementById('beams-library-status');

  const modalFirebaseSettings = document.getElementById('modal-firebase-settings');
  const btnCloseFirebaseSettings = document.getElementById('btn-close-firebase-settings');
  const btnCancelFirebaseSettings = document.getElementById('btn-cancel-firebase-settings');
  const btnSaveFirebaseConfig = document.getElementById('btn-save-firebase-config');
  const btnResetFirebaseConfig = document.getElementById('btn-reset-firebase-config');
  const inputFirebaseConfigJson = document.getElementById('input-firebase-config-json');

  const btnQuizHistory = document.getElementById('btn-quiz-history');

  // Helper: Nhận diện môn học từ tiêu đề tài liệu
  function detectSubjectFromTitle(title) {
    if (!title) return 'Khác';
    const t = title.toLowerCase();
    if (t.includes('toán') || t.includes('hình học') || t.includes('đại số') || t.includes('phương trình')) return 'Toán';
    if (t.includes('khtn') || t.includes('khoa học tự nhiên') || t.includes('vật lí') || t.includes('hóa học') || t.includes('sinh học') || t.includes('điện') || t.includes('ôm')) return 'KHTN';
    if (t.includes('văn') || t.includes('ngữ văn') || t.includes('tiếng việt') || t.includes('thơ') || t.includes('truyện')) return 'Ngữ văn';
    if (t.includes('sử') || t.includes('địa') || t.includes('lịch sử')) return 'Lịch sử - Địa lí';
    if (t.includes('anh') || t.includes('english')) return 'Tiếng Anh';
    return 'Khác';
  }

  // ================= CÔ LẬP VÀ ĐỒNG BỘ DỮ LIỆU RIÊNG TỪNG TÀI KHOẢN =================

  // Nạp toàn bộ dữ liệu CỦA RIÊNG HỌC SINH ĐANG ĐĂNG NHẬP lên giao diện (không lẫn lộn người khác)
  function applyUserSession(user) {
    if (!user) return;
    state.currentUser = user;

    // Đóng Auth Gate NGAY LẬP TỨC ở đầu hàm
    const authGate = document.getElementById('modal-auth-gate');
    if (authGate) {
      authGate.style.display = 'none';
      authGate.classList.add('hidden');
      authGate.classList.remove('flex');
    }
    user.scores = user.scores || [];
    user.mindmaps = user.mindmaps || [];
    user.summaries = user.summaries || [];
    user.flashcards = user.flashcards || [];

    // 1. Cập nhật thanh tiêu đề Header
    updateHeaderAccountUI();

    // 2. Cập nhật các bộ đếm thư viện
    updateSavedMindmapsCount();
    updateSavedSummariesCount();
    updateSavedBeamsCount();

    // 3. Khởi tạo/Hiển thị dữ liệu CỦA RIÊNG HỌC SINH NÀY lên các Tab:
    // Tab 1: Sơ đồ tư duy
    if (user.mindmaps.length > 0) {
      const latestMm = user.mindmaps[0];
      const content = latestMm.markdownContent || latestMm.content || latestMm.markdown || '';
      state.mindmapMarkdown = content;
      if (dom.markmapSvg) dom.markmapSvg.innerHTML = '';
      state.markmapInstance = null;
      renderMindmap(content);
      if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.add('hidden');
      setTimeout(() => {
        if (state.markmapInstance && state.markmapInstance.fit) {
          state.markmapInstance.fit();
        }
      }, 300);
    } else {
      state.mindmapMarkdown = '';
      state.markmapInstance = null;
      if (dom.markmapSvg) dom.markmapSvg.innerHTML = '';
      if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.remove('hidden');
    }

    // Tab 2: Tóm tắt & Gợi ý học tập
    if (user.summaries.length > 0) {
      const latestSum = user.summaries[0];
      renderSummary(latestSum.summaryData || latestSum.content || latestSum);
    } else {
      state.summaryData = null;
      if (dom.summaryEmptyState) dom.summaryEmptyState.classList.remove('hidden');
      if (dom.sectionTakeaways) dom.sectionTakeaways.classList.add('hidden');
      if (dom.sectionTerms) dom.sectionTerms.classList.add('hidden');
      if (dom.sectionStrategies) dom.sectionStrategies.classList.add('hidden');
    }

    // Tab 3: Khảo thí & Chấm điểm (Xóa trắng kết quả phiên trước, sẵn sàng cho bài thi mới)
    state.quizData = [];
    if (dom.interactiveQuizContainer) dom.interactiveQuizContainer.classList.add('hidden');
    if (dom.quizResultCard) dom.quizResultCard.classList.add('hidden');
    if (dom.quizSubmitBar) dom.quizSubmitBar.classList.add('hidden');
    if (dom.quizEmptyState) dom.quizEmptyState.classList.remove('hidden');

    // Tab 4: Thẻ lật thông minh
    if (user.flashcards.length > 0) {
      const latestBm = user.flashcards[0];
      renderBeams(latestBm.cards || latestBm.flashcards || latestBm);
    } else {
      state.beamData = [];
      if (dom.beamCardsGrid) dom.beamCardsGrid.classList.add('hidden');
      if (dom.beamEmptyState) dom.beamEmptyState.classList.remove('hidden');
    }

    // Reset toàn bộ tài liệu đã nạp ở khung input của phiên làm việc trước
    state.uploadedFiles = [];
    state.currentDoc = { title: '', text: '', type: 'text', imageBase64: null, images: [], wordCount: 0 };
    if (dom.uploadedFilesContainer) dom.uploadedFilesContainer.classList.add('hidden');
    if (dom.uploadedFilesItems) dom.uploadedFilesItems.innerHTML = '';
    if (dom.uploadedFilesCount) dom.uploadedFilesCount.textContent = '0';
    if (dom.docPreviewCard) dom.docPreviewCard.classList.add('hidden');
    if (dom.btnOcrImage) dom.btnOcrImage.classList.add('hidden');
    if (dom.rawTextInput) dom.rawTextInput.value = '';
    if (dom.extractedTextArea) dom.extractedTextArea.value = '';
    if (dom.fileInput) dom.fileInput.value = '';
    if (dom.cameraInput) dom.cameraInput.value = '';
    const addMoreF1 = document.getElementById('btn-add-more-files-input');
    if (addMoreF1) addMoreF1.value = '';
    const addMoreC1 = document.getElementById('btn-add-more-camera-input');
    if (addMoreC1) addMoreC1.value = '';

    // Dừng âm thanh và bộ đếm thời gian
    stopAllSpeech();
    if (state.quizTimerInterval) {
      clearInterval(state.quizTimerInterval);
      state.quizTimerInterval = null;
    }
    state.quizUserAnswers = {};
    state.quizSubmitted = false;

    // Cập nhật lại danh sách Thư viện trong DOM chuẩn xác theo tài khoản này
    renderMindmapLibrary();
    renderSummaryLibrary();
    renderBeamsLibrary();

    // Đóng Auth Gate
    if (modalAuthGate) {
      modalAuthGate.style.display = 'none';
      modalAuthGate.classList.add('hidden');
      modalAuthGate.classList.remove('flex');
    }
  }

  // Xóa trắng toàn bộ giao diện và dữ liệu trên màn hình khi khách chưa đăng nhập / khi đăng xuất
  function resetUIForGuest() {
    state.currentUser = null;
    state.mindmapMarkdown = '';
    state.summaryData = null;
    state.quizData = [];
    state.beamData = [];
    state.currentDoc = { title: '', text: '', type: 'text', imageBase64: null, images: [], wordCount: 0 };
    state.uploadedFiles = [];

    // Xóa sạch toàn bộ tài liệu đã nạp ở khung input
    if (dom.uploadedFilesContainer) dom.uploadedFilesContainer.classList.add('hidden');
    if (dom.uploadedFilesItems) dom.uploadedFilesItems.innerHTML = '';
    if (dom.uploadedFilesCount) dom.uploadedFilesCount.textContent = '0';
    if (dom.docPreviewCard) dom.docPreviewCard.classList.add('hidden');
    if (dom.btnOcrImage) dom.btnOcrImage.classList.add('hidden');
    if (dom.rawTextInput) dom.rawTextInput.value = '';
    if (dom.extractedTextArea) dom.extractedTextArea.value = '';
    if (dom.markdownInput) dom.markdownInput.value = '';
    if (dom.fileInput) dom.fileInput.value = '';
    if (dom.cameraInput) dom.cameraInput.value = '';
    const addMoreF2 = document.getElementById('btn-add-more-files-input');
    if (addMoreF2) addMoreF2.value = '';
    const addMoreC2 = document.getElementById('btn-add-more-camera-input');
    if (addMoreC2) addMoreC2.value = '';

    // Dừng âm thanh và bộ đếm thời gian
    stopAllSpeech();
    if (state.quizTimerInterval) {
      clearInterval(state.quizTimerInterval);
      state.quizTimerInterval = null;
    }
    state.quizUserAnswers = {};
    state.quizSubmitted = false;

    // Tab 1: Sơ đồ tư duy
    state.markmapInstance = null;
    if (dom.markmapSvg) dom.markmapSvg.innerHTML = '';
    if (dom.mindmapEmptyState) dom.mindmapEmptyState.classList.remove('hidden');
    if (mindmapLibraryList) mindmapLibraryList.innerHTML = '';
    if (mindmapLibraryEmpty) mindmapLibraryEmpty.classList.remove('hidden');
    updateSavedMindmapsCount();

    // Tab 2: Tóm tắt
    if (dom.summaryEmptyState) dom.summaryEmptyState.classList.remove('hidden');
    if (dom.sectionTakeaways) dom.sectionTakeaways.classList.add('hidden');
    if (dom.sectionTerms) dom.sectionTerms.classList.add('hidden');
    if (dom.sectionStrategies) dom.sectionStrategies.classList.add('hidden');
    if (dom.listTakeaways) dom.listTakeaways.innerHTML = '';
    if (dom.tableTermsBody) dom.tableTermsBody.innerHTML = '';
    if (dom.feynmanText) dom.feynmanText.textContent = '';
    if (dom.mnemonicsText) dom.mnemonicsText.textContent = '';
    if (dom.spacedList) dom.spacedList.innerHTML = '';
    if (summaryLibraryList) summaryLibraryList.innerHTML = '';
    if (summaryLibraryEmpty) summaryLibraryEmpty.classList.remove('hidden');
    updateSavedSummariesCount();

    // Tab 3: Khảo thí
    if (dom.interactiveQuizContainer) dom.interactiveQuizContainer.classList.add('hidden');
    if (dom.quizResultCard) dom.quizResultCard.classList.add('hidden');
    if (dom.quizSubmitBar) dom.quizSubmitBar.classList.add('hidden');
    if (dom.quizEmptyState) dom.quizEmptyState.classList.remove('hidden');
    if (dom.quizQuestionsList) dom.quizQuestionsList.innerHTML = '';

    // Tab 4: Thẻ lật
    if (dom.beamCardsGrid) {
      dom.beamCardsGrid.classList.add('hidden');
      dom.beamCardsGrid.innerHTML = '';
    }
    if (dom.beamEmptyState) dom.beamEmptyState.classList.remove('hidden');
    if (beamsLibraryList) beamsLibraryList.innerHTML = '';
    if (beamsLibraryEmpty) beamsLibraryEmpty.classList.remove('hidden');
    updateSavedBeamsCount();

    // Header
    updateHeaderAccountUI();
  }

  // Khởi tạo tài khoản người dùng và kiểm tra phiên đăng nhập
  async function initUserAccounts() {
    // Render avatar pickers
    renderAvatarPicker('👨‍🎓');
    renderRegisterAvatarPicker('👨‍🎓');

    // Cập nhật trạng thái Firebase Cloud
    if (authCloudStatusText && window.SmartEduCloud) {
      const st = window.SmartEduCloud.getStatus();
      if (st.isFirebase) {
        authCloudStatusText.textContent = `Google Firebase: ${st.projectId}`;
      } else {
        authCloudStatusText.textContent = `Lưu Trữ Web Cloud (Sẵn Sàng)`;
      }
    }

    // Kiểm tra xem máy này có phiên đăng nhập đã ghi nhớ không
    const rememberedUsername = localStorage.getItem('smartedu_active_cloud_username');
    if (rememberedUsername && window.SmartEduCloud) {
      const cleanUsername = rememberedUsername.toLowerCase();
      const localUsers = window.SmartEduCloud._getLocalUsers();
      let existingUser = localUsers[cleanUsername];
      if (cleanUsername === 'admin' && !existingUser) {
        window.SmartEduCloud._ensureSuperAdminAccount();
        existingUser = window.SmartEduCloud._getLocalUsers()['admin'];
      }
      if (existingUser) {
        applyUserSession(existingUser);

        // ĐỒNG BỘ TỰ ĐỘNG VỚI FIREBASE CLOUD: Kéo dữ liệu mới nhất (sơ đồ mới lưu từ điện thoại/máy tính khác)
        if (window.SmartEduCloud.isFirebaseReady && window.SmartEduCloud.getUserData) {
          window.SmartEduCloud.getUserData(cleanUsername).then(freshUser => {
            if (freshUser && state.currentUser && state.currentUser.username === cleanUsername) {
              applyUserSession(freshUser);
              console.log('☁️ Đã đồng bộ bài học & sơ đồ mới nhất từ Firebase cho:', cleanUsername);
            }
          }).catch(() => {});
        }
        return;
      }
    }

    // Nếu chưa có phiên đăng nhập -> Xóa dữ liệu tạm và hiển thị Khung Đăng Nhập
    resetUIForGuest();
    if (modalAuthGate) {
      modalAuthGate.style.display = 'flex';
      modalAuthGate.classList.remove('hidden');
      modalAuthGate.classList.add('flex');
      window.switchAuthTab('login');
    }
  }

  // Chuyển đổi giữa Đăng Nhập và Đăng Ký
  window.switchAuthTab = function(tab) {
    const lBtn = document.getElementById('auth-tab-btn-login');
    const rBtn = document.getElementById('auth-tab-btn-register');
    const lForm = document.getElementById('form-auth-login');
    const rForm = document.getElementById('form-auth-register');
    const uInp = document.getElementById('login-username');
    const fInp = document.getElementById('reg-fullname');

    if (tab === 'login') {
      if (lBtn) lBtn.className = 'py-2 rounded-lg bg-white text-indigo-600 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-bold transition-all';
      if (rBtn) rBtn.className = 'py-2 rounded-lg text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-all';
      if (lForm) lForm.classList.remove('hidden');
      if (rForm) rForm.classList.add('hidden');
      if (uInp) uInp.focus();
    } else {
      if (rBtn) rBtn.className = 'py-2 rounded-lg bg-white text-indigo-600 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-bold transition-all';
      if (lBtn) lBtn.className = 'py-2 rounded-lg text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-all';
      if (rForm) rForm.classList.remove('hidden');
      if (lForm) lForm.classList.add('hidden');
      if (fInp) fInp.focus();
    }
  };

  if (authTabBtnLogin) {
    authTabBtnLogin.addEventListener('click', () => window.switchAuthTab('login'));
  }
  if (authTabBtnRegister) {
    authTabBtnRegister.addEventListener('click', () => window.switchAuthTab('register'));
  }

  // Nạp tài khoản mẫu cho giám khảo/học sinh trải nghiệm nhanh 1 chạm
  window.fillDemoAccount = async function() {
    const localUsers = window.SmartEduCloud ? window.SmartEduCloud._getLocalUsers() : {};
    const existing = localUsers['longphung9a13'];

    const demoUser = {
      username: 'longphung9a13',
      password: '123',
      profile: {
        name: 'Trần Lê Long Phụng',
        grade: '9',
        className: '9A13',
        school: 'THCS Long Cang',
        avatar: '👨‍🎓',
        createdAt: '22/11/2026',
        lastLogin: new Date().toLocaleString('vi-VN')
      },
      scores: (existing && existing.scores && existing.scores.length > 0) ? existing.scores : [
        {
          id: 1732230001,
          date: '22/11/2026 08:30',
          title: 'Bài mẫu Toán 9: Hệ hai phương trình bậc nhất hai ẩn',
          subject: 'Toán',
          score: 9.0,
          correctTotal: 9,
          totalQ: 10,
          percentage: 90
        },
        {
          id: 1732230002,
          date: '22/11/2026 09:15',
          title: 'Bài mẫu KHTN 9: Định luật Ôm & Điện năng',
          subject: 'KHTN',
          score: 10.0,
          correctTotal: 10,
          totalQ: 10,
          percentage: 100
        }
      ],
      mindmaps: (existing && existing.mindmaps && existing.mindmaps.length > 0) ? existing.mindmaps : [],
      summaries: (existing && existing.summaries && existing.summaries.length > 0) ? existing.summaries : [],
      flashcards: (existing && existing.flashcards && existing.flashcards.length > 0) ? existing.flashcards : []
    };

    if (window.SmartEduCloud) {
      window.SmartEduCloud._saveLocalUser(demoUser);
    }
    localStorage.setItem('smartedu_active_cloud_username', demoUser.username);
    applyUserSession(demoUser);
    showToast('Đã đăng nhập bằng tài khoản mẫu: Trần Lê Long Phụng (9A13)!', 'success');
  };

  // Nạp tài khoản Super Admin 1 chạm (admin / 123) - TỨC THÌ 100%
  window.fillSuperAdminAccount = function() {
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    if (uInput) uInput.value = 'admin';
    if (pInput) pInput.value = '123';

    const adminUser = {
      username: 'admin',
      password: '123',
      profile: {
        name: 'Super Admin',
        role: 'superadmin',
        grade: 'Quản Lý',
        className: 'Quản Trị',
        school: 'SmartEdu THCS',
        avatar: '👑',
        createdAt: (window.getVietnamDateShort ? window.getVietnamDateShort() : '22/11/2026'),
        lastLogin: (window.getVietnamTimeString ? window.getVietnamTimeString() : new Date().toLocaleString('vi-VN'))
      },
      scores: [],
      mindmaps: [],
      summaries: [],
      flashcards: []
    };

    if (window.SmartEduCloud) {
      window.SmartEduCloud._saveLocalUser(adminUser);
      if (window.SmartEduCloud.isFirebaseReady && window.SmartEduCloud.db) {
        window.SmartEduCloud.db.collection('users').doc('admin').set(adminUser, { merge: true }).catch(() => {});
      }
    }
    localStorage.setItem('smartedu_active_cloud_username', 'admin');

    applyUserSession(adminUser);
    showToast('Kính chào Super Admin đã đăng nhập thành công!', 'success');

    setTimeout(() => {
      if (typeof window.openSuperAdminModal === 'function') {
        window.openSuperAdminModal('users');
      }
    }, 200);
  };

  // Hàm xử lý Đăng Nhập an toàn toàn cục
  window.handleLoginSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const uInput = document.getElementById('login-username');
    const pInput = document.getElementById('login-password');
    const remInput = document.getElementById('login-remember-me');
    const u = (uInput?.value || '').trim();
    const p = (pInput?.value || '').trim();

    if (!u || !p) {
      showToast('Vui lòng nhập tên tài khoản và mật khẩu!', 'warning');
      return false;
    }

    // Xử lý tức thì cho Super Admin admin / 123
    if (u.toLowerCase() === 'admin' && p === '123') {
      window.fillSuperAdminAccount();
      return false;
    }

    const submitBtn = document.getElementById('btn-submit-login');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Đang xác thực trên Web...</span>`;
    }

    try {
      const res = await window.SmartEduCloud.loginUser(u, p);
      if (res.success && res.user) {
        if (remInput && remInput.checked) {
          localStorage.setItem('smartedu_active_cloud_username', res.user.username);
        } else {
          localStorage.removeItem('smartedu_active_cloud_username');
        }

        applyUserSession(res.user);
        const isSuperAdmin = (res.user.username === 'admin' || res.user.profile?.role === 'superadmin');
        const welcomePrefix = isSuperAdmin ? 'Kính chào Thầy/Cô' : 'Chào mừng em';
        showToast(`${welcomePrefix} ${res.user.profile?.name || res.user.username} đã đăng nhập thành công!`, 'success');

        if (isSuperAdmin) {
          setTimeout(() => {
            if (typeof window.openSuperAdminModal === 'function') {
              window.openSuperAdminModal('users');
            }
          }, 200);
        }
      } else {
        showToast(res.message || 'Đăng nhập không thành công!', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
    return false;
  };

  // Gắn sự kiện submit cho form đăng nhập
  if (formAuthLogin) {
    formAuthLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      window.handleLoginSubmit(e);
    });
  }

  // Xử lý gửi Form Đăng Ký (tạo tài khoản mới hoàn toàn sạch sẽ, không chứa dữ liệu người khác)
  window.handleRegisterSubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = (document.getElementById('reg-fullname')?.value || '').trim();
    const grade = document.getElementById('reg-grade')?.value || '9';
    const className = (document.getElementById('reg-class')?.value || '').trim();
    const school = (document.getElementById('reg-school')?.value || '').trim();
    const u = (document.getElementById('reg-username')?.value || '').trim();
    const p = (document.getElementById('reg-password')?.value || '').trim();
    const avatar = document.getElementById('reg-avatar')?.value || '👨‍🎓';

    if (!name || !u || !p) {
      showToast('Vui lòng điền đầy đủ các thông tin có dấu sao (*)!', 'warning');
      return false;
    }

    const submitBtn = document.getElementById('btn-submit-register');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> <span>Đang khởi tạo tài khoản Web...</span>`;
    }

    try {
      const res = await window.SmartEduCloud.registerUser(u, p, {
        name, grade, className, school, avatar
      });

      if (res.success && res.user) {
        localStorage.setItem('smartedu_active_cloud_username', res.user.username);
        applyUserSession(res.user);
        showToast(`Chúc mừng em ${name} đã tạo tài khoản Web thành công!`, 'success');
      } else {
        showToast(res.message || 'Đăng ký không thành công!', 'error');
      }
    } catch (err) {
      showToast('Lỗi đăng ký: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
    return false;
  };

  if (formAuthRegister) {
    formAuthRegister.addEventListener('submit', (e) => {
      e.preventDefault();
      window.handleRegisterSubmit(e);
    });
  }

  // Đăng xuất tài khoản an toàn & đưa về ngay khung Đăng Nhập
  window.logoutUser = function() {
    localStorage.removeItem('smartedu_active_cloud_username');
    resetUIForGuest();

    // 1. Đóng toàn bộ các modal tài khoản / quản trị / thư viện
    const mUser = document.getElementById('modal-user-account');
    if (mUser) {
      mUser.style.display = 'none';
      mUser.classList.add('hidden');
      mUser.classList.remove('flex');
    }
    const mAdmin = document.getElementById('modal-super-admin');
    if (mAdmin) {
      mAdmin.style.display = 'none';
      mAdmin.classList.add('hidden');
      mAdmin.classList.remove('flex');
    }
    const mMm = document.getElementById('modal-mindmap-library');
    if (mMm) mMm.classList.add('hidden');
    const mSum = document.getElementById('modal-summary-library');
    if (mSum) mSum.classList.add('hidden');
    const mBm = document.getElementById('modal-beams-library');
    if (mBm) mBm.classList.add('hidden');

    // 2. Mở lại ngay khung Đăng Nhập (bỏ display: none, set display: flex)
    const authGate = document.getElementById('modal-auth-gate');
    if (authGate) {
      authGate.style.display = 'flex';
      authGate.classList.remove('hidden');
      authGate.classList.add('flex');
    }

    // 3. Reset form đăng nhập về tab Login
    if (typeof window.switchAuthTab === 'function') {
      window.switchAuthTab('login');
    }
    const pInp = document.getElementById('login-password');
    if (pInp) pInp.value = '';

    showToast('Đã đăng xuất tài khoản an toàn! Vui lòng đăng nhập để tiếp tục.', 'info');
  };

  // Cập nhật giao diện Header (Desktop + Mobile)
  function updateHeaderAccountUI() {
    const user = state.currentUser;
    if (!user) {
      if (userNameMobile) userNameMobile.textContent = 'Đăng nhập';
      if (userAvatarMobile) userAvatarMobile.textContent = '👤';
      if (userNameDesktop) userNameDesktop.textContent = 'Đăng nhập';
      if (userSubtextDesktop) userSubtextDesktop.textContent = 'Đồng bộ Web';
      if (userBadgeCountDesktop) userBadgeCountDesktop.classList.add('hidden');
      if (btnLogoutHeader) btnLogoutHeader.classList.add('hidden');
      if (btnLogoutMobile) btnLogoutMobile.classList.add('hidden');
      const btnSuperAdminMobile = document.getElementById('btn-super-admin-mobile');
      const btnSuperAdminDesktop = document.getElementById('btn-super-admin-desktop');
      if (btnSuperAdminMobile) btnSuperAdminMobile.classList.add('hidden');
      if (btnSuperAdminDesktop) btnSuperAdminDesktop.classList.add('hidden');
      return;
    }

    const p = user.profile || {};
    const scoresCount = (user.scores && user.scores.length) || 0;

    const isSuperAdmin = (user.username === 'admin' || (user.profile && user.profile.role === 'superadmin'));

    // Mobile Header
    if (userAvatarMobile) userAvatarMobile.textContent = isSuperAdmin ? '👑' : (p.avatar || '👨‍🎓');
    if (userNameMobile) {
      if (isSuperAdmin) {
        userNameMobile.textContent = 'Admin';
      } else {
        const shortName = p.name ? p.name.trim().split(' ').slice(-2).join(' ') : 'Hồ sơ';
        userNameMobile.textContent = shortName;
      }
    }
    if (btnLogoutMobile) btnLogoutMobile.classList.remove('hidden');

    // Desktop Header
    if (userAvatarDesktop) userAvatarDesktop.textContent = isSuperAdmin ? '👑' : (p.avatar || '👨‍🎓');
    if (userNameDesktop) {
      userNameDesktop.textContent = isSuperAdmin ? 'Super Admin' : (p.name || user.username);
    }
    if (userSubtextDesktop) {
      if (isSuperAdmin) {
        userSubtextDesktop.textContent = 'Quản trị';
      } else {
        const cls = p.className ? `Lớp ${p.className}` : `Khối ${p.grade || 9}`;
        userSubtextDesktop.textContent = `${cls} • ${scoresCount} bài đã thi`;
      }
    }
    if (userBadgeCountDesktop) {
      if (isSuperAdmin) {
        userBadgeCountDesktop.classList.add('hidden');
      } else {
        userBadgeCountDesktop.textContent = `${scoresCount} bài`;
        userBadgeCountDesktop.classList.remove('hidden');
      }
    }
    if (btnLogoutHeader) btnLogoutHeader.classList.remove('hidden');

    // Hiển thị nút Super Admin nếu là admin
    const btnSuperAdminMobile = document.getElementById('btn-super-admin-mobile');
    const btnSuperAdminDesktop = document.getElementById('btn-super-admin-desktop');
    if (btnSuperAdminMobile) {
      if (isSuperAdmin) btnSuperAdminMobile.classList.remove('hidden');
      else btnSuperAdminMobile.classList.add('hidden');
    }
    if (btnSuperAdminDesktop) {
      if (isSuperAdmin) btnSuperAdminDesktop.classList.remove('hidden');
      else btnSuperAdminDesktop.classList.add('hidden');
    }
  }

  // Render Avatar Picker cho Modal Hồ sơ
  function renderAvatarPicker(selectedAvatar) {
    if (!accAvatarPicker) return;
    accAvatarPicker.innerHTML = AVATAR_OPTIONS.map(av => {
      const isSel = (av === selectedAvatar);
      return `
        <button type="button" class="avatar-option-btn w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-indigo-50 border-2 ${isSel ? 'border-indigo-600 bg-indigo-50 font-bold scale-110 shadow-sm' : 'border-slate-200'} flex items-center justify-center text-lg sm:text-xl transition-all cursor-pointer" data-avatar="${av}">
          ${av}
        </button>
      `;
    }).join('');

    accAvatarPicker.querySelectorAll('.avatar-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const av = btn.dataset.avatar;
        if (inputAccountAvatar) inputAccountAvatar.value = av;
        renderAvatarPicker(av);
      });
    });
  }

  // Render Avatar Picker cho Form Đăng Ký
  function renderRegisterAvatarPicker(selectedAvatar) {
    if (!regAvatarPicker) return;
    regAvatarPicker.innerHTML = AVATAR_OPTIONS.map(av => {
      const isSel = (av === selectedAvatar);
      return `
        <button type="button" class="reg-avatar-btn w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-50 border-2 ${isSel ? 'border-indigo-600 bg-indigo-50 font-bold scale-110 shadow-2xs' : 'border-slate-200'} flex items-center justify-center text-base transition-all cursor-pointer" data-avatar="${av}">
          ${av}
        </button>
      `;
    }).join('');

    regAvatarPicker.querySelectorAll('.reg-avatar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const av = btn.dataset.avatar;
        if (regAvatar) regAvatar.value = av;
        renderRegisterAvatarPicker(av);
      });
    });
  }

  // ================= 4 TRỤ CỘT HỌC TẬP ĐỒNG BỘ ĐÁM MÂY =================

  // TRỤ CỘT 1: LƯU & XEM SƠ ĐỒ TƯ DUY TRÊN WEB
  if (btnSaveMindmap) {
    btnSaveMindmap.addEventListener('click', async () => {
      if (!state.currentUser) {
        showToast('Vui lòng đăng nhập để lưu sơ đồ vào tài khoản Web!', 'warning');
        if (modalAuthGate) modalAuthGate.classList.remove('hidden');
        return;
      }
      if (!state.mindmapMarkdown || state.mindmapMarkdown.trim() === '') {
        showToast('Chưa có nội dung sơ đồ tư duy để lưu!', 'warning');
        return;
      }

      // 1. Tự động trích xuất tiêu đề bài học thông minh từ dòng # đầu tiên của Markdown
      let cleanTitle = '';
      const lines = state.mindmapMarkdown.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ')) {
          cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/[#*`_]/g, '').trim();
          break;
        }
      }
      if (!cleanTitle && state.currentDoc.title) {
        cleanTitle = state.currentDoc.title.replace(/\.(jpg|jpeg|png|webp|gif|pdf|docx?)$/i, '').trim();
      }
      if (!cleanTitle) cleanTitle = 'Sơ đồ tư duy bài học';

      const subject = detectSubjectFromTitle(cleanTitle);
      const mindmapItem = {
        id: 'mm_' + Date.now(),
        title: cleanTitle,
        subject: subject,
        date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        markdownContent: state.mindmapMarkdown
      };

      if (!state.currentUser.mindmaps) state.currentUser.mindmaps = [];
      // Tránh trùng lặp nếu học sinh bấm lưu nhiều lần cùng 1 bài
      const existingMmIdx = state.currentUser.mindmaps.findIndex(m => 
        m.title === cleanTitle || m.markdownContent === state.mindmapMarkdown
      );
      if (existingMmIdx !== -1) {
        state.currentUser.mindmaps.splice(existingMmIdx, 1);
      }
      state.currentUser.mindmaps.unshift(mindmapItem);
      if (state.currentUser.mindmaps.length > 50) state.currentUser.mindmaps.length = 50;

      await window.SmartEduCloud.syncUserData(state.currentUser);
      updateSavedMindmapsCount();
      renderMindmapLibrary();
      showToast(`Đã lưu sơ đồ: "${cleanTitle}" vào tài khoản Web!`, 'success');
    });
  }

  function renderMindmapLibrary() {
    if (!mindmapLibraryList) return;
    const user = state.currentUser;
    const mindmaps = (user && user.mindmaps) || [];

    if (mindmapLibraryStatus) {
      mindmapLibraryStatus.textContent = `Đã lưu ${mindmaps.length} sơ đồ`;
    }

    if (mindmaps.length === 0) {
      mindmapLibraryList.innerHTML = '';
      if (mindmapLibraryEmpty) mindmapLibraryEmpty.classList.remove('hidden');
      return;
    }

    if (mindmapLibraryEmpty) mindmapLibraryEmpty.classList.add('hidden');
    mindmapLibraryList.innerHTML = mindmaps.map((mm, idx) => `
      <div class="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3 border-b border-slate-100 last:border-b-0">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">${mm.subject || 'Sơ đồ'}</span>
            <h5 class="text-xs sm:text-sm font-bold text-slate-900 truncate" title="${mm.title}">${mm.title}</h5>
          </div>
          <span class="text-[11px] text-slate-400 font-mono mt-0.5 block">${mm.date}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="window.loadSavedMindmapById && window.loadSavedMindmapById('${mm.id}')" class="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer shadow-xs active:scale-95 flex items-center gap-1">
            <i class="fa-solid fa-eye text-[11px]"></i>
            <span>Mở xem</span>
          </button>
          <button onclick="window.deleteSavedMindmapById && window.deleteSavedMindmapById('${mm.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors" title="Xóa sơ đồ này">
            <i class="fa-solid fa-trash-can text-xs"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.loadSavedMindmapById = function(id) {
    if (!state.currentUser || !state.currentUser.mindmaps) {
      showToast('Vui lòng đăng nhập để mở sơ đồ tư duy!', 'warning');
      return;
    }
    const item = state.currentUser.mindmaps.find(m => String(m.id) === String(id));
    if (!item) {
      showToast('Không tìm thấy sơ đồ tư duy này trong tài khoản của bạn!', 'warning');
      return;
    }

    const content = item.markdownContent || item.content || item.markdown || '';
    if (!content) {
      showToast('Nội dung sơ đồ này bị rỗng!', 'warning');
      return;
    }

    state.mindmapMarkdown = content;

    // 1. Đóng modal thư viện
    if (modalMindmapLibrary) modalMindmapLibrary.classList.add('hidden');
    const mModal = document.getElementById('modal-mindmap-library');
    if (mModal) mModal.classList.add('hidden');

    // 2. Chuyển sang Tab Sơ đồ tư duy trước để SVG có layout chiều rộng/cao chuẩn
    switchTab('tab-mindmap');

    // 3. Xóa cache instance cũ và render mới hoàn toàn
    if (dom.markmapSvg) dom.markmapSvg.innerHTML = '';
    state.markmapInstance = null;
    renderMindmap(content);

    // 4. Retry nhẹ sau khi layout ổn định để fit view chuẩn xác 100%
    setTimeout(() => {
      renderMindmap(content);
      if (state.markmapInstance && state.markmapInstance.fit) {
        state.markmapInstance.fit();
      }
    }, 150);

    showToast(`Đã mở sơ đồ: "${item.title}"!`, 'info');
  };

  window.deleteSavedMindmapById = async function(id) {
    if (!state.currentUser || !state.currentUser.mindmaps) return;
    if (confirm('Bạn có chắc muốn xóa sơ đồ này khỏi tài khoản Web không?')) {
      state.currentUser.mindmaps = state.currentUser.mindmaps.filter(m => m.id !== id);
      await window.SmartEduCloud.syncUserData(state.currentUser);
      renderMindmapLibrary();
      updateSavedMindmapsCount();
      showToast('Đã xóa sơ đồ!', 'info');
    }
  };

  function updateSavedMindmapsCount() {
    const user = state.currentUser;
    const count = (user && user.mindmaps && user.mindmaps.length) || 0;
    const el = document.getElementById('saved-mindmaps-count');
    if (el) el.textContent = count;
    if (dom.savedMindmapsCount) dom.savedMindmapsCount.textContent = count;
    if (mindmapLibraryStatus) mindmapLibraryStatus.textContent = `Đã lưu ${count} sơ đồ`;
  }

  if (btnOpenMindmapLibrary) {
    btnOpenMindmapLibrary.addEventListener('click', () => {
      renderMindmapLibrary();
      if (modalMindmapLibrary) modalMindmapLibrary.classList.remove('hidden');
    });
  }
  if (btnCloseMindmapLibrary) btnCloseMindmapLibrary.addEventListener('click', () => modalMindmapLibrary?.classList.add('hidden'));
  if (btnDoneMindmapLibrary) btnDoneMindmapLibrary.addEventListener('click', () => modalMindmapLibrary?.classList.add('hidden'));

  // TRỤ CỘT 2: LƯU & XEM TÓM TẮT & GỢI Ý HỌC TẬP TRÊN WEB
  if (btnSaveSummary) {
    btnSaveSummary.addEventListener('click', async () => {
      if (!state.currentUser) {
        showToast('Vui lòng đăng nhập để lưu bài tóm tắt vào tài khoản Web!', 'warning');
        if (modalAuthGate) modalAuthGate.classList.remove('hidden');
        return;
      }
      if (!state.summaryData) {
        showToast('Chưa có nội dung tóm tắt để lưu. Hãy tạo tóm tắt bằng AI trước!', 'warning');
        return;
      }

      let cleanTitle = state.currentDoc.title || 'Tóm tắt bài học';
      cleanTitle = cleanTitle.replace(/\.(jpg|jpeg|png|webp|gif|pdf|docx?)$/i, '').trim();
      const subject = detectSubjectFromTitle(cleanTitle);
      const summaryItem = {
        id: 'sum_' + Date.now(),
        title: cleanTitle,
        subject: subject,
        date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        summaryData: state.summaryData
      };

      if (!state.currentUser.summaries) state.currentUser.summaries = [];
      const existingSumIdx = state.currentUser.summaries.findIndex(s => s.title === cleanTitle);
      if (existingSumIdx !== -1) {
        state.currentUser.summaries.splice(existingSumIdx, 1);
      }
      state.currentUser.summaries.unshift(summaryItem);
      if (state.currentUser.summaries.length > 50) state.currentUser.summaries.length = 50;

      await window.SmartEduCloud.syncUserData(state.currentUser);
      updateSavedSummariesCount();
      renderSummaryLibrary();
      showToast(`Đã lưu bài tóm tắt: "${cleanTitle}" vào tài khoản Web!`, 'success');
    });
  }

  function renderSummaryLibrary() {
    if (!summaryLibraryList) return;
    const user = state.currentUser;
    const summaries = (user && user.summaries) || [];

    if (summaryLibraryStatus) {
      summaryLibraryStatus.textContent = `Đã lưu ${summaries.length} bài tóm tắt`;
    }

    if (summaries.length === 0) {
      summaryLibraryList.innerHTML = '';
      if (summaryLibraryEmpty) summaryLibraryEmpty.classList.remove('hidden');
      return;
    }

    if (summaryLibraryEmpty) summaryLibraryEmpty.classList.add('hidden');
    summaryLibraryList.innerHTML = summaries.map(sm => `
      <div class="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">${sm.subject || 'Tóm tắt'}</span>
            <h5 class="text-xs sm:text-sm font-bold text-slate-900 truncate" title="${sm.title}">${sm.title}</h5>
          </div>
          <span class="text-[11px] text-slate-400 font-mono mt-0.5 block">${sm.date}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="window.loadSavedSummaryById && window.loadSavedSummaryById('${sm.id}')" class="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer shadow-2xs active:scale-95">
            Xem lại
          </button>
          <button onclick="window.deleteSavedSummaryById && window.deleteSavedSummaryById('${sm.id}')" class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Xóa bài tóm tắt này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.loadSavedSummaryById = function(id) {
    if (!state.currentUser || !state.currentUser.summaries) {
      showToast('Vui lòng đăng nhập để mở bài tóm tắt!', 'warning');
      return;
    }
    const item = state.currentUser.summaries.find(s => String(s.id) === String(id));
    if (item && item.summaryData) {
      state.summaryData = item.summaryData;
      if (modalSummaryLibrary) modalSummaryLibrary.classList.add('hidden');
      switchTab('tab-summary');
      renderSummary(item.summaryData);
      showToast(`Đã mở bài tóm tắt: "${item.title}"!`, 'info');
    } else {
      showToast('Không tìm thấy bài tóm tắt này trong tài khoản của bạn!', 'warning');
    }
  };

  window.deleteSavedSummaryById = async function(id) {
    if (!state.currentUser || !state.currentUser.summaries) return;
    if (confirm('Bạn có chắc muốn xóa bài tóm tắt này khỏi tài khoản Web không?')) {
      state.currentUser.summaries = state.currentUser.summaries.filter(s => s.id !== id);
      await window.SmartEduCloud.syncUserData(state.currentUser);
      renderSummaryLibrary();
      updateSavedSummariesCount();
      showToast('Đã xóa bài tóm tắt!', 'info');
    }
  };

  function updateSavedSummariesCount() {
    const user = state.currentUser;
    const count = (user && user.summaries && user.summaries.length) || 0;
    const el = document.getElementById('saved-summaries-count');
    if (el) el.textContent = count;
    if (summaryLibraryStatus) summaryLibraryStatus.textContent = `Đã lưu ${count} bài tóm tắt`;
  }

  if (btnOpenSummaryLibrary) {
    btnOpenSummaryLibrary.addEventListener('click', () => {
      renderSummaryLibrary();
      if (modalSummaryLibrary) modalSummaryLibrary.classList.remove('hidden');
    });
  }
  if (btnCloseSummaryLibrary) btnCloseSummaryLibrary.addEventListener('click', () => modalSummaryLibrary?.classList.add('hidden'));
  if (btnDoneSummaryLibrary) btnDoneSummaryLibrary.addEventListener('click', () => modalSummaryLibrary?.classList.add('hidden'));

  // TRỤ CỘT 3: LƯU ĐIỂM SỐ & THEO DÕI TIẾN BỘ KHẢO THÍ TRÊN WEB
  async function recordQuizScoreToAccount(scoreData) {
    if (!state.currentUser) {
      if (modalAuthGate) modalAuthGate.classList.remove('hidden');
      return;
    }

    if (!state.currentUser.scores) state.currentUser.scores = [];
    const detectedSubject = detectSubjectFromTitle(scoreData.title);

    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
      title: scoreData.title || 'Bài tập khảo thí',
      subject: detectedSubject,
      score: parseFloat(scoreData.score) || 0,
      correctTotal: scoreData.correctTotal || 0,
      totalQ: scoreData.totalQ || 10,
      percentage: scoreData.percentage || 0,
      tierBreakdown: scoreData.tierBreakdown || null
    };

    state.currentUser.scores.unshift(newRecord);
    if (state.currentUser.scores.length > 100) state.currentUser.scores.length = 100;

    await window.SmartEduCloud.syncUserData(state.currentUser);
    updateHeaderAccountUI();

    const p = state.currentUser.profile || {};
    showToast(`Đã lưu ${scoreData.score.toFixed(1)} điểm vào tài khoản Web của ${p.name}!`, 'success');

    if (dom.quizResultSummary) {
      dom.quizResultSummary.innerHTML = `
        <span>Làm đúng <strong>${scoreData.correctTotal}/${scoreData.totalQ}</strong> câu (${scoreData.percentage}%)</span>
        <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-full text-xs text-indigo-900 font-bold">
          <span>${p.avatar || '👨‍🎓'}</span>
          <span>Điểm số đã được lưu lên Web vào tài khoản <strong>${p.name}</strong></span>
        </div>
      `;
    }
  }

  // TRỤ CỘT 4: LƯU & ÔN TẬP BỘ THẺ HỌC TẬP (FLASHCARDS) TRÊN WEB
  if (btnSaveBeams) {
    btnSaveBeams.addEventListener('click', async () => {
      if (!state.currentUser) {
        showToast('Vui lòng đăng nhập để lưu bộ thẻ vào tài khoản Web!', 'warning');
        if (modalAuthGate) modalAuthGate.classList.remove('hidden');
        return;
      }
      if (!state.beamData || state.beamData.length === 0) {
        showToast('Chưa có thẻ học tập nào để lưu. Hãy tạo bộ thẻ AI trước!', 'warning');
        return;
      }

      const title = state.currentDoc.title || 'Bộ thẻ học tập';
      const subject = detectSubjectFromTitle(title);
      const beamsItem = {
        id: 'bm_' + Date.now(),
        title: title,
        subject: subject,
        date: new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
        cards: state.beamData
      };

      if (!state.currentUser.flashcards) state.currentUser.flashcards = [];
      state.currentUser.flashcards.unshift(beamsItem);
      if (state.currentUser.flashcards.length > 50) state.currentUser.flashcards.length = 50;

      await window.SmartEduCloud.syncUserData(state.currentUser);
      updateSavedBeamsCount();
      showToast('Đã lưu bộ thẻ học tập vào tài khoản Web thành công!', 'success');
    });
  }

  function renderBeamsLibrary() {
    if (!beamsLibraryList) return;
    const user = state.currentUser;
    const flashcards = (user && user.flashcards) || [];

    if (beamsLibraryStatus) {
      beamsLibraryStatus.textContent = `Đã lưu ${flashcards.length} bộ thẻ`;
    }

    if (flashcards.length === 0) {
      beamsLibraryList.innerHTML = '';
      if (beamsLibraryEmpty) beamsLibraryEmpty.classList.remove('hidden');
      return;
    }

    if (beamsLibraryEmpty) beamsLibraryEmpty.classList.add('hidden');
    beamsLibraryList.innerHTML = flashcards.map(bm => `
      <div class="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">${bm.subject || 'Thẻ'}</span>
            <h5 class="text-xs sm:text-sm font-bold text-slate-900 truncate" title="${bm.title}">${bm.title}</h5>
          </div>
          <span class="text-[11px] text-slate-500 mt-0.5 block">${bm.date} • <strong>${bm.cards ? bm.cards.length : 0} thẻ</strong></span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button onclick="window.loadSavedBeamsById && window.loadSavedBeamsById('${bm.id}')" class="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg cursor-pointer shadow-2xs active:scale-95">
            Luyện tập
          </button>
          <button onclick="window.deleteSavedBeamsById && window.deleteSavedBeamsById('${bm.id}')" class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer" title="Xóa bộ thẻ này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  window.loadSavedBeamsById = function(id) {
    if (!state.currentUser || !state.currentUser.flashcards) {
      showToast('Vui lòng đăng nhập để mở bộ thẻ!', 'warning');
      return;
    }
    const item = state.currentUser.flashcards.find(b => String(b.id) === String(id));
    if (item && item.cards) {
      state.beamData = item.cards;
      if (modalBeamsLibrary) modalBeamsLibrary.classList.add('hidden');
      switchTab('tab-beam');
      renderBeams(item.cards);
      showToast(`Đã mở bộ thẻ: "${item.title}"!`, 'info');
    } else {
      showToast('Không tìm thấy bộ thẻ này trong tài khoản của bạn!', 'warning');
    }
  };

  window.deleteSavedBeamsById = async function(id) {
    if (!state.currentUser || !state.currentUser.flashcards) return;
    if (confirm('Bạn có chắc muốn xóa bộ thẻ này khỏi tài khoản Web không?')) {
      state.currentUser.flashcards = state.currentUser.flashcards.filter(b => b.id !== id);
      await window.SmartEduCloud.syncUserData(state.currentUser);
      renderBeamsLibrary();
      updateSavedBeamsCount();
      showToast('Đã xóa bộ thẻ!', 'info');
    }
  };

  function updateSavedBeamsCount() {
    const user = state.currentUser;
    const count = (user && user.flashcards && user.flashcards.length) || 0;
    const el = document.getElementById('saved-beams-count');
    if (el) el.textContent = count;
    if (beamsLibraryStatus) beamsLibraryStatus.textContent = `Đã lưu ${count} bộ thẻ`;
  }

  if (btnOpenBeamsLibrary) {
    btnOpenBeamsLibrary.addEventListener('click', () => {
      renderBeamsLibrary();
      if (modalBeamsLibrary) modalBeamsLibrary.classList.remove('hidden');
    });
  }
  if (btnCloseBeamsLibrary) btnCloseBeamsLibrary.addEventListener('click', () => modalBeamsLibrary?.classList.add('hidden'));
  if (btnDoneBeamsLibrary) btnDoneBeamsLibrary.addEventListener('click', () => modalBeamsLibrary?.classList.add('hidden'));

  // ================= CÀI ĐẶT CẤU HÌNH FIREBASE TÙY CHỈNH =================
  window.openFirebaseSettingsModal = function() {
    if (inputFirebaseConfigJson) {
      try {
        const saved = localStorage.getItem('smartedu_firebase_custom_config');
        if (saved) {
          inputFirebaseConfigJson.value = JSON.stringify(JSON.parse(saved), null, 2);
        } else {
          inputFirebaseConfigJson.value = JSON.stringify(window.FIREBASE_CONFIG, null, 2);
        }
      } catch (e) {}
    }
    if (modalFirebaseSettings) modalFirebaseSettings.classList.remove('hidden');
  };

  if (btnCloseFirebaseSettings) btnCloseFirebaseSettings.addEventListener('click', () => modalFirebaseSettings?.classList.add('hidden'));
  if (btnCancelFirebaseSettings) btnCancelFirebaseSettings.addEventListener('click', () => modalFirebaseSettings?.classList.add('hidden'));

  if (btnSaveFirebaseConfig) {
    btnSaveFirebaseConfig.addEventListener('click', () => {
      const val = (inputFirebaseConfigJson?.value || '').trim();
      if (!val) {
        showToast('Vui lòng nhập JSON cấu hình Firebase!', 'warning');
        return;
      }
      try {
        const parsed = JSON.parse(val);
        if (!parsed.projectId) {
          showToast('JSON phải chứa ít nhất trường "projectId"!', 'warning');
          return;
        }
        localStorage.setItem('smartedu_firebase_custom_config', JSON.stringify(parsed));
        window.FIREBASE_CONFIG = parsed;
        if (window.SmartEduCloud) window.SmartEduCloud.init();
        if (modalFirebaseSettings) modalFirebaseSettings.classList.add('hidden');
        showToast('Đã lưu cấu hình Firebase! Kết nối thành công.', 'success');
      } catch (err) {
        showToast('Lỗi cú pháp JSON cấu hình: ' + err.message, 'error');
      }
    });
  }

  if (btnResetFirebaseConfig) {
    btnResetFirebaseConfig.addEventListener('click', () => {
      if (confirm('Bạn có muốn xóa cấu hình Firebase tùy chỉnh và quay về mặc định?')) {
        localStorage.removeItem('smartedu_firebase_custom_config');
        if (inputFirebaseConfigJson) inputFirebaseConfigJson.value = '';
        if (modalFirebaseSettings) modalFirebaseSettings.classList.add('hidden');
        showToast('Đã đặt lại cấu hình Firebase mặc định!', 'info');
      }
    });
  }

  // ================= BẢNG TIẾN ĐỘ & BẢNG ĐIỂM (MODAL USER ACCOUNT) =================

  // Vẽ biểu đồ tiến độ học tập bằng SVG
  function renderProgressChart(scores) {
    if (!accChartContainer) return;
    if (!scores || scores.length === 0) {
      accChartContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-4">
          <i class="fa-solid fa-chart-line text-2xl text-slate-300 mb-1"></i>
          <span class="text-xs text-slate-400">Chưa đủ dữ liệu để vẽ biểu đồ (Cần ít nhất 1 bài thi ở Tab 3)</span>
        </div>
      `;
      if (accTrendComment) {
        accTrendComment.textContent = 'Chưa có bài thi';
        accTrendComment.className = 'text-[11px] font-bold text-slate-400';
      }
      return;
    }

    const chronological = [...scores].reverse().slice(-10);

    if (accTrendComment) {
      if (chronological.length === 1) {
        accTrendComment.textContent = '🌟 Khởi đầu xuất sắc';
        accTrendComment.className = 'text-[11px] font-bold text-indigo-600';
      } else {
        const firstScore = chronological[0].score;
        const lastScore = chronological[chronological.length - 1].score;
        const diff = lastScore - firstScore;
        if (diff > 0.5) {
          accTrendComment.textContent = `📈 Tiến bộ vượt bậc (+${diff.toFixed(1)}đ)`;
          accTrendComment.className = 'text-[11px] font-bold text-emerald-600';
        } else if (diff < -0.5) {
          accTrendComment.textContent = `📉 Cần rèn luyện thêm (${diff.toFixed(1)}đ)`;
          accTrendComment.className = 'text-[11px] font-bold text-amber-600';
        } else {
          accTrendComment.textContent = `⭐ Phong độ ổn định (${lastScore.toFixed(1)}đ)`;
          accTrendComment.className = 'text-[11px] font-bold text-blue-600';
        }
      }
    }

    if (chronological.length === 1) {
      const s = chronological[0].score;
      accChartContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center text-center p-3">
          <span class="text-xs text-slate-500">Bài thi đầu tiên: <strong>${chronological[0].title}</strong></span>
          <div class="mt-1 text-2xl font-black text-indigo-600">${s.toFixed(1)} / 10 Điểm</div>
          <span class="text-[11px] text-emerald-600 font-semibold mt-1">
            <i class="fa-solid fa-sparkles"></i> Hãy làm thêm bài thi ở Tab 3 để hiển thị đường cong tiến bộ!
          </span>
        </div>
      `;
      return;
    }

    const width = 640;
    const height = 135;
    const paddingLeft = 38;
    const paddingRight = 25;
    const paddingTop = 22;
    const paddingBottom = 26;

    const chartW = width - paddingLeft - paddingRight;
    const chartH = height - paddingTop - paddingBottom;

    const points = chronological.map((item, idx) => {
      const x = paddingLeft + (idx / (chronological.length - 1)) * chartW;
      const y = paddingTop + chartH - ((item.score / 10) * chartH);
      return { x, y, score: item.score, title: item.title, date: item.date };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`;

    const y10 = paddingTop;
    const y5 = paddingTop + chartH / 2;
    const y0 = paddingTop + chartH;

    const svg = `
      <svg viewBox="0 0 ${width} ${height}" class="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4f46e5" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="#4f46e5" stop-opacity="0.01"/>
          </linearGradient>
        </defs>

        <line x1="${paddingLeft}" y1="${y10}" x2="${width - paddingRight}" y2="${y10}" stroke="#e2e8f0" stroke-dasharray="3 3" />
        <line x1="${paddingLeft}" y1="${y5}" x2="${width - paddingRight}" y2="${y5}" stroke="#e2e8f0" stroke-dasharray="3 3" />
        <line x1="${paddingLeft}" y1="${y0}" x2="${width - paddingRight}" y2="${y0}" stroke="#cbd5e1" stroke-width="1.2" />

        <text x="${paddingLeft - 8}" y="${y10 + 4}" font-size="10" fill="#94a3b8" text-anchor="end" font-weight="bold">10đ</text>
        <text x="${paddingLeft - 8}" y="${y5 + 4}" font-size="10" fill="#94a3b8" text-anchor="end">5đ</text>
        <text x="${paddingLeft - 8}" y="${y0 + 4}" font-size="10" fill="#94a3b8" text-anchor="end">0đ</text>

        <path d="${areaD}" fill="url(#chartGrad)" />
        <path d="${pathD}" fill="none" stroke="#4f46e5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />

        ${points.map((p, i) => `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#ffffff" stroke="#4f46e5" stroke-width="2.5">
            <title>Lần ${i + 1}: ${p.score.toFixed(1)}đ - ${p.title} (${p.date})</title>
          </circle>
          <text x="${p.x.toFixed(1)}" y="${(p.y - 8).toFixed(1)}" font-size="10" font-weight="extrabold" fill="#312e81" text-anchor="middle">${p.score.toFixed(1)}</text>
          <text x="${p.x.toFixed(1)}" y="${(height - 8)}" font-size="9" font-weight="500" fill="#64748b" text-anchor="middle">Lần ${i + 1}</text>
        `).join('')}
      </svg>
    `;

    accChartContainer.innerHTML = svg;
  }

  // Hiển thị huy hiệu khích lệ học sinh
  function renderAchievementBadges(scores) {
    if (!accBadgesList) return;
    const scoresCount = (scores && scores.length) || 0;
    
    let hasBreakthrough = false;
    if (scoresCount >= 2) {
      for (let i = scores.length - 1; i >= 1; i--) {
        if (scores[i - 1].score - scores[i].score >= 1.5) {
          hasBreakthrough = true;
          break;
        }
      }
    }

    const totalScore = scores ? scores.reduce((sum, item) => sum + item.score, 0) : 0;
    const avgScore = scoresCount > 0 ? (totalScore / scoresCount) : 0;

    const badges = [
      {
        id: 'b1',
        icon: '🌟',
        name: 'Khởi đầu nan',
        desc: 'Làm bài kiểm tra đầu tiên',
        unlocked: scoresCount >= 1
      },
      {
        id: 'b2',
        icon: '⚡',
        name: 'Chăm chỉ',
        desc: 'Hoàn thành từ 3 bài khảo thí',
        unlocked: scoresCount >= 3
      },
      {
        id: 'b3',
        icon: '🏆',
        name: 'Thủ khoa 10đ',
        desc: 'Đạt điểm 10 tuyệt đối',
        unlocked: scores ? scores.some(s => s.score >= 10) : false
      },
      {
        id: 'b4',
        icon: '📈',
        name: 'Đột phá',
        desc: 'Tăng ≥ 1.5đ so với bài trước',
        unlocked: hasBreakthrough
      },
      {
        id: 'b5',
        icon: '🎯',
        name: 'Bậc thầy THCS',
        desc: '≥ 5 bài thi & Điểm TB ≥ 8.0',
        unlocked: scoresCount >= 5 && avgScore >= 8.0
      }
    ];

    const unlockedCount = badges.filter(b => b.unlocked).length;
    if (accBadgeUnlockedText) {
      accBadgeUnlockedText.textContent = `Đã đạt ${unlockedCount}/${badges.length}`;
    }

    accBadgesList.innerHTML = badges.map(b => {
      if (b.unlocked) {
        return `
          <div class="p-2 sm:p-2.5 rounded-xl bg-white border border-amber-300 shadow-2xs flex flex-col items-center text-center transition-all hover:scale-105">
            <span class="text-2xl sm:text-3xl mb-1">${b.icon}</span>
            <span class="font-extrabold text-[11px] text-amber-950 truncate max-w-full">${b.name}</span>
            <span class="text-[9px] text-slate-500 line-clamp-1 mt-0.5">${b.desc}</span>
            <span class="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full mt-1">Đã mở</span>
          </div>
        `;
      } else {
        return `
          <div class="p-2 sm:p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80 flex flex-col items-center text-center opacity-60">
            <span class="text-2xl sm:text-3xl mb-1 grayscale">${b.icon}</span>
            <span class="font-bold text-[11px] text-slate-600 truncate max-w-full">${b.name}</span>
            <span class="text-[9px] text-slate-400 line-clamp-1 mt-0.5">${b.desc}</span>
            <span class="text-[9px] text-slate-400 mt-1"><i class="fa-solid fa-lock text-[8px]"></i> Khóa</span>
          </div>
        `;
      }
    }).join('');
  }

  // Render toàn bộ giao diện Tab "Tiến độ học tập & Bảng điểm"
  function renderAccountProgressUI(filterSubject = 'all') {
    const user = state.currentUser;
    if (!user) return;
    const p = user.profile || {};

    if (modalUserAvatarLarge) modalUserAvatarLarge.textContent = p.avatar || '👨‍🎓';
    if (modalUserFullname) modalUserFullname.textContent = p.name || user.username;
    if (modalUserGradeBadge) modalUserGradeBadge.textContent = `Khối ${p.grade || '9'}`;
    if (modalUserSchoolClass) {
      const cls = p.className ? `Lớp ${p.className}` : `Khối ${p.grade || '9'}`;
      const sch = p.school ? p.school : 'Trường THCS';
      modalUserSchoolClass.textContent = `${cls} • ${sch} (Tài khoản: ${user.username})`;
    }

    const scores = user.scores || [];
    const totalTests = scores.length;

    let totalScore = 0;
    let maxScore = 0;
    let totalCorrect = 0;

    scores.forEach(item => {
      const s = parseFloat(item.score) || 0;
      totalScore += s;
      if (s > maxScore) maxScore = s;
      totalCorrect += (item.correctTotal || 0);
    });

    const avgScore = totalTests > 0 ? (totalScore / totalTests).toFixed(1) : '0.0';

    if (accStatTotalTests) accStatTotalTests.textContent = totalTests;
    if (accStatMaxScore) accStatMaxScore.textContent = maxScore.toFixed(1);
    if (accStatAvgScore) accStatAvgScore.textContent = avgScore;
    if (accStatTotalCorrect) accStatTotalCorrect.textContent = totalCorrect;

    if (accStatRatingBadge) {
      const avgNum = parseFloat(avgScore);
      if (totalTests === 0) {
        accStatRatingBadge.textContent = 'Chưa có bài';
        accStatRatingBadge.className = 'inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-slate-100 text-slate-600 mt-0.5';
      } else if (avgNum >= 9.0) {
        accStatRatingBadge.textContent = 'Xuất sắc';
        accStatRatingBadge.className = 'inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 mt-0.5';
      } else if (avgNum >= 8.0) {
        accStatRatingBadge.textContent = 'Giỏi';
        accStatRatingBadge.className = 'inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 mt-0.5';
      } else if (avgNum >= 6.5) {
        accStatRatingBadge.textContent = 'Khá';
        accStatRatingBadge.className = 'inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800 border border-blue-300 mt-0.5';
      } else if (avgNum >= 5.0) {
        accStatRatingBadge.textContent = 'Đạt';
        accStatRatingBadge.className = 'inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 border border-amber-300 mt-0.5';
      } else {
        accStatRatingBadge.textContent = 'Cần cố gắng';
        accStatRatingBadge.className = 'inline-block text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-800 border border-rose-300 mt-0.5';
      }
    }

    renderProgressChart(scores);
    renderAchievementBadges(scores);

    const filteredScores = scores.filter(item => {
      if (filterSubject === 'all') return true;
      return (item.subject === filterSubject);
    });

    if (accHistoryTableBody) {
      if (filteredScores.length === 0) {
        accHistoryTableBody.innerHTML = '';
        if (accHistoryEmpty) accHistoryEmpty.classList.remove('hidden');
      } else {
        if (accHistoryEmpty) accHistoryEmpty.classList.add('hidden');
        accHistoryTableBody.innerHTML = filteredScores.map((item, idx) => {
          const s = parseFloat(item.score) || 0;
          const badgeClass = s >= 8 
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
            : (s >= 5 ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-rose-100 text-rose-800 border-rose-300');
          
          const subjectColor = item.subject === 'Toán'
            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
            : (item.subject === 'KHTN' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200');

          return `
            <tr class="hover:bg-slate-50/80 transition-colors">
              <td class="p-2 sm:px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">${item.date}</td>
              <td class="p-2 sm:px-3 font-semibold text-slate-900 max-w-[180px] sm:max-w-xs truncate" title="${item.title}">${item.title}</td>
              <td class="p-2 sm:px-3 text-center whitespace-nowrap">
                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${subjectColor}">${item.subject || 'Khác'}</span>
              </td>
              <td class="p-2 sm:px-3 text-center font-medium text-slate-700 whitespace-nowrap">${item.correctTotal}/${item.totalQ} (${item.percentage}%)</td>
              <td class="p-2 sm:px-3 text-right whitespace-nowrap">
                <span class="inline-block px-2 py-0.5 rounded-md font-bold text-xs border ${badgeClass}">
                  ${s.toFixed(1)} đ
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // Nạp thông tin hồ sơ của chính người dùng hiện tại vào form
  function fillCurrentProfileForm() {
    const user = state.currentUser;
    if (!user) return;
    const p = user.profile || {};
    if (inputAccountId) inputAccountId.value = user.username;
    if (accFormUsernameDisplay) accFormUsernameDisplay.textContent = `@${user.username}`;
    if (inputAccountName) inputAccountName.value = p.name || '';
    if (inputAccountSchool) inputAccountSchool.value = p.school || '';
    if (inputAccountGrade) inputAccountGrade.value = p.grade || '9';
    if (inputAccountClass) inputAccountClass.value = p.className || '';
    if (inputAccountAvatar) inputAccountAvatar.value = p.avatar || '👨‍🎓';
    if (inputAccountNewPassword) inputAccountNewPassword.value = '';
    renderAvatarPicker(p.avatar || '👨‍🎓');
  }

  // Mở Modal Hồ Sơ Cá Nhân (chỉ nạp dữ liệu của người dùng hiện tại)
  function openUserAccountModal(tab = 'progress') {
    if (!state.currentUser) {
      if (modalAuthGate) modalAuthGate.classList.remove('hidden');
      return;
    }
    renderAccountProgressUI();
    fillCurrentProfileForm();
    switchAccountModalTab(tab);
    if (modalUserAccount) modalUserAccount.classList.remove('hidden');
  }

  // Đóng Modal Hồ Sơ Cá Nhân
  function closeUserAccountModal() {
    if (modalUserAccount) modalUserAccount.classList.add('hidden');
  }

  function switchAccountModalTab(tab) {
    if (tab === 'progress') {
      if (tabBtnAccountProgress) {
        tabBtnAccountProgress.className = 'account-tab-btn active px-3 py-2 text-indigo-600 border-b-2 border-indigo-600 flex items-center gap-1.5 cursor-pointer font-bold';
      }
      if (tabBtnAccountManage) {
        tabBtnAccountManage.className = 'account-tab-btn px-3 py-2 text-slate-500 hover:text-slate-800 border-b-2 border-transparent flex items-center gap-1.5 cursor-pointer font-bold';
      }
      if (paneAccountProgress) paneAccountProgress.classList.remove('hidden');
      if (paneAccountManage) paneAccountManage.classList.add('hidden');
    } else {
      if (tabBtnAccountManage) {
        tabBtnAccountManage.className = 'account-tab-btn active px-3 py-2 text-indigo-600 border-b-2 border-indigo-600 flex items-center gap-1.5 cursor-pointer font-bold';
      }
      if (tabBtnAccountProgress) {
        tabBtnAccountProgress.className = 'account-tab-btn px-3 py-2 text-slate-500 hover:text-slate-800 border-b-2 border-transparent flex items-center gap-1.5 cursor-pointer font-bold';
      }
      if (paneAccountManage) paneAccountManage.classList.remove('hidden');
      if (paneAccountProgress) paneAccountProgress.classList.add('hidden');
    }
  }

  // Lưu chỉnh sửa hồ sơ cá nhân và đổi mật khẩu cho chính mình
  if (formUserAccount) {
    formUserAccount.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = state.currentUser;
      if (!user) {
        showToast('Vui lòng đăng nhập trước!', 'warning');
        return;
      }

      const name = (inputAccountName?.value || '').trim();
      if (!name) {
        showToast('Vui lòng nhập họ và tên học sinh!', 'warning');
        return;
      }

      user.profile = user.profile || {};
      user.profile.name = name;
      user.profile.school = (inputAccountSchool?.value || '').trim();
      user.profile.grade = inputAccountGrade?.value || '9';
      user.profile.className = (inputAccountClass?.value || '').trim();
      user.profile.avatar = inputAccountAvatar?.value || '👨‍🎓';

      const newPass = (inputAccountNewPassword?.value || '').trim();
      if (newPass) {
        user.password = newPass;
      }

      await window.SmartEduCloud.syncUserData(user);
      updateHeaderAccountUI();
      renderAccountProgressUI();
      showToast(`Đã lưu thay đổi hồ sơ của em ${name}!`, 'success');
      switchAccountModalTab('progress');
    });
  }

  if (accFilterSubject) {
    accFilterSubject.addEventListener('change', () => {
      renderAccountProgressUI(accFilterSubject.value);
    });
  }

  if (tabBtnAccountProgress) tabBtnAccountProgress.addEventListener('click', () => switchAccountModalTab('progress'));
  if (tabBtnAccountManage) tabBtnAccountManage.addEventListener('click', () => {
    fillCurrentProfileForm();
    switchAccountModalTab('manage');
  });

  if (btnEditCurrentProfile) {
    btnEditCurrentProfile.addEventListener('click', () => {
      if (state.currentUser) {
        fillCurrentProfileForm();
        switchAccountModalTab('manage');
      }
    });
  }

  // In bảng điểm cá nhân
  function printStudentReport() {
    const user = state.currentUser;
    if (!user) return;
    const p = user.profile || {};
    const scores = user.scores || [];

    const printName = document.getElementById('print-student-name');
    const printClass = document.getElementById('print-student-class');
    const printSchool = document.getElementById('print-student-school');
    const printDate = document.getElementById('print-report-date');
    const printStatTests = document.getElementById('print-stat-tests');
    const printStatAvg = document.getElementById('print-stat-avg');
    const printStatMax = document.getElementById('print-stat-max');
    const printStatRating = document.getElementById('print-stat-rating');
    const printTableBody = document.getElementById('print-history-table-body');

    if (printName) printName.textContent = p.name || user.username;
    if (printClass) printClass.textContent = p.className ? `Lớp ${p.className} (Khối ${p.grade || 9})` : `Khối ${p.grade || 9}`;
    if (printSchool) printSchool.textContent = p.school || 'Trường THCS';
    if (printDate) printDate.textContent = `Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

    let totalScore = 0;
    let maxScore = 0;
    scores.forEach(s => {
      totalScore += s.score;
      if (s.score > maxScore) maxScore = s.score;
    });
    const avgScore = scores.length > 0 ? (totalScore / scores.length).toFixed(1) : '0.0';

    if (printStatTests) printStatTests.textContent = scores.length;
    if (printStatAvg) printStatAvg.textContent = `${avgScore} đ`;
    if (printStatMax) printStatMax.textContent = `${maxScore.toFixed(1)} đ`;
    if (printStatRating) {
      const a = parseFloat(avgScore);
      printStatRating.textContent = a >= 9 ? 'Xuất sắc' : (a >= 8 ? 'Giỏi' : (a >= 6.5 ? 'Khá' : (a >= 5 ? 'Đạt' : 'Cần cố gắng')));
    }

    if (printTableBody) {
      if (scores.length === 0) {
        printTableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">Chưa có bài thi nào được ghi nhận.</td></tr>`;
      } else {
        printTableBody.innerHTML = scores.map((item, idx) => `
          <tr class="border-b border-slate-200">
            <td class="p-2 border-r border-slate-200 text-center">${idx + 1}</td>
            <td class="p-2 border-r border-slate-200">${item.date}</td>
            <td class="p-2 border-r border-slate-200 font-semibold">${item.title}</td>
            <td class="p-2 border-r border-slate-200 text-center">${item.subject || 'Khác'}</td>
            <td class="p-2 border-r border-slate-200 text-center">${item.correctTotal}/${item.totalQ} (${item.percentage}%)</td>
            <td class="p-2 text-right font-bold">${item.score.toFixed(1)} đ</td>
          </tr>
        `).join('');
      }
    }

    document.body.classList.add('printing-report-active');
    window.print();
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-report-active');
    }, { once: true });
  }

  if (btnPrintStudentReport) btnPrintStudentReport.addEventListener('click', printStudentReport);

  // Xuất file sao lưu JSON
  if (btnExportAccountData) {
    btnExportAccountData.addEventListener('click', () => {
      const user = state.currentUser;
      if (!user) return;
      const jsonStr = JSON.stringify(user, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (user.profile?.name || user.username).replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      a.href = url;
      a.download = `SmartEdu_Cloud_${safeName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Đã xuất file sao lưu dữ liệu học tập thành công!', 'success');
    });
  }

  // Nhập file sao lưu JSON của cá nhân
  if (inputImportAccountData) {
    inputImportAccountData.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported && imported.username && imported.profile) {
            await window.SmartEduCloud.syncUserData(imported);
            localStorage.setItem('smartedu_active_cloud_username', imported.username);
            applyUserSession(imported);
            fillCurrentProfileForm();
            renderAccountProgressUI();
            showToast(`Đã nạp và khôi phục dữ liệu học tập của ${imported.profile?.name || imported.username}!`, 'success');
          } else {
            showToast('Tệp JSON không đúng định dạng sao lưu của SmartEdu!', 'warning');
          }
        } catch (err) {
          showToast('Lỗi đọc tệp JSON: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  // Gắn sự kiện đóng mở Modal Hồ sơ
  if (btnUserAccountMobile) btnUserAccountMobile.addEventListener('click', () => openUserAccountModal('progress'));
  if (btnUserAccountDesktop) btnUserAccountDesktop.addEventListener('click', () => openUserAccountModal('progress'));
  if (btnQuizHistory) btnQuizHistory.addEventListener('click', () => openUserAccountModal('progress'));
  if (btnCloseUserAccount) btnCloseUserAccount.addEventListener('click', closeUserAccountModal);
  if (btnDoneUserAccount) btnDoneUserAccount.addEventListener('click', closeUserAccountModal);
  if (modalUserAccount) {
    modalUserAccount.addEventListener('click', (e) => {
      if (e.target === modalUserAccount) closeUserAccountModal();
    });
  }

  // Expose các hàm ra window & aliases an toàn
  window.openUserAccountModal = openUserAccountModal;
  window.recordQuizScoreToAccount = recordQuizScoreToAccount;
  window.renderMindmap = renderMindmap;
  window.renderMarkmap = renderMindmap;
  window.renderSummary = renderSummary;
  window.renderSummaryUI = renderSummary;

  // ==============================================================
  // QUẢN LÝ SUPER ADMIN (BẢNG ĐIỀU KHIỂN TOÀN TRƯỜNG)
  // ==============================================================
  const modalSuperAdmin = document.getElementById('modal-super-admin');
  const btnCloseSuperAdmin = document.getElementById('btn-close-super-admin');
  const btnRefreshSuperAdmin = document.getElementById('btn-refresh-super-admin');
  const btnSuperAdminMobile = document.getElementById('btn-super-admin-mobile');
  const btnSuperAdminDesktop = document.getElementById('btn-super-admin-desktop');

  // Stats
  const adminStatUsers = document.getElementById('admin-stat-users');
  const adminStatMindmaps = document.getElementById('admin-stat-mindmaps');
  const adminStatSummaries = document.getElementById('admin-stat-summaries');
  const adminStatQuizzes = document.getElementById('admin-stat-quizzes');
  const adminStatFlashcards = document.getElementById('admin-stat-flashcards');
  const adminStatCloud = document.getElementById('admin-stat-cloud');

  // Panes & Tabs
  const adminTabBtns = {
    users: document.getElementById('admin-tab-btn-users'),
    mindmaps: document.getElementById('admin-tab-btn-mindmaps'),
    summaries: document.getElementById('admin-tab-btn-summaries'),
    scores: document.getElementById('admin-tab-btn-scores'),
    flashcards: document.getElementById('admin-tab-btn-flashcards')
  };
  const adminPanes = {
    users: document.getElementById('admin-pane-users'),
    mindmaps: document.getElementById('admin-pane-mindmaps'),
    summaries: document.getElementById('admin-pane-summaries'),
    scores: document.getElementById('admin-pane-scores'),
    flashcards: document.getElementById('admin-pane-flashcards')
  };

  // Search Inputs & Lists
  const adminSearchUsers = document.getElementById('admin-search-users');
  const adminUsersList = document.getElementById('admin-users-list');
  const adminUsersCounter = document.getElementById('admin-users-counter');

  const adminSearchMindmaps = document.getElementById('admin-search-mindmaps');
  const adminMindmapsList = document.getElementById('admin-mindmaps-list');
  const adminMindmapsCounter = document.getElementById('admin-mindmaps-counter');

  const adminSearchSummaries = document.getElementById('admin-search-summaries');
  const adminSummariesList = document.getElementById('admin-summaries-list');
  const adminSummariesCounter = document.getElementById('admin-summaries-counter');

  const adminSearchScores = document.getElementById('admin-search-scores');
  const adminFilterSubjectScores = document.getElementById('admin-filter-subject-scores');
  const adminScoresTableBody = document.getElementById('admin-scores-table-body');

  const adminSearchFlashcards = document.getElementById('admin-search-flashcards');
  const adminFlashcardsList = document.getElementById('admin-flashcards-list');
  const adminFlashcardsCounter = document.getElementById('admin-flashcards-counter');

  let cachedAllAdminUsers = [];
  let currentAdminTab = 'users';

  // Mở Bảng điều khiển Super Admin
  async function openSuperAdminModal(tab = 'users') {
    const user = state.currentUser;
    const isSuperAdmin = user && (user.username === 'admin' || user.profile?.role === 'superadmin');
    if (!isSuperAdmin) {
      showToast('Chỉ Quản trị viên (Super Admin) mới có quyền truy cập khu vực này!', 'warning');
      return;
    }

    if (modalSuperAdmin) {
      modalSuperAdmin.style.display = 'flex';
      modalSuperAdmin.classList.remove('hidden');
      modalSuperAdmin.classList.add('flex');
    }
    switchAdminTab(tab);
    loadSuperAdminData();
  }

  // Đóng Modal Super Admin
  function closeSuperAdminModal() {
    if (modalSuperAdmin) {
      modalSuperAdmin.style.display = 'none';
      modalSuperAdmin.classList.add('hidden');
      modalSuperAdmin.classList.remove('flex');
    }
  }

  // Nạp toàn bộ dữ liệu từ Cloud / Local
  async function loadSuperAdminData() {
    if (!window.SmartEduCloud) return;
    
    // Hiển thị trạng thái cloud
    if (adminStatCloud) {
      if (window.SmartEduCloud.isFirebaseReady) {
        adminStatCloud.textContent = 'Google Cloud Online';
        adminStatCloud.className = 'text-[11px] font-bold text-emerald-700 mt-1 truncate';
      } else {
        adminStatCloud.textContent = 'Bộ nhớ Máy này';
        adminStatCloud.className = 'text-[11px] font-bold text-amber-700 mt-1 truncate';
      }
    }

    try {
      const res = await window.SmartEduCloud.getAllUsers();
      if (Array.isArray(res)) {
        cachedAllAdminUsers = res;
      } else if (res && typeof res === 'object') {
        cachedAllAdminUsers = Object.values(res);
      } else {
        cachedAllAdminUsers = [];
      }
      updateAdminStats();
      renderCurrentAdminTab();
    } catch (e) {
      console.warn('Lỗi nạp dữ liệu Super Admin:', e);
      showToast('Lỗi khi tải dữ liệu từ máy chủ: ' + e.message, 'error');
    }
  }

  // Lọc bỏ tài khoản mẫu / dữ liệu bài mẫu (Toán 9, KHTN 9, longphung9a13...) để Super Admin chỉ thấy dữ liệu thực tế
  function isAdminSampleUser(u) {
    if (!u) return true;
    const uname = (u.username || '').trim().toLowerCase();
    const name = (u.profile?.name || '').toLowerCase();
    if (uname === 'admin' || uname === 'longphung9a13' || uname.startsWith('demo') || uname.startsWith('test')) return true;
    if (name.includes('bài mẫu') || name.includes('mẫu') || name.includes('demo') || name.includes('long phụng')) return true;
    return false;
  }

  function isAdminSampleItem(item) {
    if (!item) return true;
    const author = (item.authorUsername || item.studentUsername || '').trim().toLowerCase();
    if (author === 'longphung9a13' || author === 'admin' || author.startsWith('demo') || author.startsWith('test')) return true;
    const title = (item.title || '').toLowerCase();
    if (title.includes('bài mẫu') || title.includes('mẫu toán') || title.includes('mẫu khtn') || 
        title.includes('hệ hai phương trình') || title.includes('định luật ôm') || title.includes('demo')) {
      return true;
    }
    return false;
  }

  // Cập nhật thẻ số liệu thống kê
  function updateAdminStats() {
    const students = cachedAllAdminUsers.filter(u => !isAdminSampleUser(u));
    let totalMindmaps = 0;
    let totalSummaries = 0;
    let totalScores = 0;
    let totalFlashcards = 0;

    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      const validMm = (u.mindmaps || []).filter(mm => !isAdminSampleItem(mm));
      const validSm = (u.summaries || []).filter(sm => !isAdminSampleItem(sm));
      const validSc = (u.scores || []).filter(sc => !isAdminSampleItem(sc));
      const validFc = (u.flashcards || []).filter(fc => !isAdminSampleItem(fc));

      totalMindmaps += validMm.length;
      totalSummaries += validSm.length;
      totalScores += validSc.length;
      totalFlashcards += validFc.length;
    });

    if (adminStatUsers) adminStatUsers.textContent = students.length;
    if (adminStatMindmaps) adminStatMindmaps.textContent = totalMindmaps;
    if (adminStatSummaries) adminStatSummaries.textContent = totalSummaries;
    if (adminStatQuizzes) adminStatQuizzes.textContent = totalScores;
    if (adminStatFlashcards) adminStatFlashcards.textContent = totalFlashcards;
  }

  // Chuyển Tab
  function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    Object.keys(adminTabBtns).forEach(k => {
      const btn = adminTabBtns[k];
      const pane = adminPanes[k];
      if (k === tabName) {
        if (btn) btn.className = 'admin-tab-btn active px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all';
        if (pane) pane.classList.remove('hidden');
      } else {
        if (btn) btn.className = 'admin-tab-btn px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all';
        if (pane) pane.classList.add('hidden');
      }
    });
    renderCurrentAdminTab();
  }

  // Render tab hiện tại
  function renderCurrentAdminTab() {
    switch (currentAdminTab) {
      case 'users':
        renderAdminUsersTab();
        break;
      case 'mindmaps':
        renderAdminMindmapsTab();
        break;
      case 'summaries':
        renderAdminSummariesTab();
        break;
      case 'scores':
        renderAdminScoresTab();
        break;
      case 'flashcards':
        renderAdminFlashcardsTab();
        break;
    }
  }

  // TAB 1: Render Danh sách Học sinh
  function renderAdminUsersTab() {
    if (!adminUsersList) return;
    const query = (adminSearchUsers?.value || '').trim().toLowerCase();
    const students = cachedAllAdminUsers.filter(u => {
      if (isAdminSampleUser(u)) return false;
      if (!query) return true;
      const name = (u.profile?.name || '').toLowerCase();
      const uname = (u.username || '').toLowerCase();
      const cls = (u.profile?.className || '').toLowerCase();
      const school = (u.profile?.school || '').toLowerCase();
      return name.includes(query) || uname.includes(query) || cls.includes(query) || school.includes(query);
    });

    if (adminUsersCounter) {
      adminUsersCounter.textContent = `Hiển thị ${students.length} học sinh`;
    }

    if (students.length === 0) {
      adminUsersList.innerHTML = `
        <div class="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i class="fa-solid fa-user-slash text-2xl mb-2 text-slate-300"></i>
          <p class="font-bold">Chưa tìm thấy học sinh nào phù hợp!</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Khi học sinh đăng ký trên web, tài khoản sẽ tự động xuất hiện tại đây.</p>
        </div>
      `;
      return;
    }

    adminUsersList.innerHTML = students.map((u, idx) => {
      const p = u.profile || {};
      const mmCount = (u.mindmaps || []).filter(mm => !isAdminSampleItem(mm)).length;
      const smCount = (u.summaries || []).filter(sm => !isAdminSampleItem(sm)).length;
      const scCount = (u.scores || []).filter(sc => !isAdminSampleItem(sc)).length;
      const fcCount = (u.flashcards || []).filter(fc => !isAdminSampleItem(fc)).length;
      return `
        <div class="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              ${p.avatar || '👨‍🎓'}
            </span>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-extrabold text-slate-900 text-xs sm:text-sm truncate">${p.name || u.username}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  ${p.className ? 'Lớp ' + p.className : 'Khối ' + (p.grade || 9)}
                </span>
                <span class="text-[11px] text-slate-400 font-mono">@${u.username}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5 truncate">
                ${p.school || 'THCS Long Cang'} • Tham gia: ${p.createdAt || 'Mới'} • Đăng nhập: ${p.lastLogin || 'Chưa rõ'} (giờ VN)
              </p>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap text-[10px] font-bold text-slate-600">
                <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">🧠 ${mmCount} sơ đồ</span>
                <span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">📝 ${smCount} tóm tắt</span>
                <span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">🎯 ${scCount} bài thi</span>
                <span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">🃏 ${fcCount} bộ thẻ</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button onclick="window.adminResetStudentPassword && window.adminResetStudentPassword('${u.username}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all active:scale-95" title="Đặt lại mật khẩu cho học sinh này">
              <i class="fa-solid fa-key text-[11px]"></i>
              <span>Đổi MK</span>
            </button>
            <button onclick="window.adminDeleteStudent && window.adminDeleteStudent('${u.username}', '${p.name || u.username}')" class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95" title="Xóa tài khoản học sinh">
              <i class="fa-solid fa-trash text-[11px]"></i>
              <span>Xóa</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // TAB 2: Render Tất Cả Sơ Đồ Tư Duy
  function renderAdminMindmapsTab() {
    if (!adminMindmapsList) return;
    const query = (adminSearchMindmaps?.value || '').trim().toLowerCase();
    
    let allMindmaps = [];
    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      if (u.mindmaps && Array.isArray(u.mindmaps)) {
        u.mindmaps.forEach(mm => {
          if (isAdminSampleItem(mm)) return;
          allMindmaps.push({
            ...mm,
            authorUsername: u.username,
            authorName: u.profile?.name || u.username,
            authorClass: u.profile?.className || `Khối ${u.profile?.grade || 9}`
          });
        });
      }
    });

    if (query) {
      allMindmaps = allMindmaps.filter(mm => {
        const title = (mm.title || '').toLowerCase();
        const sub = (mm.subject || '').toLowerCase();
        const author = (mm.authorName || '').toLowerCase();
        return title.includes(query) || sub.includes(query) || author.includes(query);
      });
    }

    if (adminMindmapsCounter) {
      adminMindmapsCounter.textContent = `Hiển thị ${allMindmaps.length} sơ đồ tư duy toàn trường`;
    }

    if (allMindmaps.length === 0) {
      adminMindmapsList.innerHTML = `
        <div class="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i class="fa-solid fa-sitemap text-2xl mb-2 text-slate-300"></i>
          <p class="font-bold">Chưa có sơ đồ tư duy nào!</p>
        </div>
      `;
      return;
    }

    adminMindmapsList.innerHTML = allMindmaps.map(mm => `
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              ${mm.subject || 'Tổng hợp'}
            </span>
            <span class="text-[11px] text-slate-400 font-mono">${mm.createdAt || 'Mới'}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">${mm.title || 'Sơ đồ tư duy'}</h4>
          <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <i class="fa-solid fa-user-pen text-indigo-500"></i>
            Tác giả: <span class="font-bold text-slate-700">${mm.authorName}</span> (${mm.authorClass})
          </p>
        </div>
        <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
          <button onclick="window.adminOpenMindmap && window.adminOpenMindmap('${mm.authorUsername}', '${mm.id}')" class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i class="fa-solid fa-eye text-[11px]"></i>
            <span>Mở xem</span>
          </button>
          <button onclick="window.adminDeletePost && window.adminDeletePost('${mm.authorUsername}', 'mindmap', '${mm.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i class="fa-solid fa-trash text-[11px]"></i>
            <span>Xóa</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // TAB 3: Render Tất Cả Bài Tóm Tắt
  function renderAdminSummariesTab() {
    if (!adminSummariesList) return;
    const query = (adminSearchSummaries?.value || '').trim().toLowerCase();

    let allSummaries = [];
    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      if (u.summaries && Array.isArray(u.summaries)) {
        u.summaries.forEach(sm => {
          if (isAdminSampleItem(sm)) return;
          allSummaries.push({
            ...sm,
            authorUsername: u.username,
            authorName: u.profile?.name || u.username,
            authorClass: u.profile?.className || `Khối ${u.profile?.grade || 9}`
          });
        });
      }
    });

    if (query) {
      allSummaries = allSummaries.filter(sm => {
        const title = (sm.title || '').toLowerCase();
        const sub = (sm.subject || '').toLowerCase();
        const author = (sm.authorName || '').toLowerCase();
        return title.includes(query) || sub.includes(query) || author.includes(query);
      });
    }

    if (adminSummariesCounter) {
      adminSummariesCounter.textContent = `Hiển thị ${allSummaries.length} bài tóm tắt toàn trường`;
    }

    if (allSummaries.length === 0) {
      adminSummariesList.innerHTML = `
        <div class="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i class="fa-solid fa-book-bookmark text-2xl mb-2 text-slate-300"></i>
          <p class="font-bold">Chưa có bài tóm tắt nào!</p>
        </div>
      `;
      return;
    }

    adminSummariesList.innerHTML = allSummaries.map(sm => `
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-purple-200 hover:shadow-xs transition-all flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
              ${sm.subject || 'Tổng hợp'}
            </span>
            <span class="text-[11px] text-slate-400 font-mono">${sm.createdAt || 'Mới'}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">${sm.title || 'Bài tóm tắt kiến thức'}</h4>
          <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <i class="fa-solid fa-user-pen text-purple-500"></i>
            Tác giả: <span class="font-bold text-slate-700">${sm.authorName}</span> (${sm.authorClass})
          </p>
        </div>
        <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
          <button onclick="window.adminOpenSummary && window.adminOpenSummary('${sm.authorUsername}', '${sm.id}')" class="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i class="fa-solid fa-eye text-[11px]"></i>
            <span>Xem lại</span>
          </button>
          <button onclick="window.adminDeletePost && window.adminDeletePost('${sm.authorUsername}', 'summary', '${sm.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i class="fa-solid fa-trash text-[11px]"></i>
            <span>Xóa</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // TAB 4: Render Bảng Điểm Khảo Thí Toàn Trường
  function renderAdminScoresTab() {
    if (!adminScoresTableBody) return;
    const query = (adminSearchScores?.value || '').trim().toLowerCase();
    const filterSub = adminFilterSubjectScores?.value || 'all';

    let allScores = [];
    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      if (u.scores && Array.isArray(u.scores)) {
        u.scores.forEach(sc => {
          if (isAdminSampleItem(sc)) return;
          allScores.push({
            ...sc,
            studentUsername: u.username,
            studentName: u.profile?.name || u.username,
            studentClass: u.profile?.className || `Khối ${u.profile?.grade || 9}`,
            studentSchool: u.profile?.school || 'THCS Long Cang'
          });
        });
      }
    });

    if (filterSub !== 'all') {
      allScores = allScores.filter(sc => (sc.subject || '').toLowerCase().includes(filterSub.toLowerCase()));
    }

    if (query) {
      allScores = allScores.filter(sc => {
        const sName = (sc.studentName || '').toLowerCase();
        const sClass = (sc.studentClass || '').toLowerCase();
        const sTitle = (sc.title || '').toLowerCase();
        return sName.includes(query) || sClass.includes(query) || sTitle.includes(query);
      });
    }

    // Sắp xếp bài mới nhất lên đầu
    allScores.sort((a, b) => (b.id || 0) - (a.id || 0));

    if (allScores.length === 0) {
      adminScoresTableBody.innerHTML = `
        <tr>
          <td colspan="9" class="p-8 text-center text-slate-400 bg-slate-50">
            <i class="fa-solid fa-award text-2xl mb-1 text-slate-300"></i>
            <p class="font-bold">Chưa có kết quả khảo thí nào!</p>
          </td>
        </tr>
      `;
      return;
    }

    adminScoresTableBody.innerHTML = allScores.map((sc, idx) => {
      const scoreVal = typeof sc.score === 'number' ? sc.score : parseFloat(sc.score) || 0;
      let badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      let evalText = 'Cần cố gắng';
      if (scoreVal >= 8.0) {
        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold';
        evalText = 'Giỏi / Xuất sắc';
      } else if (scoreVal >= 6.5) {
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
        evalText = 'Khá';
      } else if (scoreVal >= 5.0) {
        badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
        evalText = 'Đạt';
      }

      return `
        <tr class="hover:bg-slate-50 transition-colors">
          <td class="py-2.5 px-3 text-slate-400 font-mono text-[11px]">${idx + 1}</td>
          <td class="py-2.5 px-3 font-bold text-slate-900">${sc.studentName}</td>
          <td class="py-2.5 px-3 text-slate-600 font-medium">${sc.studentClass}</td>
          <td class="py-2.5 px-3 text-slate-800 font-medium max-w-[200px] truncate" title="${sc.title || ''}">${sc.title || 'Bài kiểm tra'}</td>
          <td class="py-2.5 px-3">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              ${sc.subject || 'Tổng hợp'}
            </span>
          </td>
          <td class="py-2.5 px-3 text-center">
            <span class="text-sm font-black text-indigo-700">${scoreVal.toFixed(1)}</span>
          </td>
          <td class="py-2.5 px-3 text-center font-mono text-[11px]">
            ${sc.correctTotal || 0}/${sc.totalQ || 10}
          </td>
          <td class="py-2.5 px-3 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}">
              ${evalText}
            </span>
          </td>
          <td class="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
            ${sc.date || ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  // TAB 5: Render Tất Cả Bộ Thẻ Lật
  function renderAdminFlashcardsTab() {
    if (!adminFlashcardsList) return;
    const query = (adminSearchFlashcards?.value || '').trim().toLowerCase();

    let allFlashcards = [];
    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      if (u.flashcards && Array.isArray(u.flashcards)) {
        u.flashcards.forEach(fc => {
          if (isAdminSampleItem(fc)) return;
          allFlashcards.push({
            ...fc,
            authorUsername: u.username,
            authorName: u.profile?.name || u.username,
            authorClass: u.profile?.className || `Khối ${u.profile?.grade || 9}`
          });
        });
      }
    });

    if (query) {
      allFlashcards = allFlashcards.filter(fc => {
        const title = (fc.title || '').toLowerCase();
        const sub = (fc.subject || '').toLowerCase();
        const author = (fc.authorName || '').toLowerCase();
        return title.includes(query) || sub.includes(query) || author.includes(query);
      });
    }

    if (adminFlashcardsCounter) {
      adminFlashcardsCounter.textContent = `Hiển thị ${allFlashcards.length} bộ thẻ lật toàn trường`;
    }

    if (allFlashcards.length === 0) {
      adminFlashcardsList.innerHTML = `
        <div class="col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <i class="fa-solid fa-clone text-2xl mb-2 text-slate-300"></i>
          <p class="font-bold">Chưa có bộ thẻ lật nào!</p>
        </div>
      `;
      return;
    }

    adminFlashcardsList.innerHTML = allFlashcards.map(fc => `
      <div class="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-200 hover:shadow-xs transition-all flex flex-col justify-between gap-3">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
              ${fc.subject || 'Tổng hợp'} • ${fc.cards?.length || 0} thẻ
            </span>
            <span class="text-[11px] text-slate-400 font-mono">${fc.createdAt || 'Mới'}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">${fc.title || 'Bộ thẻ ôn tập'}</h4>
          <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <i class="fa-solid fa-user-pen text-amber-500"></i>
            Tác giả: <span class="font-bold text-slate-700">${fc.authorName}</span> (${fc.authorClass})
          </p>
        </div>
        <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
          <button onclick="window.adminOpenFlashcard && window.adminOpenFlashcard('${fc.authorUsername}', '${fc.id}')" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i class="fa-solid fa-play text-[11px]"></i>
            <span>Luyện tập</span>
          </button>
          <button onclick="window.adminDeletePost && window.adminDeletePost('${fc.authorUsername}', 'flashcard', '${fc.id}')" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
            <i class="fa-solid fa-trash text-[11px]"></i>
            <span>Xóa</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Xuất file CSV / Excel Bảng điểm toàn trường
  window.exportAdminScoresCSV = function() {
    let allScores = [];
    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      if (u.scores && Array.isArray(u.scores)) {
        u.scores.forEach(sc => {
          if (isAdminSampleItem(sc)) return;
          allScores.push({
            ...sc,
            studentUsername: u.username,
            studentName: u.profile?.name || u.username,
            studentClass: u.profile?.className || `Khối ${u.profile?.grade || 9}`,
            studentSchool: u.profile?.school || 'THCS Long Cang'
          });
        });
      }
    });

    if (allScores.length === 0) {
      showToast('Chưa có dữ liệu bài khảo thí nào để xuất file!', 'warning');
      return;
    }

    let csvContent = '\uFEFFSTT,Họ và tên,Lớp,Trường THCS,Bài Khảo Thí,Môn học,Điểm số (Thang 10),Số câu đúng,Tổng số câu,Tỉ lệ (%),Thời gian thi\n';
    allScores.forEach((sc, idx) => {
      const cleanTitle = (sc.title || '').replace(/"/g, '""');
      const cleanName = (sc.studentName || '').replace(/"/g, '""');
      const cleanSchool = (sc.studentSchool || '').replace(/"/g, '""');
      csvContent += `${idx + 1},"${cleanName}","${sc.studentClass}","${cleanSchool}","${cleanTitle}","${sc.subject || ''}",${sc.score || 0},${sc.correctTotal || 0},${sc.totalQ || 10},${sc.percentage || 0}%,"${sc.date || ''}"
`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_Diem_SmartEdu_THCS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Đã xuất file bảng điểm CSV / Excel thành công!', 'success');
  };

  // In Báo Cáo Bảng Điểm Toàn Trường
  window.printAdminScoresReport = function() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('Trình duyệt đã chặn popup in, vui lòng cho phép!', 'warning');
      return;
    }

    let allScores = [];
    cachedAllAdminUsers.forEach(u => {
      if (isAdminSampleUser(u)) return;
      if (u.scores && Array.isArray(u.scores)) {
        u.scores.forEach(sc => {
          if (isAdminSampleItem(sc)) return;
          allScores.push({
            ...sc,
            studentName: u.profile?.name || u.username,
            studentClass: u.profile?.className || `Khối ${u.profile?.grade || 9}`
          });
        });
      }
    });

    const rowsHtml = allScores.map((sc, i) => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid #ddd; padding: 6px;"><b>${sc.studentName}</b></td>
        <td style="border: 1px solid #ddd; padding: 6px;">${sc.studentClass}</td>
        <td style="border: 1px solid #ddd; padding: 6px;">${sc.title || ''}</td>
        <td style="border: 1px solid #ddd; padding: 6px;">${sc.subject || ''}</td>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: center; font-weight: bold; color: #4338ca;">${sc.score}</td>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${sc.correctTotal}/${sc.totalQ}</td>
        <td style="border: 1px solid #ddd; padding: 6px; text-align: center;">${sc.date || ''}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Bảng Điểm Khảo Thí SmartEdu THCS</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 30px; font-size: 13px; color: #1e293b; }
            h2, h3 { text-align: center; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          <h2>BÁO CÁO KẾT QUẢ KHẢO THÍ TOÀN TRƯỜNG</h2>
          <h3>HỆ THỐNG SMARTEDU THCS (GDPT 2018)</h3>
          <p style="text-align: center; font-size: 12px; color: #64748b;">Thời gian xuất báo cáo: ${new Date().toLocaleString('vi-VN')}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">STT</th>
                <th>Họ và tên</th>
                <th>Lớp</th>
                <th>Bài Khảo Thí</th>
                <th>Môn</th>
                <th style="text-align: center;">Điểm</th>
                <th style="text-align: center;">Đúng/Tổng</th>
                <th style="text-align: center;">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  // Hành động Admin: Đổi mật khẩu học sinh
  window.adminResetStudentPassword = async function(username) {
    const newPass = prompt(`Nhập mật khẩu mới cho tài khoản @${username}:`, '123');
    if (!newPass || !newPass.trim()) return;

    if (window.SmartEduCloud) {
      const res = await window.SmartEduCloud.adminResetPassword(username, newPass.trim());
      if (res.success) {
        showToast(res.message, 'success');
        await loadSuperAdminData();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Hành động Admin: Xóa tài khoản học sinh
  window.adminDeleteStudent = async function(username, fullname) {
    const confirmDel = confirm(`⚠️ CẢNH BÁO QUẢN TRỊ VIÊN:
Thầy cô có chắc chắn muốn xóa tài khoản học sinh "${fullname}" (@${username}) cùng toàn bộ sơ đồ, bài tóm tắt và điểm số của em này?`);
    if (!confirmDel) return;

    if (window.SmartEduCloud) {
      const res = await window.SmartEduCloud.adminDeleteUser(username);
      if (res.success) {
        showToast(res.message, 'success');
        await loadSuperAdminData();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Hành động Admin: Xóa bài viết cụ thể (mindmap, summary, flashcard)
  window.adminDeletePost = async function(username, postType, postId) {
    const typeLabel = postType === 'mindmap' ? 'sơ đồ tư duy' : postType === 'summary' ? 'bài tóm tắt' : 'bộ thẻ lật';
    const confirmDel = confirm(`Thầy cô có chắc chắn muốn xóa ${typeLabel} này?`);
    if (!confirmDel) return;

    if (window.SmartEduCloud) {
      const res = await window.SmartEduCloud.adminDeleteUserPost(username, postType, postId);
      if (res.success) {
        showToast(res.message, 'success');
        await loadSuperAdminData();
      } else {
        showToast(res.message, 'error');
      }
    }
  };

  // Hành động Admin: Mở xem sơ đồ tư duy của học sinh
  window.adminOpenMindmap = function(authorUsername, mindmapId) {
    const user = cachedAllAdminUsers.find(u => u.username === authorUsername);
    if (!user || !user.mindmaps) {
      showToast('Không tìm thấy dữ liệu học sinh này!', 'warning');
      return;
    }
    const mm = user.mindmaps.find(m => String(m.id) === String(mindmapId));
    if (!mm) {
      showToast('Không tìm thấy sơ đồ tư duy này!', 'warning');
      return;
    }

    closeSuperAdminModal();
    const tabBtn = document.querySelector('.tab-btn[data-tab="tab-mindmap"]');
    if (tabBtn) tabBtn.click();
    setTimeout(() => {
      const content = mm.markdownContent || mm.content || '';
      renderMindmap(content);
      showToast(`Đang xem sơ đồ tư duy "${mm.title || ''}" của học sinh: ${user.profile?.name || authorUsername}`, 'info');
    }, 150);
  };

  // Hành động Admin: Mở xem bài tóm tắt của học sinh
  window.adminOpenSummary = function(authorUsername, summaryId) {
    const user = cachedAllAdminUsers.find(u => u.username === authorUsername);
    if (!user || !user.summaries) {
      showToast('Không tìm thấy dữ liệu học sinh này!', 'warning');
      return;
    }
    const sm = user.summaries.find(s => String(s.id) === String(summaryId));
    if (!sm) {
      showToast('Không tìm thấy bài tóm tắt này!', 'warning');
      return;
    }

    closeSuperAdminModal();
    const tabBtn = document.querySelector('.tab-btn[data-tab="tab-summary"]');
    if (tabBtn) tabBtn.click();
    setTimeout(() => {
      const data = sm.summaryData || sm.content || sm;
      renderSummary(data);
      showToast(`Đang xem bài tóm tắt "${sm.title || ''}" của học sinh: ${user.profile?.name || authorUsername}`, 'info');
    }, 150);
  };

  // Hành động Admin: Mở xem bộ thẻ lật của học sinh
  window.adminOpenFlashcard = function(authorUsername, flashcardId) {
    const user = cachedAllAdminUsers.find(u => u.username === authorUsername);
    if (!user || !user.flashcards) {
      showToast('Không tìm thấy dữ liệu học sinh này!', 'warning');
      return;
    }
    const fc = user.flashcards.find(f => String(f.id) === String(flashcardId));
    if (!fc) {
      showToast('Không tìm thấy bộ thẻ lật này!', 'warning');
      return;
    }

    closeSuperAdminModal();
    const tabBtn = document.querySelector('.tab-btn[data-tab="tab-beam"]');
    if (tabBtn) tabBtn.click();
    setTimeout(() => {
      renderBeams(fc.cards || []);
      showToast(`Đang mở bộ thẻ lật "${fc.title || ''}" của học sinh: ${user.profile?.name || authorUsername}`, 'info');
    }, 150);
  };

  // Gắn sự kiện Admin
  if (btnCloseSuperAdmin) btnCloseSuperAdmin.addEventListener('click', closeSuperAdminModal);
  if (btnRefreshSuperAdmin) btnRefreshSuperAdmin.addEventListener('click', loadSuperAdminData);
  if (btnSuperAdminMobile) btnSuperAdminMobile.addEventListener('click', () => openSuperAdminModal('users'));
  if (btnSuperAdminDesktop) btnSuperAdminDesktop.addEventListener('click', () => openSuperAdminModal('users'));
  if (modalSuperAdmin) {
    modalSuperAdmin.addEventListener('click', (e) => {
      if (e.target === modalSuperAdmin) closeSuperAdminModal();
    });
  }

  // Tìm kiếm live trong các tab Admin
  if (adminSearchUsers) adminSearchUsers.addEventListener('input', () => renderAdminUsersTab());
  if (adminSearchMindmaps) adminSearchMindmaps.addEventListener('input', () => renderAdminMindmapsTab());
  if (adminSearchSummaries) adminSearchSummaries.addEventListener('input', () => renderAdminSummariesTab());
  if (adminSearchScores) adminSearchScores.addEventListener('input', () => renderAdminScoresTab());
  if (adminFilterSubjectScores) adminFilterSubjectScores.addEventListener('change', () => renderAdminScoresTab());
  if (adminSearchFlashcards) adminSearchFlashcards.addEventListener('input', () => renderAdminFlashcardsTab());

  // Window exposures
  window.openSuperAdminModal = openSuperAdminModal;
  window.closeSuperAdminModal = closeSuperAdminModal;
  window.switchAdminTab = switchAdminTab;
  window.refreshSuperAdminData = loadSuperAdminData;

  // Initialize
  initUserAccounts();
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

  // Chỉ nạp bài học mẫu khi người dùng chủ động bấm chọn bài mẫu (không tự động nạp khi khởi chạy)
  if (window._pendingLessonKey && window.SAMPLE_LESSONS?.[window._pendingLessonKey]) {
    loadSpecificLesson(window.SAMPLE_LESSONS[window._pendingLessonKey], window._pendingLessonKey.toUpperCase(), false, true);
    window._pendingLessonKey = null;
  }

});
