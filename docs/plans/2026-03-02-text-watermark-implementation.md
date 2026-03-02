# 文本水印系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现一个纯文本嵌入式水印系统，支持零宽字符编码、段落指纹和文本比对检测

**Architecture:** 分层水印策略（全局水印 + 段落指纹），使用零宽 Unicode 字符进行二进制编码，配合文本相似度算法实现两种检测模式

**Tech Stack:** Node.js, Jest, 纯 JavaScript（无外部依赖）

---

## 项目初始化

### Task 1: 初始化 Node.js 项目

**Files:**
- Create: `package.json`
- Create: `.gitignore`

**Step 1: 初始化项目**

```bash
cd "/Users/marcus/Desktop/digital watermark"
npm init -y
```

**Step 2: 安装 Jest**

```bash
npm install --save-dev jest
```

**Step 3: 修改 package.json**

```json
{
  "name": "text-watermark",
  "version": "1.0.0",
  "description": "纯文本嵌入式水印系统",
  "main": "src/index.js",
  "scripts": {
    "test": "jest"
  },
  "keywords": ["watermark", "text", "steganography"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

**Step 4: 创建 .gitignore**

```
node_modules/
coverage/
*.log
.DS_Store
```

**Step 5: 创建目录结构**

```bash
mkdir -p src tests
```

**Step 6: Commit**

```bash
git init
git add package.json .gitignore

git commit -m "$(cat <<'EOF'
chore: initialize Node.js project

- Add package.json with Jest test runner
- Add .gitignore for node_modules
- Create src/ and tests/ directories

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 核心编码模块

### Task 2: 实现零宽字符编码器

**Files:**
- Create: `src/encoder.js`
- Create: `tests/encoder.test.js`

**Step 1: 编写测试**

```javascript
// tests/encoder.test.js
const { encodeToZeroWidth, decodeFromZeroWidth } = require('../src/encoder');

describe('Zero-width encoder', () => {
  test('should encode binary string to zero-width characters', () => {
    const binary = '1010';
    const encoded = encodeToZeroWidth(binary);
    expect(encoded).toContain('\u200C'); // 1
    expect(encoded).toContain('\u200B'); // 0
    expect(encoded.length).toBe(4);
  });

  test('should decode zero-width characters back to binary', () => {
    const binary = '1010';
    const encoded = encodeToZeroWidth(binary);
    const decoded = decodeFromZeroWidth(encoded);
    expect(decoded).toBe(binary);
  });

  test('should handle empty string', () => {
    expect(encodeToZeroWidth('')).toBe('');
    expect(decodeFromZeroWidth('')).toBe('');
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/encoder.test.js
```
Expected: FAIL - "encodeToZeroWidth is not defined"

**Step 3: 实现编码器**

```javascript
// src/encoder.js

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

module.exports = {
  encodeToZeroWidth,
  decodeFromZeroWidth,
  ZERO_WIDTH_SPACE,
  ZERO_WIDTH_NON_JOINER,
  ZERO_WIDTH_JOINER,
  ZERO_WIDTH_NO_BREAK
};
```

**Step 4: 运行测试确认通过**

```bash
npm test -- tests/encoder.test.js
```
Expected: PASS

**Step 5: Commit**

```bash
git add tests/encoder.test.js src/encoder.js

git commit -m "$(cat <<'EOF'
feat: implement zero-width character encoder

- Add encodeToZeroWidth() for binary to zero-width conversion
- Add decodeFromZeroWidth() for reverse conversion
- Support empty string handling

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 实现数据序列化/反序列化

**Files:**
- Create: `src/serializer.js`
- Create: `tests/serializer.test.js`

**Step 1: 编写测试**

```javascript
// tests/serializer.test.js
const { serializeData, deserializeData, stringToBinary, binaryToString } = require('../src/serializer');

