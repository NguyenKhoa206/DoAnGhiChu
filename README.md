# HKT — Sổ tay ghi chú cá nhân

Ứng dụng ghi chú dùng **React + Vite** ở frontend, **Node.js + Express** ở backend và lưu dữ liệu bằng **JSON**. Khi mở web, bạn vào thẳng trang ghi chú; không cần đăng ký, đăng nhập hoặc token tài khoản. Mỗi backend phục vụ một sổ tay cá nhân. Chỉ vùng ghi chú riêng tư yêu cầu mật khẩu.

## Chức năng

- Tạo, đọc, sửa, xóa ghi chú; phân loại theo chủ đề; tìm kiếm, ghim và yêu thích.
- Soạn thảo có định dạng chữ, danh sách, checklist, hình ảnh, công cụ chỉnh ảnh và tệp đính kèm. Có nút × để gỡ ảnh/tệp.
- Xuất ghi chú sang **TXT UTF-8** hoặc **Word DOCX**. File Word là định dạng Office thực, không phải HTML đổi đuôi thành DOC.
- Lịch ghi chú, thùng rác, khôi phục và xóa vĩnh viễn.
- Vùng riêng tư mã hóa nội dung bằng Web Crypto AES-GCM ở trình duyệt. Mật khẩu được băm bằng bcrypt ở backend; phiên mở khóa sử dụng JWT riêng, giữ trong bộ nhớ.
- Hồ sơ cá nhân: tên hiển thị, email tùy chọn, ảnh đại diện. Cài đặt sáng/tối, màu chủ đạo, kiểu danh sách và khoảng cách hiển thị.
- Hỗ trợ nhập tiếng Việt qua IME: không ghi lại DOM hoặc khôi phục vùng chọn trong lúc bộ gõ đang ghép dấu. Tiêu đề được chuẩn hóa Unicode NFC khi lưu.

## Yêu cầu môi trường

- Node.js **22.12 trở lên** hoặc Node.js 24 LTS, kèm npm.
- Chrome/Edge hiện đại. Web Crypto cần localhost hoặc HTTPS.
- Backend mặc định: `http://localhost:5000`. Frontend: `http://localhost:5173`.
- Không cần MySQL, MongoDB hoặc tài khoản đăng nhập.

## Cài đặt và chạy

```bash
git clone https://github.com/NguyenKhoa206/DoAnGhiChu.git
cd DoAnGhiChu
```

Mở terminal thứ nhất để chạy backend:

```bash
cd Note/server
npm ci
npm start
```

Mở terminal thứ hai từ thư mục gốc dự án để chạy frontend:

```bash
cd Note/frontend
npm ci
npm run dev
```

Truy cập **http://localhost:5173**. App tự mở `/dashboard`. Các đường dẫn cũ `/login` và `/register` chuyển về ghi chú. Không còn trang đăng nhập, đăng ký, đăng xuất hoặc đổi mật khẩu tài khoản.

Khi phát triển backend có thể dùng `npm run dev` để tự khởi động lại khi sửa code.

## Cấu hình

Frontend dùng URL mặc định `http://localhost:5000/api`. Nếu đổi backend, sao chép `Note/frontend/.env.example` thành `.env`, sửa `VITE_API_BASE_URL`, rồi khởi động lại Vite.

Backend có `Note/server/.env.example`:

| Biến | Công dụng |
| --- | --- |
| `PORT` | Cổng backend, mặc định 5000. |
| `NODE_ENV` | `development` hoặc `production`. |
| `JWT_SECRET` | Khóa ký phiên mở khóa riêng tư; production yêu cầu ít nhất 32 byte. |
| `NOTEAPP_DATA_DIR` | Tùy chọn đường dẫn tuyệt đối tới thư mục dữ liệu khác; hữu ích khi test. |
| `NOTEAPP_LEGACY_USER_ID` | Chọn thư mục sổ tay cũ khi có nhiều thư mục trong `data/users/`. |

Ở development, app tự tạo khóa JWT ổn định nếu chưa cấu hình. `.env`, `node_modules`, `dist`, báo cáo tự sinh và dữ liệu mới không được đưa vào Git.

## Cấu trúc dự án

