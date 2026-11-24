// sw.js - Service Worker cho SmartEdu THCS (Hỗ trợ PWA & Bộ nhớ đệm Ngoại tuyến)
const CACHE_NAME = 'smartedu-thcs-v33-mobile-quiz-history-fix';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './sample_data.js',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png'
];

// Cài đặt Service Worker và lưu đệm tài nguyên
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Kích hoạt và dọn dẹp các bản cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Chiến lược Network First, fallback to Cache khi mất mạng
self.addEventListener('fetch', (event) => {
  // Bỏ qua các yêu cầu API của Gemini hoặc POST requests
  if (event.request.method !== 'GET' || event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
