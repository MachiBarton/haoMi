const {
  ZERO_WIDTH_SPACE,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_JOINER,
  ZERO_WIDTH_NO_BREAK,
  encodeToZeroWidth,
  decodeFromZeroWidth
} = require('../src/encoder');

describe('Zero Width Encoder', () => {
  describe('Constants', () => {
    test('should define zero-width character constants', () => {
      expect(ZERO_WIDTH_SPACE).toBe('\u200B');
      expect(ZERO_WIDTH_NON_JOINER).toBe('\u200C');
      expect(ZERO_WIDTH_JOINER).toBe('\u200D');
      expect(ZERO_WIDTH_NO_BREAK).toBe('\uFEFF');
    });
  });

  describe('encodeToZeroWidth', () => {
    test('should encode "1010" with correct zero-width characters', () => {
      const encoded = encodeToZeroWidth('1010');
      expect(encoded).toBe(ZERO_WIDTH_NON_JOINER + ZERO_WIDTH_SPACE + ZERO_WIDTH_NON_JOINER + ZERO_WIDTH_SPACE);
      expect(encoded).toContain(ZERO_WIDTH_NON_JOINER);
      expect(encoded).toContain(ZERO_WIDTH_SPACE);
    });

    test('should encode "1" to ZERO_WIDTH_NON_JOINER', () => {
      expect(encodeToZeroWidth('1')).toBe(ZERO_WIDTH_NON_JOINER);
    });

    test('should encode "0" to ZERO_WIDTH_SPACE', () => {
      expect(encodeToZeroWidth('0')).toBe(ZERO_WIDTH_SPACE);
    });

    test('should handle empty string', () => {
      expect(encodeToZeroWidth('')).toBe('');
    });

    test('should handle null/undefined', () => {
      expect(encodeToZeroWidth(null)).toBe('');
      expect(encodeToZeroWidth(undefined)).toBe('');
    });
  });

  describe('decodeFromZeroWidth', () => {
    test('should decode zero-width characters back to original binary', () => {
      const original = '1010';
      const encoded = encodeToZeroWidth(original);
      const decoded = decodeFromZeroWidth(encoded);
      expect(decoded).toBe(original);
    });

    test('should decode ZERO_WIDTH_NON_JOINER to "1"', () => {
      expect(decodeFromZeroWidth(ZERO_WIDTH_NON_JOINER)).toBe('1');
    });

    test('should decode ZERO_WIDTH_SPACE to "0"', () => {
      expect(decodeFromZeroWidth(ZERO_WIDTH_SPACE)).toBe('0');
    });

    test('should handle empty string', () => {
      expect(decodeFromZeroWidth('')).toBe('');
    });

    test('should handle null/undefined', () => {
      expect(decodeFromZeroWidth(null)).toBe('');
      expect(decodeFromZeroWidth(undefined)).toBe('');
    });

    test('should decode complex binary strings correctly', () => {
      const testCases = [
        '11110000',
        '00001111',
        '10101010',
        '01010101',
        '110011001100'
      ];

      testCases.forEach(binary => {
        const encoded = encodeToZeroWidth(binary);
        const decoded = decodeFromZeroWidth(encoded);
        expect(decoded).toBe(binary);
      });
    });
  });

  describe('Round-trip encoding/decoding', () => {
    test('should correctly round-trip various binary strings', () => {
      const testCases = [
        '0',
        '1',
        '00',
        '11',
        '01',
        '10',
        '101010',
        '111000',
        '000111'
      ];

      testCases.forEach(binary => {
        const encoded = encodeToZeroWidth(binary);
        const decoded = decodeFromZeroWidth(encoded);
        expect(decoded).toBe(binary);
      });
    });
  });
});
