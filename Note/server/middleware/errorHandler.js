/**
 * Middleware xử lý lỗi tập trung cho Express Server
 * Bắt tất cả các lỗi phát sinh từ Async Controllers / Route Handlers
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Server Error Logged:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  // Mặc định HTTP Status Code là 500 (Internal Server Error) nếu chưa được thiết lập
  const statusCode = err.status || err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  // Xử lý các loại lỗi đặc thù
  let message = err.message || 'Đã xảy ra lỗi hệ thống trên máy chủ.';

  // 1. Lỗi liên quan đến thao tác Đọc/Ghi tệp tin JSON (fs-extra / read_write.js)
  if (err.code === 'ENOENT') {
    message = 'Không tìm thấy tệp tin hoặc thư mục dữ liệu yêu cầu.';
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    message = 'Định dạng dữ liệu JSON gửi lên không hợp lệ.';
  } else if (statusCode === 413) {
    message = 'Dữ liệu gửi lên vượt quá giới hạn cho phép.';
  }

  // 2. Lỗi liên quan đến JWT Token
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token xác thực không hợp lệ hoặc đã bị can thiệp.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  // Trả về Response dạng JSON đồng nhất cho Client
  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = errorHandler;
