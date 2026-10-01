# HKT — Ứng dụng quản lý ghi chú

**HKT** là ứng dụng ghi chú cá nhân trên web, được xây dựng bằng **React + Vite** và **Node.js + Express**. Ứng dụng hỗ trợ quản lý ghi chú theo chủ đề, soạn thảo văn bản có định dạng, chèn ảnh, đính kèm tệp, xem lịch, bảo vệ ghi chú riêng tư và xuất nội dung ra Word hoặc TXT.

**Repository:** [NguyenKhoa206/DoAnGhiChu](https://github.com/NguyenKhoa206/DoAnGhiChu)

## Mục lục

- [Tổng quan](#tổng-quan)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Các trang và đường dẫn](#các-trang-và-đường-dẫn)
- [API backend](#api-backend)
- [Lưu trữ và bảo mật](#lưu-trữ-và-bảo-mật)
- [Kiểm thử và build](#kiểm-thử-và-build)
- [Triển khai](#triển-khai)
- [Lỗi thường gặp](#lỗi-thường-gặp)
- [Đóng góp và cập nhật mã nguồn](#đóng-góp-và-cập-nhật-mã-nguồn)

## Tổng quan

Dự án gồm hai phần chạy độc lập:

| Thành phần | Vai trò | Địa chỉ khi chạy cục bộ |
| --- | --- | --- |
| Frontend | Hiển thị giao diện, điều hướng, soạn thảo, xử lý ảnh, mã hóa và xuất ghi chú. | [http://localhost:5173](http://localhost:5173), hoặc cổng Vite thông báo. |
| Backend | Cung cấp REST API, xác thực tài khoản, kiểm tra dữ liệu và đọc/ghi tệp JSON. | [http://localhost:5000](http://localhost:5000). |

Giao diện gửi yêu cầu đến backend qua Axios. Các API quản lý dữ liệu kiểm tra JWT để xác định tài khoản đang thao tác; backend lưu dữ liệu trong thư mục riêng của tài khoản đó.

Ứng dụng bắt đầu tại trang **đăng nhập**. Các trang công khai phục vụ đăng nhập và đăng ký; đường dẫn `/` chuyển hướng đến `/login`.

## Tính năng

### Tài khoản và hồ sơ

- Đăng ký, đăng nhập và đăng xuất.
- Duy trì phiên đăng nhập trong trình duyệt.
- Cập nhật tên hiển thị, email và ảnh đại diện.
- Đổi mật khẩu tài khoản.
- Cài đặt và đổi mật khẩu riêng cho vùng ghi chú riêng tư.

### Dashboard và chủ đề

- Tạo, xem, chỉnh sửa và chuyển ghi chú vào thùng rác.
- Tạo, đổi tên và xóa chủ đề.
- Xem tất cả ghi chú hoặc lọc theo chủ đề, ngày, yêu thích và trạng thái ghim.
- Tìm kiếm theo tiêu đề và nội dung.
- Sắp xếp theo mới cập nhật, cũ nhất hoặc tên A–Z.
- Hiển thị danh sách dưới dạng bảng hoặc lưới.
- Đánh dấu yêu thích và ghim những ghi chú cần truy cập nhanh.

### Soạn thảo văn bản

- Đoạn văn, tiêu đề cấp 1–3 và trích dẫn.
- In đậm, in nghiêng, gạch chân và gạch ngang.
- Thay đổi cỡ chữ, màu chữ và giãn dòng.
- Căn trái, căn giữa, căn phải và căn đều.
- Danh sách dấu đầu dòng, danh sách đánh số và checklist.
- Tăng/giảm thụt lề và xóa định dạng.
- Tùy chỉnh màu nền hoặc ảnh nền của ghi chú.

### Ảnh và tệp đính kèm

- Chèn ảnh bằng cách chọn tệp, kéo thả hoặc dán từ clipboard.
- Chọn nhiều ảnh trong một lần.
- Tự giảm kích thước và dung lượng ảnh tĩnh khi cần.
- Thay đổi chiều rộng, căn ảnh và chế độ hiển thị trong khung.
- Điều chỉnh vùng hiển thị khi chọn chế độ cắt vừa khung.
- Thay ảnh, khôi phục tỷ lệ gốc và xóa ảnh đang chọn.
- Đính kèm PDF/TXT, mở hoặc tải tệp về.
- Gỡ từng ảnh/tệp bằng nút **×** trong trình soạn thảo.

### Xuất ghi chú

| Định dạng | Nội dung xuất |
| --- | --- |
| Word `.docx` | Tiêu đề, văn bản, các định dạng được hỗ trợ, danh sách, checklist và ảnh chèn trong nội dung. |
| Văn bản `.txt` | Tiêu đề và nội dung văn bản, xuống dòng, danh sách, trạng thái checklist; ảnh được biểu diễn bằng mô tả. |

Tệp đính kèm được **liệt kê theo tên** trong bản xuất. PDF/TXT đính kèm cần được tải riêng nếu muốn giữ nội dung tệp. Chức năng hiện tại tạo **`.docx`**; định dạng Word cũ `.doc` chưa được hỗ trợ.

### Lịch, riêng tư và thùng rác

- Xem lịch tháng, ngày dương lịch và lịch âm Việt Nam.
- Xem ghi chú gắn với từng ngày.
- Mở khóa ghi chú riêng tư bằng mật khẩu riêng.
- Mã hóa tiêu đề, nội dung và metadata của ghi chú riêng tư trong trình duyệt.
- Tách thùng rác ghi chú thường và thùng rác riêng tư.
- Khôi phục ghi chú hoặc xóa vĩnh viễn.

### Cài đặt giao diện

- Giao diện sáng/tối và màu chủ đạo.
- Bố cục ghi chú mặc định: bảng hoặc lưới.
- Cách sắp xếp mặc định.
- Mật độ hiển thị: thoáng hoặc gọn.
- Lưu tùy chọn theo tài khoản để sử dụng lại khi đăng nhập.

## Công nghệ sử dụng

Các phiên bản dưới đây ghi theo nhóm phiên bản khai báo trong `package.json`. `package-lock.json` xác định phiên bản cụ thể được cài bằng `npm ci`.

| Nhóm | Công nghệ | Mục đích |
| --- | --- | --- |
| Giao diện | React 19, React DOM 19 | Xây dựng các trang và component. |
| Điều hướng | React Router DOM 7 | Định tuyến và bảo vệ trang cần đăng nhập. |
| Công cụ frontend | Vite 8, plugin React | Chạy môi trường phát triển và tạo bản build. |
| Gọi API | Axios 1 | Gửi HTTP request và đính kèm token. |
| Backend | Node.js, Express 5 | Cung cấp REST API. |
| Xác thực | jsonwebtoken, bcryptjs | Ký/kiểm tra JWT và băm mật khẩu. |
| Middleware | cors, dotenv | CORS và đọc biến môi trường. |
| Nội dung | sanitize-html | Làm sạch HTML ghi chú thường trước khi lưu. |
| Lưu trữ | fs-extra, tệp JSON | Quản lý thư mục và dữ liệu theo tài khoản. |
| Mã hóa riêng tư | Web Crypto API, PBKDF2, AES-GCM 256 bit | Mã hóa/giải mã phía trình duyệt. |
| Xuất Word | `noteExport.js`, `wordPackage.js` | Tạo tài liệu DOCX trong trình duyệt. |
| Kiểm thử | `node:test` | Kiểm thử API và các tiện ích. |
| Kiểm tra mã | Oxlint | Kiểm tra mã nguồn frontend. |
| Giao diện trực quan | CSS và component SVG `Icon.jsx` | Bố cục, kiểu hiển thị và icon dùng chung. |

## Cấu trúc dự án

### Vị trí thư mục

Trên repository, mã nguồn nằm trong `Note/`:

~~~text
DoAnGhiChu/
├── README.md
└── Note/
    ├── frontend/
    └── server/
~~~

File cây thư mục `cay.txt` được xuất từ vị trí chứa trực tiếp `frontend/` và `server/`, tương ứng với thư mục `Note/` trên GitHub.

**Quy ước trong README:** đường dẫn đầy đủ được tính từ thư mục gốc `DoAnGhiChu/`. Nếu terminal của bạn đã mở tại `Note/`, dùng `cd server` hoặc `cd frontend` khi chạy ứng dụng.

### Cây mã nguồn chi tiết

Cây dưới đây liệt kê các tệp mã nguồn và cấu hình chính theo cấu trúc dự án. `node_modules/`, cache Vite, `dist/`, file `.env` cục bộ và dữ liệu của tài khoản thực không được liệt kê. Dependencies được tạo lại qua `npm ci`.

~~~text
DoAnGhiChu/
├── Note/
│   ├── frontend/
│   │   ├── public/
│   │   │   └── favicon.svg
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Layouts/
│   │   │   │   │   ├── MainLayout.css
│   │   │   │   │   ├── MainLayout.jsx
│   │   │   │   │   ├── Sidebar.css
│   │   │   │   │   └── Sidebar.jsx
│   │   │   │   ├── Notes/
│   │   │   │   │   ├── DocumentDetailView.css
│   │   │   │   │   ├── DocumentDetailView.jsx
│   │   │   │   │   ├── ExportNoteButton.css
│   │   │   │   │   ├── ExportNoteButton.jsx
│   │   │   │   │   ├── NoteCard.css
│   │   │   │   │   ├── NoteCard.jsx
│   │   │   │   │   ├── NoteDetailModal.css
│   │   │   │   │   ├── NoteDetailModal.jsx
│   │   │   │   │   ├── NoteEditor.css
│   │   │   │   │   ├── NoteEditor.jsx
│   │   │   │   │   ├── NoteFormattingTools.css
│   │   │   │   │   ├── NoteFormattingTools.jsx
│   │   │   │   │   ├── NoteImageTools.css
│   │   │   │   │   ├── NoteImageTools.jsx
│   │   │   │   │   ├── NoteList.css
│   │   │   │   │   ├── NoteList.jsx
│   │   │   │   │   ├── TopicModal.css
│   │   │   │   │   └── TopicModal.jsx
│   │   │   │   ├── Public/
│   │   │   │   │   ├── AuthLayout.css
│   │   │   │   │   ├── AuthLayout.jsx
│   │   │   │   │   ├── PasswordInput.jsx
│   │   │   │   │   ├── PublicBrand.jsx
│   │   │   │   │   ├── PublicIcon.jsx
│   │   │   │   │   └── PublicPage.css
│   │   │   │   ├── UI/
│   │   │   │   │   ├── Icon.jsx
│   │   │   │   │   ├── PrivateAuthModal.css
│   │   │   │   │   ├── PrivateAuthModal.jsx
│   │   │   │   │   ├── Toast.css
│   │   │   │   │   └── Toast.jsx
│   │   │   │   └── User/
│   │   │   │       ├── ProfileMenu.css
│   │   │   │       └── ProfileMenu.jsx
│   │   │   ├── context/
│   │   │   │   ├── AppContext.jsx
│   │   │   │   └── AppContextBase.js
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.js
│   │   │   ├── pages/
│   │   │   │   ├── CalendarPage.css
│   │   │   │   ├── CalendarPage.jsx
│   │   │   │   ├── DashboardPage.css
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── LoginPage.css
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── NotFoundPage.css
│   │   │   │   ├── NotFoundPage.jsx
│   │   │   │   ├── PrivateNotePage.css
│   │   │   │   ├── PrivateNotePage.jsx
│   │   │   │   ├── RegisterPage.css
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── SettingsPage.css
│   │   │   │   ├── SettingsPage.jsx
│   │   │   │   ├── TrashPage.css
│   │   │   │   └── TrashPage.jsx
│   │   │   ├── routes/
│   │   │   │   └── PrivateRoute.jsx
│   │   │   ├── services/
│   │   │   │   ├── api.js
│   │   │   │   ├── authService.js
│   │   │   │   ├── noteService.js
│   │   │   │   └── userService.js
│   │   │   ├── styles/
│   │   │   │   └── global.css
│   │   │   ├── utils/
│   │   │   │   ├── crypto.js
│   │   │   │   ├── formatters.js
│   │   │   │   ├── noteAppearance.js
│   │   │   │   ├── noteExport.js
│   │   │   │   ├── noteFiles.js
│   │   │   │   ├── noteImages.js
│   │   │   │   ├── noteRichText.js
│   │   │   │   ├── vietnameseLunar.js
│   │   │   │   └── wordPackage.js
│   │   │   ├── App.jsx
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   ├── test/
│   │   │   ├── noteExport.test.js
│   │   │   ├── noteFiles.test.js
│   │   │   ├── noteImages.test.js
│   │   │   ├── privateCrypto.test.js
│   │   │   └── privateSession.test.js
│   │   ├── .env.example
│   │   ├── .oxlintrc.json
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   └── vite.config.js
│   └── server/
│       ├── config/
│       │   └── jwt.js
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── noteController.js
│       │   └── userController.js
│       ├── data/
│       │   └── users/
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   ├── errorHandler.js
│       │   └── privateAuthMiddleware.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── noteRoutes.js
│       │   ├── privateRoutes.js
│       │   └── userRoutes.js
│       ├── test/
│       │   ├── persistence.test.js
│       │   ├── security.test.js
│       │   └── sprintApis.test.js
│       ├── utils/
│       │   ├── accountStorage.js
│       │   ├── encryption.js
│       │   ├── noteBackground.js
│       │   ├── noteContent.js
│       │   ├── privateAccess.js
│       │   ├── read_write.js
│       │   └── uiPreferences.js
│       ├── .env.example
│       ├── package-lock.json
│       ├── package.json
│       └── server.js
└── README.md
~~~

### Frontend: vai trò các thư mục

| Thư mục | Nội dung |
| --- | --- |
| `public/` | Tài nguyên tĩnh, hiện có favicon. |
| `src/components/Layouts/` | Khung trang sau đăng nhập và thanh điều hướng Sidebar. |
| `src/components/Notes/` | Hiển thị, soạn thảo, định dạng, quản lý ảnh/tệp và xuất ghi chú. |
| `src/components/Public/` | Bố cục đăng nhập/đăng ký, nhận diện ứng dụng và ô nhập mật khẩu. |
| `src/components/UI/` | Icon dùng chung, thông báo Toast và hộp thoại mở khóa riêng tư. |
| `src/components/User/` | Menu tài khoản và hồ sơ. |
| `src/context/` | Trạng thái dùng chung như tài khoản và tùy chọn giao diện. |
| `src/hooks/` | Hook hỗ trợ truy cập trạng thái xác thực. |
| `src/pages/` | Các màn hình của ứng dụng. |
| `src/routes/` | Kiểm tra đăng nhập trước khi hiển thị trang được bảo vệ. |
| `src/services/` | Các hàm gọi API tài khoản, người dùng và ghi chú. |
| `src/styles/` | CSS dùng chung. |
| `src/utils/` | Mã hóa, xử lý nội dung/ảnh/tệp, lịch âm và xuất tài liệu. |
| `test/` | Kiểm thử các tiện ích frontend và hành vi phiên riêng tư. |

### Frontend: các tệp đáng chú ý

Các đường dẫn trong bảng được tính từ `Note/frontend/`.

| Tệp | Vai trò |
| --- | --- |
| `src/main.jsx` | Khởi tạo ứng dụng React. |
| `src/App.jsx` | Khai báo Router, Provider và các trang. |
| `src/pages/DashboardPage.jsx` | Quản lý danh sách, bộ lọc, tìm kiếm và thao tác ghi chú. |
| `src/pages/CalendarPage.jsx` | Lịch và ghi chú theo ngày. |
| `src/pages/PrivateNotePage.jsx` | Mở khóa và quản lý ghi chú riêng tư. |
| `src/pages/TrashPage.jsx` | Thùng rác thường/riêng tư, khôi phục và xóa vĩnh viễn. |
| `src/pages/SettingsPage.jsx` | Hồ sơ, giao diện và mật khẩu. |
| `src/components/Notes/DocumentDetailView.jsx` | Màn hình chi tiết và chỉnh sửa tài liệu. |
| `src/components/Notes/NoteEditor.jsx` | Component soạn ghi chú được sử dụng trong các luồng tạo/sửa. |
| `src/components/Notes/NoteFormattingTools.jsx` | Công cụ định dạng chữ, đoạn và danh sách. |
| `src/components/Notes/NoteImageTools.jsx` | Chỉnh kích thước, căn ảnh và khung ảnh. |
| `src/components/Notes/ExportNoteButton.jsx` | Menu chọn định dạng và tải bản xuất. |
| `src/components/UI/Icon.jsx` | Bộ icon SVG dùng chung. |
| `src/services/api.js` | Axios instance, URL API, timeout và interceptor xác thực. |
| `src/utils/crypto.js` | Mã hóa/giải mã ghi chú riêng tư. |
| `src/utils/noteImages.js` | Kiểm tra ảnh, tối ưu ảnh và tính giới hạn dữ liệu. |
| `src/utils/noteFiles.js` | Hiển thị tệp đính kèm và xử lý nút gỡ ×. |
| `src/utils/noteRichText.js` | Các tiện ích thao tác văn bản có định dạng. |
| `src/utils/noteExport.js` | Chuyển ghi chú sang TXT/DOCX và tạo tên tệp tải xuống. |
| `src/utils/wordPackage.js` | Đóng gói tài liệu Word. |
| `src/utils/vietnameseLunar.js` | Chuyển đổi và tính lịch âm Việt Nam. |
| `vite.config.js` | Cấu hình Vite và plugin React. |
| `.env.example` | Mẫu URL API. |
| `.oxlintrc.json` | Cấu hình kiểm tra mã frontend. |
| `package.json` | Dependencies và scripts frontend. |

Các tệp CSS đặt cạnh component hoặc trang tương ứng giúp quản lý kiểu hiển thị của từng màn hình.

### Backend: vai trò các tệp

Các đường dẫn trong bảng được tính từ `Note/server/`.

| Thư mục/tệp | Vai trò |
| --- | --- |
| `server.js` | Khởi tạo Express, middleware, các nhóm route và health check. |
| `config/jwt.js` | Đọc/kiểm tra khóa JWT; quản lý khóa development khi chưa cấu hình. |
| `controllers/authController.js` | Đăng ký, đăng nhập, mật khẩu tài khoản và mật khẩu riêng tư. |
| `controllers/noteController.js` | Chủ đề, ghi chú thường/riêng tư và thùng rác. |
| `controllers/userController.js` | Hồ sơ, ảnh đại diện và tùy chọn giao diện. |
| `middleware/authMiddleware.js` | Xác thực JWT tài khoản. |
| `middleware/privateAuthMiddleware.js` | Kiểm tra quyền truy cập vùng riêng tư. |
| `middleware/errorHandler.js` | Trả lỗi API qua middleware dùng chung. |
| `routes/authRoutes.js` | Đường dẫn xác thực và mật khẩu. |
| `routes/userRoutes.js` | Đường dẫn hồ sơ và preferences. |
| `routes/noteRoutes.js` | Đường dẫn chủ đề, ghi chú và thùng rác thường; hỗ trợ URL riêng tư cũ. |
| `routes/privateRoutes.js` | Nhóm API riêng tư sử dụng token mở khóa. |
| `utils/accountStorage.js` | Xác định thư mục lưu dữ liệu tài khoản. |
| `utils/read_write.js` | Đọc/ghi dữ liệu JSON. |
| `utils/noteContent.js` | Kiểm tra và làm sạch nội dung HTML, tệp đính kèm. |
| `utils/noteBackground.js` | Kiểm tra dữ liệu ảnh nền. |
| `utils/privateAccess.js` | Tạo và xác minh token mở khóa riêng tư. |
| `utils/uiPreferences.js` | Kiểm tra và hợp nhất tùy chọn giao diện. |
| `utils/encryption.js` | Tiện ích mã hóa phía server dùng khóa cấu hình riêng. |
| `data/` | Dữ liệu được tạo và cập nhật khi ứng dụng hoạt động. |
| `test/` | Kiểm thử API, lưu trữ và các kiểm tra bảo mật. |
| `.env.example` | Mẫu biến môi trường backend. |
| `package.json` | Dependencies và scripts backend. |

## Yêu cầu môi trường

- **Node.js 22.12 trở lên** và npm. Phiên bản Vite trong lockfile yêu cầu `^20.19.0 || >=22.12.0`; README sử dụng mốc Node 22.12 để thống nhất.
- **Git** nếu tải hoặc cập nhật mã nguồn từ repository.
- Trình duyệt hiện đại hỗ trợ JavaScript, Canvas và Web Crypto API.
- **localhost hoặc HTTPS** để chức năng mã hóa riêng tư sử dụng `crypto.subtle`.
- Quyền ghi vào thư mục `Note/server/data/`.

Dự án lưu dữ liệu bằng JSON. Sau khi cài dependencies và cấu hình môi trường, bạn có thể chạy frontend và backend.

Kiểm tra công cụ đã cài:

~~~bash
node -v
npm -v
git --version
~~~

## Cài đặt và chạy

### Bước 1: tải mã nguồn

~~~bash
git clone --branch main https://github.com/NguyenKhoa206/DoAnGhiChu.git
cd DoAnGhiChu
~~~

Nếu tải ZIP từ GitHub, giải nén và mở terminal tại thư mục chứa `README.md` và `Note/`.

### Bước 2: cài đặt và chạy backend

Mở **terminal thứ nhất** tại thư mục gốc repository. Ví dụ dưới đây dùng **PowerShell trên Windows**:

~~~powershell
cd Note/server
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
~~~

Mở file `Note/server/.env`, kiểm tra cổng và thay hai giá trị khóa mẫu bằng khóa ngẫu nhiên của bạn. Sau đó chạy:

~~~powershell
npm run dev
~~~

Backend mặc định sử dụng cổng `5000`. Kiểm tra API tại:

[http://localhost:5000/api/health](http://localhost:5000/api/health)

Phản hồi có các trường `status`, `message` và `timestamp`; `status` là `OK` khi backend đã chạy.

### Bước 3: cài đặt và chạy frontend

Mở **terminal thứ hai** tại thư mục gốc repository:

~~~powershell
cd Note/frontend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
~~~

Kiểm tra `Note/frontend/.env`:

~~~dotenv
VITE_API_BASE_URL=http://localhost:5000/api
~~~

Chạy giao diện:

~~~powershell
npm run dev
~~~

Mở địa chỉ Vite thông báo trong terminal, thường là:

[http://localhost:5173](http://localhost:5173)

Giữ cả hai terminal chạy khi sử dụng ứng dụng. Sau khi thay đổi `.env`, khởi động lại tiến trình tương ứng.

### macOS/Linux

Các lệnh Git, `cd`, npm giống như trên. Thay dòng tạo `.env` của PowerShell bằng lệnh dưới đây khi đang ở thư mục `server/` hoặc `frontend/` tương ứng:

~~~bash
if [ ! -f .env ]; then cp .env.example .env; fi
~~~

### Khi đã mở terminal tại thư mục Note

Với cấu trúc cục bộ giống cây bạn xuất trong `cay.txt`, lệnh chuyển thư mục là:

**Terminal backend**, mở từ `Note/`:

~~~powershell
cd server
~~~

**Terminal frontend khác**, cũng mở từ `Note/`:

~~~powershell
cd frontend
~~~

Cài dependencies và chạy các script trong đúng thư mục của từng phần.

## Cấu hình môi trường

### Frontend

File: `Note/frontend/.env`.

| Biến | Giá trị khi chạy cục bộ | Ý nghĩa |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | URL gốc của backend, bao gồm tiền tố `/api`. |

Biến có tiền tố `VITE_` được đưa vào mã frontend khi build và có thể được người dùng xem. Chỉ đặt cấu hình công khai tại đây.

### Backend

File: `Note/server/.env`. Sao chép từ `.env.example` rồi thay các giá trị phù hợp:

~~~dotenv
PORT=5000
NODE_ENV=development
JWT_SECRET=replace-with-a-random-secret-of-at-least-32-bytes
SERVER_ENCRYPTION_KEY=replace-with-a-separate-random-secret-of-at-least-32-bytes
~~~

| Biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng HTTP của backend; mặc định `5000`. |
| `NODE_ENV` | Môi trường chạy, ví dụ `development` hoặc `production`. |
| `JWT_SECRET` | Khóa ký token. Khi chạy production, code yêu cầu khóa tối thiểu 32 byte. |
| `SERVER_ENCRYPTION_KEY` | Khóa cho tiện ích mã hóa phía server; tiện ích yêu cầu tối thiểu 32 byte khi sử dụng. |

Có thể tạo một khóa ngẫu nhiên bằng lệnh sau:

~~~bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
~~~

Chạy lệnh **hai lần** và dùng hai kết quả khác nhau cho `JWT_SECRET` và `SERVER_ENCRYPTION_KEY`.

Luồng mã hóa ghi chú riêng tư sử dụng mật khẩu riêng của người dùng tại frontend. `SERVER_ENCRYPTION_KEY` được sử dụng trong tiện ích mã hóa phía server.

Trong development, nếu không có `JWT_SECRET`, server có thể tạo và giữ khóa tại `Note/server/data/.jwt-secret`. Giữ khóa ổn định để các phiên đăng nhập không bị mất hiệu lực sau mỗi lần khởi động lại.

## Hướng dẫn sử dụng

### Đăng ký và đăng nhập

1. Mở ứng dụng, chọn **Đăng ký** nếu chưa có tài khoản.
2. Nhập tên đăng nhập, tên hiển thị, mật khẩu và email nếu cần.
3. Đăng nhập bằng tài khoản đã tạo.
4. Sử dụng menu tài khoản để vào cài đặt hoặc đăng xuất.

Quy tắc dữ liệu hiện tại:

| Trường | Quy tắc |
| --- | --- |
| Tên đăng nhập | 3–32 ký tự; gồm chữ cái không dấu, chữ số, `_`, `.` hoặc `-`. |
| Tên hiển thị | Bắt buộc, tối đa 80 ký tự. |
| Mật khẩu | Từ 6 ký tự và tối đa 72 byte UTF-8. |
| Email | Có thể để trống; nếu nhập cần đúng định dạng, tối đa 254 ký tự. |

### Tạo chủ đề và ghi chú

1. Tạo hoặc chọn chủ đề trong thanh điều hướng.
2. Chọn chức năng tạo ghi chú mới.
3. Nhập tiêu đề và nội dung.
4. Sử dụng bảng công cụ để định dạng hoặc chèn ảnh/tệp.
5. Nhấn **Lưu** để ghi dữ liệu lên backend.

Tiêu đề ghi chú tối đa **160 ký tự**. Backend hỗ trợ ghi chú không có tiêu đề và dùng tên mặc định **Không tiêu đề**. Tên chủ đề tối đa **80 ký tự**.

Sau khi sửa nội dung, ảnh, tệp hoặc nền, lưu lại để cập nhật bản ghi. Chức năng xuất file sử dụng nội dung hiện tại trong trình soạn thảo.

### Định dạng nội dung

- Bôi đen phần văn bản cần chỉnh, rồi chọn công cụ in đậm, in nghiêng, màu hoặc cỡ chữ.
- Khi chưa bôi đen, công cụ cỡ/màu chữ áp dụng tại đoạn có con trỏ.
- Dùng nhóm công cụ đoạn để chọn tiêu đề, trích dẫn, căn lề hoặc giãn dòng.
- Chọn danh sách hoặc checklist cho các mục công việc.
- Dùng **Xóa định dạng** để đưa phần nội dung về kiểu cơ bản.

### Chèn và chỉnh ảnh

1. Đặt con trỏ tại vị trí muốn thêm ảnh.
2. Chọn **Chèn ảnh tại vị trí con trỏ**, kéo ảnh vào nội dung hoặc dán ảnh từ clipboard.
3. Chờ ứng dụng đọc và tối ưu ảnh.
4. Nhấn vào ảnh để mở công cụ chỉnh ảnh.
5. Điều chỉnh chiều rộng, căn trái/giữa/phải hoặc chế độ khung ảnh.
6. Dùng **Thay ảnh**, **Xóa ảnh** hoặc nút **×** trên ảnh đang chọn.
7. Nhấn **Lưu** sau khi hoàn tất.

Chế độ ảnh gồm giữ tỷ lệ gốc, cắt vừa khung và hiện toàn ảnh trong khung. Chế độ cắt vừa khung cho phép điều chỉnh vị trí ngang/dọc của vùng hiển thị.

### Đính kèm và gỡ tệp

1. Chọn **Đính kèm PDF / TXT**.
2. Chọn một hoặc nhiều tệp hợp lệ.
3. Tệp xuất hiện trong nội dung và khu vực đính kèm.
4. Nhấn tên tệp để mở/tải xuống; nhấn **×** để gỡ.
5. Lưu ghi chú để cập nhật thay đổi.

### Giới hạn ảnh và tệp

| Loại | Định dạng | Giới hạn hiện tại |
| --- | --- | --- |
| Ảnh chèn | PNG, JPEG, WebP, GIF | Tệp gốc tối đa 10 MB; ảnh tĩnh được giảm dung lượng khi cần. |
| Ảnh sau xử lý | PNG, JPEG, WebP | Mục tiêu tối đa 800 KB/ảnh; có thể thấp hơn khi ghi chú sắp đầy. Cạnh dài được giảm về tối đa 1600 px khi cần tối ưu. |
| GIF | GIF | Giữ chuyển động trong ghi chú; dung lượng cần nằm trong ngân sách ảnh, tối đa 800 KB. |
| Tệp đính kèm | PDF, TXT | Tối đa 800 KB/tệp. |
| Ảnh nền | PNG, JPEG, WebP | Dữ liệu ảnh nền được kiểm tra giới hạn 800 KB. |
| Ảnh đại diện | PNG, JPEG, WebP | Tệp chọn tối đa 2 MB. |
| Số lượng media | Ảnh trong nội dung và tệp đính kèm | Tối đa 6 mục kết hợp trên mỗi ghi chú trong trình soạn thảo. |

Backend giới hạn JSON request ở **10 MB**. Frontend tính trước ngân sách dữ liệu, bao gồm phần tăng dung lượng do Base64 và mã hóa, nên một ghi chú có thể báo đầy trước khi đạt giới hạn số lượng mục.

### Xuất Word hoặc TXT

1. Mở ghi chú cần xuất.
2. Nhấn **Xuất file**.
3. Chọn **Word (.docx)** hoặc **Văn bản (.txt)**.
4. Tệp được tải xuống với tên lấy từ tiêu đề ghi chú.

Tên tệp được xử lý để phù hợp với hệ điều hành. TXT dùng UTF-8 có BOM để hỗ trợ tiếng Việt khi mở bằng công cụ trên Windows.

Bản Word giữ các định dạng được hỗ trợ bởi bộ xuất của dự án. GIF trong bản Word được chuyển thành ảnh tĩnh. Màu/ảnh nền giao diện không được đưa vào tài liệu xuất; tên tệp đính kèm được đưa vào danh sách cuối tài liệu.

### Ghi chú riêng tư

1. Mở **Cài đặt** để tạo mật khẩu riêng tư lần đầu.
2. Vào **Ghi chú riêng tư** và nhập mật khẩu để mở khóa.
3. Tạo, sửa, lưu hoặc xuất ghi chú sau khi mở khóa.
4. Khóa vùng riêng tư khi hoàn tất.
5. Đổi mật khẩu riêng tư tại **Cài đặt**, nhập mật khẩu cũ và mật khẩu mới.

Khi đổi mật khẩu riêng tư, frontend giải mã và mã hóa lại cả ghi chú đang dùng lẫn ghi chú trong thùng rác riêng tư. Nếu dữ liệu đã thay đổi trong lúc thực hiện, server có thể yêu cầu tải lại trang và thử lại.

Ứng dụng hiện chưa có chức năng khôi phục mật khẩu riêng tư đã quên. Hãy giữ mật khẩu để có thể giải mã dữ liệu.

### Lịch và thùng rác

- Mở **Lịch**, chọn một ngày để xem các ghi chú có `noteDate` tương ứng.
- Trang lịch hiện hạn chế tạo/sửa ghi chú với ngày ghi chú trước hôm nay.
- Xóa ghi chú sẽ chuyển dữ liệu vào thùng rác tương ứng.
- Mở **Thùng rác**, chọn **Khôi phục** để đưa ghi chú trở lại.
- Ghi chú riêng tư trong thùng rác cần mở khóa trước khi xem hoặc khôi phục.
- **Xóa vĩnh viễn** loại bỏ ghi chú khỏi thùng rác và không có chức năng hoàn tác.

### Phím tắt

| Phím | Chức năng |
| --- | --- |
| `Ctrl + K` / `⌘ + K` | Tập trung vào tìm kiếm trên dashboard. |
| `Ctrl + S` / `⌘ + S` | Lưu nội dung trong trình soạn thảo hỗ trợ phím tắt. |
| `Ctrl + B` / `⌘ + B` | In đậm trong vùng soạn thảo. |
| `Ctrl + I` / `⌘ + I` | In nghiêng trong vùng soạn thảo. |
| `Ctrl + U` / `⌘ + U` | Gạch chân trong vùng soạn thảo. |
| `Ctrl + V` / `⌘ + V` | Dán nội dung hoặc ảnh từ clipboard vào vùng soạn thảo. |
| `Esc` | Đóng menu chọn định dạng xuất. |

## Các trang và đường dẫn

| Đường dẫn | Màn hình | Quyền truy cập |
| --- | --- | --- |
| `/` | Chuyển hướng đến `/login`. | Công khai. |
| `/login` | Đăng nhập. | Công khai. |
| `/register` | Đăng ký. | Công khai. |
| `/dashboard` | Dashboard và quản lý ghi chú. | Cần đăng nhập. |
| `/notes/:topicSlug` | Ghi chú thuộc một chủ đề. | Cần đăng nhập. |
| `/calendar` | Lịch ghi chú. | Cần đăng nhập. |
| `/private-notes` | Ghi chú riêng tư. | Cần đăng nhập và mở khóa riêng tư để thao tác dữ liệu. |
| `/trash` | Thùng rác thường/riêng tư. | Cần đăng nhập; phần riêng tư cần mở khóa. |
| `/settings` | Hồ sơ, giao diện và mật khẩu. | Cần đăng nhập. |
| `/404` | Trang không tìm thấy. | Công khai. |

Các URL không khớp Router chuyển đến `/404`.

## API backend

**Base URL khi chạy cục bộ:** `http://localhost:5000/api`.

API trả dữ liệu JSON. Ghi chú thường vẫn thuộc tài khoản của người dùng và yêu cầu token đăng nhập.

### Xác thực request

Các endpoint được bảo vệ cần header:

~~~http
Authorization: Bearer <account-token>
Content-Type: application/json
~~~

Các endpoint dữ liệu riêng tư cần thêm:

~~~http
X-Private-Token: <private-token>
~~~

`private-token` được cấp sau khi xác thực mật khẩu riêng tư. Code hiện đặt thời hạn token này là **1 giờ**; khi đổi mật khẩu riêng tư, các token mở khóa cũ mất hiệu lực.

### Tài khoản và mật khẩu

| Method | Endpoint | Chức năng | Xác thực |
| --- | --- | --- | --- |
| GET | `/health` | Kiểm tra backend. | Không yêu cầu. |
| POST | `/auth/register` | Đăng ký tài khoản. | Không yêu cầu. |
| POST | `/auth/login` | Đăng nhập và nhận JWT. | Không yêu cầu. |
| GET | `/auth/private-status` | Kiểm tra đã đặt mật khẩu riêng tư chưa. | JWT tài khoản. |
| POST | `/auth/setup-private-password` | Tạo mật khẩu riêng tư lần đầu. | JWT tài khoản. |
| POST | `/auth/verify-private-password` | Xác thực và nhận token mở khóa. | JWT tài khoản. |
| PUT | `/auth/change-private-password` | Đổi mật khẩu cùng dữ liệu đã mã hóa lại. | JWT tài khoản, kiểm tra mật khẩu hiện tại. |
| PUT | `/auth/change-account-password` | Đổi mật khẩu đăng nhập. | JWT tài khoản, kiểm tra mật khẩu hiện tại. |

### Hồ sơ và giao diện

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/users/profile` | Lấy hồ sơ và preferences. |
| PUT | `/users/profile` | Cập nhật tên, email, ảnh đại diện và preferences. |
| PATCH | `/users/preferences` | Cập nhật tùy chọn giao diện. |

Cả ba endpoint yêu cầu JWT tài khoản.

### Chủ đề và ghi chú thường

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/notes/topics` | Lấy danh sách chủ đề. |
| POST | `/notes/topics` | Tạo chủ đề bằng trường `name`. |
| PUT | `/notes/topics/:topicId` | Đổi tên chủ đề. |
| DELETE | `/notes/topics/:topicId` | Xóa chủ đề và chuyển ghi chú trong đó vào thùng rác thường. |
| GET | `/notes` | Lấy tất cả ghi chú thường. |
| GET | `/notes?topic=:topicSlug` | Lọc theo chủ đề qua query. |
| GET | `/notes/:topic` | Lấy ghi chú theo chủ đề. |
| POST | `/notes/:topic` | Tạo ghi chú trong chủ đề. |
| PUT | `/notes/:topic/:noteId` | Cập nhật ghi chú trong đúng chủ đề. |
| DELETE | `/notes/:topic/:noteId` | Chuyển ghi chú vào thùng rác. |

Các endpoint này yêu cầu JWT tài khoản. API cũng hỗ trợ URL tương thích `POST /notes`, `PUT /notes/:noteId` và `DELETE /notes/:noteId`.

`:topic` là slug chủ đề, ví dụ `hoc-tap`. Các từ `topics`, `private`, `trash` được dùng cho nhóm route chuyên biệt; frontend xử lý những trường hợp này qua URL phù hợp.

### Thùng rác thường

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| GET | `/notes/trash` | Lấy ghi chú trong thùng rác. |
| POST | `/notes/trash/:noteId/restore` | Khôi phục ghi chú. |
| DELETE | `/notes/trash/:noteId` | Xóa vĩnh viễn. |

Các endpoint này yêu cầu JWT tài khoản.

### Ghi chú và thùng rác riêng tư

| Method | Endpoint | Chức năng | Xác thực |
| --- | --- | --- | --- |
| POST | `/private/auth` | Xác thực mật khẩu và nhận token mở khóa. | JWT tài khoản. |
| GET | `/private/notes` | Lấy ghi chú riêng tư đã mã hóa. | JWT + token riêng tư. |
| POST | `/private/notes` | Tạo ghi chú riêng tư. | JWT + token riêng tư. |
| PUT | `/private/notes/:noteId` | Cập nhật ghi chú riêng tư. | JWT + token riêng tư. |
| DELETE | `/private/notes/:noteId` | Chuyển ghi chú vào thùng rác riêng tư. | JWT + token riêng tư. |
| GET | `/private/trash` | Lấy thùng rác riêng tư. | JWT + token riêng tư. |
| POST | `/private/trash/:noteId/restore` | Khôi phục ghi chú riêng tư. | JWT + token riêng tư. |
| DELETE | `/private/trash/:noteId` | Xóa vĩnh viễn ghi chú riêng tư. | JWT + token riêng tư. |

Các URL cũ trong nhóm `/notes/private` và `/notes/private/trash` vẫn được bảo vệ bằng cùng cơ chế token riêng tư.

### Ví dụ request

**Đăng ký** — `POST /api/auth/register`:

~~~json
{
  "username": "sinhvien01",
  "displayName": "Sinh viên",
  "email": "sinhvien@example.com",
  "password": "Thay-bang-mat-khau-cua-ban"
}
~~~

**Đăng nhập** — `POST /api/auth/login`:

~~~json
{
  "username": "sinhvien01",
  "password": "Thay-bang-mat-khau-cua-ban"
}
~~~

Lưu `token` trong response để dùng ở header `Authorization` của request tiếp theo.

**Tạo chủ đề** — `POST /api/notes/topics`, kèm JWT:

~~~json
{
  "name": "Học tập"
}
~~~

**Tạo ghi chú** — `POST /api/notes/hoc-tap`, kèm JWT:

~~~json
{
  "title": "Kế hoạch học tập",
  "content": "<h2>Việc cần làm</h2><p>Ôn cấu trúc dữ liệu và giải thuật.</p>",
  "noteDate": "2026-10-01",
  "backgroundColor": "#fffdf8",
  "backgroundImage": "",
  "attachments": [],
  "isFavorite": false,
  "isPinned": true
}
~~~

**Mở khóa riêng tư** — `POST /api/private/auth`, kèm JWT:

~~~json
{
  "privatePassword": "Mat-khau-rieng-tu-cua-ban"
}
~~~

`/private/auth` chấp nhận `privatePassword` hoặc `password`. Dùng `privateToken` trong response cho header `X-Private-Token`.

Khi gửi ghi chú riêng tư, các trường `title`, `content` và `metadata` cần chứa dữ liệu đã được mã hóa bởi frontend. Tham khảo `src/utils/crypto.js` và luồng lưu ghi chú riêng tư trong frontend.

### Mã phản hồi thường gặp

| Mã | Ý nghĩa trong ứng dụng |
| --- | --- |
| 200 | Request thành công. |
| 201 | Tạo tài khoản, chủ đề hoặc ghi chú thành công. |
| 400 | Dữ liệu không hợp lệ hoặc thông tin xác thực riêng tư không đúng trong một số luồng. |
| 401 | JWT tài khoản không hợp lệ hoặc đăng nhập thất bại. |
| 403 | Vùng riêng tư bị khóa, thiếu token hoặc token mở khóa không còn hợp lệ. |
| 404 | Không tìm thấy route, tài khoản, chủ đề hoặc ghi chú được yêu cầu. |
| 409 | Xung đột tên chủ đề hoặc dữ liệu thay đổi trong lúc đổi mật khẩu riêng tư. |
| 413 | Request vượt giới hạn dung lượng. |
| 500 | Lỗi xử lý phía server. |

Phản hồi lỗi thường có trường `message`. Trường `code` như `PRIVATE_LOCKED` giúp frontend nhận biết khi cần mở khóa lại.

## Lưu trữ và bảo mật

### Cấu trúc dữ liệu khi ứng dụng chạy

Cấu trúc minh họa dưới đây sử dụng placeholder; tệp được tạo tùy theo các chức năng mà tài khoản đã sử dụng:

~~~text
Note/server/data/
├── .jwt-secret                 # Khóa development khi chưa đặt JWT_SECRET
└── users/
    └── <userId>/
        ├── profile.json        # Hồ sơ, mật khẩu đã băm và preferences
        ├── private.json        # Ghi chú riêng tư
        ├── private-trash.json  # Thùng rác riêng tư
        ├── trash.json          # Thùng rác thường
        └── notes/
            ├── ghi-chu.json
            └── <topicSlug>.json
~~~

| Dữ liệu | Cách lưu |
| --- | --- |
| Hồ sơ | Một `profile.json` riêng cho từng tài khoản. |
| Mật khẩu | Băm bằng bcryptjs trước khi ghi vào hồ sơ. |
| Ghi chú thường | Các mảng JSON trong `notes/<topicSlug>.json`; nội dung HTML được làm sạch trước khi lưu. |
| Ghi chú riêng tư | Các trường được mã hóa trong `private.json`. |
| Thùng rác | Tách `trash.json` và `private-trash.json`. |
| Ảnh/tệp | Dữ liệu được biểu diễn bằng Data URL/Base64 trong nội dung hoặc metadata. |

Tệp ảnh/PDF/TXT được lưu trong dữ liệu ghi chú; dự án hiện không có thư mục upload hoặc dịch vụ lưu trữ đối tượng riêng cho chúng.

### Cơ chế xác thực và mã hóa

- JWT tài khoản xác định chủ sở hữu dữ liệu.
- Token mở khóa riêng tư có phạm vi riêng và được kiểm tra theo tài khoản.
- Frontend dùng PBKDF2 với SHA-256 để tạo khóa AES-GCM 256 bit từ mật khẩu riêng tư.
- Token mở khóa và mật khẩu dùng giải mã phục vụ phiên riêng tư; dữ liệu riêng tư được giải mã để hiển thị sau khi mở khóa.
- Khi đổi mật khẩu riêng tư, dữ liệu đang dùng và thùng rác riêng tư được mã hóa lại.
- Nội dung ghi chú thường được lưu trực tiếp trong các tệp JSON sau khi làm sạch HTML.

### Sao lưu và quản lý dữ liệu

Sao lưu toàn bộ `Note/server/data/` vào nơi lưu trữ riêng, gồm hồ sơ, ghi chú, thùng rác và khóa development nếu đang dùng. Dừng backend khi sao lưu/khôi phục để tránh thao tác ghi diễn ra đồng thời.

Khi triển khai, giữ thư mục dữ liệu trên ổ lưu trữ bền vững. Môi trường tự xóa filesystem sau khi khởi động lại sẽ làm mất dữ liệu JSON nếu chưa gắn storage phù hợp.

Các file `.env`, khóa phát sinh và dữ liệu tài khoản thật cần được giữ ngoài repository công khai. Phần [Đóng góp và cập nhật mã nguồn](#đóng-góp-và-cập-nhật-mã-nguồn) có mẫu `.gitignore` dành cho dự án.

## Kiểm thử và build

### Scripts frontend

Chạy tại `Note/frontend/`:

| Lệnh | Chức năng |
| --- | --- |
| `npm run dev` | Chạy Vite ở chế độ phát triển. |
| `npm test` | Chạy kiểm thử bằng `node --test`. |
| `npm run lint` | Kiểm tra mã bằng Oxlint. |
| `npm run build` | Tạo bản frontend production trong `dist/`. |
| `npm run preview` | Xem thử bản đã build cục bộ. |

### Scripts backend

Chạy tại `Note/server/`:

| Lệnh | Chức năng |
| --- | --- |
| `npm run dev` | Chạy `node --watch server.js`, tự khởi động lại khi mã thay đổi. |
| `npm start` | Chạy backend bằng `node server.js`. |
| `npm test` | Chạy kiểm thử bằng `node --test`. |

Frontend và backend có `package.json` riêng. Repository hiện không có script npm chung ở thư mục gốc.

### Các nhóm kiểm thử

| Phần | Tệp kiểm thử | Nội dung chính |
| --- | --- | --- |
| Frontend | `noteExport.test.js` | Xuất TXT/DOCX, tên tệp và nội dung xuất. |
| Frontend | `noteFiles.test.js` | Hiển thị và gỡ tệp đính kèm. |
| Frontend | `noteImages.test.js` | Ảnh, ngân sách dữ liệu và giới hạn media. |
| Frontend | `privateCrypto.test.js` | Mã hóa, giải mã và dữ liệu riêng tư. |
| Frontend | `privateSession.test.js` | Hành vi phiên mở khóa riêng tư. |
| Backend | `persistence.test.js` | Lưu trữ dữ liệu và các thao tác cập nhật. |
| Backend | `security.test.js` | Kiểm tra xác thực, quyền truy cập và dữ liệu đầu vào. |
| Backend | `sprintApis.test.js` | API theo chủ đề, quyền riêng tư, đổi mật khẩu và media. |

Chạy các bước kiểm tra trước khi gửi thay đổi:

~~~powershell
# Terminal backend, tại Note/server
npm test
~~~

~~~powershell
# Terminal frontend, tại Note/frontend
npm test
npm run lint
npm run build
~~~


## Triển khai

### Backend

1. Cài dependencies từ `Note/server/package-lock.json`.
2. Thiết lập biến môi trường trên máy chủ, gồm `NODE_ENV=production` và khóa JWT hợp lệ.
3. Cấp quyền ghi và storage bền vững cho `Note/server/data/`.
4. Chạy backend với `npm start`.
5. Đặt backend sau HTTPS và kiểm tra `/api/health`.

`server.js` hiện sử dụng `cors()` với cấu hình mặc định. Khi triển khai công khai, cần chỉnh cấu hình CORS trong mã để giới hạn origin theo tên miền giao diện.

### Frontend

1. Đặt `VITE_API_BASE_URL` thành URL API đã triển khai, bao gồm `/api`.
2. Chạy `npm ci` và `npm run build` tại `Note/frontend/`.
3. Đưa nội dung `Note/frontend/dist/` lên dịch vụ host tệp tĩnh.
4. Cấu hình fallback về `index.html` cho các đường dẫn SPA như `/dashboard` và `/settings`.
5. Sử dụng HTTPS để vùng riêng tư có thể hoạt động qua Web Crypto API.

`VITE_API_BASE_URL` được đọc khi build; sau khi đổi URL API cần build lại frontend. `npm run preview` phục vụ xem thử bản build cục bộ.

Frontend và backend cần được triển khai cùng với cấu hình URL tương ứng. GitHub Pages có thể phục vụ frontend tĩnh; API Node.js và dữ liệu JSON cần một môi trường backend riêng.

## Lỗi thường gặp

| Vấn đề | Cách kiểm tra và xử lý |
| --- | --- |
| `Cannot find module 'sanitize-html'` | Mở terminal tại `Note/server/` và chạy `npm ci`; dependency đã có trong `package.json` và lockfile. Khởi động lại backend. |
| `ENOENT` liên quan đến `package.json` | Kiểm tra đang ở đúng `Note/server/` hoặc `Note/frontend/`; thư mục gốc không có `package.json` chung. |
| `Missing script` | Kiểm tra script thuộc frontend hay backend trong bảng phía trên. |
| Vite báo Node không được hỗ trợ | Kiểm tra `node -v`, chuyển sang phiên bản đáp ứng `^20.19.0 || >=22.12.0`. |
| Không đăng nhập hoặc tải được ghi chú | Kiểm tra backend, `/api/health`, URL API trong frontend và thông báo ở Network của trình duyệt. |
| API gọi sai địa chỉ sau khi sửa `.env` | Khởi động lại Vite; với bản production cần build lại. |
| `EADDRINUSE` hoặc cổng 5000 đang được dùng | Dừng tiến trình chiếm cổng hoặc thay `PORT`, rồi cập nhật `VITE_API_BASE_URL` cho khớp. |
| Mở vùng riêng tư bị lỗi Web Crypto | Dùng localhost hoặc HTTPS và trình duyệt có `crypto.subtle`. |
| API trả `PRIVATE_LOCKED` | Mở khóa lại bằng mật khẩu riêng tư để nhận token còn hiệu lực. |
| API trả 401 | Kiểm tra thông tin đăng nhập/token; đăng nhập lại nếu phiên không còn hợp lệ. |
| Ảnh/tệp không thêm được hoặc ghi chú báo đầy | Kiểm tra loại tệp, dung lượng, giới hạn 6 mục và tổng kích thước ghi chú; giảm ảnh/tệp rồi lưu lại. |
| Xuất Word gặp ảnh không đọc được | Kiểm tra hoặc thay ảnh bị lỗi trong ghi chú, rồi xuất lại; TXT có thể xuất phần văn bản. |
| Tải lại trực tiếp `/dashboard` trên host bị 404 | Cấu hình SPA fallback về `index.html`. |
| Dữ liệu mất sau khi restart/deploy | Kiểm tra `server/data/` có nằm trên storage bền vững và có được giữ qua các lần triển khai không. |
| Đổi mật khẩu riêng tư gặp 409 | Tải lại trang cài đặt để lấy danh sách ghi chú/thùng rác mới rồi thực hiện lại. |

## Đóng góp và cập nhật mã nguồn

### Làm việc trên nhánh riêng

~~~bash
git pull --ff-only origin main
git switch -c feature/ten-chuc-nang
~~~

Chỉnh sửa mã, chạy kiểm thử của phần bị thay đổi, rồi kiểm tra diff:

~~~bash
git status
git diff
~~~

Thêm đúng các tệp muốn gửi. Ví dụ khi chỉ cập nhật README:

~~~bash
git add README.md
git commit -m "docs: update project README"
git push -u origin feature/ten-chuc-nang
~~~

Sau khi push, tạo Pull Request trên repository và mô tả thay đổi cùng kết quả kiểm tra.

### Gợi ý .gitignore

Có thể tạo `.gitignore` tại thư mục gốc repository với nội dung:

~~~gitignore
node_modules/
dist/
.vite/
.vite-temp/
*.log

.env
.env.*
!.env.example

Note/server/data/
~~~

Mẫu này giữ `.env.example` để hướng dẫn cấu hình. `.gitignore` chỉ bỏ qua tệp chưa được theo dõi; tệp đã được Git theo dõi cần xử lý riêng nếu muốn ngừng đưa lên repository.

**Repository:** [https://github.com/NguyenKhoa206/DoAnGhiChu](https://github.com/NguyenKhoa206/DoAnGhiChu)
