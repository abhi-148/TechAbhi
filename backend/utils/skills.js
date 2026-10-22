export const compact = (s) => String(s).toLowerCase().replace(/\s+/g, '');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whole-token match so "Java" does not match "JavaScript" and "C" does not match "C++". */
export function hasSkill(text, skill) {
  const sk = String(skill || '').trim().toLowerCase();
  if (!sk) return false;
  try { return new RegExp('(?<![a-z0-9+#])' + esc(sk) + '(?![a-z0-9+#])', 'i').test(String(text).toLowerCase()); } catch { return false; }
}
