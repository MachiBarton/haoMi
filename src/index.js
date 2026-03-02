const { embedGlobalWatermark, extractGlobalWatermark } = require('./globalWatermark');
const { embedParagraphFingerprints, extractParagraphFingerprints } = require('./paragraphFingerprint');
const { compareTexts: compareTextsInternal } = require('./comparator');

/**
 * 嵌入完整水印（全局水印 + 段落指纹）
 * @param {string} text - 原始文本
 * @param {Object} data - { userId, timestamp, customData }
 * @returns {string} 带水印的文本
 */
function embedWatermark(text, data) {
  // 先嵌入段落指纹
  const withFingerprints = embedParagraphFingerprints(text);
  // 再嵌入全局水印
  return embedGlobalWatermark(withFingerprints, data);
}

/**
 * 提取水印信息
 * @param {string} text - 带水印的文本
 * @returns {Object|null} 水印信息 { userId, timestamp, customData, confidence }
 */
function extractWatermark(text) {
  // 尝试提取全局水印
  const global = extractGlobalWatermark(text);

  if (global) {
    return {
      ...global,
      confidence: 'high'
    };
  }

  // 尝试提取段落指纹
  const fingerprints = extractParagraphFingerprints(text);
  if (fingerprints.length > 0) {
    return {
      fingerprints,
      confidence: 'low',
      message: 'Global watermark missing, but paragraph fingerprints found'
    };
  }

  return null;
}

/**
 * 比对两段文本
 * @param {string} original - 原始带水印文本
 * @param {string} suspicious - 可疑文本
 * @returns {Object} 比对结果
 */
function compareTexts(original, suspicious) {
  return compareTextsInternal(original, suspicious);
}

module.exports = {
  embedWatermark,
  extractWatermark,
  compareTexts
};
