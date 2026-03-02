/**
 * 计算 Levenshtein 编辑距离
 * @param {string} str1 - 字符串1
 * @param {string} str2 - 字符串2
 * @returns {number} 编辑距离
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 计算文本相似度 (0-1)
 * @param {string} str1 - 字符串1
 * @param {string} str2 - 字符串2
 * @returns {number} 相似度 (0-1)
 */
function similarity(str1, str2) {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;

  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * 比对两段文本，检测相似度
 * @param {string} original - 原始文本（带水印）
 * @param {string} suspicious - 可疑文本
 * @returns {Object} 比对结果
 */
function compareTexts(original, suspicious) {
  // 移除零宽字符进行比对
  const cleanOriginal = original.replace(/[\u200B-\u200D\uFEFF]/g, '');
  const cleanSuspicious = suspicious.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // 分段
  const originalParas = cleanOriginal.split(/\n\n+/).filter(p => p.trim());
  const suspiciousParas = cleanSuspicious.split(/\n\n+/).filter(p => p.trim());

  const matchedParagraphs = [];
  let totalSimilarity = 0;

  // 逐段比对
  suspiciousParas.forEach(suspiciousPara => {
    let bestMatch = { similarity: 0, originalIndex: -1 };

    originalParas.forEach((originalPara, idx) => {
      const sim = similarity(originalPara, suspiciousPara);
      if (sim > bestMatch.similarity) {
        bestMatch = { similarity: sim, originalIndex: idx, text: originalPara };
      }
    });

    if (bestMatch.similarity > 0.7) {
      matchedParagraphs.push({
        suspiciousText: suspiciousPara,
        originalText: bestMatch.text,
        similarity: bestMatch.similarity,
        originalIndex: bestMatch.originalIndex
      });
      totalSimilarity += bestMatch.similarity;
    }
  });

  const avgSimilarity = suspiciousParas.length > 0
    ? totalSimilarity / suspiciousParas.length
    : 0;

  // 确定置信度
  let confidence;
  if (avgSimilarity > 0.9) confidence = 'high';
  else if (avgSimilarity > 0.7) confidence = 'medium';
  else if (avgSimilarity > 0.5) confidence = 'low';
  else confidence = 'none';

  return {
    similarity: Math.round(avgSimilarity * 100) / 100,
    matchedParagraphs,
    confidence,
    totalParagraphs: suspiciousParas.length,
    matchedCount: matchedParagraphs.length
  };
}

module.exports = {
  levenshteinDistance,
  similarity,
  compareTexts
};
