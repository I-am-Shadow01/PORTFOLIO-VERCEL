/**
 * Resolve a localized config value without duplicating whole config trees.
 * Plain strings/numbers pass through unchanged.
 */
export function localize(value, lang = 'en') {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('en' in value || 'th' in value)
  ) {
    return value[lang] ?? value.en ?? value.th;
  }
  return value;
}
