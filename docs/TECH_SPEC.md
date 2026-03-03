# 豪密密码工具 - 技术规范

## 1. 核心算法实现

### 1.1 明码编码
```typescript
// 汉字 → 明码（6位数字）
function encodeToClearCode(
  char: string,
  codebook: Codebook
): string | null {
  for (const page of codebook.pages) {
    const index = page.characters.indexOf(char);
    if (index !== -1) {
      const row = Math.floor(index / page.cols);
      const col = index % page.cols;
      return `${String(page.pageNumber).padStart(2, '0')}${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`;
    }
  }
  return null; // 字符不在密码本中
}
```

### 1.2 明码解码
```typescript
// 明码（6位数字） → 汉字
function decodeFromClearCode(
  code: string,
  codebook: Codebook
): string | null {
  const pageNum = parseInt(code.slice(0, 2));
  const row = parseInt(code.slice(2, 4));
  const col = parseInt(code.slice(4, 6));

  const page = codebook.pages.find(p => p.pageNumber === pageNum);
  if (!page) return null;

  const index = row * page.cols + col;
  return page.characters[index] || null;
}
```

### 1.3 乱数生成
```typescript
// 基于页码和位置生成乱数
function generateRandom(
  pageNumber: number,
  seed: number,
  position: number
): number {
  // LCG算法简化版
  return (seed * pageNumber * (position + 1)) % 1000000;
}
```

### 1.4 加密
```typescript
// 加密单个字符
function encryptChar(
  char: string,
  codebook: Codebook,
  position: number
): string | null {
  const clearCode = encodeToClearCode(char, codebook);
  if (!clearCode) return null;

  const pageNum = parseInt(clearCode.slice(0, 2));
  const page = codebook.pages.find(p => p.pageNumber === pageNum);
  if (!page) return null;

  const random = generateRandom(pageNum, page.randomSeed, position);
  const cipherCode = (parseInt(clearCode) + random) % 1000000;

  return String(cipherCode).padStart(6, '0');
}

// 加密字符串
function encrypt(
  plaintext: string,
  codebook: Codebook
): string {
  const chars = Array.from(plaintext).filter(c => /[\u4e00-\u9fa5]/.test(c));
  const cipherCodes: string[] = [];

  for (let i = 0; i < chars.length; i++) {
    const code = encryptChar(chars[i], codebook, i);
    if (code) cipherCodes.push(code);
  }

  return cipherCodes.join('-');
}
```

### 1.5 解密
```typescript
// 解密
function decrypt(
  ciphertext: string,
  codebook: Codebook
): string {
  const codes = ciphertext.split('-').filter(c => c.length === 6);
  const chars: string[] = [];

  for (let i = 0; i < codes.length; i++) {
    const cipherCode = parseInt(codes[i]);

    // 遍历所有可能的页码
    for (const page of codebook.pages) {
      const random = generateRandom(page.pageNumber, page.randomSeed, i);
      let clearCodeNum = (cipherCode - random) % 1000000;
      if (clearCodeNum < 0) clearCodeNum += 1000000;

      const clearCode = String(clearCodeNum).padStart(6, '0');
      const pageNum = parseInt(clearCode.slice(0, 2));

      if (pageNum === page.pageNumber) {
        const char = decodeFromClearCode(clearCode, codebook);
        if (char) {
          chars.push(char);
          break;
        }
      }
    }
  }

  return chars.join('');
}
```

## 2. 默认密码本生成

```typescript
// 使用《千字文》生成默认密码本
const QIANZIWEN = `天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏...
...余成岁律吕调阳云腾致雨露结为霜...`;

function generateDefaultCodebook(): Codebook {
  const chars = Array.from(QIANZIWEN).filter(c => /[\u4e00-\u9fa5]/.test(c));
  const pagesPerPage = 300;
  const totalPages = Math.ceil(chars.length / pagesPerPage);

  const pages: CodebookPage[] = [];
  for (let i = 0; i < totalPages && i < 100; i++) {
    const pageChars = chars.slice(i * pagesPerPage, (i + 1) * pagesPerPage);
    // 补足300字
    while (pageChars.length < 300) {
      pageChars.push('');
    }

    pages.push({
      pageNumber: i + 1,
      rows: 10,
      cols: 30,
      characters: pageChars,
      randomSeed: Math.floor(Math.random() * 900000) + 100000
    });
  }

  return {
    name: '红色星火-1930-V1',
    version: '1.0.0',
    totalPages: pages.length,
    pages
  };
}
```

## 3. 组件接口设计

### 3.1 CodebookPanel Props
```typescript
interface CodebookPanelProps {
  codebook: Codebook;
  currentPage: number;
  onPageChange: (page: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
}
```

### 3.2 CipherPanel Props
```typescript
interface CipherPanelProps {
  codebook: Codebook;
  mode: 'encrypt' | 'decrypt';
  onModeChange: (mode: 'encrypt' | 'decrypt') => void;
}

interface EncryptionResult {
  plaintext: string;
  ciphertext: string;
  details: {
    char: string;
    clearCode: string;
    random: number;
    cipherCode: string;
  }[];
  duration: number;
}
```

## 4. 样式规范

### 4.1 颜色变量
```css
:root {
  --primary: #8a0000;
  --primary-dark: #5e0000;
  --secondary: #2b2b2b;
  --paper: #fcf8f3;
  --paper-dark: #e8e0d5;
  --accent: #d4af37;
  --ink: #1d0c0c;
  --ink-light: #4a3b3b;
}
```

### 4.2 字体
```css
font-family: 'Noto Serif SC', serif;  /* 主字体 */
font-family: 'Courier New', monospace; /* 等宽字体（密文） */
```

### 4.3 间距
- 基础单位：4px
- 小间距：8px
- 中间距：16px
- 大间距：24px
- 超大间距：32px

## 5. 错误处理

### 5.1 错误类型
```typescript
enum CipherErrorType {
  CHAR_NOT_IN_CODEBOOK = 'CHAR_NOT_IN_CODEBOOK',
  INVALID_CIPHER_TEXT = 'INVALID_CIPHER_TEXT',
  INVALID_CODEBOOK = 'INVALID_CODEBOOK',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

class CipherError extends Error {
  constructor(
    public type: CipherErrorType,
    message: string
  ) {
    super(message);
  }
}
```

### 5.2 用户提示
- 字符不在密码本中：红色提示"字符[X]不在当前密码本中"
- 无效密文：红色提示"密文格式错误，请检查输入"
- 存储错误：红色提示"本地存储失败，请检查浏览器设置"
