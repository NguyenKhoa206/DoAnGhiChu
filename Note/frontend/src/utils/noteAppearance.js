// The original cream value represents the default page, so old notes follow the current theme too.
export const isDefaultNoteBackground = (color) => !color
  || ['#fffdf8', '#ffffff', '#fff'].includes(color.toLowerCase());

export const hasCustomNoteBackground = (note = {}) => Boolean(note.backgroundImage)
  || !isDefaultNoteBackground(note.backgroundColor);

export const getNoteBackgroundStyle = (note = {}) => ({
  ...(!isDefaultNoteBackground(note.backgroundColor) ? { backgroundColor: note.backgroundColor } : {}),
  ...(note.backgroundImage ? {
    backgroundImage: `linear-gradient(var(--note-image-overlay), var(--note-image-overlay)), url("${note.backgroundImage}")`,
  } : {}),
});
