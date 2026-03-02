const { embedGlobalWatermark, extractGlobalWatermark } = require('../src/globalWatermark');

describe('Global watermark', () => {
  const testData = {
    userId: 'user123',
    timestamp: 1700000000000,
    customData: 'license_pro'
  };

  test('should embed watermark into text', () => {
    const text = '这是一段测试文本';
    const watermarked = embedGlobalWatermark(text, testData);
    expect(watermarked.length).toBeGreaterThan(text.length);
    expect(watermarked).toContain('这是一段测试文本');
  });

  test('should extract watermark from watermarked text', () => {
    const text = '这是一段测试文本';
    const watermarked = embedGlobalWatermark(text, testData);
    const extracted = extractGlobalWatermark(watermarked);
    expect(extracted).not.toBeNull();
    expect(extracted.userId).toBe(testData.userId);
    expect(extracted.timestamp).toBe(testData.timestamp);
    expect(extracted.customData).toBe(testData.customData);
  });

  test('should return null for text without watermark', () => {
    const text = '这是一段没有水印的文本';
    const extracted = extractGlobalWatermark(text);
    expect(extracted).toBeNull();
  });

  test('should handle empty text', () => {
    const watermarked = embedGlobalWatermark('', testData);
    const extracted = extractGlobalWatermark(watermarked);
    expect(extracted).not.toBeNull();
    expect(extracted.userId).toBe(testData.userId);
  });
});
