const { encodeToZeroWidth, decodeFromZeroWidth, ZERO_WIDTH_JOINER } = require('./encoder');

const PARAGRAPH_MARKER = ZERO_WIDTH_JOINER;

/**
 * 简单哈希函数，生成4位十六进制哈希
 * @param {string} text - 段落文本
 * @returns {string} 4位十六进制哈希
 */
function hashParagraph(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转为32位整数
  }
  return Math.abs(hash).toString(16).padStart(4, '0').slice(0, 4);
}

/**
 * 将段落索引和哈希编码为二进制
 * @param {number} index - 段落索引
 * @param {string} hash - 4位十六进制哈希
 * @returns {string} 零宽字符编码
 */
function encodeFingerprint(index, hash) {
  const indexBinary = index.toString(2).padStart(16, '0');
  const hashBinary = parseInt(hash, 16).toString(2).padStart(16, '0');
  return PARAGRAPH_MARKER + encodeToZeroWidth(indexBinary + hashBinary);
}

/**
 * 解码段落指纹
 * @param {string} encoded - 零宽字符编码
 * @returns {Object|null} { index, hash }
 */
function decodeFingerprint(encoded) {
  try {
    const binary = decodeFromZeroWidth(encoded);
    if (binary.length < 32) return null;

    const index = parseInt(binary.slice(0, 16), 2);
    const hashValue = parseInt(binary.slice(16, 32), 2);
    const hash = hashValue.toString(16).padStart(4, '0');

    return { index, hash };
  } catch (e) {
    return null;
  }
}

/**
 * 为每个段落嵌入指纹
 * @param {string} text - 原始文本
 * @returns {string} 带指纹的文本
 */
function embedParagraphFingerprints(text) {
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((para, index) => {
    const trimmed = para.trim();
    if (!trimmed) return para;

    const hash = hashParagraph(trimmed);
    const fingerprint = encodeFingerprint(index, hash);

    return trimmed + fingerprint;
  }).join('\n\n');
}

/**
 * 从文本中提取段落指纹
 * @param {string} text - 带指纹的文本
 * @returns {Array} 指纹数组 [{ index, hash, paragraph }]
 */
function extractParagraphFingerprints(text) {
  const paragraphs = text.split(/\n\n+/);
  const fingerprints = [];

  const pattern = new RegExp(`${PARAGRAPH_MARKER}[\\u200B\\u200C]+`, 'g');

  paragraphs.forEach((para, idx) => {
    const match = para.match(pattern);
    if (match) {
      const encoded = match[0].slice(1); // 移除标记
      const decoded = decodeFingerprint(encoded);
      if (decoded) {
        fingerprints.push({
          index: decoded.index,
          hash: decoded.hash,
          paragraph: para.replace(pattern, '').trim()
        });
      }
    }
  });

  return fingerprints;
}

module.exports = {
  embedParagraphFingerprints,
  extractParagraphFingerprints,
  hashParagraph
};
