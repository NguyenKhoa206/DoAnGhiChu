require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 1. Import Middleware xử lý lỗi trung tâm (Trỏ đúng vào thư mục /middleware/)
const errorHandler = require('./middleware/errorHandler');

// 2. Import hệ thống Routes (Trỏ đúng vào thư mục /routes/)
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const privateRoutes = require('./routes/privateRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middlewares cơ bản
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Khởi tạo nơi lưu tài khoản ghi chú.
const { prepareNotebook } = require('./utils/notebookStorage');

// Đăng ký các Endpoint Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/private', privateRoutes);

// Health-check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'NoteApp Backend Service đang hoạt động bình thường.',
    timestamp: new Date().toISOString(),
  });
});

// Handling 404 Routes (Endpoint không tồn tại)
app.use((req, res, next) => {
  const error = new Error(`Không tìm thấy tuyến đường API: ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

// Chuẩn bị dữ liệu trước khi nhận request.
const startServer = async () => {
  await prepareNotebook();
  console.log('📂 Sổ tay cá nhân đã sẵn sàng.');

  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`🔧 Môi trường: ${process.env.NODE_ENV || 'development'}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('❌ Không thể khởi động server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
