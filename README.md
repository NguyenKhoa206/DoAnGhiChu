# HKT — Hệ thống quản lý ghi chú và thông tin riêng tư

Ứng dụng sổ tay cá nhân được xây dựng bằng **React + Vite**, **Node.js + Express** và lưu trữ dữ liệu bằng **JSON**. Người dùng có thể quản lý ghi chú, sắp xếp theo bộ sưu tập, soạn thảo có định dạng, chèn ảnh, đính kèm tài liệu, xuất file và hẹn nhắc việc. Vùng ghi chú riêng tư được bảo vệ bằng mật khẩu và mã hóa nội dung.

Bản nộp trên nhánh **main** mở trực tiếp trang ghi chú. Mật khẩu chỉ được sử dụng cho vùng riêng tư.

## 1. Thông tin đồ án

| Thông tin | Nội dung |
| --- | --- |
| Đề tài | Hệ thống quản lý ghi chú và thông tin riêng tư |
| Môn học / lớp | Lập Trình Front End / CD CNTT 24 WEB C |
| Giảng viên hướng dẫn | Nguyễn Hoàng Việt |
| Nhóm thực hiện | HKT |
| Repository | [NguyenKhoa206/DoAnGhiChu](https://github.com/NguyenKhoa206/DoAnGhiChu) |
| Nhánh bản nộp | main |
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
| Bộ sưu tập | Tạo, đổi tên, xóa; lưu tên có dấu tiếng Việt |
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
- Mục Nhật ký đã được bỏ; dữ liệu ghi chú cũ trong các mục mặc định được chuyển sang chưa phân loại.
- Người dùng có thể bấm vùng nội dung của dòng/thẻ để mở ghi chú. Nút ghim, yêu thích và xóa hoạt động riêng.
- Tên bộ sưu tập được lưu riêng với mã dùng trong đường dẫn và tên file, giúp giữ nguyên dấu và cách viết sau khi tải lại trang.
- Khi đặt hoặc đổi tên, ô nhập giữ nội dung đang ghép dấu và đọc đúng giá trị hiện tại khi lưu.

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
cd Note/server
npm ci
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
cd Note/frontend
npm ci
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

## 9. Cấu trúc thư mục

Các đường dẫn dưới đây được tính từ thư mục gốc **DoAnGhiChu**.

| Đường dẫn | Nội dung / vai trò |
| --- | --- |
| `README.md` | Giới thiệu đồ án, phân công, cài đặt và hướng dẫn sử dụng |
| `Note/frontend/` | Mã nguồn giao diện React |
| `Note/frontend/public/` | Tài nguyên tĩnh của frontend |
| `Note/frontend/src/main.jsx` | Khởi tạo ứng dụng React |
| `Note/frontend/src/App.jsx` | Định nghĩa các trang và điều hướng |
| `Note/frontend/src/components/Layouts/` | Khung giao diện, sidebar và thương hiệu HKT |
| `Note/frontend/src/components/Notes/` | Trình soạn thảo, định dạng, ảnh, bộ sưu tập, xuất file và nhắc việc |
| `Note/frontend/src/components/UI/` | Icon, thông báo, hộp xác nhận và hộp mở khóa riêng tư |
| `Note/frontend/src/components/User/` | Menu hồ sơ cá nhân |
| `Note/frontend/src/pages/` | Dashboard, lịch, vùng riêng tư, cài đặt, thùng rác và trang 404 |
| `Note/frontend/src/context/` | Trạng thái hồ sơ, tùy chọn giao diện và quá trình mở ứng dụng |
| `Note/frontend/src/services/` | Gọi API ghi chú, hồ sơ và mật khẩu riêng tư |
| `Note/frontend/src/utils/` | Mã hóa, ảnh, tệp đính kèm, xuất DOCX/TXT và xử lý lịch |
| `Note/frontend/src/styles/` | Style và biến giao diện dùng chung |
| `Note/frontend/test/` | Các test frontend |
| `Note/frontend/package.json` | Phụ thuộc và các lệnh chạy frontend |
| `Note/frontend/package-lock.json` | Phiên bản phụ thuộc dùng khi cài bằng npm ci |
| `Note/frontend/.env.example` | Cấu hình API mẫu |
| `Note/server/` | Mã nguồn backend Node.js |
| `Note/server/server.js` | Khởi tạo Express, middleware và API |
| `Note/server/config/` | Cấu hình JWT |
| `Note/server/routes/` | Các đường dẫn API |
| `Note/server/controllers/` | Xử lý ghi chú, nhắc việc, hồ sơ và mật khẩu riêng tư |
| `Note/server/middleware/` | Chuẩn bị sổ tay, kiểm tra phiên riêng tư và xử lý lỗi |
| `Note/server/utils/` | Đọc/ghi JSON, chuyển dữ liệu, quản lý khóa và lọc nội dung |
| `Note/server/test/` | Các test backend/API và bảo mật |
| `Note/server/data/` | Dữ liệu trên máy chạy backend; được chuẩn bị khi cần |
| `Note/server/package.json` | Phụ thuộc và các lệnh chạy backend |
| `Note/server/package-lock.json` | Phiên bản phụ thuộc dùng khi cài bằng npm ci |
| `Note/server/.env.example` | Cấu hình backend mẫu |

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
| GET / POST | `/notes` | Đọc tất cả / tạo ghi chú chưa phân loại |
| GET / POST | `/notes/:topic` | Đọc / tạo ghi chú trong bộ sưu tập |
| PUT / DELETE | `/notes/:topic/:noteId` | Sửa / xóa ghi chú trong bộ sưu tập |
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

Mốc mã nguồn đối chiếu: [206033c](https://github.com/NguyenKhoa206/DoAnGhiChu/commit/206033cdb503254eb809cf82b65d7c9dfe38fd76).

| Nội dung | Kết quả đã ghi nhận |
| --- | --- |
| Backend unit/API | 49/49 test đạt |
| Frontend unit | 26/26 test đạt |
| Kiểm tra ô tên bộ sưu tập ở desktop/mobile trong đợt sửa gần nhất | 14/14 lượt đạt; sử dụng IME mô phỏng của Chromium |
| Lint frontend | Đạt |
| Build frontend | Đạt |

Số lượt UI có thể gồm cùng một kịch bản chạy trên desktop và mobile; không cộng thành số test case chức năng độc lập.

### Các nhóm kiểm tra chính

- Người dùng mới, hồ sơ trắng, file/thư mục dữ liệu bị thiếu trong môi trường test.
- Tiêu đề trống, toàn khoảng trắng, tên bộ sưu tập sai hoặc quá dài.
- Tạo, sửa, xóa, khôi phục, ghim và yêu thích ghi chú.
- Tên bộ sưu tập có dấu, đổi tên chỉ thêm dấu và giữ tên sau F5.
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
| Bộ sưu tập | Giữ tên có dấu sau F5; đổi tên và khôi phục đúng; bổ sung nhãn Học/Ý tưởng cho dữ liệu cũ chưa lưu tên |
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
