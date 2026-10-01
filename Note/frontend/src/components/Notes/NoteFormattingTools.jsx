import Icon from '../UI/Icon';
import { TEXT_SIZES } from '../../utils/noteRichText';
import './NoteFormattingTools.css';

export default function NoteFormattingTools({ format, disabled, onRemember, onCommand, onInlineStyle, onBlockStyle, onChecklist, onClear }) {
  const keepSelection = (event) => { onRemember(); event.preventDefault(); };
  return <section className="inspector-section note-format-section">
    <h3>Chữ và đoạn</h3>
    <fieldset className="note-format-tools" disabled={disabled}>
      <div className="inspector-control-row">
        <select aria-label="Kiểu đoạn" value={format.block} onMouseDown={onRemember} onChange={(event) => onCommand('formatBlock', event.target.value)}><option value="P">Đoạn văn</option><option value="H1">Tiêu đề 1</option><option value="H2">Tiêu đề 2</option><option value="H3">Tiêu đề 3</option><option value="BLOCKQUOTE">Trích dẫn</option></select>
        <select aria-label="Cỡ chữ (pt)" value={format.fontSize} onMouseDown={onRemember} onChange={(event) => onInlineStyle('fontSize', `${event.target.value}pt`)}>{[...new Set([...TEXT_SIZES, Number(format.fontSize)])].sort((a, b) => a - b).map((size) => <option key={size} value={size}>{size} pt</option>)}</select>
      </div>
      <div className="inspector-button-grid" role="group" aria-label="Kiểu chữ">{[['bold', 'bold', 'In đậm (Ctrl/⌘+B)'], ['italic', 'italic', 'In nghiêng (Ctrl/⌘+I)'], ['underline', 'underline', 'Gạch chân (Ctrl/⌘+U)'], ['strikeThrough', 'strike', 'Gạch ngang']].map(([command, icon, label]) => <button key={command} type="button" aria-label={label} title={label} aria-pressed={format[command]} onMouseDown={keepSelection} onClick={() => onCommand(command)}><Icon name={icon} size={18} /></button>)}</div>
      <div className="note-format-color-row"><label>Màu chữ<input type="color" aria-label="Màu chữ" value={format.color} onMouseDown={onRemember} onChange={(event) => onInlineStyle('color', event.target.value)} /></label><label>Giãn dòng<select aria-label="Giãn dòng" value={format.lineHeight} onMouseDown={onRemember} onChange={(event) => onBlockStyle('lineHeight', event.target.value)}>{[1.4, 1.6, 1.85, 2].map((value) => <option value={value} key={value}>{value}</option>)}</select></label></div>
      <div className="inspector-subheading">Căn lề</div>
      <div className="inspector-button-grid" role="group" aria-label="Căn lề đoạn">{[['left', 'Căn trái'], ['center', 'Căn giữa'], ['right', 'Căn phải'], ['justify', 'Căn đều hai bên']].map(([value, label]) => <button key={value} type="button" aria-label={label} title={label} aria-pressed={format.align === value} onMouseDown={keepSelection} onClick={() => onBlockStyle('textAlign', value)}><Icon name={`align-${value}`} size={18} /></button>)}</div>
      <div className="inspector-subheading">Danh sách và thụt lề</div>
      <div className="inspector-button-grid" role="group" aria-label="Danh sách và thụt lề"><button type="button" aria-label="Danh sách dấu đầu dòng" title="Dấu đầu dòng" aria-pressed={format.list === 'bullet'} onMouseDown={keepSelection} onClick={() => onCommand('insertUnorderedList')}><Icon name="list-bullet" size={18} /></button><button type="button" aria-label="Danh sách đánh số" title="Đánh số" aria-pressed={format.list === 'ordered'} onMouseDown={keepSelection} onClick={() => onCommand('insertOrderedList')}><Icon name="list-ordered" size={18} /></button><button type="button" aria-label="Giảm thụt lề" title="Giảm thụt lề" onMouseDown={keepSelection} onClick={() => onCommand('outdent')}><Icon name="outdent" size={18} /></button><button type="button" aria-label="Tăng thụt lề" title="Tăng thụt lề" onMouseDown={keepSelection} onClick={() => onCommand('indent')}><Icon name="indent" size={18} /></button></div>
      <button className="inspector-add-row" type="button" onMouseDown={keepSelection} onClick={onChecklist}><Icon name="check-square" className="inspector-add-icon" /><span>Danh sách công việc</span><Icon name="plus" size={16} /></button>
      <button className="note-clear-format" type="button" onMouseDown={keepSelection} onClick={onClear}><Icon name="clear-format" size={17} />Xóa định dạng</button>
      <p className="inspector-hint">Bôi đen để đổi riêng một đoạn chữ. Cỡ và màu chữ áp dụng cho đoạn ở con trỏ khi chưa bôi đen.</p>
    </fieldset>
  </section>;
}
