const ZERO_WIDTH_SPACE = '\u200B';      // 0
const ZERO_WIDTH_NON_JOINER = '\u200C'; // 1
const ZERO_WIDTH_JOINER = '\u200D';     // separator
const ZERO_WIDTH_NO_BREAK = '\uFEFF';   // marker

/**
 * 将二进制字符串编码为零宽字符
 * @param {string} binary - 二进制字符串 (e.g., "1010")
 * @returns {string} 零宽字符字符串
 */
function encodeToZeroWidth(binary) {
  if (!binary) return '';
  return binary.split('').map(bit => {
    return bit === '1' ? ZERO_WIDTH_NON_JOINER : ZERO_WIDTH_SPACE;
  }).join('');
}

/**
 * 从零宽字符解码为二进制字符串
 * @param {string} encoded - 零宽字符字符串
 * @returns {string} 二进制字符串
 */
function decodeFromZeroWidth(encoded) {
  if (!encoded) return '';
  return encoded.split('').map(char => {
    if (char === ZERO_WIDTH_NON_JOINER) return '1';
    if (char === ZERO_WIDTH_SPACE) return '0';
    return '';
  }).join('');
}

/**
 * 从文本中移除所有零宽字符
 * @param {string} text - 输入文本
 * @returns {string} 清理后的文本
 */
function removeZeroWidthChars(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text
    .replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), '')
    .replace(new RegExp(ZERO_WIDTH_NON_JOINER, 'g'), '')
    .replace(new RegExp(ZERO_WIDTH_JOINER, 'g'), '')
    .replace(new RegExp(ZERO_WIDTH_NO_BREAK, 'g'), '');
}

module.exports = {
  encodeToZeroWidth,
  decodeFromZeroWidth,
  removeZeroWidthChars,
  ZERO_WIDTH_SPACE,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_JOINER,
  ZERO_WIDTH_NO_BREAK
};
