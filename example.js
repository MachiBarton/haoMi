const { embedWatermark, extractWatermark, compareTexts } = require('./src/index');

// 示例数据
const userData = {
  userId: 'user_abc123',
  timestamp: Date.now(),
  customData: 'enterprise_license'
};

const originalText = `第一章：产品介绍

我们的文本水印系统采用先进的零宽字符编码技术，可以在不影响阅读体验的情况下，将追踪信息嵌入到普通文本中。

第二章：核心功能

1. 全局水印：在文本开头嵌入完整的用户信息
2. 段落指纹：为每个段落生成唯一标识
3. 文本比对：检测文本相似度和抄袭行为`;

console.log('=== 文本水印系统示例 ===\n');

// 1. 嵌入水印
console.log('1. 嵌入水印...');
const watermarkedText = embedWatermark(originalText, userData);
console.log('✓ 水印嵌入成功');
console.log('  原始长度:', originalText.length);
console.log('  水印长度:', watermarkedText.length);
console.log();

// 2. 提取水印
console.log('2. 提取水印...');
const extracted = extractWatermark(watermarkedText);
console.log('✓ 提取结果:');
console.log('  用户ID:', extracted.userId);
console.log('  时间戳:', new Date(extracted.timestamp).toISOString());
console.log('  自定义数据:', extracted.customData);
console.log('  置信度:', extracted.confidence);
console.log();

// 3. 模拟部分复制
console.log('3. 检测部分复制...');
const partialCopy = `第一章：产品介绍

我们的文本水印系统采用先进的零宽字符编码技术，可以在不影响阅读体验的情况下，将追踪信息嵌入到普通文本中。`;

const comparison = compareTexts(watermarkedText, partialCopy);
console.log('✓ 比对结果:');
console.log('  相似度:', (comparison.similarity * 100).toFixed(1) + '%');
console.log('  置信度:', comparison.confidence);
console.log('  匹配段落数:', comparison.matchedCount);
console.log();

console.log('=== 示例完成 ===');