describe('Data serializer', () => {
  test('should convert string to binary', () => {
    expect(stringToBinary('A')).toBe('01000001');
    expect(stringToBinary('Hi')).toBe('0100100001101001');
  });

  test('should convert binary to string', () => {
    expect(binaryToString('01000001')).toBe('A');
    expect(binaryToString('0100100001101001')).toBe('Hi');
  });

  test('should serialize watermark data', () => {
    const data = {
      userId: 'user123',
      timestamp: 1700000000000,
      customData: 'test'
    };
    const serialized = serializeData(data);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
  });

  test('should deserialize watermark data', () => {
    const data = {
      userId: 'user123',
      timestamp: 1700000000000,
      customData: 'test'
    };
    const serialized = serializeData(data);
    const deserialized = deserializeData(serialized);
    expect(deserialized.userId).toBe(data.userId);
    expect(deserialized.timestamp).toBe(data.timestamp);
    expect(deserialized.customData).toBe(data.customData);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/serializer.test.js
```
Expected: FAIL

**Step 3: 实现序列化器**

```javascript
// src/serializer.js

/**
 * 将字符串转换为二进制表示
 * @param {string} str - 输入字符串
 * @returns {string} 二进制字符串
 */
function stringToBinary(str) {
  return str.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
}

/**
 * 将二进制字符串转换为普通字符串
 * @param {string} binary - 二进制字符串
 * @returns {string} 普通字符串
 */
function binaryToString(binary) {
  const bytes = binary.match(/.{8}/g) || [];
  return bytes.map(byte => {
    return String.fromCharCode(parseInt(byte, 2));
  }).join('');
}

/**
 * 序列化水印数据为二进制字符串
 * 格式: [version:4bit][userIdLength:8bit][userId][timestamp:64bit][customDataLength:8bit][customData]
 * @param {Object} data - { userId, timestamp, customData }
 * @returns {string} 二进制字符串
 */
function serializeData(data) {
  const version = '0001'; // 版本 1

  const userIdBinary = stringToBinary(data.userId);
  const userIdLength = data.userId.length.toString(2).padStart(8, '0');

  const timestampBinary = BigInt(data.timestamp).toString(2).padStart(64, '0');

  const customDataBinary = stringToBinary(data.customData);
  const customDataLength = data.customData.length.toString(2).padStart(8, '0');

  return version + userIdLength + userIdBinary + timestampBinary + customDataLength + customDataBinary;
}

/**
 * 反序列化二进制字符串为水印数据
 * @param {string} binary - 二进制字符串
 * @returns {Object|null} 水印数据对象或null
 */
function deserializeData(binary) {
  try {
    let offset = 4; // 跳过版本号

    const userIdLength = parseInt(binary.slice(offset, offset + 8), 2);
    offset += 8;

    const userIdBinary = binary.slice(offset, offset + userIdLength * 8);
    const userId = binaryToString(userIdBinary);
    offset += userIdLength * 8;

    const timestamp = parseInt(binary.slice(offset, offset + 64), 2);
    offset += 64;

    const customDataLength = parseInt(binary.slice(offset, offset + 8), 2);
    offset += 8;

    const customDataBinary = binary.slice(offset, offset + customDataLength * 8);
    const customData = binaryToString(customDataBinary);

    return { userId, timestamp, customData };
  } catch (e) {
    return null;
  }
}

module.exports = {
  stringToBinary,
  binaryToString,
  serializeData,
  deserializeData
};
```

**Step 4: 运行测试确认通过**

```bash
npm test -- tests/serializer.test.js
```
Expected: PASS

**Step 5: Commit**

```bash
git add tests/serializer.test.js src/serializer.js

git commit -m "$(cat <<'EOF'
feat: implement data serializer

- Add stringToBinary() and binaryToString() utilities
- Add serializeData() for watermark data encoding
- Add deserializeData() for watermark data decoding
- Support version 1 format with userId, timestamp, customData

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 全局水印模块

### Task 4: 实现全局水印嵌入/提取

**Files:**
- Create: `src/globalWatermark.js`
- Create: `tests/globalWatermark.test.js`

**Step 1: 编写测试**

```javascript
// tests/globalWatermark.test.js
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
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/globalWatermark.test.js
```
Expected: FAIL

**Step 3: 实现全局水印模块**

```javascript
// src/globalWatermark.js
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
  const pattern = new RegExp(`${MARKER_START}([${ZERO_WIDTH_NO_BREAK}\u200B\u200C\u200D]+)${MARKER_END}`);
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
```

**Step 4: 运行测试确认通过**

```bash
npm test -- tests/globalWatermark.test.js
```
Expected: PASS

**Step 5: Commit**

```bash
git add tests/globalWatermark.test.js src/globalWatermark.js

git commit -m "$(cat <<'EOF'
feat: implement global watermark embedding and extraction

- Add embedGlobalWatermark() to embed at text start
- Add extractGlobalWatermark() to retrieve watermark data
- Use markers to identify watermark boundaries
- Support full data recovery (userId, timestamp, customData)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 段落指纹模块

### Task 5: 实现段落指纹

**Files:**
- Create: `src/paragraphFingerprint.js`
- Create: `tests/paragraphFingerprint.test.js`

**Step 1: 编写测试**

```javascript
// tests/paragraphFingerprint.test.js
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
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/paragraphFingerprint.test.js
```
Expected: FAIL

**Step 3: 实现段落指纹模块**

```javascript
// src/paragraphFingerprint.js
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
```

**Step 4: 运行测试确认通过**

```bash
npm test -- tests/paragraphFingerprint.test.js
```
Expected: PASS

**Step 5: Commit**

```bash
git add tests/paragraphFingerprint.test.js src/paragraphFingerprint.js

git commit -m "$(cat <<'EOF'
feat: implement paragraph fingerprinting

- Add hashParagraph() for 4-char paragraph hashing
- Add embedParagraphFingerprints() for per-paragraph marking
- Add extractParagraphFingerprints() to retrieve fingerprints
- Support paragraph-level detection for partial copying

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 文本比对模块

### Task 6: 实现文本相似度比对

**Files:**
- Create: `src/comparator.js`
- Create: `tests/comparator.test.js`

**Step 1: 编写测试**

```javascript
// tests/comparator.test.js
const { compareTexts, levenshteinDistance, similarity } = require('../src/comparator');

describe('Text comparator', () => {
  test('should calculate Levenshtein distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('', 'abc')).toBe(3);
  });

  test('should calculate similarity percentage', () => {
    expect(similarity('hello', 'hello')).toBe(1);
    expect(similarity('hello', 'world')).toBeLessThan(0.5);
    expect(similarity('', 'abc')).toBe(0);
  });

  test('should compare texts and return result', () => {
    const original = '第一段内容。\n\n第二段内容。';
    const suspicious = '第一段内容。\n\n修改后的第二段。';
    const result = compareTexts(original, suspicious);

    expect(result).toHaveProperty('similarity');
    expect(result).toHaveProperty('matchedParagraphs');
    expect(result).toHaveProperty('confidence');
    expect(result.similarity).toBeGreaterThan(0);
    expect(result.similarity).toBeLessThanOrEqual(1);
  });

  test('should detect exact match', () => {
    const text = '这是完全相同的文本。';
    const result = compareTexts(text, text);
    expect(result.similarity).toBe(1);
    expect(result.confidence).toBe('high');
  });

  test('should detect partial match', () => {
    const original = '第一段内容。\n\n第二段内容。\n\n第三段内容。';
    const suspicious = '第一段内容。'; // 只复制了第一段
    const result = compareTexts(original, suspicious);
    expect(result.similarity).toBeGreaterThan(0.3);
    expect(result.matchedParagraphs.length).toBeGreaterThan(0);
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/comparator.test.js
```
Expected: FAIL

**Step 3: 实现比对模块**

```javascript
// src/comparator.js

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
```

**Step 4: 运行测试确认通过**

```bash
npm test -- tests/comparator.test.js
```
Expected: PASS

**Step 5: Commit**

```bash
git add tests/comparator.test.js src/comparator.js

git commit -m "$(cat <<'EOF'
feat: implement text comparison module

- Add levenshteinDistance() for edit distance calculation
- Add similarity() for normalized similarity score
- Add compareTexts() with paragraph-level matching
- Support confidence scoring (high/medium/low/none)

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 主入口模块

### Task 7: 实现主 API 入口

**Files:**
- Create: `src/index.js`
- Create: `tests/index.test.js`

**Step 1: 编写测试**

```javascript
// tests/index.test.js
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
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/index.test.js
```
Expected: FAIL

**Step 3: 实现主入口**

```javascript
// src/index.js
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
```

**Step 4: 运行测试确认通过**

```bash
npm test -- tests/index.test.js
```
Expected: PASS

**Step 5: Commit**

```bash
git add tests/index.test.js src/index.js

git commit -m "$(cat <<'EOF'
feat: implement main API entry point

- Add embedWatermark() combining global + paragraph watermarks
- Add extractWatermark() with confidence scoring
- Add compareTexts() as public API
- Support full watermark detection workflow

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 集成测试与示例

### Task 8: 添加集成测试和示例

**Files:**
- Create: `tests/integration.test.js`
- Create: `example.js`

**Step 1: 编写集成测试**

```javascript
// tests/integration.test.js
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
    expect(result.matchedParagraphs.length).toBe(1);
    expect(result.confidence).toBe('high');
  });

  test('detect modified copy', () => {
    const originalText = '原始段落内容。\n\n第二段内容。';
    const watermarked = embedWatermark(originalText, userData);

    // 修改后的版本
    const modified = '原始段落内容已被修改。\n\n第二段内容。';

    const result = compareTexts(watermarked, modified);

    expect(result.similarity).toBeGreaterThan(0.5);
    expect(result.matchedParagraphs.length).toBeGreaterThan(0);
  });

  test('no false positive on clean text', () => {
    const cleanText = '这是一个没有任何水印的普通文本。';
    const extracted = extractWatermark(cleanText);
    expect(extracted).toBeNull();
  });
});
```

**Step 2: 运行测试确认失败**

```bash
npm test -- tests/integration.test.js
```
Expected: FAIL

**Step 3: 创建示例文件**

```javascript
// example.js
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
```

**Step 4: 运行集成测试**

```bash
npm test -- tests/integration.test.js
```
Expected: PASS

**Step 5: 运行示例**

```bash
node example.js
```
Expected: 成功输出示例结果

**Step 6: Commit**

```bash
git add tests/integration.test.js example.js

git commit -m "$(cat <<'EOF'
test: add integration tests and example

- Add comprehensive integration tests
- Add example.js demonstrating full workflow
- Test embed -> extract -> verify cycle
- Test partial copy detection

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 最终验证

### Task 9: 运行完整测试套件

**Step 1: 运行所有测试**

```bash
npm test
```
Expected: 所有测试通过

**Step 2: 验证代码覆盖率**

```bash
npm test -- --coverage
```
Expected: 显示覆盖率报告

**Step 3: 最终提交**

```bash
git add .

git commit -m "$(cat <<'EOF'
feat: complete text watermark system implementation

- Zero-width character encoding/decoding
- Global watermark with userId, timestamp, customData
- Paragraph-level fingerprinting
- Text similarity comparison with Levenshtein distance
- Full API: embedWatermark, extractWatermark, compareTexts
- Comprehensive test suite with integration tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## 项目结构

```
text-watermark/
├── src/
│   ├── index.js              # 主入口 API
│   ├── encoder.js            # 零宽字符编码
│   ├── serializer.js         # 数据序列化
│   ├── globalWatermark.js    # 全局水印
│   ├── paragraphFingerprint.js # 段落指纹
│   └── comparator.js         # 文本比对
├── tests/
│   ├── encoder.test.js
│   ├── serializer.test.js
│   ├── globalWatermark.test.js
│   ├── paragraphFingerprint.test.js
│   ├── comparator.test.js
│   ├── index.test.js
│   └── integration.test.js
├── docs/
│   └── plans/
│       ├── 2026-03-02-text-watermark-design.md
│       └── 2026-03-02-text-watermark-implementation.md
├── example.js
├── package.json
└── .gitignore
```

---

## 使用说明

```javascript
const { embedWatermark, extractWatermark, compareTexts } = require('./src/index');

// 嵌入水印
const watermarked = embedWatermark('你的文本内容', {
  userId: 'user123',
  timestamp: Date.now(),
  customData: 'license_info'
});

// 提取水印
const info = extractWatermark(watermarked);
// { userId, timestamp, customData, confidence: 'high' }

// 比对检测
const result = compareTexts(watermarked, suspiciousText);
// { similarity: 0.85, matchedParagraphs: [...], confidence: 'high' }
```
