import { useEffect, useState } from 'react';
import Icon from '../UI/Icon';
import { dataUrlBytes, formatImageBytes } from '../../utils/noteImages';
import './NoteImageTools.css';

const margins = { left: '16px 0 16px 0', center: '16px auto', right: '16px 0 16px auto' };
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export default function NoteImageTools({ image, editorWidth, disabled, onChange, onReplace, onRemove }) {
  const [width, setWidth] = useState(() => clamp(image.style.width.endsWith('%')
    ? Number.parseFloat(image.style.width) : image.getBoundingClientRect().width / Math.max(1, editorWidth) * 100 || 70, 20, 100));
  const [height, setHeight] = useState(() => clamp(Number.parseFloat(image.style.height) || image.getBoundingClientRect().height || 260, 80, 900));
  const [mode, setMode] = useState(() => image.style.aspectRatio ? 'cover' : !image.style.height || image.style.height === 'auto' ? 'original' : image.style.objectFit || 'cover');
  const position = (image.style.objectPosition || '').match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  const [x, setX] = useState(() => clamp(Number(position?.[1] ?? 50), 0, 100));
  const [y, setY] = useState(() => clamp(Number(position?.[2] ?? 50), 0, 100));
  const [alignment, setAlignment] = useState(() => image.style.marginLeft === 'auto'
    ? image.style.marginRight === 'auto' ? 'center' : 'right'
    : image.style.marginLeft === '0px' ? 'left' : 'center');
  const [alt, setAlt] = useState(image.alt || '');
  const [dimensions, setDimensions] = useState(() => [image.naturalWidth, image.naturalHeight]);

  useEffect(() => {
    const loaded = () => setDimensions([image.naturalWidth, image.naturalHeight]);
    image.addEventListener('load', loaded);
    if (image.complete) loaded();
    return () => image.removeEventListener('load', loaded);
  }, [image]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'original') {
      setX(50); setY(50);
      onChange({ styles: { height: 'auto', aspectRatio: '', objectFit: 'contain', objectPosition: '50% 50%' } });
    } else onChange({ styles: { height: `${height}px`, aspectRatio: '', objectFit: nextMode } });
  };

  const cropRatio = (numerator, denominator) => {
    const nextHeight = clamp(Math.round(editorWidth * width / 100 * denominator / numerator), 80, 900);
    setMode('cover'); setHeight(nextHeight); setX(50); setY(50);
    onChange({ styles: { height: 'auto', aspectRatio: `${numerator} / ${denominator}`, objectFit: 'cover', objectPosition: '50% 50%' } });
  };

  return <section className="inspector-section note-image-section">
    <h3>Ảnh đang chọn</h3>
    <figure className="note-image-preview"><img src={image.src} alt="" /><figcaption>{dimensions[0] ? `${dimensions[0]} × ${dimensions[1]} · ` : ''}{formatImageBytes(dataUrlBytes(image.getAttribute('src') || ''))}</figcaption></figure>
    <fieldset className="note-image-tools" disabled={disabled}>
      <label className="drawing-option">Chiều rộng <span>{Math.round(width)}%</span><input aria-label="Chiều rộng ảnh" type="range" min="20" max="100" value={width} onChange={(event) => { const next = Number(event.target.value); setWidth(next); onChange({ styles: { width: `${next}%` } }); }} /></label>
      <div className="note-image-presets" aria-label="Kích thước nhanh">{[25, 50, 75, 100].map((size) => <button type="button" key={size} aria-pressed={width === size} onClick={() => { setWidth(size); onChange({ styles: { width: `${size}%` } }); }}>{size}%</button>)}</div>
      <div className="inspector-subheading">Căn ảnh</div>
      <div className="note-image-alignment">{[['left', 'Căn ảnh trái'], ['center', 'Căn ảnh giữa'], ['right', 'Căn ảnh phải']].map(([value, label]) => <button key={value} type="button" aria-label={label} title={label} aria-pressed={alignment === value} onClick={() => { setAlignment(value); onChange({ styles: { margin: margins[value], position: '', left: '', top: '', maxWidth: '100%' } }); }}><Icon name={`align-${value}`} size={18} /></button>)}</div>
      <label className="drawing-option">Khung ảnh<select aria-label="Cách hiển thị ảnh" value={mode} onChange={(event) => changeMode(event.target.value)}><option value="original">Giữ tỷ lệ gốc</option><option value="cover">Cắt vừa khung</option><option value="contain">Hiện toàn ảnh trong khung</option></select></label>
      {mode !== 'original' && <>
        <label className="drawing-option">Chiều cao khung <span>{Math.round(height)}px</span><input aria-label="Chiều cao khung ảnh" type="range" min="80" max="900" step="10" value={height} onChange={(event) => { const next = Number(event.target.value); setHeight(next); onChange({ styles: { height: `${next}px`, aspectRatio: '' } }); }} /></label>
        {mode === 'cover' && <>
          <div className="note-image-presets"><button type="button" onClick={() => cropRatio(1, 1)}>Vuông</button><button type="button" onClick={() => cropRatio(16, 9)}>16:9</button><button type="button" onClick={() => cropRatio(3, 4)}>3:4</button></div>
          <label className="drawing-option">Vị trí ngang <span>{x}%</span><input aria-label="Vị trí cắt ngang" type="range" min="0" max="100" value={x} onChange={(event) => { const next = Number(event.target.value); setX(next); onChange({ styles: { objectPosition: `${next}% ${y}%` } }); }} /></label>
          <label className="drawing-option">Vị trí dọc <span>{y}%</span><input aria-label="Vị trí cắt dọc" type="range" min="0" max="100" value={y} onChange={(event) => { const next = Number(event.target.value); setY(next); onChange({ styles: { objectPosition: `${x}% ${next}%` } }); }} /></label>
        </>}
        <button type="button" className="note-image-action" onClick={() => changeMode('original')}><Icon name="reset" size={16} />Khôi phục tỷ lệ gốc</button>
      </>}
      <label className="note-image-alt">Mô tả ảnh<input value={alt} maxLength={120} placeholder="Mô tả ngắn cho ảnh" onChange={(event) => { setAlt(event.target.value); onChange({ alt: event.target.value }); }} /></label>
      <p className="inspector-hint">Khung cắt chỉ thay đổi cách hiển thị; bạn có thể khôi phục tỷ lệ gốc.</p>
      <div className="note-image-actions"><button type="button" className="note-image-action" onClick={onReplace}><Icon name="image" size={16} />Thay ảnh</button><button type="button" className="note-image-action danger" onClick={onRemove}><Icon name="trash" size={16} />Xóa ảnh</button></div>
    </fieldset>
  </section>;
}
