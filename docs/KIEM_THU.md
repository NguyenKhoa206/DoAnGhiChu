# Kiểm thử sổ tay — luồng mở trực tiếp

Ngày kiểm tra: 08/10/2026. Chỉ sử dụng dữ liệu tạm. Không xóa dữ liệu thật để test.

## Bộ test tự động

- `Note/server/test/notebookApis.test.js`: dữ liệu mới, file trắng/mất, nhập liệu, CRUD, profile/theme, khóa riêng tư, request song song và chuyển dữ liệu cũ.
- `Note/server/test/security.test.js`: lọc HTML, ảnh/tệp an toàn và cấu hình bảo mật.
- `Note/frontend/test/`: xuất TXT/DOCX, ảnh, gỡ tệp và mã hóa riêng tư.
- `Note/frontend/e2e/notebook.spec.js`: mở trực tiếp, dữ liệu trắng, space-only title, IME composition, khóa/sau reload, hồ sơ và theme trên desktop/mobile Chromium.

### Kết quả đã chạy ngày 08/10/2026

| Bộ kiểm tra | Kết quả | Môi trường / phạm vi |
| --- | --- | --- |
| Backend `npm test` | 25/25 đạt | Node.js 24.19.0; dữ liệu tạm, gồm mất/trắng file, CRUD và khóa riêng tư. |
| Frontend `npm test` | 23/23 đạt | Các helper xuất file, ảnh/tệp và mã hóa. |
| Playwright desktop | 6/6 đạt | Chromium 153 chạy headless. |
| Playwright mobile | 6/6 đạt | Chromium 153, mô phỏng Pixel 7; đã sửa lỗi danh sách bị co chiều cao và thông báo tiêu đề bị ẩn. |
| `npm run lint` | Đạt | Source, unit test, E2E và cấu hình. |
| `npm run build` | Đạt | Vite production build. |
| `git diff --check` | Đạt | Không có lỗi whitespace trong bản thay đổi. |

Tổng 60 ca tự động đạt. Desktop và mobile được chạy riêng; mobile chạy lại sau khi sửa bố cục. Chưa kiểm tra trực tiếp UniKey/EVKey trên Windows, Edge hoặc điện thoại thật. Các ca đó vẫn cần điền minh chứng thủ công bên dưới.

## Checklist PM

Điền Pass/Fail, ngày chạy và minh chứng khi kiểm tra thủ công. Không coi test tự động là minh chứng đã chạy UniKey/EVKey hoặc Edge thật.

| ID | Tình huống / bước thực hiện | Kết quả mong đợi |
| --- | --- | --- |
| TC01 | Mở app không có dữ liệu / token tài khoản | Vào dashboard; không có đăng nhập/đăng ký. |
| TC02 | Mở đường dẫn cũ `/login`, `/register` | Chuyển về dashboard. |
| TC03 | Xóa profile và notes trong thư mục test, mở lại app | Tạo profile/notes; API danh sách trả `[]`, không trắng trang/500. |
| TC04 | Để profile trắng hoặc chỉ có space, F5 | Hồ sơ mặc định, app vẫn dùng được. |
| TC05 | Để profile `{}`; file chủ đề/thùng rác trắng | Profile được bổ sung mặc định; danh sách rỗng. |
| TC06 | Tiêu đề và nội dung đều trống, bấm Lưu | Báo cần tiêu đề; không tạo ghi chú. |
| TC07 | Tiêu đề toàn space, nội dung có chữ | Bị chặn; API trực tiếp cũng trả 400. |
| TC08 | Nhập Unicode: Tiếng Việt, Đắk Lắk, trường đại học | Giữ đủ dấu sau lưu/F5. |
| TC09 | Bật Telex UniKey/EVKey, gõ tiêu đề + nội dung; gõ nhanh rồi sửa giữa câu | Không thiếu/lặp dấu, không nhảy con trỏ. Cần test thủ công Windows. |
| TC10 | Gõ tiếng Việt khi bật in đậm/in nghiêng | Dấu và định dạng giữ nguyên sau lưu. |
| TC11 | Tạo/sửa/xóa/khôi phục ghi chú thường | Dữ liệu lưu đúng chủ đề, thùng rác hoạt động. |
| TC12 | Thêm ảnh và TXT/PDF rồi bấm × gỡ | Gỡ phần hiển thị và dữ liệu đính kèm, lưu/F5 không xuất hiện lại. |
| TC13 | Xuất TXT/DOCX với tiếng Việt | File mở được, không mất dấu; ghi chú gốc không đổi. |
| TC14 | Đổi tên hiển thị / theme; F5 | Hồ sơ, theme giữ nguyên. |
| TC15 | Nhập sai mật khẩu riêng tư 1–5 lần | Báo sai, giảm lượt còn lại, không lộ danh sách. |
| TC16 | Nhập sai lần thứ 6 | Khóa 10 phút, API trả 429 và thời gian còn lại. |
| TC17 | F5 / đóng mở modal / khởi động backend trong lúc khóa | Không mất khóa; mật khẩu đúng vẫn bị chặn. |
| TC18 | Mở ghi chú thường khi riêng tư đang khóa | Ghi chú thường vẫn dùng được. |
| TC19 | Đợi hết khóa, nhập đúng; đổi mật khẩu; thử phiên cũ | Được mở sau hết khóa, bộ đếm reset; phiên cũ bị vô hiệu khi đổi mật khẩu. |
| TC20 | Chrome, Edge; desktop và mobile qua F12 | Bố cục không tràn ngang; menu/nút Lưu/hộp thoại dùng được. Edge thật cần test thủ công. |

## Ghi lỗi và kiểm thử lại

Ghi ID ca test, bước thực hiện, kết quả thực tế, mong đợi, ảnh/video, người sửa và lần kiểm thử lại. Chỉ đánh Pass khi đã xác minh kết quả. Thống kê test tự động và test thủ công riêng; không cộng các ca chưa chạy vào số Pass.

Các ca tự động hết khóa dùng timestamp đã hết hạn trong fixture, không chờ đủ 10 phút thực. Test xác nhận thời lượng khóa được cấu hình 600.000 ms và API trả gần 600 giây khi vừa khóa.
