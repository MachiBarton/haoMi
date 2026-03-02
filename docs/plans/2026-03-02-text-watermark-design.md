# 纯文本嵌入式水印系统 - 设计方案

## 项目目标

构建一个基于 Node.js 的纯文本水印系统，支持在文本中嵌入不可见水印（用户ID、时间戳、自定义字符串），并提供提取和比对两种检测方式，能够检测文本是否被第三方部分采用。

## 核心架构

### 分层水印策略

1. **全局水印 (Global Watermark)**
   - 位置：文本开头
   - 编码：零宽 Unicode 字符序列
   - 内容：用户ID + 时间戳 + 自定义字符串的二进制编码
   - 容量：约 100-200 bits

2. **段落指纹 (Paragraph Fingerprint)**
   - 位置：每个段落开头
   - 编码：零宽字符短序列
   - 内容：段落序号 + 段落哈希前几位
   - 目的：支持部分文本检测

3. **文本比对器 (Text Comparator)**
   - 算法：基于文本相似度（Levenshtein + 段落匹配）
   - 功能：计算相似度、定位可疑段落

### 技术选型

- **语言**: Node.js (JavaScript/TypeScript)
- **测试**: Jest
- **核心库**:
  - 零宽字符编解码：自定义实现
  - 文本相似度：自定义 Levenshtein 实现

## API 设计

```javascript
// 嵌入水印
const watermarked = await embedWatermark(text, {
  userId: "user_123",
  timestamp: Date.now(),
  customData: "license_premium"
});

// 提取水印（提取模式）
const info = extractWatermark(watermarkedText);
// 返回: { userId, timestamp, customData, confidence }

// 比对检测（比对模式）
const result = compareTexts(originalWatermarked, suspiciousText);
// 返回: { similarity: 0.85, matchedParagraphs: [...], confidence: "high" }
```

## 零宽字符编码方案

使用以下 Unicode 零宽字符表示二进制数据：
- `\u200B` (零宽空格) = 0
- `\u200C` (零宽非连接符) = 1
- `\u200D` (零宽连接符) = 分隔符
- `\uFEFF` (零宽非断空格) = 标记起始/结束

## 数据格式

```
[FEFF][HEADER][DATA][FEFF]

HEADER: 版本(4bit) + 数据类型(4bit)
DATA: 二进制编码的用户数据
```

## 错误处理

- 水印损坏：返回低置信度 + 比对结果
- 无水印文本：返回 null
- 部分损坏：尽可能恢复数据
