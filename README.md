# SmartEdu THCS - Nền Tảng Hỗ Trợ Học Tập & Khảo Thí Thông Minh (Chuyên Cấp 2)

> **Dự án tham dự:** Cuộc Thi Khoa Học Kỹ Thuật Dành Cho Học Sinh Trung Học Cấp Trường  
> **Năm học:** 2026 – 2027  
> **Tác giả:** Trần Lê Long Phụng (Lớp 9A13)  
> **Đơn vị:** Trường THCS Long Cang  
> **Lĩnh vực:** Hệ thống phần mềm (Systems Software)

Phần mềm web chuyên sâu dành cho **Học sinh & Giáo viên Cấp 2 (THCS: Lớp 6, 7, 8, 9)**, tích hợp trí tuệ nhân tạo (Google Gemini) với cơ chế **xoay vòng API Key tự động (Key Rotation Pool)**, hỗ trợ đọc file Word, PDF, ảnh chụp bài học từ điện thoại/máy tính và tự động tạo:
1. **Sơ đồ tư duy (Mindmap) tương tác** & **Xuất file ảnh PNG HD 300 DPI siêu nét**.
2. **Tóm tắt bài học & Gợi ý học tập thông minh THCS** (Kỹ thuật Feynman, thơ vui/vè mẹo nhớ, Lộ trình ôn tập 3 giai đoạn).
3. **Bộ đề thi trắc nghiệm THCS phân hóa 3 mức độ (Dễ, Trung bình, Khó)** với chế độ luyện thi trực tuyến, in ấn và **Nhật ký tiến độ khảo thí**.
4. **Thẻ học tập lật 3D (Flashcards & Micro-learning)** hỗ trợ giọng đọc Text-to-Speech tiếng Việt chống buồn ngủ và theo dõi tỷ lệ ghi nhớ.
5. **Mã QR chia sẻ tức thì** & **Đóng gói ứng dụng di động Web Cấp tiến (PWA)** cài đặt lên màn hình chính điện thoại.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. Kho Bài Học Mẫu Cấp 2 (THCS) & Xử Lý Công Thức Toán - Khoa Học (KaTeX)
- **Mẫu Toán 9**: *Phương trình bậc hai một ẩn & Hệ thức Vi-ét*. Tích hợp công thức nghiệm tổng quát $\Delta = b^2 - 4ac$, công thức nghiệm thu gọn $\Delta'$, các ứng dụng định lý Vi-ét nhẩm nghiệm nhanh, tìm 2 số khi biết tổng và tích, biểu thức đối xứng $x_1^2 + x_2^2 = S^2 - 2P$.
- **Mẫu KHTN 9**: *Định luật Ôm & Điện năng - Công suất điện*. Tích hợp công thức $I = \frac{U}{R}$, đoạn mạch nối tiếp/song song, công suất điện $P = U \cdot I = I^2 R = \frac{U^2}{R}$, điện năng $A = P \cdot t$, định luật Jun - Len-xơ $Q = I^2 R t$, đơn vị điện lực ($\Omega, \text{V}, \text{A}, \text{W}, \text{J}, \text{kWh}$).
- **Mẫu KHTN 8**: *Phản ứng Hóa học & Định luật bảo toàn khối lượng*.
- **Mẫu KHTN 7**: *Quang hợp ở thực vật*.
- **Hiển thị công thức Toán & Khoa học bằng KaTeX**: Tự động chuyển đổi các biểu thức LaTeX `$ax^2 + bx + c = 0$`, phân số `$\frac{a}{b}$`, căn thức `$\sqrt{x}$`, $\Delta$, $\pm$, $\ge$, $\le$ thành ký hiệu toán học tiêu chuẩn quốc tế đẹp mắt, sắc nét ở mọi độ phân giải.
- **Xử lý đọc công thức Toán bằng Giọng Tiếng Việt Tự Nhiên**: Bộ giải mã công thức toán học chuyên dụng giúp Text-to-Speech phát âm chuẩn xác ngôn ngữ sư phạm tiếng Việt (ví dụ: đọc "Đen-ta", "x bình phương", "căn bậc hai của", "trên hai a", "ki-lô-oát giờ", "Ôm" thay vì đọc các ký tự gạch chéo hay cú pháp LaTeX thô).

