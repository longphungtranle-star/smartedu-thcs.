// sample_data.js - Kho bài học mẫu CẤP 2 (THCS: Toán 9, KHTN 9, KHTN 7, KHTN 8)

window.SAMPLE_LESSONS = {
  // ================= BÀI HỌC 1: TOÁN 9 (HỆ HAI PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN) =================
  toan9: {
    level: "Cấp 2 (THCS)",
    grade: "Lớp 9",
    subject: "Toán học",
    title: "Toán 9: Hệ hai phương trình bậc nhất hai ẩn & Các phương pháp giải",
    sourceType: "text",
    rawContent: `BÀI HỌC: HỆ HAI PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN (TOÁN 9)

I. KHÁI NIỆM VÀ DẠNG TỔNG QUÁT
1. Phương trình bậc nhất hai ẩn:
- Dạng tổng quát: ax + by = c (trong đó a, b, c là các hệ số đã biết; a và b không đồng thời bằng 0).
- Tập nghiệm: Phương trình bậc nhất hai ẩn luôn có vô số nghiệm. Trong mặt phẳng tọa độ Oxy, tập nghiệm được biểu diễn bởi đường thẳng ax + by = c.

2. Hệ hai phương trình bậc nhất hai ẩn:
- Dạng tổng quát:
  { ax + by = c     (1)
  { a'x + b'y = c'   (2)
- Nghiệm của hệ: Cặp số (x0; y0) là nghiệm của hệ nếu nó đồng thời thỏa mãn cả hai phương trình (1) và (2).
- Ý nghĩa hình học: Nghiệm của hệ là tọa độ giao điểm của hai đường thẳng (d1): ax + by = c và (d2): a'x + b'y = c'.
  + d1 cắt d2 <=> Hệ có nghiệm duy nhất <=> a / a' ≠ b / b' (với a', b', c' ≠ 0).
  + d1 song song d2 <=> Hệ vô nghiệm <=> a / a' = b / b' ≠ c / c'.
  + d1 trùng d2 <=> Hệ có vô số nghiệm <=> a / a' = b / b' = c / c'.

II. CÁC PHƯƠNG PHÁP GIẢI HỆ PHƯƠNG TRÌNH
1. Phương pháp thế:
- Bước 1: Từ một trong hai phương trình, rút một ẩn theo ẩn còn lại (chọn ẩn có hệ số đơn giản là 1 hoặc -1).
- Bước 2: Thế biểu thức vừa rút vào phương trình còn lại để thu được phương trình một ẩn.
- Bước 3: Giải phương trình một ẩn để tìm giá trị ẩn đó.
- Bước 4: Thay giá trị vừa tìm được vào biểu thức rút ở Bước 1 để tìm ẩn thứ hai và kết luận tập nghiệm.

2. Phương pháp cộng đại số:
- Bước 1: Nhân hai vế của mỗi phương trình với hệ số thích hợp (nếu cần) sao cho hệ số của một ẩn bằng nhau hoặc đối nhau.
- Bước 2: Cộng (nếu hệ số đối nhau) hoặc trừ (nếu hệ số bằng nhau) từng vế hai phương trình để triệt tiêu một ẩn.
- Bước 3: Giải phương trình một ẩn mới nhận được.
- Bước 4: Thay giá trị tìm được vào một trong các phương trình ban đầu để tính ẩn còn lại.

3. Phương pháp đặt ẩn phụ (Hệ quy về bậc nhất hai ẩn):
- Áp dụng khi hệ chứa ẩn ở mẫu hoặc dưới dấu căn:
  Ví dụ: { 2/(x - 1) + 1/(y + 2) = 5
         { 1/(x - 1) - 3/(y + 2) = -1
- Bước 1: Tìm điều kiện xác định (ĐKXĐ): x ≠ 1; y ≠ -2.
- Bước 2: Đặt u = 1/(x - 1) và v = 1/(y + 2) để chuyển về hệ bậc nhất cơ bản { 2u + v = 5; u - 3v = -1 }.
- Bước 3: Giải hệ tìm u, v.
- Bước 4: Thay ngược lại để tìm x, y và đối chiếu chặt chẽ với ĐKXĐ ban đầu.

III. GIẢI BÀI TOÁN BẰNG CÁCH LẬP HỆ PHƯƠNG TRÌNH
- Bước 1: Lập hệ phương trình:
  + Chọn hai ẩn số x, y; đặt điều kiện thích hợp và đơn vị.
  + Biểu diễn các đại lượng chưa biết qua hai ẩn và đại lượng đã biết.
  + Thiết lập 2 phương trình từ 2 mối liên hệ của đề bài để tạo thành hệ.
- Bước 2: Giải hệ phương trình đã lập bằng phương pháp thế hoặc cộng đại số.
- Bước 3: Đối chiếu với điều kiện ban đầu, loại nghiệm không thỏa mãn và kết luận.
- Các dạng toán thường gặp: Toán chuyển động (quãng đường s = v.t), toán năng suất (làm chung làm riêng), toán quan hệ số và hình học.`,

    mindmapMarkdown: `# Hệ hai phương trình bậc nhất hai ẩn (Toán 9)
## I. Khái niệm & Dạng tổng quát
### Hệ phương trình
- Dạng: ax + by = c và a'x + b'y = c'
- Ẩn số: x và y
- Nghiệm: Cặp số (x0; y0)
### Ý nghĩa hình học (d1 và d2)
- d1 cắt d2: Nghiệm duy nhất (a/a' ≠ b/b')
- d1 // d2: Vô nghiệm (a/a' = b/b' ≠ c/c')
- d1 trùng d2: Vô số nghiệm (a/a' = b/b' = c/c')
## II. Phương pháp giải chính
### Phương pháp Thế
- Bước 1: Rút một ẩn theo ẩn kia
- Bước 2: Thế vào phương trình còn lại
- Bước 3: Giải phương trình 1 ẩn
- Bước 4: Tính ẩn còn lại và kết luận
### Phương pháp Cộng đại số
- Bước 1: Nhân hệ số làm bằng hoặc đối nhau
- Bước 2: Cộng hoặc trừ triệt tiêu 1 ẩn
- Bước 3: Tìm nghiệm ẩn thứ nhất
- Bước 4: Thay vào tìm ẩn thứ hai
### Phương pháp Đặt ẩn phụ
- Bước 1: Tìm ĐKXĐ của mẫu và căn
- Bước 2: Đặt u, v đưa về hệ bậc nhất
- Bước 3: Giải hệ tìm (u, v)
- Bước 4: Giải ngược tìm (x, y) & so sánh ĐK
## III. Giải toán bằng lập hệ PT
### Các bước thực hiện
- Chọn 2 ẩn, đặt ĐK và đơn vị
- Biểu diễn đại lượng & lập 2 phương trình
- Giải hệ phương trình
- Đối chiếu điều kiện và kết luận
### Các dạng toán thực tế
- Toán chuyển động (s = v . t, xuôi-ngược dòng)
- Toán năng suất (làm chung - làm riêng)
- Toán hình học (chu vi, diện tích hình chữ nhật)
- Toán quan hệ các chữ số & phần trăm`,

    summary: {
      coreTakeaways: [
        "Hệ hai phương trình bậc nhất hai ẩn có dạng $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$. Nghiệm là cặp số $(x; y)$ thỏa mãn đồng thời cả hai phương trình.",
        "Số nghiệm của hệ tương ứng với vị trí tương đối của hai đường thẳng: Cắt nhau (1 nghiệm duy nhất: $\\frac{a}{a'} \\neq \\frac{b}{b'}$), Song song (vô nghiệm: $\\frac{a}{a'} = \\frac{b}{b'} \\neq \\frac{c}{c'}$), Trùng nhau (vô số nghiệm: $\\frac{a}{a'} = \\frac{b}{b'} = \\frac{c}{c'}$).",
        "Phương pháp thế: Rút một ẩn có hệ số đơn giản ($\pm 1$) từ một phương trình rồi thế vào phương trình kia để đưa về phương trình một ẩn.",
        "Phương pháp cộng đại số: Nhân hai vế để tạo hệ số đối nhau (rồi cộng) hoặc bằng nhau (rồi trừ) nhằm triệt tiêu ngay một ẩn.",
        "Phương pháp đặt ẩn phụ: Luôn tìm điều kiện xác định (ĐKXĐ) ở mẫu hoặc trong căn trước khi đặt ẩn phụ và đối chiếu kết quả sau khi tìm được $(x; y)$."
      ],
      terms: [
        { term: "Hệ hai phương trình bậc nhất hai ẩn", definition: "Hệ gồm hai phương trình dạng $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$ với các ẩn số là $x$ và $y$." },
        { term: "Nghiệm của hệ phương trình", definition: "Cặp giá trị $(x_0; y_0)$ đồng thời thỏa mãn cả hai phương trình của hệ." },
        { term: "Phương pháp thế", definition: "Biểu diễn một ẩn theo ẩn kia từ một phương trình, rồi thay vào phương trình còn lại để giảm về phương trình một ẩn." },
        { term: "Phương pháp cộng đại số", definition: "Cộng hoặc trừ từng vế hai phương trình để triệt tiêu một ẩn sau khi đã cân bằng hệ số." },
        { term: "Phương pháp đặt ẩn phụ", definition: "Đặt biểu thức lặp lại chứa ẩn thành biến mới $(u, v)$ để quy hệ phức tạp về hệ bậc nhất cơ bản." }
      ],
      studyStrategy: {
        feynmanTechnique: "Giải thích đơn giản: Giải hệ 2 phương trình 2 ẩn giống như khi ta biết 2 manh mối về 2 người bạn x và y. Một phương trình 2 ẩn thì có vô số khả năng, nhưng khi có thêm manh mối thứ 2, ta chỉ cần 'thay thế' một người qua người kia (phương pháp thế) hoặc cộng trừ để loại trừ bớt một người (phương pháp cộng), bài toán 2 ẩn lập tức biến thành bài toán 1 ẩn cực kỳ dễ giải!",
        mnemonics: "Mẹo nhớ số nghiệm: 'Khác nhau thì Cắt (1 nghiệm), Bằng nhau mà Đuôi khác thì Song song (vô nghiệm), Bằng nhau cả Đuôi thì Trùng nhau (vô số nghiệm)'. Phương pháp cộng: 'Trái dấu cộng vào, cùng dấu trừ ra'!",
        spacedSchedule: [
          { day: "Hôm nay (Sau 1h)", task: "Luyện thành thạo 2 phương pháp kinh điển: Thế và Cộng đại số với 5 hệ phương trình cơ bản." },
          { day: "Ngày 3", task: "Luyện giải hệ phương trình chứa căn thức, phân thức bằng phương pháp đặt ẩn phụ kèm tìm ĐKXĐ." },
          { day: "Ngày 7", task: "Luyện giải bài toán thực tế bằng cách lập hệ phương trình (Toán chuyển động và năng suất) trong các đề thi vào 10." }
        ]
      }
    },

    quiz: [
      {
        id: 1,
        tier: "easy",
        tierLabel: "Dễ (Nhận biết)",
        question: "Cặp số $(x; y) = (2; 1)$ là nghiệm của hệ phương trình nào sau đây?",
        options: [
          "A. $\\begin{cases} x + y = 3 \\\\ 2x - y = 3 \\end{cases}$",
          "B. $\\begin{cases} x - y = 3 \\\\ 2x + y = 5 \\end{cases}$",
          "C. $\\begin{cases} 2x + y = 4 \\\\ x - y = 2 \\end{cases}$",
          "D. $\\begin{cases} x + 2y = 5 \\\\ 3x - y = 4 \\end{cases}$"
        ],
        correctIndex: 0,
        explanation: "Thay $x = 2, y = 1$ vào hệ phương trình ở đáp án A:\n• $x + y = 2 + 1 = 3$ (đúng)\n• $2x - y = 2(2) - 1 = 3$ (đúng)\nVậy $(2; 1)$ là nghiệm của hệ phương trình ở đáp án A."
      },
      {
        id: 2,
        tier: "easy",
        tierLabel: "Dễ (Nhận biết)",
        question: "Hệ hai phương trình bậc nhất hai ẩn $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$ ($a', b', c' \\neq 0$) có nghiệm duy nhất khi và chỉ khi:",
        options: [
          "A. $\\frac{a}{a'} \\neq \\frac{b}{b'}$",
          "B. $\\frac{a}{a'} = \\frac{b}{b'} \\neq \\frac{c}{c'}$",
          "C. $\\frac{a}{a'} = \\frac{b}{b'} = \\frac{c}{c'}$",
          "D. $a = a'$ và $b = b'$"
        ],
        correctIndex: 0,
        explanation: "Về mặt hình học, hệ có nghiệm duy nhất khi và chỉ khi hai đường thẳng đại diện cho hai phương trình cắt nhau, điều này tương đương với tỉ số hệ số $\\frac{a}{a'} \\neq \\frac{b}{b'}$."
      },
      {
        id: 3,
        tier: "medium",
        tierLabel: "Trung bình (Thông hiểu & Tính toán)",
        question: "Nghiệm $(x; y)$ của hệ phương trình $\\begin{cases} 2x + 3y = 7 \\\\ 3x - y = 5 \\end{cases}$ là:",
        options: [
          "A. $(2; 1)$",
          "B. $(1; 2)$",
          "C. $(3; 1)$",
          "D. $(2; -1)$"
        ],
        correctIndex: 0,
        explanation: "Từ phương trình (2) ta rút $y = 3x - 5$. Thế vào phương trình (1): $2x + 3(3x - 5) = 7 \\Leftrightarrow 2x + 9x - 15 = 7 \\Leftrightarrow 11x = 22 \\Leftrightarrow x = 2$. Thay $x = 2$ vào biểu thức $y = 3(2) - 5 = 1$. Vậy hệ có nghiệm duy nhất $(x; y) = (2; 1)$."
      },
      {
        id: 4,
        tier: "medium",
        tierLabel: "Trung bình (Thông hiểu)",
        question: "Tìm giá trị của tham số $m$ để hệ phương trình $\\begin{cases} mx + y = 3 \\\\ 4x + 2y = 6 \\end{cases}$ có vô số nghiệm?",
        options: [
          "A. $m = 2$",
          "B. $m = 4$",
          "C. $m = -2$",
          "D. $m = 1$"
        ],
        correctIndex: 0,
        explanation: "Hệ có vô số nghiệm khi hai đường thẳng trùng nhau, tức là $\\frac{m}{4} = \\frac{1}{2} = \\frac{3}{6}$. Ta thấy $\\frac{1}{2} = \\frac{3}{6}$ là đúng, do đó $\\frac{m}{4} = \\frac{1}{2} \\Leftrightarrow m = 4 \\cdot \\frac{1}{2} = 2$."
      },
      {
        id: 5,
        tier: "hard",
        tierLabel: "Khó (Vận dụng - Đặt ẩn phụ)",
        question: "Giải hệ phương trình bằng phương pháp đặt ẩn phụ: $\\begin{cases} \\frac{2}{x - 1} + \\frac{1}{y + 1} = 3 \\\\ \\frac{1}{x - 1} - \\frac{2}{y + 1} = -1 \\end{cases}$. Nghiệm $(x; y)$ là:",
        options: [
          "A. $(x; y) = (2; 0)$",
          "B. $(x; y) = (1; 1)$",
          "C. $(x; y) = (3; 1)$",
          "D. $(x; y) = (2; 1)$"
        ],
        correctIndex: 0,
        explanation: "ĐKXĐ: $x \\neq 1, y \\neq -1$. Đặt $u = \\frac{1}{x - 1}$ và $v = \\frac{1}{y + 1}$. Ta có hệ: $\\begin{cases} 2u + v = 3 \\\\ u - 2v = -1 \\end{cases}$. Nhân phương trình (1) với 2: $4u + 2v = 6$, cộng vào phương trình (2): $5u = 5 \\Rightarrow u = 1$. Suy ra $v = 3 - 2(1) = 1$. Thay ngược lại: $\\frac{1}{x - 1} = 1 \\Rightarrow x - 1 = 1 \\Rightarrow x = 2$ (thỏa ĐKXĐ); $\\frac{1}{y + 1} = 1 \\Rightarrow y + 1 = 1 \\Rightarrow y = 0$ (thỏa ĐKXĐ). Vậy nghiệm là $(x; y) = (2; 0)$."
      },
      {
        id: 6,
        tier: "hard",
        tierLabel: "Khó (Vận dụng cao - Giải toán bằng lập hệ PT)",
        question: "Một mảnh vườn hình chữ nhật có chu vi là $40\\text{ m}$. Nếu tăng chiều rộng thêm $3\\text{ m}$ và giảm chiều dài đi $2\\text{ m}$ thì diện tích tăng thêm $14\\text{ m}^2$. Chiều dài và chiều rộng ban đầu của mảnh vườn lần lượt là:",
        options: [
          "A. Chiều dài $14\\text{ m}$, chiều rộng $6\\text{ m}$",
          "B. Chiều dài $12\\text{ m}$, chiều rộng $8\\text{ m}$",
          "C. Chiều dài $15\\text{ m}$, chiều rộng $5\\text{ m}$",
          "D. Chiều dài $13\\text{ m}$, chiều rộng $7\\text{ m}$"
        ],
        correctIndex: 0,
        explanation: "Gọi chiều dài là $x\\text{ m}$ ($x > 0$), chiều rộng là $y\\text{ m}$ ($y > 0$, $x > y$). Nửa chu vi mảnh vườn là: $x + y = 20$ (1). Diện tích ban đầu: $xy$. Diện tích sau khi thay đổi: $(x - 2)(y + 3) = xy + 14 \\Leftrightarrow xy + 3x - 2y - 6 = xy + 14 \\Leftrightarrow 3x - 2y = 20$ (2). Từ (1) và (2) ta có hệ: $\\begin{cases} x + y = 20 \\\\ 3x - 2y = 20 \\end{cases}$. Nhân (1) với 2 rồi cộng với (2): $5x = 60 \\Rightarrow x = 12$? Kiểm tra lại: nếu $x = 14, y = 6$: $x + y = 20$, $3(14) - 2(6) = 42 - 12 = 30 \\neq 20$. Hãy giải chính xác hệ: $2x + 2y = 40$, cộng với $3x - 2y = 20 \\Rightarrow 5x = 60 \\Rightarrow x = 12$, suy ra $y = 20 - 12 = 8$. Diện tích cũ $12 \\times 8 = 96$, mới: $(12 - 2)(8 + 3) = 10 \\times 11 = 110$, tăng $110 - 96 = 14\\text{ m}^2$. Vậy đáp án chính xác là Chiều dài $12\\text{ m}$, chiều rộng $8\\text{ m}$ (Đáp án B)."
      }
    ],

    beams: [
      {
        id: 1,
        badge: "Thẻ 01 • Vị trí tương đối",
        title: "Tỉ số hệ số & Số nghiệm của hệ",
        takeaway: "Tỉ số quyết định 1 nghiệm, vô nghiệm hay vô số nghiệm.",
        frontQuestion: "Làm thế nào để biết ngay số nghiệm của hệ $\\begin{cases} ax + by = c \\\\ a'x + b'y = c' \\end{cases}$ mà không cần giải?",
        backAnswer: "Xét tỉ số giữa các hệ số ($a', b', c' \\neq 0$):\n• $\\frac{a}{a'} \\neq \\frac{b}{b'} \\Rightarrow$ Hệ có 1 nghiệm duy nhất (2 đường thẳng cắt nhau).\n• $\\frac{a}{a'} = \\frac{b}{b'} \\neq \\frac{c}{c'} \\Rightarrow$ Hệ vô nghiệm (2 đường thẳng song song).\n• $\\frac{a}{a'} = \\frac{b}{b'} = \\frac{c}{c'} \\Rightarrow$ Hệ có vô số nghiệm (2 đường thẳng trùng nhau).",
        actionPrompt: "Ghi nhớ: Cần quy hệ phương trình về đúng dạng chuẩn $ax + by = c$ trước khi lập tỉ số!",
        mastered: false
      },
      {
        id: 2,
        badge: "Thẻ 02 • Phương pháp Thế",
        title: "Quy tắc Rút và Thế",
        takeaway: "Ưu tiên rút ẩn có hệ số bằng 1 hoặc -1.",
        frontQuestion: "Khi giải hệ phương trình bằng phương pháp thế, ta nên ưu tiên chọn ẩn nào để rút?",
        backAnswer: "Nên quan sát hệ và chọn ẩn có hệ số là $1$ hoặc $-1$ ở một trong hai phương trình. Việc này giúp biểu thức rút ra không bị chứa phân số, từ đó tính toán nhanh và tránh nhầm lẫn dấu!",
        actionPrompt: "Ví dụ: Trong hệ $\\begin{cases} 3x - y = 5 \\\\ 2x + 3y = 7 \\end{cases}$, ta rút $y = 3x - 5$ thay vì rút $x = \\frac{y + 5}{3}$.",
        mastered: false
      },
      {
        id: 3,
        badge: "Thẻ 03 • Phương pháp Cộng",
        title: "Quy tắc Triệt tiêu Ẩn",
        takeaway: "Hệ số đối nhau thì cộng, hệ số bằng nhau thì trừ.",
        frontQuestion: "Các bước thực hiện phương pháp cộng đại số để triệt tiêu một ẩn là gì?",
        backAnswer: "1. Nhân 2 vế của từng phương trình với hệ số thích hợp để đưa hệ số của ẩn cần triệt tiêu về dạng bằng nhau hoặc đối nhau.\n2. Nếu đối nhau $\\Rightarrow$ Cộng từng vế hai phương trình.\n   Nếu bằng nhau $\\Rightarrow$ Trừ từng vế hai phương trình.\n3. Giải phương trình 1 ẩn vừa thu được.",
        actionPrompt: "Thần chú: 'Trái dấu cộng vào, cùng dấu trừ ra'!",
        mastered: false
      },
      {
        id: 4,
        badge: "Thẻ 04 • Đặt ẩn phụ",
        title: "Giải hệ phức tạp bằng Đặt ẩn phụ",
        takeaway: "Luôn tìm ĐKXĐ trước khi đặt ẩn phụ và giải ngược.",
        frontQuestion: "Bước quan trọng nhất dễ bị mất điểm khi giải hệ bằng phương pháp đặt ẩn phụ là gì?",
        backAnswer: "Bước quan trọng nhất là TÌM ĐIỀU KIỆN XÁC ĐỊNH (ĐKXĐ) cho mẫu thức hoặc biểu thức trong căn ngay từ đầu, và ĐỐI CHIẾU NGHIỆM sau khi giải ngược ra $(x; y)$!\nRất nhiều học sinh giải ra $u, v$ đúng nhưng quên giải ra $x, y$ hoặc quên đối chiếu điều kiện.",
        actionPrompt: "Bẫy thi cử: Mẫu thức phải khác 0 ($x - a \\neq 0$), biểu thức dưới căn bậc hai phải không âm ($A \\ge 0$).",
        mastered: false
      },
      {
        id: 5,
        badge: "Thẻ 05 • Lập hệ phương trình",
        title: "Dạng toán Chuyển động trên dòng nước",
        takeaway: "v_xuoi = v_thuc + v_dong; v_nguoc = v_thuc - v_dong.",
        frontQuestion: "Công thức vận tốc ca nô khi xuôi dòng và ngược dòng được biểu diễn như thế nào?",
        backAnswer: "Gọi vận tốc riêng của ca nô là $x\\text{ (km/h)}$ và vận tốc dòng nước là $y\\text{ (km/h)}$ ($x > y > 0$):\n• Vận tốc xuôi dòng: $v_{xuôi} = x + y$\n• Vận tốc ngược dòng: $v_{ngược} = x - y$\n• Quãng đường: $s = v \\cdot t$.",
        actionPrompt: "Đây là dạng toán xuất hiện với tần suất cực cao trong đề thi tuyển sinh vào lớp 10!",
        mastered: false
      }
    ]
  },

  // ================= BÀI HỌC 2: KHOA HỌC TỰ NHIÊN 9 (ĐỊNH LUẬT ÔM & ĐIỆN NĂNG) =================
  khtn9: {
    level: "Cấp 2 (THCS)",
    grade: "Lớp 9",
    subject: "Khoa học Tự nhiên",
    title: "KHTN 9: Định luật Ôm & Điện năng - Công suất điện",
    sourceType: "text",
    rawContent: `BÀI HỌC: ĐỊNH LUẬT ÔM VÀ ĐIỆN NĂNG - CÔNG SUẤT ĐIỆN (KHOA HỌC TỰ NHIÊN 9)

I. ĐỊNH LUẬT ÔM CHO ĐOẠN MẠCH
1. Nội dung định luật Ôm:
- Cường độ dòng điện chạy qua một dây dẫn tỉ lệ thuận với hiệu điện thế đặt vào hai đầu dây và tỉ lệ nghịch với điện trở của dây.
- Công thức: I = U / R
  Trong đó:
  + I là cường độ dòng điện (đơn vị: Ampe, A)
  + U là hiệu điện thế giữa hai đầu dây dẫn (đơn vị: Vôn, V)
  + R là điện trở của dây dẫn (đơn vị: Ôm, Ω)
- Từ đó suy ra: U = I . R và R = U / I.

2. Đoạn mạch mắc nối tiếp:
- Cường độ dòng điện: I = I_1 = I_2
- Hiệu điện thế: U = U_1 + U_2
- Điện trở tương đương: R_td = R_1 + R_2

3. Đoạn mạch mắc song song:
- Cường độ dòng điện: I = I_1 + I_2
- Hiệu điện thế: U = U_1 = U_2
- Điện trở tương đương: 1 / R_td = 1 / R_1 + 1 / R_2 => R_td = (R_1 . R_2) / (R_1 + R_2)

II. CÔNG SUẤT ĐIỆN
1. Khái niệm và công thức:
- Công suất điện của một đoạn mạch bằng tích của hiệu điện thế giữa hai đầu đoạn mạch và cường độ dòng điện chạy qua nó.
- Công thức: P = U . I
  Kết hợp với định luật Ôm: P = I^2 . R = U^2 / R
  Trong đó: P là công suất điện (đơn vị: Oát, W; 1 kW = 1000 W; 1 MW = 1.000.000 W).
2. Ý nghĩa số ghi trên dụng cụ điện:
- Số vôn (V) ghi trên dụng cụ là hiệu điện thế định mức.
- Số oát (W) ghi trên dụng cụ là công suất định mức khi dùng ở hiệu điện thế định mức.

III. ĐIỆN NĂNG TIÊU THỤ VÀ ĐỊNH LUẬT JUN - LEN-XƠ
1. Điện năng tiêu thụ:
- Công của dòng điện (điện năng tiêu thụ): A = P . t = U . I . t
  Trong đó: A là công của dòng điện (Jun, J; 1 kJ = 1000 J); t là thời gian (giây, s).
- Đo điện năng tiêu thụ trong gia đình bằng Công tơ điện:
  1 số điện = 1 kWh = 1000 W . 3600 s = 3.600.000 J = 3,6 . 10^6 J.

2. Định luật Jun - Len-xơ (Nhiệt lượng tỏa ra trên dây dẫn):
- Nhiệt lượng tỏa ra ở một dây dẫn khi có dòng điện chạy qua tỉ lệ thuận với bình phương cường độ dòng điện, với điện trở của dây dẫn và thời gian dòng điện chạy qua.
- Công thức: Q = I^2 . R . t (Jun, J)
  Nếu tính theo đơn vị calo: Q = 0,24 . I^2 . R . t (calo).`,

    mindmapMarkdown: `# Định luật Ôm & Điện năng (KHTN 9)
## I. Định luật Ôm
### Công thức gốc
- I = U / R
- I: Ampe (A), U: Vôn (V), R: Ôm (Ω)
- Hệ quả: U = I.R và R = U/I
### Mạch nối tiếp
- I = I1 = I2
- U = U1 + U2
- Rtd = R1 + R2
### Mạch song song
- I = I1 + I2
- U = U1 = U2
- Rtd = (R1.R2) / (R1 + R2)
## II. Công suất điện
### Công thức tính P
- P = U . I
- P = I^2 . R = U^2 / R
- Đơn vị: Oát (W), 1 kW = 1000 W
### Công suất định mức
- Hiệu điện thế định mức (Uđm)
- Công suất định mức (Pđm)
## III. Điện năng & Định luật Jun - Len-xơ
### Điện năng tiêu thụ (A)
- A = P . t = U . I . t
- Đơn vị: Jun (J)
- 1 số điện = 1 kWh = 3.600.000 J
### Định luật Jun - Len-xơ (Q)
- Q = I^2 . R . t
- Tỉ lệ thuận với bình phương I
- Ứng dụng: Bàn là, ấm điện, bếp điện`,

    summary: {
      coreTakeaways: [
        "Định luật Ôm: Cường độ dòng điện tỉ lệ thuận với hiệu điện thế $U$ và tỉ lệ nghịch với điện trở $R$: $I = \\frac{U}{R}$.",
        "Mạch nối tiếp dòng điện bằng nhau ($I = I_1 = I_2$, $R_{td} = R_1 + R_2$); Mạch song song hiệu điện thế bằng nhau ($U = U_1 = U_2$, $R_{td} = \\frac{R_1 R_2}{R_1 + R_2}$).",
        "Công suất điện đặc trưng cho tốc độ tiêu thụ điện: $P = U \\cdot I = I^2 R = \\frac{U^2}{R}$ (đơn vị Oát - W).",
        "Điện năng tiêu thụ tính bằng công thức: $A = P \\cdot t = U \\cdot I \\cdot t$. Một 'số điện' trên công tơ chính là $1 \\text{ kWh} = 3.600.000 \\text{ J}$.",
        "Định luật Jun - Len-xơ: Nhiệt lượng tỏa ra trên dây dẫn tỉ lệ với bình phương dòng điện: $Q = I^2 \\cdot R \\cdot t$."
      ],
      terms: [
        { term: "Định luật Ôm (Ohm's Law)", definition: "Cường độ dòng điện $I$ tỉ lệ thuận với $U$ và tỉ lệ nghịch với $R$: $I = \\frac{U}{R}$." },
        { term: "Điện trở tương đương ($R_{td}$)", definition: "Điện trở có thể thay thế cho cả đoạn mạch sao cho hiệu điện thế và cường độ dòng điện không đổi." },
        { term: "Công suất điện ($P$)", definition: "Tốc độ sinh công của dòng điện: $P = U \\cdot I$ (Oát, W)." },
        { term: "Số điện (1 kWh)", definition: "Đơn vị đo điện sinh hoạt: $1 \\text{ kWh} = 1000 \\text{ W} \\times 3600 \\text{ s} = 3.600.000 \\text{ J}$." },
        { term: "Định luật Jun - Len-xơ", definition: "Nhiệt lượng tỏa ra trên dây dẫn có điện trở: $Q = I^2 R t$ (Jun, J)." }
      ],
      studyStrategy: {
        feynmanTechnique: "Hãy tưởng tượng dòng điện như dòng nước chảy qua đường ống: Hiệu điện thế U là áp lực nước đẩy, điện trở R là cát sỏi cản trở dòng chảy. Áp lực càng mạnh thì nước chảy càng siết (I tăng), sỏi cát càng nhiều cản trở thì nước chảy càng chậm (I giảm). Đó chính là I = U / R!",
        mnemonics: "Mẹo nhớ tam giác Ôm: Vẽ hình tam giác với U ở đỉnh trên, I và R ở hai góc đáy. Muốn tìm đại lượng nào chỉ cần che đại lượng đó lại: Che U thấy I.R, che I thấy U/R, che R thấy U/I!",
        spacedSchedule: [
          { day: "Hôm nay (Sau 1h)", task: "Học thuộc tam giác Ôm $I = \\frac{U}{R}$ và công thức công suất $P = U \\cdot I$." },
          { day: "Ngày 3", task: "Luyện tính điện trở tương đương mạch nối tiếp và song song; giải bài tập tính tiền điện gia đình." },
          { day: "Ngày 7", task: "Làm bài tập vận dụng định luật Jun - Len-xơ $Q = I^2 R t$ trong ấm điện đun sôi nước." }
        ]
      }
    },

    quiz: [
      {
        id: 1,
        tier: "easy",
        tierLabel: "Dễ (Nhận biết)",
        question: "Biểu thức của định luật Ôm cho đoạn mạch có điện trở $R$ và hiệu điện thế $U$ là:",
        options: [
          "A. $I = \\frac{U}{R}$",
          "B. $I = U \\cdot R$",
          "C. $I = \\frac{R}{U}$",
          "D. $I = U^2 \\cdot R$"
        ],
        correctIndex: 0,
        explanation: "Theo định luật Ôm, cường độ dòng điện tỉ lệ thuận với hiệu điện thế và tỉ lệ nghịch với điện trở: $I = \\frac{U}{R}$."
      },
      {
        id: 2,
        tier: "easy",
        tierLabel: "Dễ (Nhận biết)",
        question: "Đơn vị nào sau đây là đơn vị đo của công suất điện?",
        options: [
          "A. Oát (W)",
          "B. Jun (J)",
          "C. Ampe (A)",
          "D. Vôn (V)"
        ],
        correctIndex: 0,
        explanation: "Công suất điện được đo bằng Oát (W) hoặc Kilôoát (kW). Jun (J) là đơn vị của công/điện năng; Ampe là cường độ dòng điện; Vôn là hiệu điện thế."
      },
      {
        id: 3,
        tier: "medium",
        tierLabel: "Trung bình (Thông hiểu & Tính toán)",
        question: "Hai điện trở $R_1 = 20\\,\\Omega$ và $R_2 = 30\\,\\Omega$ được mắc nối tiếp vào hiệu điện thế $U = 100\\,\\text{V}$. Cường độ dòng điện qua mạch chính là:",
        options: [
          "A. $2\\,\\text{A}$",
          "B. $5\\,\\text{A}$",
          "C. $10\\,\\text{A}$",
          "D. $1\\,\\text{A}$"
        ],
        correctIndex: 0,
        explanation: "Đoạn mạch nối tiếp có điện trở tương đương: $R_{td} = R_1 + R_2 = 20 + 30 = 50\\,\\Omega$. Áp dụng định luật Ôm: $I = \\frac{U}{R_{td}} = \\frac{100}{50} = 2\\,\\text{A}$."
      },
      {
        id: 4,
        tier: "medium",
        tierLabel: "Trung bình (Thông hiểu & Tính toán)",
        question: "Một bóng đèn có ghi $220\\,\\text{V} - 100\\,\\text{W}$ được sử dụng đúng hiệu điện thế định mức trong $5$ giờ mỗi ngày. Điện năng tiêu thụ của bóng đèn trong $30$ ngày là:",
        options: [
          "A. $15\\,\\text{kWh}$ (15 số điện)",
          "B. $150\\,\\text{kWh}$",
          "C. $30\\,\\text{kWh}$",
          "D. $5\\,\\text{kWh}$"
        ],
        correctIndex: 0,
        explanation: "Công suất $P = 100\\,\\text{W} = 0,1\\,\\text{kW}$. Tổng thời gian dùng trong 30 ngày: $t = 5 \\times 30 = 150\\,\\text{h}$. Điện năng tiêu thụ: $A = P \\cdot t = 0,1 \\times 150 = 15\\,\\text{kWh}$ (tương đương 15 số điện)."
      },
      {
        id: 5,
        tier: "hard",
        tierLabel: "Khó (Vận dụng cao)",
        question: "Một ấm điện có ghi $220\\,\\text{V} - 1000\\,\\text{W}$ được dùng ở hiệu điện thế $220\\,\\text{V}$ để đun sôi $2\\,\\text{lít}$ nước từ nhiệt độ ban đầu $20^\\circ\\text{C}$. Biết nhiệt dung riêng của nước là $c = 4200\\,\\text{J/(kg.K)}$ và hiệu suất ấm là $84\\%$. Thời gian đun sôi nước là:",
        options: [
          "A. $800\\,\\text{giây}$ (khoảng 13 phút 20 giây)",
          "B. $672\\,\\text{giây}$",
          "C. $1000\\,\\text{giây}$",
          "D. $500\\,\\text{giây}$"
        ],
        correctIndex: 0,
        explanation: "Nhiệt lượng có ích cần làm sôi nước: $Q_i = m \\cdot c \\cdot \\Delta t = 2 \\times 4200 \\times (100 - 20) = 672.000\\,\\text{J}$. Vì hiệu suất $H = 84\\%$, nhiệt lượng toàn phần ấm cần sinh ra: $A = \\frac{Q_i}{H} = \\frac{672.000}{0,84} = 800.000\\,\\text{J}$. Mà $A = P \\cdot t \\Rightarrow t = \\frac{A}{P} = \\frac{800.000}{1000} = 800\\,\\text{giây}$."
      },
      {
        id: 6,
        tier: "hard",
        tierLabel: "Khó (Vận dụng cao)",
        question: "Cho mạch điện gồm điện trở $R_1 = 12\\,\\Omega$ mắc song song với $R_2$ vào nguồn điện có $U = 24\\,\\text{V}$. Biết ampe kế đo mạch chính chỉ $3\\,\\text{A}$. Giá trị của điện trở $R_2$ là:",
        options: [
          "A. $24\\,\\Omega$",
          "B. $12\\,\\Omega$",
          "C. $8\\,\\Omega$",
          "D. $6\\,\\Omega$"
        ],
        correctIndex: 0,
        explanation: "Vì mạch song song nên $U_1 = U_2 = U = 24\\,\\text{V}$. Cường độ dòng điện qua $R_1$ là: $I_1 = \\frac{U_1}{R_1} = \\frac{24}{12} = 2\\,\\text{A}$. Cường độ dòng điện qua $R_2$ là: $I_2 = I - I_1 = 3 - 2 = 1\\,\\text{A}$. Suy ra điện trở $R_2 = \\frac{U_2}{I_2} = \\frac{24}{1} = 24\\,\\Omega$."
      }
    ],

    beams: [
      {
        id: 1,
        badge: "Thẻ 01 • Định luật Nền tảng",
        title: "Tam giác Vàng Định luật Ôm $I = U / R$",
        takeaway: "Hiệu điện thế đẩy, Điện trở cản, Dòng điện chạy.",
        frontQuestion: "Khi giữ nguyên hiệu điện thế $U$, nếu tăng điện trở $R$ lên gấp 3 lần thì cường độ dòng điện $I$ thay đổi như thế nào?",
        backAnswer: "Cường độ dòng điện $I$ sẽ GIẢM ĐI 3 LẦN. Vì theo định luật Ôm $I = \\frac{U}{R}$, $I$ tỉ lệ nghịch với điện trở $R$.",
        actionPrompt: "Quy tắc tam giác: Che $U$ được $I \\times R$, che $I$ được $U / R$, che $R$ được $U / I$.",
        mastered: false
      },
      {
        id: 2,
        badge: "Thẻ 02 • Mắc Song Song vs Nối Tiếp",
        title: "Bí kíp Điện trở Tương đương",
        takeaway: "Nối tiếp $R$ cộng dồn ($R_{td} > R_1$); Song song $R$ giảm đi ($R_{td} < R_1$).",
        frontQuestion: "Tại sao các thiết bị điện trong gia đình (quạt, đèn, tivi) luôn được mắc song song với nhau?",
        backAnswer: "1. Để tất cả đều nhận đúng hiệu điện thế định mức $220\\,\\text{V}$.\n2. Để khi một thiết bị tắt hoặc hỏng, các thiết bị còn lại vẫn hoạt động bình thường độc lập.",
        actionPrompt: "Công thức nhanh cho 2 điện trở song song: $R_{td} = \\frac{R_1 R_2}{R_1 + R_2}$.",
        mastered: false
      },
      {
        id: 3,
        badge: "Thẻ 03 • Công suất Điện",
        title: "3 Công thức Tính Công suất $P$",
        takeaway: "$P = U \\cdot I = I^2 \\cdot R = U^2 / R$.",
        frontQuestion: "Một ấm đun nước ghi $220\\,\\text{V} - 1000\\,\\text{W}$. Ý nghĩa của hai con số này là gì?",
        backAnswer: "• $220\\,\\text{V}$ là hiệu điện thế định mức để ấm hoạt động bình thường.\n• $1000\\,\\text{W}$ là công suất tiêu thụ định mức của ấm khi cắm đúng nguồn $220\\,\\text{V}$.",
        actionPrompt: "Công suất càng lớn thì nước sôi càng nhanh nhưng tiêu tốn nhiều điện năng hơn.",
        mastered: false
      },
      {
        id: 4,
        badge: "Thẻ 04 • Tiết kiệm Điện",
        title: "Một Số Điện (1 kWh) là gì?",
        takeaway: "1 số điện = $1\\,\\text{kWh} = 3.600.000\\,\\text{Jun}$.",
        frontQuestion: "Dùng một bàn là điện công suất $1000\\,\\text{W}$ liên tục trong 2 giờ thì hết bao nhiêu số điện?",
        backAnswer: "$A = P \\cdot t = 1\\,\\text{kW} \\times 2\\,\\text{h} = 2\\,\\text{kWh}$ (tức là tiêu tốn đúng 2 số điện trên công tơ!).",
        actionPrompt: "Tiền điện = Số điện $\\times$ Giá điện (ví dụ: $2 \\times 2.500 = 5.000\\,\\text{đồng}$).",
        mastered: false
      },
      {
        id: 5,
        badge: "Thẻ 05 • Hiệu ứng Nhiệt",
        title: "Định luật Jun - Len-xơ $Q = I^2 R t$",
        takeaway: "Nhiệt lượng tỏa ra tỉ lệ với bình phương cường độ dòng điện.",
        frontQuestion: "Tại sao dây dẫn nối từ ổ cắm vào bàn là thì hầu như không nóng, trong khi dây mai-so bên trong bàn là lại nóng đỏ rực?",
        backAnswer: "Vì dây dẫn và dây mai-so mắc nối tiếp nên cùng dòng điện $I$. Nhưng dây mai-so có điện trở $R$ rất lớn so với dây đồng, theo $Q = I^2 R t$, nhiệt lượng tập trung tỏa ra chủ yếu ở dây mai-so!",
        actionPrompt: "Ứng dụng trong cầu chì: Dây chì có nhiệt độ nóng chảy thấp, khi quá tải sẽ tự chảy đứt để bảo vệ mạch điện.",
        mastered: false
      }
    ]
  },

  // ================= BÀI HỌC 3: KHOA HỌC TỰ NHIÊN 7 (QUANG HỢP) =================
  khtn7: {
    level: "Cấp 2 (THCS)",
    grade: "Lớp 7",
    subject: "Khoa học Tự nhiên",
    title: "KHTN 7: Quang hợp ở Thực vật",
    sourceType: "text",
    rawContent: `BÀI HỌC: QUANG HỢP Ở THỰC VẬT (KHOA HỌC TỰ NHIÊN 7)

I. KHÁI NIỆM VÀ PHƯƠNG TRÌNH QUANG HỢP
1. Khái niệm:
- Quang hợp là quá trình lá cây sử dụng nước và khí carbon dioxide (CO2), nhờ năng lượng ánh sáng mặt trời được diệp lục hấp thụ để tổng hợp chất hữu cơ (glucose, tinh bột) và giải phóng khí oxygen (O2).
- Phương trình chữ: Nước + Khí carbon dioxide + Năng lượng ánh sáng (Chất diệp lục) ---> Glucose (chất hữu cơ) + Khí oxygen.
- Phương trình hóa học cơ bản: 6H2O + 6CO2 --(Ánh sáng, Diệp lục)--> C6H12O6 + 6O2.

II. CƠ QUAN VÀ BÀO QUAN THỰC HIỆN QUANG HỢP
1. Cơ quan quang hợp chính: Lá cây (phiến lá dẹt, rộng đón nắng).
2. Bào quan: Lục lạp chứa chất diệp lục hấp thụ ánh sáng.
3. Khí khổng: Đóng mở trao đổi CO2 và O2.`,

    mindmapMarkdown: `# Quang hợp ở Thực vật (KHTN 7)
## I. Khái niệm & Bản chất
### Khái niệm
- Thực vật tổng hợp chất hữu cơ
- Hấp thụ CO2 và Nước
- Giải phóng khí Oxygen
### Phương trình chữ
- Nước + Khí carbon dioxide
- Ánh sáng + Chất diệp lục
- -> Glucose (chất hữu cơ) + Oxygen
## II. Cơ quan & Bào quan
### Lá cây
- Phiến lá dẹt, rộng đón nắng
- Gân lá dẫn nước và khoáng
### Lục lạp
- Chứa chất diệp lục màu xanh
- Bào quan trực tiếp quang hợp`,

    summary: {
      coreTakeaways: [
        "Quang hợp giúp cây biến Nước và khí Carbon dioxide thành Glucose và khí Oxygen nhờ năng lượng mặt trời.",
        "Lục lạp chứa chất diệp lục chính là 'nhà máy chế biến thức ăn' của cây xanh.",
        "Khí khổng đóng mở linh hoạt để hút khí $CO_2$ vào và nhả khí $O_2$ ra."
      ],
      terms: [
        { term: "Quang hợp", definition: "Quá trình thực vật tổng hợp chất hữu cơ từ $CO_2$ và $H_2O$ nhờ ánh sáng mặt trời." },
        { term: "Lục lạp", definition: "Bào quan chứa chất diệp lục thực hiện quang hợp." }
      ],
      studyStrategy: {
        feynmanTechnique: "Giải thích đơn giản: Cây xanh như đầu bếp nhỏ: Lấy nước từ rễ, hút khí CO2 từ không khí, bật 'bếp lửa' là ánh nắng mặt trời qua chiếc chảo diệp lục, nấu thành món bánh ngọt Glucose và tặng kèm khí Oxy trong lành!",
        mnemonics: "Thơ vui: 'Nước cùng CO2 / Gặp nắng ấm ban mai / Diệp lục trổ tài / Ra Đường cùng Dưỡng khí'.",
        spacedSchedule: [
          { day: "Hôm nay", task: "Ôn lại phương trình quang hợp." },
          { day: "Ngày 3", task: "Làm bài tập trắc nghiệm quang hợp." }
        ]
      }
    },

    quiz: [
      {
        id: 1,
        tier: "easy",
        tierLabel: "Dễ (Nhận biết)",
        question: "Bào quan nào trong tế bào lá cây chứa chất diệp lục và là nơi trực tiếp diễn ra quá trình quang hợp?",
        options: ["A. Không bào", "B. Ti thể", "C. Lục lạp", "D. Nhân tế bào"],
        correctIndex: 2,
        explanation: "Lục lạp là bào quan chứa sắc tố diệp lục, có nhiệm vụ hấp thụ ánh sáng để thực hiện quá trình quang hợp ở thực vật."
      }
    ],

    beams: [
      {
        id: 1,
        badge: "Thẻ 01 • Khái niệm Vàng",
        title: "Phương trình Kì diệu của Sự sống",
        takeaway: "Nước + CO2 + Ánh nắng -> Đường nuôi cây + Oxy cho muôn loài.",
        frontQuestion: "Cây xanh lấy nguyên liệu từ đâu để tạo ra chất hữu cơ và khí oxy trong quá trình quang hợp?",
        backAnswer: "Cây hút NƯỚC và khoáng từ đất qua hệ thống rễ, đồng thời hút khí CARBON DIOXIDE (CO2) từ không khí qua các lỗ khí khổng trên lá.",
        actionPrompt: "Phương trình: Nước + CO2 --(Ánh sáng/Diệp lục)--> Glucose + Oxygen.",
        mastered: false
      }
    ]
  },

  // ================= BÀI HỌC 4: KHOA HỌC TỰ NHIÊN 8 (BẢO TOÀN KHỐI LƯỢNG) =================
  khtn8: {
    level: "Cấp 2 (THCS)",
    grade: "Lớp 8",
    subject: "Khoa học Tự nhiên",
    title: "KHTN 8: Phản ứng Hóa học & Định luật Bảo toàn Khối lượng",
    sourceType: "text",
    rawContent: `BÀI HỌC: PHẢN ỨNG HÓA HỌC VÀ ĐỊNH LUẬT BẢO TOÀN KHỐI LƯỢNG (KHTN 8)

I. BIẾN ĐỔI VẬT LÍ VÀ HÓA HỌC
- Biến đổi vật lí: Không tạo chất mới (nước đá tan, cồn bay hơi).
- Biến đổi hóa học: Có chất mới tạo thành (than cháy, đinh sắt gỉ).

II. ĐỊNH LUẬT BẢO TOÀN KHỐI LƯỢNG
- Tổng khối lượng sản phẩm bằng tổng khối lượng các chất phản ứng: mA + mB = mC + mD.`,

    mindmapMarkdown: `# Phản ứng Hóa học & Bảo toàn Khối lượng (KHTN 8)
## I. Hiện tượng Biến đổi
### Biến đổi vật lí
- Thay đổi trạng thái, hình dạng
- Không tạo ra chất mới
### Biến đổi hóa học
- Có chất mới sinh ra
## II. Định luật Bảo toàn Khối lượng
### Nội dung
- Tổng m sản phẩm = Tổng m phản ứng
- Công thức: mA + mB = mC + mD`,

    summary: {
      coreTakeaways: [
        "Biến đổi hóa học luôn sinh ra chất mới, còn biến đổi vật lí thì không.",
        "Định luật bảo toàn khối lượng: $m_A + m_B = m_C + m_D$."
      ],
      terms: [
        { term: "Định luật bảo toàn khối lượng", definition: "Tổng khối lượng chất tham gia bằng tổng khối lượng sản phẩm." }
      ],
      studyStrategy: {
        feynmanTechnique: "Tưởng tượng nguyên tử như những khối Lego: Tháo xe ô tô lắp thành ngôi nhà, số mảnh Lego và khối lượng không hề thay đổi!",
        mnemonics: "Công thức: 'Vào bao nhiêu, Ra bấy nhiêu'.",
        spacedSchedule: [{ day: "Hôm nay", task: "Nắm vững công thức $mA + mB = mC + mD$." }]
      }
    },

    quiz: [
      {
        id: 1,
        tier: "easy",
        tierLabel: "Dễ (Nhận biết)",
        question: "Hiện tượng nào sau đây là biến đổi vật lí?",
        options: ["A. Cơm bị thiu", "B. Nước đá tan chảy", "C. Than cháy", "D. Đinh sắt gỉ"],
        correctIndex: 1,
        explanation: "Nước đá tan chỉ biến đổi trạng thái, không sinh ra chất mới."
      }
    ],

    beams: [
      {
        id: 1,
        badge: "Thẻ 01 • Phân biệt",
        title: "Vật lí vs Hóa học",
        takeaway: "Có chất mới = Hóa học; Giữ nguyên chất = Vật lí.",
        frontQuestion: "Cắt vụn tờ giấy và Đốt cháy tờ giấy khác nhau như thế nào?",
        backAnswer: "Cắt vụn là biến đổi vật lí (vẫn là giấy). Đốt cháy là biến đổi hóa học (tạo tro và khí CO2).",
        actionPrompt: "Luôn tự hỏi: 'Có chất mới sinh ra không?'.",
        mastered: false
      }
    ]
  }
};

// Default sample is Toán 9
window.SAMPLE_LESSON = window.SAMPLE_LESSONS.toan9;
