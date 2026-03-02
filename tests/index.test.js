const { embedWatermark, extractWatermark, compareTexts } = require('../src/index');

describe('Main API', () => {
  const testData = {
    userId: 'user123',
    timestamp: 1700000000000,
    customData: 'license_premium'
  };

  test('should embed complete watermark', () => {
    const text = '第一段内容。\n\n第二段内容。';
    const watermarked = embedWatermark(text, testData);
    expect(typeof watermarked).toBe('string');
    expect(watermarked.length).toBeGreaterThan(text.length);
  });

  test('should extract watermark with all data', () => {
    const text = '第一段内容。\n\n第二段内容。';
    const watermarked = embedWatermark(text, testData);
    const extracted = extractWatermark(watermarked);

    expect(extracted).not.toBeNull();
    expect(extracted.userId).toBe(testData.userId);
    expect(extracted.timestamp).toBe(testData.timestamp);
    expect(extracted.customData).toBe(testData.customData);
    expect(extracted.confidence).toBe('high');
  });

  test('should return null for text without watermark', () => {
    const text = '没有水印的普通文本。';
    const extracted = extractWatermark(text);
    expect(extracted).toBeNull();
  });

  test('should compare texts and detect similarity', () => {
    const original = embedWatermark('第一段内容。\n\n第二段内容。', testData);
    const suspicious = '第一段内容。'; // 部分复制

    const result = compareTexts(original, suspicious);
    expect(result.similarity).toBeGreaterThan(0.3);
    expect(result.matchedParagraphs.length).toBeGreaterThan(0);
  });

  test('should handle single paragraph text', () => {
    const text = '只有一段。';
    const watermarked = embedWatermark(text, testData);
    const extracted = extractWatermark(watermarked);
    expect(extracted.userId).toBe(testData.userId);
  });
});
