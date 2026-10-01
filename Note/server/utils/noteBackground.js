const MAX_NOTE_BACKGROUND_BYTES = 800 * 1024;

const isValidNoteBackgroundImage = (value) => {
  if (value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]*={0,2})$/);
  if (!match) return false;
  const byteLength = Math.floor(match[2].length * 3 / 4);
  return byteLength > 0 && byteLength <= MAX_NOTE_BACKGROUND_BYTES;
};

module.exports = { isValidNoteBackgroundImage, MAX_NOTE_BACKGROUND_BYTES };
