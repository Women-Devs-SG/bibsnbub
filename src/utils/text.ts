/**
 * Converts a string to sentence case.
 * @param str the input string
 * @returns the string in sentence case
 */
export const toSentenceCase = (str: string): string => {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const skipTrimToSentenceCase = (str: string): string => {
  if (!str) {
    return str;
  }
  str = str.trim();
  const firstCharIndex = str.search(/[a-z]/i);
  if (firstCharIndex === -1) {
    return str;
  }
  return str.slice(0, firstCharIndex) + toSentenceCase(str.slice(firstCharIndex));
};