| Thư mục/tệp | Vai trò |
| --- | --- |
| `Note/frontend/src/App.jsx` | Điều hướng trực tiếp đến ghi chú. |
| `Note/frontend/src/context/` | Hồ sơ, cài đặt giao diện và trạng thái mở app. |
| `Note/frontend/src/components/Layouts/` | Layout, sidebar và logo dùng chung. |
| `Note/frontend/src/components/Notes/` | Trình soạn thảo, danh sách, định dạng, ảnh và xuất file. |
| `Note/frontend/src/components/UI/` | Icon, mật khẩu riêng tư, thông báo và input mật khẩu. |
| `Note/frontend/src/components/User/` | Menu hồ sơ cá nhân. |
| `Note/frontend/src/pages/` | Dashboard, riêng tư, lịch, cài đặt, thùng rác và 404. |
| `Note/frontend/src/services/` | Gọi API ghi chú, hồ sơ và mật khẩu riêng tư. |
| `Note/frontend/src/utils/` | Mã hóa, ảnh, định dạng, xuất DOCX/TXT và lịch âm. |
| `Note/frontend/test/` | Unit test frontend. |
| `Note/frontend/e2e/` | Kiểm thử giao diện desktop/mobile bằng Playwright. |
| `Note/frontend/playwright.config.js` | Khởi chạy frontend/backend với dữ liệu test tạm. |
| `Note/server/controllers/` | Xử lý ghi chú, hồ sơ và mật khẩu riêng tư. |
| `Note/server/routes/` | Định tuyến API. |
| `Note/server/middleware/` | Chuẩn bị sổ tay, kiểm tra phiên riêng tư và xử lý lỗi. |
| `Note/server/utils/` | Lưu JSON, khởi tạo/chuyển dữ liệu, bộ đếm khóa và lọc nội dung. |
| `Note/server/config/jwt.js` | Cấu hình khóa ký JWT. |
| `Note/server/test/` | Kiểm thử API, lưu dữ liệu và bảo mật. |
| `Note/server/data/` | Dữ liệu sổ tay trên máy chạy backend. |
| `docs/KIEM_THU.md` | Checklist và cách kiểm tra các yêu cầu PM. |

## Lưu dữ liệu và khởi chạy với dữ liệu mới

Backend sử dụng `Note/server/data/` mặc định:

| Đường dẫn | Nội dung |
| --- | --- |
| `profile.json` | Hồ sơ, cài đặt và hash mật khẩu riêng tư. |
| `notes/<chu-de>.json` | Danh sách ghi chú của từng chủ đề. |
| `private.json` | Ghi chú riêng tư đã mã hóa. |
| `trash.json` | Thùng rác ghi chú thường. |
| `private-trash.json` | Thùng rác riêng tư. |
| `private-attempts.json` | Số lần nhập sai và thời điểm hết khóa. |
| `.notebook-migrated` | Đánh dấu đã chuẩn bị/chuyển sổ tay cũ. |

Nếu `profile.json` bị xóa, để trắng, chỉ có khoảng trắng hoặc `{}`, backend tạo lại hồ sơ mặc định. Nếu `notes/` chưa có hoặc bị xóa, backend tạo thư mục và API trả `[]`. File danh sách JSON trắng cũng được đọc như danh sách rỗng; lần lưu tiếp theo ghi JSON hợp lệ.

JSON không rỗng nhưng sai cú pháp sẽ báo lỗi để tránh âm thầm ghi đè dữ liệu. Không dùng thao tác xóa dữ liệu thật để chạy test; các bộ test tự tạo thư mục tạm.

Lần mở đầu của phiên bản mới, nếu chỉ có một sổ tay trong `data/users/`, app sao chép profile và ghi chú vào cấu trúc mới. Bản gốc được giữ để đối chiếu/khôi phục. Nếu có nhiều sổ tay cũ, cấu hình `NOTEAPP_LEGACY_USER_ID` trước lần mở đầu. Sau khi đã chuyển dữ liệu, việc xóa profile không kéo hồ sơ cũ trở lại.

## Quy tắc nhập liệu và khóa riêng tư

