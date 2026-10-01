import React, { useState } from 'react';
import noteService from '../../services/noteService';
import './TopicModal.css';
import Icon from '../UI/Icon';

const TopicModal = ({ isOpen, onClose, onSuccess, topicToEdit = null }) => {
  const [topicName, setTopicName] = useState(() => topicToEdit?.name || topicToEdit?.title || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = topicName.trim();

    if (!trimmedName) {
      setError('Tên chủ đề không được để trống.');
      return;
    }

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
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi lưu chủ đề.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const topicId = topicToEdit?.id || topicToEdit?.slug;
    if (!topicId || !window.confirm(`Xóa chủ đề “${topicName}” và toàn bộ ghi chú bên trong?`)) return;
    setIsSubmitting(true);
    setError('');
    try {
      await noteService.deleteTopic(topicId);
      await onSuccess?.({ action: 'delete', topicId });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa chủ đề.');
    } finally {
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
                id="topic-name"
                type="text"
                placeholder="Ví dụ: Học tập, Công việc, Ý tưởng..."
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
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
