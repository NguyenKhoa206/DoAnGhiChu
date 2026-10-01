export const createFileChip = (file, readOnly = false) => {
  const chip = document.createElement('span');
  chip.className = 'note-file-chip';
  chip.contentEditable = 'false';
  const link = document.createElement('a');
  link.className = 'note-file-link';
  link.href = `#note-file-${file.id}`;
  link.textContent = file.name;
  chip.append(link);
  if (!readOnly) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'note-file-remove';
    remove.dataset.fileId = file.id;
    remove.setAttribute('aria-label', `Gỡ ${file.name}`);
    remove.title = `Gỡ ${file.name}`;
    remove.textContent = '×';
    chip.append(remove);
  }
  return chip;
};

// Add the same controls to links in notes saved by earlier versions.
export const decorateNoteFiles = (editor, attachments, readOnly) => {
  for (const link of editor.querySelectorAll('a.note-file-link')) {
    const id = link.getAttribute('href')?.replace('#note-file-', '');
    const file = attachments.find((item) => item.id === id);
    if (!file) continue;
    const parent = link.closest('.note-file-chip');
    if (parent) {
      if (readOnly) parent.querySelectorAll('.note-file-remove').forEach((button) => button.remove());
      else if (!parent.querySelector('.note-file-remove')) parent.append(createFileChip(file).lastChild);
    } else link.replaceWith(createFileChip(file, readOnly));
  }
};

export const removeFileLinks = (editor, attachmentId) => {
  if (!editor || !attachmentId) return;
  for (const link of editor.querySelectorAll('a.note-file-link')) {
    if (link.getAttribute('href') === `#note-file-${attachmentId}`) (link.closest('.note-file-chip') || link).remove();
  }
};
