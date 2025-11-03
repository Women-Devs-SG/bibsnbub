import { describe, expect, it } from 'vitest';
import { capitalizeFirstAlphabeticChar, transformToSentenceCase } from './text';

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

  describe('when capitalizing each word', () => {
    describe('when input contains multiple words', () => {
      it('should capitalize the first alphabetic character of each word', () => {
        expect(capitalizeFirstAlphabeticChar('hello world')).toBe('Hello World');
        expect(capitalizeFirstAlphabeticChar('ion orchard mall')).toBe('Ion Orchard Mall');
      });

      it('should capitalize the first alphabetic character of each word and lowercase the rest', () => {
        expect(capitalizeFirstAlphabeticChar('hello WORLD')).toBe('Hello World');
        expect(capitalizeFirstAlphabeticChar('mIXed CaSe')).toBe('Mixed Case');
      });
    });

    describe('when input is empty or single character', () => {
      it('should return empty string for empty input', () => {
        expect(capitalizeFirstAlphabeticChar('')).toBe('');
      });

      it('should capitalize single lowercase letter', () => {
        expect(capitalizeFirstAlphabeticChar('a')).toBe('A');
      });

      it('should preserve single uppercase letter', () => {
        expect(capitalizeFirstAlphabeticChar('A')).toBe('A');
      });
    });

    describe('when input contains special characters', () => {
      it('should preserve leading numbers and capitalize first alphabetic character', () => {
        expect(capitalizeFirstAlphabeticChar('123abc')).toBe('123Abc');
        expect(capitalizeFirstAlphabeticChar('123 main street')).toBe('123 Main Street');
      });

      it('should handle words starting with special characters', () => {
        expect(capitalizeFirstAlphabeticChar('313@orchard')).toBe('313@Orchard');
        expect(capitalizeFirstAlphabeticChar('@hello #world')).toBe('@Hello #World');
      });

      it('should preserve special characters throughout', () => {
        expect(capitalizeFirstAlphabeticChar('hello!world')).toBe('Hello!world');
      });
    });

    describe('when input has no alphabetic characters', () => {
      it('should return the string unchanged', () => {
        expect(capitalizeFirstAlphabeticChar('123')).toBe('123');
        expect(capitalizeFirstAlphabeticChar('@#$')).toBe('@#$');
      });
    });
  });
});
