# SmartEdu THCS - Nền Tảng Hỗ Trợ Học Tập & Khảo Thí Thông Minh (Chuyên Cấp 2 & Mở Rộng STEM Cấp 3)

> **Dự án tham dự:** Cuộc Thi Khoa Học Kỹ Thuật Dành Cho Học Sinh Trung Học Cấp Trường & Cấp Tỉnh  
> **Năm học:** 2026 – 2027  
> **Tác giả:** Trần Lê Long Phụng (Lớp 9A13)  
> **Đơn vị:** Trường THCS Long Cang  
> **Lĩnh vực:** Hệ thống phần mềm (Systems Software)  
> **Kho mã nguồn GitHub:** [https://github.com/longphungtranle-star/smartedu-thcs.](https://github.com/longphungtranle-star/smartedu-thcs.)  
> **Trải nghiệm trực tuyến (Live Demo):** [https://smartedu-thcs.vercel.app/](https://smartedu-thcs.vercel.app/)

---

## 📖 Giới Thiệu Dự Án

**SmartEdu THCS** là nền tảng web học tập thông minh thế hệ mới dành cho học sinh và giáo viên THCS (lớp 6, 7, 8, 9 theo chương trình GDPT 2018) và có khả năng tương thích mở rộng cho cả THPT (lớp 10, 11, 12). 

Phần mềm tích hợp Trí tuệ nhân tạo đa phương thức (Google Gemini Multimodal AI) với cơ chế **xoay vòng API Key tự động (Key Rotation Pool)**, tự động đọc đa tài liệu (nạp đồng thời nhiều file Word, PDF, hàng loạt ảnh chụp bài tập từ camera điện thoại) để tạo ra 4 công cụ học tập sâu:
1. **Sơ đồ tư duy (Mindmap) tương tác** với kiến trúc đồ họa kép (Markmap D3.js + Built-in Pure SVG 100% Offline), Thư viện sơ đồ cá nhân và xuất ảnh PNG HD 300 DPI / SVG.
2. **Tóm tắt bài học & Chiến lược ghi nhớ thông minh** (Kỹ thuật Feynman, thơ vui/vè nhớ nhanh, lộ trình ôn tập lặp lại ngắt quãng 3 giai đoạn).
3. **Bộ đề thi trắc nghiệm phân hóa 3 mức độ (Dễ, Trung bình, Khó)** với tốc độ tạo siêu tốc (2-3 giây qua `gemini-3.5-flash-lite`), chấm điểm tự động, lưu vết câu đã chọn và Nhật ký tiến độ khảo thí.
4. **Thẻ học tập lật 3D (Flashcards & Micro-learning)** hỗ trợ xuất bản in PDF A4 cắt rời trực tiếp trên trang, tích hợp giọng đọc AI tiếng Việt không buồn ngủ với cơ chế Watchdog Timer chống ngắt giọng.
5. **Đóng gói ứng dụng Web Cấp tiến (PWA)**: Tự động điều hướng khi mở trong Facebook/Zalo sang Google Chrome/Safari, cài 1 chạm cho Android và hướng dẫn trực quan cho iPhone iOS Safari.

---

## 🌟 Các Tính Năng Đột Phá & Công Nghệ Cốt Lõi (Bản Mới Nhất)

### 1. Nạp Đa Tài Liệu & Xử Lý Hình Vẽ, Mạch Điện Bằng AI Vision
- **Nạp đồng thời nhiều tệp:** Cho phép tải cùng lúc nhiều file Word (`.docx`), file PDF và hàng loạt ảnh bài tập chụp từ camera. Hệ thống tự động gom dữ liệu thông minh (Smart Merging).
- **Phân tích hình vẽ trực quan bằng AI Multimodal Vision:**
  - *Hình học:* Nhận diện góc vuông, $\triangle ABC$, đường tròn nội tiếp/ngoại tiếp, tiếp tuyến và chuyển thành giả thiết toán học.
  - *Mạch điện Vật lí:* Phân tích mạch nối tiếp, song song, mạch cầu, biến trở, ampe kế, vôn kế.
  - *Thí nghiệm Hóa học:* Đọc dụng cụ thí nghiệm, hiện tượng sinh khí, kết tủa và phương trình phản ứng tương ứng.
  - *Đồ thị:* Tọa độ hàm số và đồ thị chuyển động vật lý $s-t, v-t$.

### 2. Nhận Diện & Kết Xuất Công Thức Toán - Lý - Hóa Toàn Diện (KaTeX)
- **Mức độ Cấp 2 (THCS):**
  - **Toán học:** Phương trình bậc hai một ẩn ($ax^2 + bx + c = 0$), định lý Viète ($x_1+x_2 = -\frac{b}{a}$, $x_1 x_2 = \frac{c}{a}$), căn bậc hai $\sqrt{A}$, hệ phương trình bậc nhất hai ẩn, biểu thức hình học ($\triangle ABC, \perp, \parallel, \widehat{ABC}$).
  - **Khoa học tự nhiên:** Định luật Ôm ($I = \frac{U}{R}$), công suất điện ($P = U \cdot I$), điện năng ($A = P \cdot t$), định luật Jun-Len-xơ ($Q = I^2 R t$), phương trình hóa học và phản ứng quang hợp (${6\text{CO}_2 + 6\text{H}_2\text{O} \rightarrow \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2}$).
- **Mở rộng Cấp 3 (THPT):**
  - **Toán học:** Đạo hàm $f'(x)$, Tích phân $\int_a^b f(x)dx$, Giới hạn $\lim_{x \to x_0}$, Lượng giác ($\sin, \cos, \tan$), Hình học không gian $Oxyz$ ($\vec{u} = (x; y; z)$), Số phức $z = a + bi$, Logarit $\log_a b$.
  - **Vật lý:** Dao động điều hòa ($x = A \cos(\omega t + \varphi)$), sóng cơ & sóng dừng ($\lambda = \frac{v}{f}$), dòng điện xoay chiều, từ trường $\vec{B}$, phản ứng hạt nhân.
  - **Hóa học:** Cân bằng hóa học ($\rightleftharpoons$), phản ứng oxi hóa khử, phương trình ion thu gọn ($\text{Fe}^{3+} + 3\text{OH}^- \rightarrow \text{Fe(OH)}_3\downarrow$), hóa học hữu cơ.
- **Bộ phân giải & tự sửa lỗi JSON LaTeX:** Tự động chuẩn hóa dấu escape ngược (`\\frac`, `\\sqrt`, `\\Delta`, `\\Omega`...) đảm bảo dữ liệu công thức toán học không bao giờ bị lỗi parse.

### 3. Tab 1: Sơ Đồ Tư Duy (Mindmap) Với Kiến Trúc Kép
- **Tầng 1 (Engine chính):** `Markmap.js` & `D3.js v7` cho đồ họa vector mượt mà, hỗ trợ zoom, kéo thả pan và thu gọn/mở rộng từng nhánh con.
- **Tầng 2 (Engine tự thân độc lập):** Bộ vẽ thuần JavaScript & SVG DOM (`renderBuiltInSvgMindmap`) hoạt động 100% offline, không cần nạp bất kỳ thư viện ngoài nào.
- **Thư viện Sơ đồ tư duy cá nhân (Mindmap Library):** Lưu trữ không giới hạn các sơ đồ đã học vào `localStorage` để mở xem lại bất cứ lúc nào.
- **Xuất ảnh đa định dạng:** Xuất file vector SVG hoặc ảnh PNG HD 300 DPI kích thước lớn **3600 × 2700 px** tâm đối xứng.

### 4. Tab 2: Tóm Tắt Bài Học & Trợ Lý Giọng Đọc AI (TTS)
- **Tóm tắt tinh gọn:** Key Takeaways (3-5 ý cốt lõi), Bảng đối chiếu thuật ngữ - định nghĩa, Kỹ thuật Feynman giải thích siêu đơn giản trong 2 câu.
- **Giọng đọc AI tự nhiên chống ngắt quãng:** Bộ đệm `activeSpeechUtterances` (Anti-GC) và Watchdog Timer chống việc trình duyệt tự ý xóa bộ nhớ âm thanh. Hỗ trợ giọng Siri tiếng Việt ("Linh") trên iPhone/iPad/Mac.

### 5. Tab 3: Khảo Thí Phân Hóa 3 Mức Độ & Chấm Điểm Thông Minh
- **Tạo đề siêu tốc:** Sử dụng mô hình `gemini-3.5-flash-lite` giúp sinh đề 10-15 câu chỉ trong 2-3 giây.
- **Phân hóa chuẩn GDPT 2018:** 40% Dễ (Nhận biết) + 40% Trung bình (Thông hiểu) + 20% Khó (Vận dụng cao).
- **Lưu vết bài thi trực quan:** Nút chọn đáp án vẫn được bảo lưu kèm huy hiệu xanh/đỏ giúp học sinh đối chiếu kết quả.
- **Bản in đề thi & đáp án:** Hỗ trợ giáo viên in đề thi ra giấy A4 kèm bảng đáp án chi tiết.

### 6. Tab 4: Thẻ Học Tập Flashcards & Bản In PDF Cắt Rời Trực Tiếp
- Thẻ lật 3D tương tác với chế độ toàn màn hình Focus Mode.
- **Đọc tuần tự toàn bộ thẻ:** Tự động đọc lần lượt từ Thẻ 1 đến Thẻ $N$.
- **Xuất bản in PDF A4 trực tiếp trên trang:** In trực tiếp ngay trong giao diện web, định dạng thẻ cắt rời nét đứt chuẩn A4.

### 7. Cài Đặt Ứng Dụng Màn Hình Chính (PWA) Trên Điện Thoại
- **Tự động điều hướng In-app Browser:** Khi người dùng mở từ Facebook, Zalo, Messenger, hệ thống phát hiện và cung cấp nút bấm chuyển sang Google Chrome hoặc Safari để cài đặt thành công 100%.
- **Tối ưu hóa toàn diện cho iPhone (iOS):**
  - Chống auto-zoom màn hình khi bấm ô gõ chữ (`font-size: 16px !important`).
  - Hỗ trợ Safe Area cho tai thỏ, Dynamic Island và thanh Home Bar.
  - Cuộn 120Hz mượt mà (`-webkit-overflow-scrolling: touch`).

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
d:\Antigravity\phan_mem_hoc_tap\
├── index.html        # Giao diện chính responsive (PC, Tablet, Mobile)
├── app.js            # Xử lý Logic: Gemini AI, OCR, Markmap, Quiz, Flashcards, Voice, PWA
├── styles.css        # Hiệu ứng 3D Flip Card, Markmap SVG, CSS in ấn trực tiếp
├── sample_data.js    # Kho dữ liệu mẫu Toán 9, KHTN 9, KHTN 8, KHTN 7
├── manifest.json     # Khai báo ứng dụng di động Web Cấp tiến (PWA)
├── sw.js             # Service Worker quản lý bộ đệm ngoại tuyến offline
├── icon.svg          # Biểu tượng ứng dụng vector
├── vercel.json       # Cấu hình xuất bản Vercel
├── .gitignore        # Lọc tệp tin khi đồng bộ Git
├── README.md         # Giới thiệu dự án trên GitHub
├── api/              # Serverless API endpoints (key.js, tts.js)
└── Tai_Lieu_Bao_Cao_KHKT/                  # Toàn bộ hồ sơ báo cáo dự thi KHKT
    ├── 1_Ban_Mo_Ta_De_Tai/                 # Bản mô tả đề tài (PDF, Word, HTML)
    ├── 2_Giai_Thich_Code_Va_Van_Dap/       # Cẩm nang giải thích code & 17 câu hỏi GK (PDF, Word, HTML)
    ├── 3_Huong_Dan_GitHub_Vercel_Demo/     # Hướng dẫn GitHub/Vercel & Kịch bản demo (PDF, Word, HTML)
    ├── 4_Cac_Diem_Moi_Va_Nang_Cap_Dot_Pha/ # Báo cáo điểm mới & nâng cấp đột phá (PDF, Word, HTML)
    └── 5_Huong_Dan_Su_Dung_Cho_Hoc_Sinh_THCS/ # Sổ tay hướng dẫn sử dụng dành cho học sinh THCS (PDF, Word, HTML)
```

---

## 🚀 Hướng Dẫn Chạy & Cài Đặt

1. **Trải nghiệm ngay trên trình duyệt:** Truy cập [https://smartedu-thcs.vercel.app/](https://smartedu-thcs.vercel.app/)
2. **Chạy cục bộ trên máy tính:**
   - Mở terminal tại thư mục dự án và chạy server nội bộ:
     ```powershell
     powershell -ExecutionPolicy Bypass -File server.ps1
     ```
   - Mở trình duyệt và truy cập `http://localhost:8080`.
3. **Cài đặt lên điện thoại:**
   - Mở link trên điện thoại bằng Google Chrome (Android) hoặc Safari (iOS).
   - Bấm nút **"Cài đặt"** trên thanh banner nổi ở đáy màn hình (hoặc bấm nút **"📱 Cài App"** trên thanh tiêu đề).

---

> **Tác giả:** Trần Lê Long Phụng - Lớp 9A13 - Trường THCS Long Cang  
> **Dự án:** SmartEdu THCS - Cuộc thi Khoa học Kỹ thuật dành cho học sinh Trung học cấp Trường & Cấp Tỉnh
