import { Link } from 'react-router-dom';
import PublicBrand from './PublicBrand';
import PublicIcon from './PublicIcon';
import './AuthLayout.css';

const copy = {
  login: {
    eyebrow: 'CHÀO MỪNG TRỞ LẠI',
    title: 'Đăng nhập vào HKT',
    description: 'Tiếp tục những ý tưởng còn đang viết dở.',
    asideTitle: <>Không gian dành cho<br />ghi chú.</>,
    asideDescription: 'Lên Ý tưởng, kế hoạch ghi chú lại những câu chuyện mỗi ngày.',
    footer: 'Chưa có tài khoản?',
    link: '/register',
    linkText: 'Tạo tài khoản',
  },
  register: {
    eyebrow: 'KHÔNG GIAN CỦA RIÊNG BẠN',
    title: 'Bắt đầu cùng HKT',
    description: 'Tạo tài khoản và viết trang đầu tiên của bạn.',
    asideTitle: <>Mỗi ý tưởng nhỏ,<br />một khởi đầu mới.</>,
    asideDescription: 'Một trang giấy cho hôm nay. Một bộ sưu tập cho những điều bạn muốn giữ lại lâu hơn.',
    footer: 'Đã có tài khoản?',
    link: '/login',
    linkText: 'Đăng nhập',
  },
};

export default function AuthLayout({ mode, children }) {
  const content = copy[mode];

  return (
    <div className={`public-page auth-page auth-page--${mode}`}>
      <header className="auth-topbar">
        <PublicBrand />
      </header>

      <main className="auth-layout">
        <aside className="auth-story">
          <div className="auth-story-copy">
            <span className="public-eyebrow"><span className="public-eyebrow-dot" /></span>
            <h2>{content.asideTitle}</h2>
            <p>{content.asideDescription}</p>
          </div>
          <div className="auth-note-scene" aria-hidden="true">
            <div className="auth-note-back" />
            <div className="auth-note-front">
              <div className="auth-note-caption"><span><PublicIcon name="notebook" />GÓC NHỎ MỖI NGÀY</span><PublicIcon name="star" /></div>
              <h3>Những điều đáng nhớ</h3>
              <p>Một ý tưởng chợt đến.<br />Một mục tiêu muốn thực hiện.</p>
              <div className="auth-note-line" /><div className="auth-note-line auth-note-line--short" />
              <div className="auth-note-task"><span><PublicIcon name="check" /></span>Viết một chút cho hôm nay</div>
              <span className="auth-note-tag">Dành riêng cho mình</span>
            </div>
            <div className="auth-note-badge"><PublicIcon name="calendar" /><span>Mỗi ngày, một trang mới</span></div>
          </div>
          <div className="auth-story-bottom"><PublicIcon name="lock" /><span>Ghi chú riêng tư có mật khẩu riêng</span></div>
        </aside>

        <section className="auth-form-panel" aria-labelledby="auth-title">
          <div className="auth-form-heading">
            <span className="auth-form-eyebrow">{content.eyebrow}</span>
            <h1 id="auth-title">{content.title}</h1>
            <p>{content.description}</p>
          </div>
          {children}
          <p className="auth-switch">{content.footer} <Link to={content.link} className="public-text-link">{content.linkText}</Link></p>
        </section>
      </main>

      <footer className="auth-page-footer"><span>© {new Date().getFullYear()} </span><span></span></footer>
    </div>
  );
}