### 2. Nạp Tài Liệu Học Tập Đa Phương Thức
- **File Word (`.docx`, `.doc`)**: Tự động giải mã và trích xuất cấu trúc văn bản qua `mammoth.js`.
- **File PDF (`.pdf`)**: Trích xuất toàn bộ các trang tài liệu bằng `PDF.js`.
- **File Ảnh chụp bài học (`.png`, `.jpg`, `.jpeg`, `.webp`)**: 
  - Tải ảnh chụp từ máy tính hoặc **chụp trực tiếp bằng camera điện thoại**.
  - Tích hợp tính năng **Nhận diện chữ qua AI (OCR)** với mô hình Gemini Multimodal Vision, đọc được cả chữ viết tay, công thức và bảng biểu.
- **Nhập / Dán trực tiếp**: Dành cho ghi chú bài giảng hoặc văn bản nhanh.

### 3. Hệ Thống Xoay Vòng API Key Thông Minh (Key Rotation Pool)
- Cho phép dán **1 hoặc nhiều Google Gemini API Key**.
- Tự động luân chuyển theo cơ chế **Round-Robin** cho từng tác vụ.
- **Tự động Fallback khi gặp lỗi 429 (Too Many Requests / Hết ngạch)**: Hệ thống tự động chuyển sang key khả dụng tiếp theo ngay lập tức mà không làm gián đoạn bài học của bạn.
- Bảng quản lý key trực quan: hiển thị trạng thái `Sẵn sàng`, `Rate Limited (429)`, `Lỗi xác thực`, số lần gọi thành công và tính năng kiểm tra kết nối từng key.
- Hỗ trợ các mô hình AI mới nhất: `Gemini 3.8 Flash` (khuyên dùng, nhanh & chính xác), `Gemini 2.0 Flash`, `Gemini 1.5 Flash`, `Gemini 1.5 Pro`.
- Lưu trữ an toàn tuyệt đối ngay trên `localStorage` trình duyệt.

### 4. Tab 1: Sơ đồ tư duy (Interactive Mindmap)
- Tự động phân tích kiến thức và dựng cây sơ đồ tư duy phân cấp màu sắc chuẩn khoa học bằng `Markmap` & `D3.js`.
- Thao tác: Kéo thả (Pan), phóng to/thu nhỏ (Zoom), nhấp vào nút tròn để đóng/mở từng nhánh con.
- Chế độ chia màn hình: Vừa xem sơ đồ vừa chỉnh sửa mã nguồn Markdown phân cấp và cập nhật trực tiếp.
- **Xuất ảnh PNG HD Siêu Nét (Độ phân giải cao 300 DPI)**: Tự động gom toàn bộ các nhánh, khử răng cưa, xuất ảnh kích thước lớn siêu nét để in ấn, nộp bài hoặc chia sẻ Zalo/Facebook.
- **Xuất file vector SVG**: Sắc nét ở mọi kích thước không bao giờ vỡ hạt.

### 4. Tab 2: Tóm tắt bài học & Gợi ý phương pháp học
- **Key Takeaways**: 3 - 5 điểm cốt lõi nhất cần nhớ.
- **Bảng thuật ngữ & Khái niệm then chốt**: Đối chiếu rõ ràng Thuật ngữ - Định nghĩa - Ứng dụng.
- **Hộp chiến lược học thông minh**:
  - *Kỹ thuật Feynman*: Cách giải thích bài học siêu đơn giản trong 2 câu ngắn.
  - *Mẹo ghi nhớ siêu tốc (Mnemonics)*: Câu vè, liên tưởng hình ảnh để ghim vào trí nhớ dài hạn.
  - *Lộ trình lặp lại ngắt quãng (Spaced Repetition Checklist)*: Hôm nay -> Ngày 3 -> Ngày 7.
- Nút sao chép toàn bộ tóm tắt hoặc in ra giấy/PDF.