- Tiêu đề thường/riêng tư cần từ 1 đến 160 ký tự; tiêu đề trắng hoặc chỉ có space bị chặn. Frontend thông báo tại chỗ, backend cũng kiểm tra để chống bỏ qua giao diện.
- Mật khẩu riêng tư cần tối thiểu 6 ký tự, tối đa 72 byte UTF-8; có xác nhận mật khẩu khi tạo/đổi.
- **Quá 5 lần sai nghĩa là lần sai thứ 6:** vùng riêng tư khóa **10 phút**. Năm lần đầu trả HTTP 401 và số lượt còn lại; khi khóa trả HTTP 429, `Retry-After` và thời điểm hết khóa.
- Tải lại trang, đóng/mở hộp thoại hoặc khởi động lại backend không xóa khóa. Mật khẩu đúng cũng không mở được trong thời gian khóa. Các request song song dùng cùng bộ đếm; đổi mật khẩu không tạo đường vòng để thử lại.
- Sau khi hết 10 phút, người dùng được thử lại. Xác thực thành công xóa số lần sai trước đó. Ghi chú thường vẫn dùng được khi vùng riêng tư bị khóa.

## API chính

| Phương thức | Đường dẫn | Công dụng |
| --- | --- | --- |
| GET | `/api/health` | Kiểm tra backend. |
| GET/PUT | `/api/users/profile` | Đọc/cập nhật hồ sơ sổ tay. |
| PATCH | `/api/users/preferences` | Cập nhật giao diện. |
| GET/POST/PUT/DELETE | `/api/notes/topics[/<id>]` | Quản lý chủ đề. |
| GET/POST | `/api/notes/<chu-de>` | Đọc/tạo ghi chú thường. |
| PUT/DELETE | `/api/notes/<chu-de>/<id>` | Sửa/xóa ghi chú thường. |
| GET | `/api/auth/private-status` | Trạng thái mật khẩu và thời gian khóa. |
| POST | `/api/auth/setup-private-password` | Tạo mật khẩu riêng tư. |
| POST | `/api/private/auth` | Kiểm tra mật khẩu, cấp phiên riêng tư. |
| PUT | `/api/auth/change-private-password` | Đổi mật khẩu và mã hóa lại dữ liệu riêng tư. |
| GET/POST/PUT/DELETE | `/api/private/notes[/<id>]` | CRUD riêng tư, yêu cầu `X-Private-Token`. |
| GET/POST/DELETE | `/api/notes/trash/...` | Thùng rác thường. |
| GET/POST/DELETE | `/api/private/trash/...` | Thùng rác riêng tư, yêu cầu phiên mở khóa. |

API đăng nhập, đăng ký và đổi mật khẩu tài khoản đã được gỡ bỏ.

## Kiểm thử và build

Backend:

```bash
cd Note/server
npm test
```

Frontend:

```bash
cd Note/frontend
npm test
npm run lint
npm run build
```

Kiểm thử giao diện desktop/mobile:

```bash
cd Note/frontend
npx playwright install chromium
npm run test:e2e
```

Playwright tự khởi chạy backend và frontend; tắt các server đang dùng cổng 5000/5173 trước khi chạy. Dữ liệu được đặt trong thư mục tạm có tiền tố `noteapp-e2e-`, hoàn toàn tách dữ liệu thật. Các ca IME dùng cơ chế composition của Chromium; cần kiểm tra thêm Telex với UniKey/EVKey trên Windows bằng checklist PM.

Bản build frontend nằm ở `Note/frontend/dist/`. `npm run preview` chỉ xem bản build, backend vẫn phải chạy.

## Xử lý lỗi thường gặp

- Không mở được sổ tay: chạy backend và kiểm tra `/api/health`; xác nhận URL API và cổng.
- Thiếu module: chạy `npm ci` trong đúng `Note/server` hoặc `Note/frontend`.
- Cổng đã được sử dụng: tắt tiến trình cũ hoặc đổi cấu hình đồng thời ở frontend/backend.
- Không mở vùng riêng tư: kiểm tra thông báo số lượt/thời gian khóa, sử dụng đúng mật khẩu và localhost/HTTPS.
- Gõ tiếng Việt: chọn bảng mã Unicode và kiểu gõ Telex/VNI trong bộ gõ hệ điều hành; dùng một bộ gõ tại một thời điểm. App xử lý composition, không tự chuyển chuỗi Telex thành tiếng Việt.

## Đóng gói nộp bài

Giữ source, các `package.json`, `package-lock.json`, `.env.example`, README và tài liệu kiểm thử. Loại `node_modules`, `dist`, `.env`, báo cáo tự sinh và dữ liệu cá nhân khỏi ZIP. Giải nén ở thư mục khác, chạy `npm ci` theo hai terminal ở trên rồi kiểm tra lại luồng người dùng mới.
