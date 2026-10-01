const fields = {
  theme: (value) => ['light', 'dark'].includes(value),
  primaryColor: (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value),
  noteLayout: (value) => ['table', 'grid'].includes(value),
  noteSort: (value) => ['newest', 'oldest', 'title'].includes(value),
  density: (value) => ['comfortable', 'compact'].includes(value),
};

const validPreferences = (preferences) => Boolean(preferences && typeof preferences === 'object' && !Array.isArray(preferences)
  && Object.entries(fields).every(([key, validate]) => preferences[key] === undefined || validate(preferences[key])));

const mergePreferences = (previous = {}, changes = {}) => {
  const merged = { theme: previous?.theme || 'light', primaryColor: previous?.primaryColor || '#2463eb' };
  for (const [key, validate] of Object.entries(fields)) {
    if (validate(previous?.[key])) merged[key] = previous[key];
    if (changes[key] !== undefined) merged[key] = changes[key];
  }
  return merged;
};

module.exports = { validPreferences, mergePreferences };
