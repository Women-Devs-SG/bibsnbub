import { describe, expect, it } from 'vitest';
import { transformToSentenceCase } from './text';

describe('Text transformation utilities', () => {
  describe('when text is not sentence case', () => {
    describe('when input is normal uppercase text', () => {
      const upperCases = [
        { input: 'ION ORCHARD MALL', expected: 'Ion orchard mall' },
        { input: 'FAR EAST PLAZA', expected: 'Far east plaza' },
        { input: 'MANDARIN GALLERY', expected: 'Mandarin gallery' },
      ];

      it('should change uppercase phrase to sentence case', () => {
        upperCases.forEach(({ input, expected }) => {
          expect(transformToSentenceCase(input)).toBe(expected);
        });
      });
    });

    describe('when input has mixed case', () => {
      it('should change the text to sentence case', () => {
        expect(transformToSentenceCase('mIXed CaSe StRiNg')).toBe('Mixed case string');
      });
    });

    describe('when input is empty or single character', () => {
      it('should return empty string for empty input', () => {
        expect(transformToSentenceCase('')).toBe('');
      });

      it('should perserve single uppercase letter', () => {
        expect(transformToSentenceCase('A')).toBe('A');
      });

      it('should capitalize single lowercase letter', () => {
        expect(transformToSentenceCase('b')).toBe('B');
      });
    });

    describe('when input contains special characters', () => {
      describe('when input starts with numbers or special characters', () => {
        it('should perserve them and change the rest of the text to sentence case', () => {
          expect(transformToSentenceCase('123 MAIN STREET')).toBe('123 Main street');
          expect(transformToSentenceCase('313@ORCHARD')).toBe('313@Orchard');
        });
      });

      describe('when special characters appear after text', () => {
        it('should perserve them', () => {
          expect(transformToSentenceCase('SPECIAL CHARACTERS !@#$')).toBe('Special characters !@#$');
        });
      });

      describe('when input has extra whitespace at the beginning or/and end', () => {
        it('should trim the leading and trailing spaces', () => {
          expect(transformToSentenceCase('   LEADING AND TRAILING SPACES   ')).toBe('Leading and trailing spaces');
        });
      });
    });
  });
});