### 5. Tab 3: Tạo đề thi phân hóa 3 mức độ & Chấm điểm tương tác
- Tùy chỉnh số lượng câu hỏi (6, 10, 15 câu) với tỉ lệ chuẩn sư phạm:
  - **Mức 1: Dễ (Nhận biết - 40%)**: Định nghĩa, sự kiện, công thức cơ bản.
  - **Mức 2: Trung bình (Thông hiểu & Vận dụng - 40%)**: So sánh, phân tích hiện tượng, bài tập áp dụng.
  - **Mức 3: Khó (Vận dụng cao - 20%)**: Tư duy logic phản biện, câu hỏi bẫy, liên hệ chuyên sâu.
- **2 Chế độ sử dụng**:
  - **Chế độ Luyện thi trực tuyến**: Bấm chọn A/B/C/D, đồng hồ đếm ngược, thanh tiến độ, nộp bài tính điểm thang 10, pháo hoa chúc mừng, phân tích điểm từng mức độ và giải thích chi tiết vì sao đúng/sai.
  - **Chế độ In ấn & Giáo viên (Print View)**: Chuẩn hóa trang đề thi cho học sinh làm bài trên giấy kèm Bảng đáp án & lời giải chi tiết cho giáo viên chấm thi.

### 6. Tab 4: Thẻ học tập lật 3D (Flashcards & Micro-learning)
- Chia bài học thành các thẻ tri thức vi mô nắm bắt trong 30 giây: Mặt trước là Câu hỏi đố vui, Mặt sau là Đáp án và lời giải thích.
- Thẻ lật 3D tương tác xoay vòng không gian 3 chiều đẹp mắt.
- Tích hợp giọng đọc trợ lý tiếng Việt (**Text-to-Speech**) chống buồn ngủ với 3 chế độ (Hoạt bát 1.16x, Cấp tốc 1.28x, Tiêu chuẩn 1.05x).
- Nút đánh dấu "Đã thuộc" để theo dõi thanh tiến độ ghi nhớ (Mastery Progress).
- Chế độ **Focus Mode (Toàn màn hình)**: Trình chiếu từng thẻ với phím mũi tên `←` / `→` và phím cách (`Space`) để lật thẻ.

### 7. Mã QR & Đóng gói PWA (Progressive Web App)
- Tạo mã QR động tức thì cho Ban Giám khảo hoặc Thầy Cô quét bằng Zalo/Camera điện thoại để dùng ngay trên thiết bị cá nhân.
- Hỗ trợ cài đặt **"Thêm vào Màn hình chính" (Add to Home Screen)** như một ứng dụng di động chuyên nghiệp.

---

## 📁 Cấu Trúc Thư Mục Dự Án
```
d:\Antigravity\phan_mem_hoc_tap\
├── index.html        # Giao diện chính responsive (PC, Tablet, Mobile)
├── app.js            # Xử lý Logic: Gemini AI, OCR, Markmap, Quiz, Flashcards, Voice, PWA
├── styles.css        # Hiệu ứng 3D Flip Card, Markmap SVG, responsive chống tràn viền
├── sample_data.js    # Kho dữ liệu mẫu Toán 9, KHTN 9, KHTN 8, KHTN 7
├── manifest.json     # Khai báo ứng dụng di động Web Cấp tiến (PWA)
├── sw.js             # Service Worker quản lý bộ đệm ngoại tuyến offline
├── icon.svg          # Biểu tượng ứng dụng sắc nét
├── vercel.json       # Cấu hình xuất bản siêu tốc lên Vercel
├── .gitignore        # Cấu hình lọc tệp rác khi đẩy lên Git
├── README.md         # Giới thiệu dự án trên GitHub
└── Tai_Lieu_Bao_Cao_KHKT/                  # Toàn bộ hồ sơ báo cáo dự thi KHKT
    ├── 1_Ban_Mo_Ta_De_Tai/                 # Bản mô tả đề tài (PDF in ấn, Word, HTML)
    ├── 2_Giai_Thich_Code_Va_Van_Dap/       # Cẩm nang giải thích code & 12 câu hỏi GK (PDF, HTML)
    └── 3_Huong_Dan_GitHub_Vercel_Demo/     # Hướng dẫn đẩy GitHub/Vercel & Demo (PDF, Word, HTML)
```
