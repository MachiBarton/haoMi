const { embedParagraphFingerprints, extractParagraphFingerprints, hashParagraph } = require('../src/paragraphFingerprint');

describe('Paragraph fingerprint', () => {
  test('should embed fingerprints for each paragraph', () => {
    const text = '第一段内容。\n\n第二段内容。\n\n第三段内容。';
    const watermarked = embedParagraphFingerprints(text);
    expect(watermarked).not.toBe(text);
    expect(watermarked.length).toBeGreaterThan(text.length);
  });

  test('should extract fingerprints from watermarked text', () => {
    const text = '第一段内容。\n\n第二段内容。';
    const watermarked = embedParagraphFingerprints(text);
    const fingerprints = extractParagraphFingerprints(watermarked);
    expect(Array.isArray(fingerprints)).toBe(true);
    expect(fingerprints.length).toBe(2);
    expect(fingerprints[0]).toHaveProperty('index');
    expect(fingerprints[0]).toHaveProperty('hash');
  });

  test('should generate consistent hash for same paragraph', () => {
    const p1 = hashParagraph('测试段落');
    const p2 = hashParagraph('测试段落');
    expect(p1).toBe(p2);
    expect(typeof p1).toBe('string');
    expect(p1.length).toBe(4);
  });

  test('should handle single paragraph', () => {
    const text = '只有一段内容。';
    const watermarked = embedParagraphFingerprints(text);
    const fingerprints = extractParagraphFingerprints(watermarked);
    expect(fingerprints.length).toBe(1);
  });
});
