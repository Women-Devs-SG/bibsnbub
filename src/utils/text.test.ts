import { describe, expect, it } from 'vitest';
import { skipTrimToSentenceCase, toSentenceCase } from './text';

describe('Text transformation utilities', () => {
  describe('toSentenceCase', () => {
    const cases = [
      { input: 'ION ORCHARD MALL', expected: 'Ion orchard mall' },
      { input: 'FAR EAST PLAZA', expected: 'Far east plaza' },
      { input: 'MANDARIN GALLERY', expected: 'Mandarin gallery' },
    ];

    it('correctly transforms strings to sentence case', () => {
      cases.forEach(({ input, expected }) => {
        expect(toSentenceCase(input)).toBe(expected);
      });
    });
  });

  describe('skipTrimToSentenceCase', () => {
    const normalCases = [
      { input: 'ION ORCHARD MALL', expected: 'Ion orchard mall' },
      { input: 'FAR EAST PLAZA', expected: 'Far east plaza' },
      { input: 'MANDARIN GALLERY', expected: 'Mandarin gallery' },
    ];

    const edgeCases = [
      { input: '', expected: '' },
      { input: 'A', expected: 'A' },
      { input: 'b', expected: 'B' },
      { input: '123 MAIN STREET', expected: '123 Main street' },
      { input: 'mIXed CaSe StRiNg', expected: 'Mixed case string' },
      { input: '   LEADING AND TRAILING SPACES   ', expected: 'Leading and trailing spaces' },
      { input: 'SPECIAL CHARACTERS !@#$', expected: 'Special characters !@#$' },
      { input: '313@ORCHARD', expected: '313@Orchard' },
    ];

    it('correctly transforms normal cases to sentence case', () => {
      normalCases.forEach(({ input, expected }) => {
        expect(skipTrimToSentenceCase(input)).toBe(expected);
      });
    });

    it('correctly handles edge cases', () => {
      edgeCases.forEach(({ input, expected }) => {
        expect(skipTrimToSentenceCase(input)).toBe(expected);
      });
    });
  });
});
