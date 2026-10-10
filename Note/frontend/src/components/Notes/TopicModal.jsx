import React, { useRef, useState } from 'react';
import noteService from '../../services/noteService';
import './TopicModal.css';
import Icon from '../UI/Icon';

const TopicModal = ({ isOpen, onClose, onSuccess, topicToEdit = null }) => {
  const initialName = topicToEdit?.name || topicToEdit?.title || '';
  const nameInputRef = useRef(null);
  const composingRef = useRef(false);
  const pendingSubmitRef = useRef(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (composingRef.current) {
      pendingSubmitRef.current = true;
      return;
    }
    pendingSubmitRef.current = false;
    // Let the browser/IME own the input while typing. Read the committed DOM
    // value at submit so React state cannot overwrite or lag behind a diacritic.
    const trimmedName = (nameInputRef.current?.value || '').normalize('NFC').trim();

    if (!trimmedName) {
      setError('Tên chủ đề không được để trống.');
      return;
    }
    if (trimmedName.length > 80) {
      setError('Tên chủ đề không được vượt quá 80 ký tự.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');

    try {
      let savedTopic;
      if (topicToEdit) {
        // Cập nhật chủ đề cũ
        savedTopic = await noteService.updateTopic(topicToEdit.id || topicToEdit.slug, trimmedName);
      } else {
        // Tạo chủ đề mới
        savedTopic = await noteService.createTopic(trimmedName);
      }
      await onSuccess?.({
        action: topicToEdit ? 'rename' : 'create',
        topicId: topicToEdit?.id || topicToEdit?.slug,
        nextTopicId: savedTopic?.topic?.slug || savedTopic?.topic?.id,
        topic: savedTopic?.topic,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu chủ đề.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const finishComposition = (event) => {
    composingRef.current = false;
    const input = event.currentTarget;
    // A click can blur the input before the IME commits its final diacritic.
    // Wait for compositionend and the last input event before reading the name.
    window.setTimeout(() => {
      if (!pendingSubmitRef.current || composingRef.current || !input.isConnected) return;
      pendingSubmitRef.current = false;
      input.form?.requestSubmit();
    }, 0);
  };

  const handleDelete = async () => {
    if (composingRef.current || submittingRef.current) return;
    const topicId = topicToEdit?.id || topicToEdit?.slug;
    const name = (nameInputRef.current?.value || initialName).normalize('NFC').trim();
    if (!topicId || !window.confirm(`Xóa chủ đề “${name}” và toàn bộ ghi chú bên trong?`)) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setError('');
    try {
      await noteService.deleteTopic(topicId);
      await onSuccess?.({ action: 'delete', topicId });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa chủ đề.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="topic-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{topicToEdit ? 'Đổi tên bộ sưu tập' : 'Tạo bộ sưu tập mới'}</h3>
          <button className="close-btn" onClick={onClose}>
            <Icon name="close" size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="topic-name">Tên chủ đề</label>
              <input
                ref={nameInputRef}
                id="topic-name"
                type="text"
                placeholder="Ví dụ: Học tập, Công việc, Ý tưởng..."
                defaultValue={initialName}
                onInput={() => { if (error) setError(''); }}
                onCompositionStart={() => { composingRef.current = true; }}
                onCompositionEnd={finishComposition}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (composingRef.current || event.nativeEvent.isComposing || event.keyCode === 229)) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
                autoFocus
              />
            </div>
          </div>

          <div className="modal-footer">
            {topicToEdit && <button type="button" className="btn-danger" onClick={handleDelete} disabled={isSubmitting}>Xóa chủ đề</button>}
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : topicToEdit ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TopicModal;
