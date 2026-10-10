# HKT — Hệ thống quản lý ghi chú và thông tin riêng tư

Ứng dụng sổ tay cá nhân được xây dựng bằng **React + Vite**, **Node.js + Express** và lưu trữ dữ liệu bằng **JSON**. Người dùng có thể quản lý ghi chú, sắp xếp theo bộ sưu tập, soạn thảo có định dạng, chèn ảnh, đính kèm tài liệu, xuất file và hẹn nhắc việc. Vùng ghi chú riêng tư được bảo vệ bằng mật khẩu và mã hóa nội dung.


## 1. Thông tin đồ án

| Thông tin | Nội dung |
| --- | --- |
| Đề tài | Hệ thống quản lý ghi chú và thông tin riêng tư |
| Môn học / lớp | Lập Trình Front End / CD CNTT 24 WEB C |
| Giảng viên hướng dẫn | Nguyễn Hoàng Việt |
| Nhóm thực hiện | HKT |
| Repository | [NguyenKhoa206/DoAnGhiChu](https://github.com/NguyenKhoa206/DoAnGhiChu) |
| Ngày hoàn thiện bản nộp | 10/10/2026 |

## 2. Thành viên và phân công công việc

| Thành viên | MSSV | Vai trò | Công việc chính |
| --- | --- | --- | --- |
| Trần Nguyễn Gia Huy | 0306241111 | PM / QA | Lập kế hoạch, viết và thực hiện test case, ghi lỗi, kiểm thử lại, tổng hợp báo cáo và slide. |
| Nguyễn Vũ Anh Khoa | 0306241119 | Frontend Developer | Giao diện, trình soạn thảo, kết nối API, responsive và sửa lỗi FE. |
| Ngô Văn Thân | 0306241151 | Backend Developer | API, lưu trữ JSON, xác thực riêng tư, xử lý lỗi BE và hướng dẫn cài đặt. |

## 3. Mục tiêu và phạm vi

- Cung cấp một nơi lưu ghi chú, tài liệu và thông tin cá nhân dễ sử dụng.
- Hỗ trợ tổ chức ghi chú theo bộ sưu tập, tìm kiếm, ghim và đánh dấu yêu thích.
- Cung cấp trình soạn thảo có định dạng, hình ảnh và tệp đính kèm.
- Bảo vệ nội dung riêng tư bằng mật khẩu, mã hóa và giới hạn số lần thử sai.
- Hỗ trợ lịch ghi chú, hẹn nhắc việc, xuất tài liệu và khôi phục ghi chú đã xóa.
- Áp dụng giao diện responsive để sử dụng trên máy tính và màn hình điện thoại.

Mỗi backend phục vụ **một sổ tay cá nhân**. Phiên bản hiện tại chưa triển khai hệ thống nhiều tài khoản hoặc chia sẻ ghi chú giữa người dùng.

## 4. Công nghệ sử dụng

| Thành phần | Công nghệ / thư viện | Vai trò |
| --- | --- | --- |
| Frontend | React, React DOM | Xây dựng giao diện và quản lý trạng thái |
| Công cụ frontend | Vite | Chạy môi trường phát triển và tạo bản build |
| Điều hướng | React Router DOM | Điều hướng dashboard, lịch, cài đặt, thùng rác và vùng riêng tư |
| Gọi API | Axios | Kết nối frontend với backend |
| Backend | Node.js, Express | Cung cấp REST API và xử lý nghiệp vụ |
| Lưu trữ | JSON, fs-extra | Đọc, ghi và quản lý dữ liệu trên máy chạy backend |
| Bảo vệ mật khẩu | bcryptjs | Băm và kiểm tra mật khẩu vùng riêng tư |
| Phiên riêng tư | jsonwebtoken | Cấp và xác minh phiên mở khóa vùng riêng tư |
| Mã hóa nội dung | Web Crypto API, AES-GCM | Mã hóa và giải mã ghi chú riêng tư tại trình duyệt |
| Lọc nội dung | sanitize-html | Loại nội dung thực thi nguy hiểm, giữ định dạng an toàn |
| Cấu hình | dotenv, CORS | Đọc biến môi trường và hỗ trợ kết nối frontend/backend |
| Kiểm thử | Node.js test runner | Chạy các test frontend và backend |
| Kiểm tra mã | Oxlint | Kiểm tra mã frontend |

Frontend gửi yêu cầu đến API của backend. Backend phân chia xử lý trong các thư mục `routes`, `middleware`, `controllers` và `utils`, sau đó đọc hoặc ghi file JSON. Nội dung ghi chú riêng tư được mã hóa tại trình duyệt trước khi gửi lên backend.

## 5. Chức năng chính

| Nhóm chức năng | Nội dung |
| --- | --- |
| Ghi chú | Tạo, xem, chỉnh sửa, xóa; tìm kiếm và sắp xếp |
| Bộ sưu tập | Tạo, đổi tên, xóa; lưu tên có dấu tiếng Việt; chọn khi tạo ghi chú, chuyển tài liệu giữa các thư mục hoặc về Chưa phân loại |
| Ghim và yêu thích | Đánh dấu, bỏ đánh dấu, xem danh sách đã lọc |
| Trình soạn thảo | Đậm, nghiêng, gạch chân, gạch ngang, kiểu đoạn, cỡ chữ, màu, căn lề, danh sách và checklist |
| Hình ảnh | Chèn ảnh, tối ưu dung lượng, căn ảnh, đổi kích thước, cắt ảnh, thay ảnh và gỡ bằng dấu × |
| Tệp đính kèm | Thêm tài liệu, tải xuống và gỡ bằng dấu × |
| Xuất ghi chú | TXT UTF-8 và Word DOCX |
| Lịch ghi chú | Xem ghi chú theo ngày và tạo ghi chú cho ngày được chọn |
| Hẹn nhắc việc | Đặt ngày giờ; xem bảng Việc cần làm hôm nay; nhận thông báo khi được cấp quyền |
| Ghi chú riêng tư | Thiết lập mật khẩu, mở khóa, quản lý nội dung mã hóa và đổi mật khẩu |
| Thùng rác | Khôi phục hoặc xóa vĩnh viễn; có xác nhận trước khi xóa |
| Hồ sơ cá nhân | Tên hiển thị, email tùy chọn và ảnh đại diện |
| Giao diện | Sáng/tối, màu chủ đạo, kiểu danh sách và khoảng cách hiển thị |

### Quy tắc của bản nộp

- Khi truy cập `/`, ứng dụng chuyển đến `/dashboard`.
- Các đường dẫn tài khoản cũ `/login` và `/register` chuyển về trang ghi chú.
- Ghi chú chưa chọn bộ sưu tập được lưu ở trạng thái **chưa phân loại**, không tự sinh bộ sưu tập “Ghi chú”.
- Khi tạo ghi chú trong một bộ sưu tập, thư mục đó được chọn sẵn; người dùng vẫn có thể chọn bộ sưu tập khác hoặc Chưa phân loại trước khi lưu.
- Mục Nhật ký đã được bỏ; dữ liệu ghi chú cũ trong các mục mặc định được chuyển sang chưa phân loại.
- Người dùng có thể bấm vùng nội dung của dòng/thẻ để mở ghi chú. Nút ghim, yêu thích và xóa hoạt động riêng.
- Tên bộ sưu tập được lưu riêng với mã dùng trong đường dẫn và tên file, giúp giữ nguyên dấu và cách viết sau khi tải lại trang.
- Khi đặt hoặc đổi tên, ô nhập giữ nội dung đang ghép dấu và đọc đúng giá trị hiện tại khi lưu.

### Phân loại và chuyển tài liệu

1. Tạo ghi chú mới hoặc mở tài liệu đã có từ danh sách, một bộ sưu tập hay lịch ghi chú.
2. Trong bảng công cụ, tìm ô **Bộ sưu tập** và chọn thư mục muốn lưu. Danh sách hiển thị các bộ sưu tập đã tạo với tên tiếng Việt có dấu.
3. Chọn **Chưa phân loại** để đưa tài liệu ra khỏi bộ sưu tập hiện tại.
4. Nhấn **Lưu**. Ghi chú chuyển khỏi thư mục nguồn và xuất hiện trong thư mục đích; không tạo một bản sao mới.

Mỗi ghi chú thường thuộc một bộ sưu tập hoặc ở trạng thái Chưa phân loại. Khi chuyển, ứng dụng giữ ID, nội dung, tệp đính kèm, ảnh/nền, ghim, yêu thích, ngày ghi chú và lịch nhắc. Nếu chưa có bộ sưu tập, dùng nút **Tạo bộ sưu tập mới** ở thanh bên, sau đó mở lại ghi chú để chọn.

Nếu lưu không thành công, nội dung và lựa chọn trong trình soạn thảo được giữ để thử lại. Bộ sưu tập đích bị xóa sẽ được báo lỗi để chọn thư mục khác. Ghi chú riêng tư được quản lý trong vùng mã hóa riêng và không có bộ chọn thư mục thường.

## 6. Yêu cầu môi trường

- **Node.js 22.12 trở lên**; môi trường kiểm tra của nhóm sử dụng Node.js **24.19.0**.
- npm đi kèm Node.js; môi trường kiểm tra sử dụng npm **11.9.0**.
- Git nếu tải mã nguồn bằng lệnh `git clone`.
- Trình duyệt hỗ trợ Web Crypto, như Chrome hoặc Edge hiện đại.
- Truy cập bằng **localhost hoặc HTTPS** để sử dụng mã hóa vùng riêng tư.
- Không cần cài MySQL hoặc MongoDB.

Kiểm tra phiên bản trước khi cài đặt:

```bash
node -v
npm -v
```

## 7. Cài đặt và chạy dự án

### Bước 1 — Tải mã nguồn

```bash
git clone --branch main https://github.com/NguyenKhoa206/DoAnGhiChu.git
cd DoAnGhiChu
```

Nếu tải ZIP từ GitHub, giải nén và mở thư mục có chứa thư mục `Note` bằng Visual Studio Code.

### Bước 2 — Chạy backend

Mở terminal thứ nhất **tại thư mục gốc dự án**, chạy:

```bash
cd Note
cd Server
npm i
npm start
```

Backend mặc định chạy tại **http://localhost:5000**.

Kiểm tra API hoạt động bằng cách mở:

```text
http://localhost:5000/api/health
```

Trong quá trình phát triển, có thể thay `npm start` bằng `npm run dev` để backend tự khởi động lại khi sửa mã nguồn.

### Bước 3 — Chạy frontend

Mở terminal thứ hai **tại thư mục gốc dự án**, chạy:

```bash
cd Note
cd Frontend
npm i
npm run dev
```

Mở **http://localhost:5173** để sử dụng ứng dụng. Nếu Vite chọn cổng khác, dùng địa chỉ được in trong terminal.

**Giữ cả hai terminal đang chạy:** frontend hiển thị giao diện; backend cung cấp API và lưu dữ liệu. Thư mục dữ liệu được backend chuẩn bị khi cần.

### Bước 4 — Thiết lập mật khẩu riêng tư

1. Mở **Cài đặt** và chọn phần **Bảo mật**.
2. Nhập mật khẩu riêng tư, nhập lại mật khẩu xác nhận và lưu.
3. Mở **Ghi chú riêng tư**, nhập mật khẩu để mở khóa.
4. Sau khi mở khóa, tạo và chỉnh sửa ghi chú riêng tư như ghi chú thường.

Khi đổi mật khẩu, ứng dụng mã hóa lại cả ghi chú và thùng rác riêng tư bằng mật khẩu mới.

## 8. Cấu hình môi trường

Các file `.env.example` cung cấp cấu hình mẫu. Có thể sao chép thành `.env` trong cùng thư mục khi cần đổi cấu hình.

### Frontend — `Note/frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Nếu thay đổi địa chỉ hoặc cổng backend, cập nhật biến này và khởi động lại frontend.

### Backend — `Note/server/.env`

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng backend, mặc định 5000 |
| `NODE_ENV` | Chế độ development hoặc production |
| `JWT_SECRET` | Khóa ký phiên mở khóa riêng tư; production yêu cầu ít nhất 32 byte |
| `NOTEAPP_DATA_DIR` | Đường dẫn tuyệt đối đến thư mục dữ liệu khác; dùng cho môi trường kiểm tra hoặc lưu dữ liệu riêng |
| `NOTEAPP_LEGACY_USER_ID` | Chọn sổ tay cũ khi có nhiều thư mục người dùng cần chuyển dữ liệu |

Trong development, nếu chưa đặt `JWT_SECRET`, ứng dụng tạo khóa mặc định ổn định để dùng qua các lần khởi động. Khi cấu hình production, thay giá trị mẫu bằng khóa bí mật riêng đáp ứng giới hạn trên.

## 9. Cấu trúc thư mục và vai trò từng file

### 9.1. Cây thư mục mã nguồn trên nhánh main

Cây dưới đây liệt kê đầy đủ **107 file đang được Git quản lý**, tính từ thư mục gốc `DoAnGhiChu`. Dữ liệu tạo lúc chạy được mô tả riêng ở mục 9.4.

**Tên thư mục theo source trên GitHub:** `frontend` và `server` viết thường. Trên môi trường phân biệt chữ hoa/thường, dùng `cd Note/frontend` và `cd Note/server`.

```text
DoAnGhiChu/
├── Note/  # Mã nguồn ứng dụng
│   ├── frontend/  # Giao diện React + Vite
│   │   ├── public/  # Tài nguyên tĩnh
│   │   │   └── favicon.svg
│   │   ├── src/  # Mã nguồn frontend
│   │   │   ├── components/  # Thành phần giao diện tái sử dụng
│   │   │   │   ├── Layouts/  # Khung ứng dụng và điều hướng
│   │   │   │   │   ├── Brand.css
│   │   │   │   │   ├── Brand.jsx
│   │   │   │   │   ├── MainLayout.css
│   │   │   │   │   ├── MainLayout.jsx
│   │   │   │   │   ├── Sidebar.css
│   │   │   │   │   └── Sidebar.jsx
│   │   │   │   ├── Notes/  # Soạn thảo và quản lý ghi chú
│   │   │   │   │   ├── DocumentDetailView.css
│   │   │   │   │   ├── DocumentDetailView.jsx
│   │   │   │   │   ├── ExportNoteButton.css
│   │   │   │   │   ├── ExportNoteButton.jsx
│   │   │   │   │   ├── NoteCard.css
│   │   │   │   │   ├── NoteCard.jsx
│   │   │   │   │   ├── NoteFormattingTools.css
│   │   │   │   │   ├── NoteFormattingTools.jsx
│   │   │   │   │   ├── NoteImageTools.css
│   │   │   │   │   ├── NoteImageTools.jsx
│   │   │   │   │   ├── NoteList.css
│   │   │   │   │   ├── NoteList.jsx
│   │   │   │   │   ├── ReminderCenter.css
│   │   │   │   │   ├── ReminderCenter.jsx
│   │   │   │   │   ├── TopicModal.css
│   │   │   │   │   └── TopicModal.jsx
│   │   │   │   ├── UI/  # Điều khiển giao diện dùng chung
│   │   │   │   │   ├── ConfirmDialog.css
│   │   │   │   │   ├── ConfirmDialog.jsx
│   │   │   │   │   ├── Icon.jsx
│   │   │   │   │   ├── PasswordInput.css
│   │   │   │   │   ├── PasswordInput.jsx
│   │   │   │   │   ├── PrivateAuthModal.css
│   │   │   │   │   ├── PrivateAuthModal.jsx
│   │   │   │   │   ├── Toast.css
│   │   │   │   │   └── Toast.jsx
│   │   │   │   └── User/  # Menu hồ sơ
│   │   │   │       ├── ProfileMenu.css
│   │   │   │       └── ProfileMenu.jsx
│   │   │   ├── context/  # Trạng thái dùng chung
│   │   │   │   ├── AppContext.jsx
│   │   │   │   └── AppContextBase.js
│   │   │   ├── pages/  # Các trang ứng dụng
│   │   │   │   ├── CalendarPage.css
│   │   │   │   ├── CalendarPage.jsx
│   │   │   │   ├── DashboardPage.css
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── NotFoundPage.css
│   │   │   │   ├── NotFoundPage.jsx
│   │   │   │   ├── PrivateNotePage.css
│   │   │   │   ├── PrivateNotePage.jsx
│   │   │   │   ├── SettingsPage.css
│   │   │   │   ├── SettingsPage.jsx
│   │   │   │   ├── TrashPage.css
│   │   │   │   └── TrashPage.jsx
│   │   │   ├── services/  # Kết nối API
│   │   │   │   ├── api.js
│   │   │   │   ├── noteService.js
│   │   │   │   ├── privateService.js
│   │   │   │   └── userService.js
│   │   │   ├── styles/  # CSS toàn cục
│   │   │   │   └── global.css
│   │   │   ├── utils/  # Hàm hỗ trợ frontend
│   │   │   │   ├── crypto.js
│   │   │   │   ├── formatters.js
│   │   │   │   ├── noteAppearance.js
│   │   │   │   ├── noteExport.js
│   │   │   │   ├── noteFiles.js
│   │   │   │   ├── noteImages.js
│   │   │   │   ├── noteReminders.js
│   │   │   │   ├── noteRichText.js
│   │   │   │   ├── vietnameseLunar.js
│   │   │   │   └── wordPackage.js
│   │   │   ├── App.jsx
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   ├── test/  # Kiểm thử frontend
│   │   │   ├── noteExport.test.js
│   │   │   ├── noteFiles.test.js
│   │   │   ├── noteImages.test.js
│   │   │   ├── noteReminders.test.js
│   │   │   └── privateCrypto.test.js
│   │   ├── .env.example
│   │   ├── .oxlintrc.json
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── playwright.config.js
│   │   └── vite.config.js
│   └── server/  # Backend Node.js + Express
│       ├── config/  # Cấu hình xác thực riêng tư
│       │   └── jwt.js
│       ├── controllers/  # Xử lý nghiệp vụ API
│       │   ├── authController.js
│       │   ├── noteController.js
│       │   ├── reminderController.js
│       │   └── userController.js
│       ├── middleware/  # Xử lý request và lỗi
│       │   ├── errorHandler.js
│       │   ├── notebookMiddleware.js
│       │   └── privateAuthMiddleware.js
│       ├── routes/  # Định tuyến API
│       │   ├── authRoutes.js
│       │   ├── noteRoutes.js
│       │   ├── privateRoutes.js
│       │   └── userRoutes.js
│       ├── test/  # Kiểm thử backend
│       │   ├── notebookApis.test.js
│       │   └── security.test.js
│       ├── utils/  # Hàm hỗ trợ backend và lưu trữ
│       │   ├── noteBackground.js
│       │   ├── notebookMutation.js
│       │   ├── notebookStorage.js
│       │   ├── noteContent.js
│       │   ├── noteReminder.js
│       │   ├── privateAccess.js
│       │   ├── privateAttempts.js
│       │   ├── read_write.js
│       │   └── uiPreferences.js
│       ├── .env.example
│       ├── package-lock.json
│       ├── package.json
│       └── server.js
├── .gitignore
└── README.md
```

### 9.2. Vai trò từng file ở thư mục gốc

| File | Tác dụng |
| --- | --- |
| `.gitignore` | Quy định các tệp Git bỏ qua: thư viện cài bằng npm, bản build, cấu hình riêng, dữ liệu sổ tay và kết quả kiểm thử. |
| `README.md` | Tài liệu giới thiệu đồ án HKT, thành viên, chức năng, cài đặt, cấu trúc mã nguồn, API, kiểm thử và hướng dẫn bàn giao. |

### 9.3. Vai trò từng file mã nguồn

Các file `.jsx` xây dựng giao diện hoặc trạng thái React; `.css` định dạng thành phần tương ứng; `.js` chứa cấu hình, kết nối API, nghiệp vụ, tiện ích hoặc kiểm thử. Mỗi bảng ghi rõ thư mục gốc để xác định đúng file.

#### Cấu hình, tài nguyên tĩnh và điểm khởi chạy frontend

Đường dẫn gốc của bảng: `Note/frontend/`.

| File | Tác dụng |
| --- | --- |
| `.env.example` | Mẫu biến VITE_API_BASE_URL để frontend biết địa chỉ API backend. Sao chép thành .env nếu cần cấu hình riêng. |
| `.oxlintrc.json` | Cấu hình Oxlint, bật quy tắc React Hooks và kiểm tra cách export component để phát hiện lỗi mã frontend. |
| `index.html` | Trang HTML gốc: khai báo tiếng Việt, UTF-8, favicon, viewport, vùng root và đường dẫn nạp main.jsx. |
| `package.json` | Khai báo React, Vite, Axios, React Router và các lệnh dev, build, preview, lint, test, test:e2e. |
| `package-lock.json` | Khóa phiên bản phụ thuộc và thông tin cài đặt; giúp npm ci tái lập đúng bộ thư viện đã chốt. |
| `playwright.config.js` | Cấu hình kiểm thử trình duyệt desktop/mobile, khởi chạy frontend và backend với dữ liệu tạm. Tình trạng sử dụng được ghi bên dưới. |
| `vite.config.js` | Cấu hình Vite và plugin React để chạy máy chủ phát triển, xử lý JSX và tạo bản build frontend. |
| `public/favicon.svg` | Biểu tượng SVG được index.html dùng làm icon trên tab trình duyệt. |
| `src/main.jsx` | Điểm vào JavaScript: tạo React root, nạp CSS và render App trong React.StrictMode. |
| `src/App.jsx` | Ghép AppProvider và BrowserRouter, khai báo các route, xử lý trạng thái mở sổ tay và chuyển đường dẫn gốc/đăng nhập cũ về dashboard. |
| `src/index.css` | Nạp styles/global.css và đặt kích thước, nền, màu chữ, bố cục cho root của ứng dụng. |
| `src/styles/global.css` | Định nghĩa biến giao diện sáng/tối, reset CSS, typography, nút, biểu mẫu, modal, thanh cuộn và mật độ hiển thị dùng chung. |

#### Khung giao diện — components/Layouts

Đường dẫn gốc của bảng: `Note/frontend/src/components/Layouts/`.

| File | Tác dụng |
| --- | --- |
| `Brand.jsx` | Hiển thị thương hiệu HKT, dòng Sổ tay của bạn và liên kết quay về dashboard. |
| `Brand.css` | Định dạng biểu tượng thương hiệu, tên HKT, chữ phụ và kích thước hiển thị trên các màn hình. |
| `MainLayout.jsx` | Ghép sidebar, header, menu hồ sơ, trung tâm nhắc việc và Outlet; điều khiển menu trên màn hình nhỏ. |
| `MainLayout.css` | Bố cục khung ứng dụng, header, vùng nội dung, sidebar overlay và điều chỉnh responsive. |
| `Sidebar.jsx` | Điều hướng giữa các trang, lọc ghi chú, mở TopicModal và chuyển giao diện sáng/tối; giữ tên bộ sưu tập vừa lưu và bỏ kết quả tải danh sách cũ. |
| `Sidebar.css` | Định dạng thanh điều hướng, mục đang chọn, danh sách bộ sưu tập và sidebar trên mobile. |

#### Thành phần ghi chú — components/Notes

Đường dẫn gốc của bảng: `Note/frontend/src/components/Notes/`.

| File | Tác dụng |
| --- | --- |
| `DocumentDetailView.jsx` | Trình soạn thảo chi tiết: tiêu đề, HTML, định dạng, ảnh, tệp đính kèm, nền giấy, ngày ghi chú, lịch nhắc, chọn/chuyển bộ sưu tập, lưu và xuất file; xử lý nhập tiếng Việt và giữ nháp khi lưu lỗi. |
| `DocumentDetailView.css` | Bố cục trang tài liệu, vùng soạn thảo, thanh công cụ, bảng thuộc tính, ô chọn bộ sưu tập, ảnh đang chọn, tệp đính kèm và responsive. |
| `ExportNoteButton.jsx` | Menu xuất nội dung hiện tại sang DOCX hoặc TXT; gọi tiện ích tải file, khóa thao tác khi đang xuất và thông báo kết quả. |
| `ExportNoteButton.css` | Giao diện nút xuất, menu chọn định dạng và trạng thái hover/đang xử lý. |
| `NoteCard.jsx` | Hiển thị một ghi chú dạng thẻ với tiêu đề, trích đoạn và thời gian; hỗ trợ mở bằng chuột/bàn phím, sửa và xóa. |
| `NoteCard.css` | Định dạng thẻ ghi chú, nền giấy, tiêu đề, nội dung xem trước, ngày cập nhật và các nút thao tác. |
| `NoteFormattingTools.jsx` | Thanh định dạng chữ và đoạn: bật/tắt kiểu chữ, cỡ chữ, màu, căn lề, danh sách, checklist và xóa định dạng; giữ vùng chọn khi bấm công cụ. |
| `NoteFormattingTools.css` | Bố cục công cụ định dạng, ô chọn màu và trạng thái các nút định dạng đang bật. |
| `NoteImageTools.jsx` | Bảng chỉnh ảnh được chọn: kích thước, tỷ lệ khung, vị trí cắt, căn trái/giữa/phải, mô tả alt, thay ảnh và xóa ảnh. |
| `NoteImageTools.css` | Định dạng ảnh xem trước, thanh chỉnh kích thước, nút tỷ lệ khung, nút căn ảnh và thao tác thay/xóa. |
| `NoteList.jsx` | Danh sách ghi chú tái sử dụng: tìm tiêu đề/nội dung, sắp xếp, đổi kiểu bảng/lưới, mở, sửa, xóa và tạo ghi chú. |
| `NoteList.css` | Bố cục danh sách, thanh tìm kiếm, bảng/lưới, số lượng ghi chú và trạng thái danh sách rỗng. |
| `ReminderCenter.jsx` | Tải lịch nhắc, kiểm tra việc đến hạn, xác nhận đã thông báo với backend, hiển thị Việc cần làm hôm nay và mở ghi chú liên quan. |
| `ReminderCenter.css` | Định dạng nút chuông, số lượng nhắc việc, bảng thông báo, danh sách việc và giao diện mobile. |
| `TopicModal.jsx` | Hộp tạo/đổi tên/xóa bộ sưu tập; kiểm tra tên, chờ bộ gõ chốt dấu khi bấm lưu, chuẩn hóa NFC và giữ tên khi lưu lỗi. |
| `TopicModal.css` | Định dạng hộp bộ sưu tập, ô tên, thông báo lỗi, nút lưu/xóa và trạng thái đang gửi yêu cầu. |

#### Thành phần giao diện dùng chung — components/UI

Đường dẫn gốc của bảng: `Note/frontend/src/components/UI/`.

| File | Tác dụng |
| --- | --- |
| `ConfirmDialog.jsx` | Hộp xác nhận dùng khi xóa; cung cấp nút hủy/xác nhận, xử lý Escape, focus và trạng thái đang thực hiện. |
| `ConfirmDialog.css` | Định dạng lớp phủ, hộp xác nhận, biểu tượng cảnh báo và các nút thao tác. |
| `Icon.jsx` | Bộ icon SVG dùng chung; chọn biểu tượng theo tên để giao diện điều hướng và các nút dùng cùng phong cách. |
| `PasswordInput.jsx` | Ô nhập mật khẩu có nút hiện/ẩn; dùng cho mật khẩu vùng ghi chú riêng tư. |
| `PasswordInput.css` | Định dạng ô mật khẩu, biểu tượng khóa và nút hiện/ẩn ký tự. |
| `PrivateAuthModal.jsx` | Hộp thiết lập mật khẩu riêng tư lần đầu hoặc mở khóa vùng riêng tư; hiển thị lỗi và thời gian bị khóa do nhập sai. |
| `PrivateAuthModal.css` | Giao diện hộp mở khóa, biểu mẫu mật khẩu, trạng thái lỗi và hiệu ứng xuất hiện. |
| `Toast.jsx` | Thông báo ngắn cho thành công, lỗi hoặc thông tin; có biểu tượng, nút đóng và thời gian tự ẩn. |
| `Toast.css` | Định dạng vị trí, màu từng loại thông báo, nút đóng và hiệu ứng hiện/ẩn toast. |

#### Menu hồ sơ — components/User

Đường dẫn gốc của bảng: `Note/frontend/src/components/User/`.

| File | Tác dụng |
| --- | --- |
| `ProfileMenu.jsx` | Hiển thị avatar/tên hồ sơ và menu đi tới các tab hồ sơ, giao diện, mật khẩu riêng tư trong cài đặt. |
| `ProfileMenu.css` | Định dạng avatar, nút mở menu, bảng lựa chọn và trạng thái focus/hover. |

#### Các trang — pages

Đường dẫn gốc của bảng: `Note/frontend/src/pages/`.

| File | Tác dụng |
| --- | --- |
| `DashboardPage.jsx` | Trang ghi chú chính: danh sách/bộ sưu tập, tìm kiếm, lọc, bảng/lưới, tạo/sửa, chuyển thư mục, nháp, ghim, yêu thích và xác nhận xóa; cập nhật danh sách nguồn sau chuyển và bỏ phản hồi API cũ. |
| `DashboardPage.css` | Bố cục dashboard, thanh thao tác, thư mục/bộ sưu tập, bảng/lưới ghi chú và vùng xem tài liệu. |
| `CalendarPage.jsx` | Hiển thị ghi chú thường theo ngày, chuyển tháng, xem ngày âm lịch; tạo/mở/sửa/xóa và chọn/chuyển bộ sưu tập từ lịch mà vẫn giữ ngày ghi chú. |
| `CalendarPage.css` | Định dạng lưới lịch, ngày đang chọn, ghi chú theo ngày và bố cục lịch responsive. |
| `PrivateNotePage.jsx` | Mở khóa vùng riêng tư, giữ mật khẩu/token trong bộ nhớ, giải mã để xem và mã hóa lại khi lưu; xử lý xóa và khóa phiên. |
| `PrivateNotePage.css` | Định dạng màn hình đang khóa, danh sách ghi chú riêng tư, vùng nội dung và trạng thái mở khóa. |
| `SettingsPage.jsx` | Trang cập nhật hồ sơ/avatar, tùy chọn giao diện và mật khẩu riêng tư; đổi mật khẩu kèm mã hóa lại ghi chú và thùng rác riêng tư. |
| `SettingsPage.css` | Định dạng các tab cài đặt, biểu mẫu hồ sơ, lựa chọn màu/chủ đề, avatar và biểu mẫu mật khẩu. |
| `TrashPage.jsx` | Xem thùng rác thường/riêng tư, mở khóa phần riêng tư, khôi phục ghi chú và xác nhận trước khi xóa vĩnh viễn. |
| `TrashPage.css` | Bố cục thùng rác, nút chuyển phạm vi, danh sách ghi chú đã xóa, trạng thái rỗng và các nút khôi phục/xóa. |
| `NotFoundPage.jsx` | Trang 404 cho đường dẫn không hợp lệ và liên kết quay lại trang ghi chú. |
| `NotFoundPage.css` | Định dạng mã lỗi 404, biểu tượng, nội dung giải thích và nút điều hướng trở về. |

#### Trạng thái toàn ứng dụng — context

Đường dẫn gốc của bảng: `Note/frontend/src/context/`.

| File | Tác dụng |
| --- | --- |
| `AppContextBase.js` | Tạo đối tượng React Context để các component truy cập hồ sơ và tùy chọn giao diện dùng chung. |
| `AppContext.jsx` | Cung cấp AppProvider: tải hồ sơ, quản lý trạng thái khởi động/lỗi, áp dụng theme/màu/mật độ và lưu tùy chọn với khả năng khôi phục khi API lỗi. |

#### Kết nối API — services

Đường dẫn gốc của bảng: `Note/frontend/src/services/`.

| File | Tác dụng |
| --- | --- |
| `api.js` | Tạo Axios instance dùng chung với địa chỉ API, header JSON và thời gian chờ; các service khác dùng instance này. |
| `noteService.js` | Gọi API bộ sưu tập, ghi chú thường/riêng tư, thùng rác và lịch nhắc; phân biệt bộ sưu tập nguồn trong URL với đích trong dữ liệu cập nhật; gửi token riêng tư và phát sự kiện cập nhật lịch nhắc. |
| `privateService.js` | Gọi API kiểm tra trạng thái, thiết lập, xác thực và đổi mật khẩu vùng riêng tư. |
| `userService.js` | Gọi API lấy/cập nhật hồ sơ và lưu nhanh tùy chọn giao diện. |

#### Tiện ích frontend — utils

Đường dẫn gốc của bảng: `Note/frontend/src/utils/`.

| File | Tác dụng |
| --- | --- |
| `crypto.js` | Mã hóa/giải mã nội dung riêng tư bằng Web Crypto AES-GCM, suy ra khóa từ mật khẩu, hỗ trợ dữ liệu cũ và ước lượng kích thước sau mã hóa. |
| `formatters.js` | Tiện ích định dạng ngày, tạo slug, rút gọn văn bản và viết hoa ký tự đầu. |
| `noteAppearance.js` | Xác định nền giấy mặc định/tùy chỉnh và tạo style màu/ảnh nền dùng chung cho ghi chú. |
| `noteExport.js` | Đọc nội dung HTML để xuất TXT/DOCX, xử lý tên file tiếng Việt, định dạng, ảnh, checklist và liệt kê tên tệp đính kèm. |
| `noteFiles.js` | Tạo khối đính kèm trong trình soạn thảo, bổ sung nút × và gỡ các khối/liên kết tương ứng khi xóa tệp. |
| `noteImages.js` | Kiểm tra loại/dung lượng ảnh, đọc Data URL, nén ảnh, lấy ảnh từ clipboard, tạo ID tệp và tính giới hạn dữ liệu cho ghi chú thường/riêng tư. |
| `noteReminders.js` | Chuyển đổi lịch nhắc giữa thời gian nhập cục bộ và thời điểm UTC; định dạng lịch nhắc, kiểm tra đến hạn và việc trong hôm nay. |
| `noteRichText.js` | Đọc định dạng tại vùng chọn, xác định các đoạn đang chọn và áp dụng style chữ; bảo vệ khối tệp đính kèm khỏi thao tác định dạng. |
| `vietnameseLunar.js` | Tính ngày âm lịch Việt Nam từ ngày dương lịch theo múi giờ UTC+7 để hiển thị trong trang lịch. |
| `wordPackage.js` | Tạo gói Office Open XML/ZIP cho file DOCX, gồm văn bản, định dạng, danh sách, ảnh và các quan hệ tài nguyên. |

#### Kiểm thử frontend — test

Đường dẫn gốc của bảng: `Note/frontend/test/`.

| File | Tác dụng |
| --- | --- |
| `noteExport.test.js` | Kiểm tra tên file tiếng Việt, TXT UTF-8, cấu trúc DOCX, định dạng, danh sách, ảnh và tải file. |
| `noteFiles.test.js` | Kiểm tra xóa tệp đính kèm cùng các bản sao/liên kết của nó mà giữ các tệp khác và xử lý dữ liệu đính kèm cũ. |
| `noteImages.test.js` | Kiểm tra MIME, dung lượng, Base64, ngân sách ảnh thường/riêng tư, clipboard, nén ảnh, giữ GIF và xử lý ảnh hỏng. |
| `noteReminders.test.js` | Kiểm tra chuyển múi giờ/ngày, giữ lịch nhắc khi sửa nội dung, xóa lịch và nhận diện nhắc việc đến hạn hoặc bị bỏ lỡ. |
| `privateCrypto.test.js` | Kiểm tra mã hóa/giải mã Unicode, mật khẩu sai, ước lượng dung lượng, lỗi Web Crypto và khả năng đọc ghi chú riêng tư cũ. |

#### Cấu hình và điểm khởi chạy backend

Đường dẫn gốc của bảng: `Note/server/`.

| File | Tác dụng |
| --- | --- |
| `.env.example` | Mẫu cấu hình PORT, NODE_ENV, JWT_SECRET và các biến tùy chọn để đổi thư mục dữ liệu/chọn sổ tay cũ cần chuyển. |
| `package.json` | Khai báo Express, fs-extra, bcryptjs, jsonwebtoken, sanitize-html và các lệnh start, dev, test. |
| `package-lock.json` | Khóa phiên bản phụ thuộc backend để các máy có thể cài lại nhất quán bằng npm ci. |
| `server.js` | Khởi tạo Express, nạp biến môi trường, bật CORS/JSON, ghép router, API health, xử lý lỗi/404 và chuẩn bị sổ tay trước khi chạy server. |
| `config/jwt.js` | Lấy JWT_SECRET, kiểm tra độ dài khóa trong production; khi development chưa cấu hình khóa thì tạo và lưu khóa ổn định cho các lần chạy sau. |

#### Định tuyến API — routes

Đường dẫn gốc của bảng: `Note/server/routes/`.

| File | Tác dụng |
| --- | --- |
| `authRoutes.js` | Khai báo API trạng thái, thiết lập, xác thực và đổi mật khẩu riêng tư; chuẩn bị sổ tay và tuần tự hóa các yêu cầu mật khẩu. |
| `noteRoutes.js` | Khai báo API bộ sưu tập, ghi chú, thùng rác và lịch nhắc; giữ đường dẫn riêng tư cũ và đường dẫn ghi chú theo chủ đề. |
| `privateRoutes.js` | Khai báo /api/private/auth và CRUD/thùng rác ghi chú riêng tư; yêu cầu phiên mở khóa cho thao tác trên dữ liệu riêng tư. |
| `userRoutes.js` | Khai báo API đọc/cập nhật hồ sơ và cập nhật tùy chọn giao diện của sổ tay cá nhân. |

#### Xử lý nghiệp vụ — controllers

Đường dẫn gốc của bảng: `Note/server/controllers/`.

| File | Tác dụng |
| --- | --- |
| `authController.js` | Xử lý mật khẩu riêng tư: kiểm tra trạng thái, băm bcrypt, thiết lập/mở khóa/đổi mật khẩu và cập nhật dữ liệu đã mã hóa lại. |
| `noteController.js` | Xử lý ghi chú/bộ sưu tập, tên tiếng Việt, kiểm tra dữ liệu và thùng rác; chuyển ghi chú giữa các file JSON, kiểm tra đích và hoàn tác bản sao khi ghi nguồn lỗi để giữ dữ liệu cũ. |
| `reminderController.js` | Tổng hợp lịch nhắc, ẩn tiêu đề thật của ghi chú riêng tư và ghi nhận đã thông báo để hạn chế thông báo trùng. |
| `userController.js` | Đọc/cập nhật hồ sơ, avatar và tùy chọn giao diện; kiểm tra dữ liệu và loại bỏ thông tin mật khẩu khỏi phản hồi. |

#### Lớp xử lý giữa — middleware

Đường dẫn gốc của bảng: `Note/server/middleware/`.

| File | Tác dụng |
| --- | --- |
| `errorHandler.js` | Xử lý lỗi API tập trung: JSON sai, dữ liệu quá lớn, lỗi đọc file/token và trả phản hồi lỗi phù hợp. |
| `notebookMiddleware.js` | Chuẩn bị sổ tay và gắn định danh sổ tay vào request trước khi router/controller xử lý. |
| `privateAuthMiddleware.js` | Kiểm tra mật khẩu riêng tư đã được thiết lập, trạng thái khóa và token mở khóa trước khi cho truy cập dữ liệu riêng tư. |

#### Tiện ích backend — utils

Đường dẫn gốc của bảng: `Note/server/utils/`.

| File | Tác dụng |
| --- | --- |
| `noteBackground.js` | Kiểm tra ảnh nền ghi chú theo định dạng raster/Data URL và giới hạn dung lượng. |
| `noteContent.js` | Lọc HTML bằng sanitize-html: loại mã thực thi, giữ các định dạng, ảnh, checklist và khối đính kèm được cho phép. |
| `noteReminder.js` | Kiểm tra ngày giờ nhắc, chuẩn hóa sang UTC và từ chối lịch mới đặt trong quá khứ. |
| `notebookMutation.js` | Xếp hàng các thao tác thay đổi JSON/lịch nhắc để yêu cầu đồng thời trong cùng tiến trình không ghi đè dữ liệu nhau. |
| `notebookStorage.js` | Xác định thư mục dữ liệu, tạo hồ sơ/notes khi thiếu, đặt mặc định, chuyển sổ tay cũ và gộp ghi chú khỏi các bộ sưu tập mặc định đã bỏ. |
| `privateAccess.js` | Tạo/xác minh JWT mở khóa vùng riêng tư với phạm vi riêng; liên kết phiên với phiên bản mật khẩu để phiên cũ hết hiệu lực sau khi đổi mật khẩu. |
| `privateAttempts.js` | Lưu số lần nhập sai, khóa 10 phút từ lần sai thứ 6, trả thời gian chờ và tuần tự hóa các yêu cầu xác thực mật khẩu. |
| `read_write.js` | Đọc JSON: coi file thiếu/rỗng là dữ liệu mới, báo lỗi JSON hỏng; ghi qua file tạm rồi đổi tên để tránh file ghi dở. |
| `uiPreferences.js` | Kiểm tra giá trị theme, màu chủ đạo, kiểu danh sách, sắp xếp và mật độ; ghép tùy chọn hợp lệ với cấu hình trước đó. |

#### Kiểm thử backend — test

Đường dẫn gốc của bảng: `Note/server/test/`.

| File | Tác dụng |
| --- | --- |
| `notebookApis.test.js` | Kiểm thử API với dữ liệu tạm: lần chạy đầu, ghi chú/bộ sưu tập, tiếng Việt, chọn/chuyển thư mục, lỗi ghi và hoàn tác, hồ sơ, riêng tư, khóa mật khẩu, thùng rác, lịch nhắc và yêu cầu đồng thời. |
| `security.test.js` | Kiểm tra lọc HTML nguy hiểm, giữ định dạng an toàn, giới hạn ảnh/ảnh nền và cấu hình JWT trong development/production. |

**Tình trạng E2E trên main:** `playwright.config.js` và lệnh `test:e2e` vẫn còn, nhưng thư mục `Note/frontend/e2e/` đã được xóa và `package.json` hiện không khai báo `@playwright/test`. Vì vậy, đây chưa phải một bộ E2E chạy được ngay sau `npm install`. Các test có sẵn trong `frontend/test/` và `server/test/` chạy bằng `npm test`; kết quả kiểm thử được trình bày ở mục 14.

### 9.4. Cây dữ liệu backend tạo khi chạy

Với cấu hình mặc định, dữ liệu được lưu trong `Note/server/data/`. Có thể đổi nơi lưu sổ tay bằng `NOTEAPP_DATA_DIR`. Cây sau mô tả các file có thể xuất hiện khi sử dụng các chức năng; không phải tất cả đều được tạo ngay ở lần khởi động đầu tiên.

```text
Note/server/data/
├── notes/
│   ├── _unfiled.json
│   └── <slug-bo-suu-tap>.json
├── profile.json
├── topics.json
├── private.json
├── trash.json
├── private-trash.json
├── private-attempts.json
├── .notebook-migrated
└── .jwt-secret
```

| File / thư mục | Tác dụng và thời điểm tạo |
| --- | --- |
| `notes/` | Nơi lưu ghi chú thường; backend bảo đảm thư mục tồn tại khi chuẩn bị sổ tay. |
| `notes/_unfiled.json` | Mảng ghi chú chưa thuộc bộ sưu tập; được ghi khi lưu/chuyển ghi chú chưa phân loại hoặc chuyển dữ liệu mặc định cũ. |
| `notes/<slug-bo-suu-tap>.json` | Mảng ghi chú của một bộ sưu tập. Ví dụ tên Học tập có thể được lưu trong file hoc-tap.json. Đây là mẫu tên file, không phải một file cố định có sẵn trong repo. |
| `profile.json` | Hồ sơ, avatar, tùy chọn giao diện và bản băm mật khẩu riêng tư; backend tạo hồ sơ mặc định nếu file thiếu hoặc rỗng. |
| `topics.json` | Lưu tên hiển thị bộ sưu tập có dấu, tách khỏi slug/tên file; được ghi khi tạo, đổi tên hoặc khôi phục bộ sưu tập. |
| `private.json` | Mảng ghi chú riêng tư với nội dung mã hóa; được ghi khi tạo/cập nhật hoặc chuyển dữ liệu riêng tư cũ. |
| `trash.json` | Mảng ghi chú thường đã xóa, kèm thông tin phục vụ khôi phục; được ghi khi thao tác thùng rác thường. |
| `private-trash.json` | Mảng ghi chú riêng tư đã xóa; nội dung vẫn được mã hóa và thao tác yêu cầu mở khóa. |
| `private-attempts.json` | Số lần nhập sai và thời điểm hết khóa vùng riêng tư; lưu khi kiểm tra mật khẩu để trạng thái tồn tại sau khi chạy lại backend. |
| `.notebook-migrated` | Dấu mốc đã kiểm tra/chuyển sổ tay từ cấu trúc người dùng cũ; giúp không nhập dữ liệu cũ lặp lại ở các lần chạy sau. |
| `.jwt-secret` | Khóa JWT tự tạo khi development chưa có JWT_SECRET; mặc định nằm trong Note/server/data, hoặc ở đường dẫn JWT_SECRET_FILE nếu được cấu hình. |

Các API danh sách trả về `[]` khi file dữ liệu tương ứng chưa tồn tại hoặc rỗng. Backend tạo thư mục/file cần thiết khi khởi tạo hoặc ghi dữ liệu. File JSON có nội dung sai cú pháp được báo lỗi để người dùng có thể sửa hoặc phục hồi từ bản sao lưu.

### 9.5. Tệp và thư mục phát sinh trên máy chạy

| Đường dẫn | Tác dụng |
| --- | --- |
| `Note/frontend/node_modules/`, `Note/server/node_modules/` | Thư viện được npm cài từ package.json/package-lock.json; Git bỏ qua, cài lại bằng npm install hoặc npm ci. |
| `Note/frontend/dist/` | Bản frontend dùng để triển khai, được tạo bởi npm run build. |
| `Note/frontend/.env`, `Note/server/.env` | Cấu hình riêng của máy chạy, được tạo từ .env.example nếu cần; Git bỏ qua. |
| `Note/frontend/test-results/`, `Note/frontend/playwright-report/` | Kết quả, ảnh/trace và báo cáo có thể sinh ra khi chạy Playwright sau khi bổ sung đủ bộ E2E và phụ thuộc. |
| File `*.tmp` cạnh file JSON | File trung gian do read_write.js tạo khi ghi; được dọn sau khi hoàn tất và Git bỏ qua. |

Để tìm nơi chỉnh sửa một chức năng: bắt đầu ở `pages/` hoặc `components/`, xem API trong `services/`, rồi đối chiếu `routes/`, `controllers/` và `utils/` bên backend. Các file CSS cùng tên điều chỉnh giao diện của trang/component đó.

## 10. Dữ liệu và sao lưu

Ứng dụng mặc định lưu tại **`Note/server/data/`**. Nếu đặt `NOTEAPP_DATA_DIR`, dữ liệu được lưu tại đường dẫn đã cấu hình.

| File / thư mục | Nội dung |
| --- | --- |
| `profile.json` | Hồ sơ, tùy chọn giao diện và hash mật khẩu riêng tư |
| `topics.json` | Tên hiển thị có dấu của các bộ sưu tập |
| `notes/<ma-bo-suu-tap>.json` | Ghi chú của từng bộ sưu tập |
| `notes/_unfiled.json` | Ghi chú chưa phân loại |
| `private.json` | Ghi chú riêng tư đã mã hóa |
| `trash.json` | Thùng rác ghi chú thường |
| `private-trash.json` | Thùng rác ghi chú riêng tư |
| `private-attempts.json` | Số lần thử sai và thời điểm hết khóa riêng tư |

### Xử lý khi dữ liệu chưa có

- Thiếu `profile.json`, file trắng, chỉ có khoảng trắng hoặc `{}`: backend chuẩn bị hồ sơ mặc định.
- Thiếu thư mục `notes`: backend tạo lại thư mục và trả danh sách rỗng `[]`.
- File danh sách JSON trắng: được đọc như danh sách rỗng; lần ghi tiếp theo tạo JSON hợp lệ.
- JSON không rỗng nhưng sai cú pháp: trả lỗi để tránh âm thầm ghi đè dữ liệu có thể cần phục hồi.

### Sao lưu và chuyển dữ liệu cũ

Sao lưu **toàn bộ thư mục dữ liệu**, gồm `topics.json`, hồ sơ và các file riêng tư. Dừng backend trước khi sao chép để có bản sao nhất quán.

Nếu chỉ có một sổ tay trong cấu trúc cũ `data/users/`, ứng dụng sao chép dữ liệu sang cấu trúc mới trong lần chuẩn bị đầu tiên và giữ nguồn cũ. Nếu có nhiều sổ tay, cấu hình `NOTEAPP_LEGACY_USER_ID` trước lần chuyển đầu tiên. Sau khi đã chuyển, xóa hồ sơ hiện tại không làm hồ sơ cũ tự xuất hiện trở lại.

Hai bộ sưu tập cũ có mã `hoc` và `y-tuong`, nếu chưa có tên hiển thị được lưu, sẽ hiện **Học** và **Ý tưởng**. Các tên cũ khác chỉ còn mã không dấu cần được người dùng đổi tên có dấu một lần. Tên đã lưu luôn được ưu tiên.

## 11. Quy tắc nhập liệu và bảo mật riêng tư

| Nội dung | Quy tắc |
| --- | --- |
| Tiêu đề ghi chú | Từ 1 đến 160 ký tự; từ chối tiêu đề rỗng hoặc chỉ có khoảng trắng |
| Tên bộ sưu tập | Từ 1 đến 80 ký tự sau chuẩn hóa Unicode và bỏ khoảng trắng ở đầu/cuối |
| Mật khẩu riêng tư | Ít nhất 6 ký tự, tối đa 72 byte UTF-8; yêu cầu xác nhận khi tạo/đổi |
| Nhập sai mật khẩu | Quá 5 lần sai, tức lần sai thứ 6, khóa vùng riêng tư 10 phút |
| Trong thời gian khóa | Mật khẩu đúng cũng chưa mở được; F5 hoặc khởi động lại backend không xóa khóa |
| Hết thời gian khóa | Cho thử lại; xác thực thành công xóa số lần sai trước đó |
| Tệp đính kèm lưu trong ghi chú | Tối đa 6 tệp, mỗi tệp không quá 800 KB; định dạng phải được hỗ trợ |
| Nội dung HTML | Lọc mã thực thi và liên kết nguy hiểm; chỉ giữ định dạng an toàn |
| Phiên riêng tư | API yêu cầu header X-Private-Token; phiên cũ bị thu hồi khi đổi mật khẩu |

Lỗi nhập liệu bị kiểm tra ở cả frontend và backend. Vùng ghi chú thường vẫn sử dụng được khi vùng riêng tư đang bị khóa.

## 12. Hướng dẫn hẹn nhắc việc

1. Mở hoặc tạo một ghi chú.
2. Chọn tab **Thêm**, tìm phần **Hẹn nhắc việc**.
3. Chọn ngày và giờ trong tương lai, rồi nhấn **Lưu**.
4. Bấm biểu tượng chuông để xem **Việc cần làm hôm nay**.
5. Nếu muốn nhận popup của trình duyệt/hệ điều hành, chọn **Bật thông báo máy tính** và cấp quyền.
6. Khi đến hạn, dùng **Mở ghi chú** để xem nội dung hoặc **Đã xem** để đóng lời nhắc.
7. Muốn hủy, chọn **Bỏ lịch nhắc** và lưu lại ghi chú.

Giờ nhập được hiểu theo múi giờ trên máy người dùng và lưu dưới dạng UTC. Một lịch không phát lặp chỉ vì F5 hoặc mở nhiều tab. Đổi lịch sẽ tạo lần nhắc mới.

Nhận nhắc đúng giờ yêu cầu **ứng dụng đang mở và backend hoạt động**. Nếu ứng dụng đóng, các lịch quá giờ chưa được nhắc sẽ được bắt kịp khi mở lại. Bảng nhắc trong app vẫn hoạt động khi quyền thông báo máy tính bị từ chối. Lời nhắc riêng tư dùng thông tin chung và yêu cầu mở khóa trước khi xem nội dung.

## 13. API chính

URL gốc mặc định: **`http://localhost:5000/api`**.

| Phương thức | Đường dẫn | Chức năng |
| --- | --- | --- |
| GET | `/health` | Kiểm tra backend |
| GET / PUT | `/users/profile` | Đọc / cập nhật hồ sơ |
| PATCH | `/users/preferences` | Cập nhật tùy chọn giao diện |
| GET / POST | `/notes/topics` | Danh sách / tạo bộ sưu tập |
| PUT / DELETE | `/notes/topics/:topicId` | Đổi tên / xóa bộ sưu tập |
| GET / POST | `/notes` | Đọc tất cả / tạo ghi chú; `topicSlug` chọn bộ sưu tập, bỏ trống để chưa phân loại |
| GET / POST | `/notes/:topic` | Đọc / tạo ghi chú trong bộ sưu tập |
| PUT / DELETE | `/notes/:noteId` | Sửa / xóa theo ID; PUT có thể đổi bộ sưu tập |
| PUT / DELETE | `/notes/:topic/:noteId` | Sửa / xóa trong bộ sưu tập nguồn; PUT nhận `topicSlug` là đích mới |
| GET | `/notes/trash` | Danh sách thùng rác thường |
| POST | `/notes/trash/:noteId/restore` | Khôi phục ghi chú thường |
| DELETE | `/notes/trash/:noteId` | Xóa vĩnh viễn ghi chú thường |
| GET | `/auth/private-status` | Trạng thái mật khẩu và khóa riêng tư |
| POST | `/auth/setup-private-password` | Thiết lập mật khẩu riêng tư |
| POST | `/private/auth` | Xác thực và cấp phiên mở khóa riêng tư |
| PUT | `/auth/change-private-password` | Đổi mật khẩu riêng tư |
| GET / POST | `/private/notes` | Danh sách / tạo ghi chú riêng tư |
| PUT / DELETE | `/private/notes/:noteId` | Sửa / xóa ghi chú riêng tư |
| GET | `/private/trash` | Danh sách thùng rác riêng tư |
| POST | `/private/trash/:noteId/restore` | Khôi phục ghi chú riêng tư |
| DELETE | `/private/trash/:noteId` | Xóa vĩnh viễn ghi chú riêng tư |
| GET | `/notes/reminders` | Danh sách lịch nhắc |
| POST | `/notes/reminders/:noteId/deliver` | Ghi nhận lịch đến hạn đã được nhắc |

Các API quản lý ghi chú và hồ sơ thông thường sử dụng sổ tay cá nhân. API đọc/thay đổi ghi chú và thùng rác riêng tư yêu cầu phiên mở khóa hợp lệ; `/private/auth` nhận mật khẩu để cấp phiên đó.

Để chuyển ghi chú, gửi PUT tới URL có ID của ghi chú (và bộ sưu tập **nguồn**, nếu dùng URL theo thư mục), với dữ liệu ví dụ:

```json
{ "topicSlug": "cong-viec" }
```

Gửi `"topicSlug": ""` để chuyển về Chưa phân loại; không gửi trường này nếu chỉ cập nhật nội dung và giữ nơi lưu. Đích phải là bộ sưu tập còn tồn tại. Có thể gửi đồng thời tiêu đề, nội dung và các thuộc tính khác trong cùng yêu cầu. Backend trả ghi chú đã lưu với `topicSlug` mới; lỗi nhập liệu/đích thiếu/trùng ID lần lượt trả 400/404/409.

## 14. Kiểm thử và tạo bản build

### Kiểm thử backend

Tại thư mục gốc dự án:

```bash
cd Note/server
npm test
```

### Kiểm thử frontend

Tại một terminal khác ở thư mục gốc dự án:

```bash
cd Note/frontend
npm test
npm run lint
npm run build
```

Bản build frontend nằm tại `Note/frontend/dist/`. Có thể chạy `npm run preview` trong thư mục frontend để xem bản build; backend vẫn cần hoạt động. Khi triển khai frontend ở máy chủ khác, cấu hình đúng URL API trước khi build.

### Kết quả đã ghi nhận ngày 10/10/2026

Mốc kiểm thử ban đầu: [206033c](https://github.com/NguyenKhoa206/DoAnGhiChu/commit/206033cdb503254eb809cf82b65d7c9dfe38fd76). Các đợt bổ sung cùng ngày đã kiểm tra chốt dấu khi bấm lưu, phản hồi danh sách đến muộn và chọn/chuyển bộ sưu tập. Đợt thêm chuyển thư mục chạy lại backend/frontend unit, lint, build; bổ sung 11 test API và 20 lượt UI trên desktop/mobile.

| Nội dung | Kết quả đã ghi nhận |
| --- | --- |
| Backend unit/API | 60/60 test đạt |
| Frontend unit | 26/26 test đạt |
| Kiểm tra ô tên bộ sưu tập ở desktop/mobile | 14/14 lượt đạt; sử dụng IME mô phỏng của Chromium |
| Kiểm tra chốt dấu khi bấm lưu và phản hồi tải cũ ở desktop/mobile | 12/12 lượt đạt; 6 kịch bản chạy trên 2 kích thước màn hình, có mô phỏng IME/mạng chậm |
| Kiểm tra chọn/chuyển bộ sưu tập ở desktop/mobile | 20/20 lượt đạt; 10 kịch bản chạy trên 2 kích thước màn hình, gồm lưu lỗi/thử lại, đích đã xóa, lịch ghi chú, dữ liệu riêng tư và lưu nhiều lần không trùng |
| Lint frontend | Đạt |
| Build frontend | Đạt |

Số lượt UI có thể gồm cùng một kịch bản chạy trên desktop và mobile; không cộng thành số test case chức năng độc lập.

### Các nhóm kiểm tra chính

- Người dùng mới, hồ sơ trắng, file/thư mục dữ liệu bị thiếu trong môi trường test.
- Tiêu đề trống, toàn khoảng trắng, tên bộ sưu tập sai hoặc quá dài.
- Tạo, sửa, xóa, khôi phục, ghim và yêu thích ghi chú.
- Tên bộ sưu tập có dấu, đổi tên chỉ thêm dấu và giữ tên sau F5.
- Chọn thư mục khi tạo từ dashboard/bộ sưu tập/lịch; chuyển giữa thư mục và Chưa phân loại, giữ ID/tệp/lịch nhắc, cập nhật danh sách nguồn và không tạo bản trùng.
- Chuyển vào thư mục thiếu, trùng ID, JSON đích hỏng, lỗi ghi nguồn/đích, lưu đồng thời; giữ dữ liệu cũ, báo lỗi và cho thử lại.
- Bật/tắt định dạng, danh sách, xóa định dạng và nhập tiếng Việt.
- Chèn ảnh, giới hạn dung lượng, gỡ ảnh/tệp và giữ dữ liệu sau khi lưu.
- Xuất TXT/DOCX, nội dung Unicode và định dạng tài liệu.
- Sai mật khẩu, khóa riêng tư, đổi mật khẩu và giữ dữ liệu mã hóa.
- Hẹn giờ, đổi/hủy lịch, chống thông báo lặp và nhắc riêng tư.
- Giao diện ở kích thước desktop và mobile mô phỏng.

### Kiểm tra bổ sung trên máy thật

Tiếp tục kiểm tra bằng UniKey/EVKey trên Windows, mở DOCX/TXT bằng Word/Notepad, popup thông báo hệ điều hành, khóa đủ 10 phút theo đồng hồ thật và thiết bị điện thoại thực tế. Kiểm tra tự động bằng IME hoặc quyền thông báo mô phỏng chưa thay thế các bước này.

Khi kiểm tra thiếu dữ liệu hoặc JSON trắng, dùng dữ liệu tạm hoặc `NOTEAPP_DATA_DIR`; không xóa dữ liệu đang sử dụng.

## 15. Các lỗi và vấn đề đã khắc phục

| Nhóm | Nội dung đã xử lý |
| --- | --- |
| Khởi chạy | Tự chuẩn bị dữ liệu khi thiếu hồ sơ/notes; xử lý JSON trắng |
| Nhập liệu | Chặn tiêu đề trống hoặc toàn khoảng trắng; kiểm tra tên bộ sưu tập |
| Tiếng Việt | Bảo vệ quá trình ghép dấu trong editor và ô tên bộ sưu tập; chuẩn hóa Unicode khi lưu |
| Bộ sưu tập | Chờ bộ gõ chốt dấu khi tạo/đổi tên; bỏ phản hồi tải cũ ghi đè tên mới; giữ tên sau F5, đổi tên và khôi phục đúng; bổ sung nhãn Học/Ý tưởng cho dữ liệu cũ chưa lưu tên |
| Phân loại tài liệu | Thêm ô chọn bộ sưu tập khi tạo/sửa; chuyển giữa thư mục và Chưa phân loại; dùng URL nguồn và slug đích riêng, cập nhật danh sách, giữ dữ liệu và hoàn tác khi ghi lỗi |
| Định dạng | Bật/tắt đậm, nghiêng, gạch chân, gạch ngang; xóa kiểu chữ đang chờ khi editor rỗng |
| Hình ảnh | Tối ưu dung lượng, tránh dán trùng, giữ dữ liệu GIF và xử lý ảnh hỏng |
| Tệp đính kèm | Gỡ cả tệp, chip/link và thông tin đi kèm bằng dấu × |
| Ghi chú mới | Không tự tạo bộ sưu tập Ghi chú; giữ trạng thái chưa phân loại khi phục hồi |
| Mở và xóa | Mở từ vùng nội dung; có nút xóa ngoài ghi chú và xác nhận xóa/xóa vĩnh viễn |
| Ngày và nhắc việc | Giữ ngày đã chọn, mở đúng ghi chú từ nhắc, chống nhắc trùng và kiểm tra lịch sai |
| Lưu đồng thời | Xử lý lần lượt các cập nhật; đồng bộ đổi mật khẩu với phát nhắc |
| Phụ thuộc | Khai báo sanitize-html để cài đặt backend đầy đủ từ package-lock.json |

## 16. Xử lý lỗi thường gặp

| Hiện tượng | Cách xử lý |
| --- | --- |
| Không tải được ghi chú hoặc báo lỗi kết nối | Kiểm tra terminal backend và mở `/api/health`; kiểm tra VITE_API_BASE_URL |
| Cannot find module, gồm sanitize-html | Chạy `npm ci` trong `Note/server`; frontend cài riêng trong `Note/frontend` |
| Lỗi phiên bản Node.js / Vite | Kiểm tra `node -v`; dùng Node.js đáp ứng yêu cầu ở mục 6 |
| Cổng 5000 đã được sử dụng | Dừng tiến trình đang dùng cổng hoặc đổi PORT và URL API tương ứng |
| Frontend dùng cổng khác 5173 | Mở địa chỉ Vite in trong terminal |
| Không mở được vùng riêng tư | Kiểm tra mật khẩu, trạng thái khóa và truy cập bằng localhost/HTTPS |
| Tên bộ sưu tập cũ không có dấu | Cập nhật mã nguồn, khởi động lại app; nếu tên không dấu đã được lưu, dùng nút quản lý để đổi tên có dấu |
| Không gõ được tiếng Việt | Kiểm tra bảng mã Unicode, kiểu gõ Telex/VNI và chỉ dùng một bộ gõ; cập nhật mã nguồn rồi tải lại trang |
| Không có popup nhắc việc | Giữ app/backend hoạt động, kiểm tra quyền Notification; xem bảng nhắc trong app |
| Thay đổi biến môi trường chưa có hiệu lực | Khởi động lại tiến trình; frontend cần build lại nếu dùng bản build |
| File JSON có nội dung nhưng sai cú pháp | Sao lưu, kiểm tra và sửa JSON; không ghi đè bằng file rỗng |

## 17. Chuẩn bị bản nộp

1. Giữ mã nguồn frontend/backend, `package.json`, `package-lock.json`, `.env.example` và README.
2. Chuẩn bị báo cáo test case, danh sách lỗi đã sửa và slide thuyết trình theo yêu cầu môn học.
3. Loại `node_modules`, `dist`, file `.env` chứa khóa thật và dữ liệu cá nhân khỏi gói mã nguồn.
4. Nếu cần dữ liệu minh họa, dùng bộ dữ liệu mẫu riêng và ghi rõ cách sử dụng.
5. Giải nén gói nộp ở thư mục mới, chạy `npm ci` cho cả hai phần và kiểm tra luồng người dùng mới.
6. Kiểm tra các đường dẫn cài đặt, quyền mở repository và thông tin thành viên trước khi nộp.

**Nhóm HKT — Trần Nguyễn Gia Huy, Nguyễn Vũ Anh Khoa, Ngô Văn Thân.**
