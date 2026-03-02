const { encodeToZeroWidth, decodeFromZeroWidth, ZERO_WIDTH_NO_BREAK } = require('./encoder');
const { serializeData, deserializeData } = require('./serializer');

const MARKER_START = ZERO_WIDTH_NO_BREAK;
const MARKER_END = ZERO_WIDTH_NO_BREAK;

/**
 * 在文本开头嵌入全局水印
 * @param {string} text - 原始文本
 * @param {Object} data - { userId, timestamp, customData }
 * @returns {string} 带水印的文本
 */
function embedGlobalWatermark(text, data) {
  const binary = serializeData(data);
  const encoded = encodeToZeroWidth(binary);
  const watermark = MARKER_START + encoded + MARKER_END;
  return watermark + text;
}

/**
 * 从文本中提取全局水印
 * @param {string} text - 带水印的文本
 * @returns {Object|null} 水印数据或null
 */
function extractGlobalWatermark(text) {
  const pattern = new RegExp(`${MARKER_START}([\\u200B\\u200C\\u200D\\uFEFF]+)${MARKER_END}`);
  const match = text.match(pattern);

  if (!match) return null;

  const encoded = match[1];
  const binary = decodeFromZeroWidth(encoded);
  return deserializeData(binary);
}

module.exports = {
  embedGlobalWatermark,
  extractGlobalWatermark
};
