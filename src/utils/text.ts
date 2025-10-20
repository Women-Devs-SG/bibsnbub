/**
 * Convert a string to sentence case:
 * - trims whitespace
 * - uppercases the first alphabetic character and lowercases following letters
 * - preserves leading non-letter characters; returns trimmed string if no letters
 *
 * Note: internal acronyms/mixed-case words will be lowercased (e.g. "NASA" -> "Nasa").
 */

export const transformToSentenceCase = (str: string): string => {
  if (!str) {
    return str;
  }
  str = str.trim();
  const firstCharIndex = str.search(/[a-z]/i);
  if (firstCharIndex === -1) {
    return str;
  }
  return str.slice(0, firstCharIndex) + str.charAt(firstCharIndex).toUpperCase() + str.slice(firstCharIndex + 1).toLowerCase();
};
