# HKT — Sổ tay ghi chú

Ứng dụng ghi chú cá nhân trên web, gồm giao diện React và API Node.js. HKT giúp bạn sắp xếp ghi chú theo chủ đề, định dạng nội dung, lưu ảnh và tệp đính kèm, xem lịch, quản lý thùng rác và xuất ghi chú ra Word hoặc TXT.

## Tính năng

- **Tài khoản và hồ sơ:** đăng ký, đăng nhập, cập nhật thông tin hồ sơ và đổi mật khẩu.
- **Dashboard:** tìm kiếm, sắp xếp, đánh dấu yêu thích, ghim ghi chú và xem dạng bảng hoặc lưới.
- **Chủ đề và lịch:** tạo chủ đề, xem ghi chú theo ngày, tra lịch âm Việt Nam.
- **Soạn thảo:** định dạng văn bản, danh sách, checklist và nội dung có ảnh.
- **Ảnh và tệp:** chèn ảnh bằng cách chọn, dán hoặc kéo thả; thay đổi kích thước/căn ảnh; gỡ ảnh hoặc tệp đính kèm bằng nút ×.
- **Xuất ghi chú:** lưu bản Word (.docx) hoặc văn bản (.txt).
- **Ghi chú riêng tư:** mở khóa bằng mật khẩu riêng; nội dung và dữ liệu đính kèm được mã hóa trong trình duyệt.
- **Thùng rác và tùy chỉnh:** khôi phục ghi chú, đổi giao diện sáng/tối, màu sắc và cách hiển thị.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Giao diện | React, React Router, Vite |
| Kết nối API | Axios |
| Backend | Node.js, Express |
| Bảo mật | JWT, bcryptjs, Web Crypto API |
| Lưu trữ | Tệp JSON theo tài khoản |
| Kiểm thử | node:test, Oxlint |

## Cấu trúc dự án

| Đường dẫn | Nội dung |
| --- | --- |
| Note/frontend/src/pages | Các trang đăng nhập, đăng ký, dashboard, lịch, ghi chú riêng tư, thùng rác và cài đặt. |
| Note/frontend/src/components | Bố cục, điều hướng, trình soạn thảo, định dạng và quản lý ảnh/tệp. |
| Note/frontend/src/services | Các dịch vụ gọi API. |
| Note/frontend/src/utils | Xử lý ảnh, định dạng, mã hóa, lịch âm và xuất Word/TXT. |
| Note/frontend/test | Kiểm thử giao diện, tệp, ảnh, mã hóa và xuất ghi chú. |
| Note/server/routes | Khai báo các API. |
| Note/server/controllers | Xử lý tài khoản, hồ sơ và ghi chú. |
| Note/server/data | Dữ liệu JSON cục bộ được tạo khi ứng dụng chạy. |
| Note/server/test | Kiểm thử API, bảo mật và lưu trữ. |

## Yêu cầu

- Node.js 22.12 trở lên và npm.
- Git.
- Trình duyệt hiện đại. Ghi chú riêng tư cần Web Crypto API và yêu cầu localhost hoặc HTTPS.

## Cài đặt và chạy trên Windows

Tải repo và mở thư mục gốc:

~~~powershell
git clone --branch main https://github.com/NguyenKhoa206/DoAnGhiChu.git
cd DoAnGhiChu
~~~

### Chạy backend

Mở terminal thứ nhất:

~~~powershell
cd Note/server
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
~~~

Backend chạy tại http://localhost:5000. Kiểm tra trạng thái tại http://localhost:5000/api/health.

### Chạy frontend

Mở terminal thứ hai tại thư mục gốc repo:

~~~powershell
cd Note/frontend
npm ci
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
~~~

Mở địa chỉ Vite hiển thị trong terminal, thường là http://localhost:5173. Đặt VITE_API_BASE_URL trong Note/frontend/.env thành http://localhost:5000/api nếu cần kết nối backend cục bộ.

Nếu sử dụng macOS/Linux, có thể thay lệnh tạo file môi trường bằng:

~~~bash
cp .env.example .env
~~~

Chỉ tạo file .env khi chưa có; không ghi đè cấu hình đã dùng.

## Cấu hình môi trường

Các file .env.example chứa cấu hình mẫu:

| File | Biến | Ý nghĩa |
| --- | --- | --- |
| Note/frontend/.env | VITE_API_BASE_URL | URL API, mặc định http://localhost:5000/api. |
| Note/server/.env | PORT | Cổng API, mặc định 5000. |
| Note/server/.env | NODE_ENV | Môi trường chạy, ví dụ development hoặc production. |
| Note/server/.env | JWT_SECRET | Khóa ký phiên đăng nhập; cần tối thiểu 32 byte khi chạy production. |
| Note/server/.env | SERVER_ENCRYPTION_KEY | Khóa riêng cho tiện ích mã hóa phía server; dùng khóa ngẫu nhiên riêng, tối thiểu 32 byte. |

Dùng các giá trị bí mật khác nhau cho JWT_SECRET và SERVER_ENCRYPTION_KEY. Không đưa file .env hoặc dữ liệu tài khoản thật lên GitHub.

## Các trang chính

| Đường dẫn | Chức năng |
| --- | --- |
| / | Chuyển tới đăng nhập. |
| /login và /register | Đăng nhập, tạo tài khoản. |
| /dashboard | Quản lý ghi chú. |
| /notes/:topicSlug | Ghi chú theo chủ đề. |
| /calendar | Lịch ghi chú. |
| /private-notes | Ghi chú riêng tư. |
| /trash | Thùng rác. |
| /settings | Hồ sơ, giao diện và bảo mật. |

## Giới hạn ảnh và tệp

- Ảnh PNG, JPEG, WebP hoặc GIF: ảnh gốc tối đa 10 MB. Ảnh tĩnh được tự giảm kích thước/dung lượng khi cần.
- PDF và TXT: tối đa 800 KB mỗi tệp.
- Mỗi ghi chú có tối đa 6 ảnh và tệp đính kèm kết hợp; có thể gỡ từng mục bằng nút ×.

## Kiểm thử và build

Backend:

~~~powershell
cd Note/server
npm test
npm start
~~~

Frontend:

~~~powershell
cd Note/frontend
npm test
npm run lint
npm run build
~~~

Bản build frontend được tạo trong Note/frontend/dist. Lệnh npm run preview dùng để xem thử bản build cục bộ.

## Lưu trữ và triển khai

Backend lưu dữ liệu dưới dạng JSON trong Note/server/data/users, riêng theo từng tài khoản. Hãy giữ thư mục này trên ổ lưu trữ bền vững và sao lưu định kỳ.

Khi triển khai, dùng HTTPS, đặt các khóa bí mật qua biến môi trường của máy chủ, giới hạn CORS theo tên miền của ứng dụng và cấu hình frontend trỏ tới API đang chạy.