const { embedWatermark, extractWatermark, compareTexts } = require('../src/index');

describe('Integration tests', () => {
  const userData = {
    userId: 'user_abc123',
    timestamp: 1700000000000,
    customData: 'premium_license'
  };

  test('full workflow: embed -> extract -> verify', () => {
    const originalText = `第一章：引言

这是一个关于文本水印的测试文档。文本水印技术可以在不影响阅读的情况下嵌入隐藏信息。

第二章：技术原理

通过使用零宽字符，我们可以将二进制数据隐藏在普通文本中。这种方法对肉眼完全不可见。`;

    // 嵌入水印
    const watermarked = embedWatermark(originalText, userData);

    // 提取水印
    const extracted = extractWatermark(watermarked);

    // 验证
    expect(extracted).not.toBeNull();
    expect(extracted.userId).toBe(userData.userId);
    expect(extracted.timestamp).toBe(userData.timestamp);
    expect(extracted.customData).toBe(userData.customData);
    expect(extracted.confidence).toBe('high');
  });

  test('detect partial copy', () => {
    const originalText = `第一段：产品介绍

我们的产品具有高性能和可靠性。

第二段：技术规格

支持多种平台和部署方式。

第三段：价格信息

提供灵活的定价方案。`;

    const watermarked = embedWatermark(originalText, userData);

    // 模拟只复制了第二段
    const partialCopy = '第二段：技术规格\n\n支持多种平台和部署方式。';

    const result = compareTexts(watermarked, partialCopy);

    expect(result.similarity).toBeGreaterThan(0.8);
    expect(result.matchedParagraphs.length).toBeGreaterThanOrEqual(1);
    expect(result.confidence).toBe('high');
  });

  test('detect modified copy', () => {
    const originalText = '原始段落内容。\n\n第二段内容。';
    const watermarked = embedWatermark(originalText, userData);

    // 修改后的版本
    const modified = '原始段落内容已被修改。\n\n第二段内容。';

    const result = compareTexts(watermarked, modified);

    expect(result.similarity).toBeGreaterThanOrEqual(0.5);
    expect(result.matchedParagraphs.length).toBeGreaterThan(0);
  });

  test('no false positive on clean text', () => {
    const cleanText = '这是一个没有任何水印的普通文本。';
    const extracted = extractWatermark(cleanText);
    expect(extracted).toBeNull();
  });
});
