# 豪密密码工具 - 技术规范

## 1. 核心算法实现

### 1.1 明码编码（中文）

```typescript
// 汉字 → 明码（7位数字）
// 页码(3位) + 行号(2位) + 列号(2位)
function encodeToClearCode(
  char: string,
  codebook: Codebook
): string | null {
  for (const page of codebook.pages) {
    const index = page.characters.indexOf(char);
    if (index !== -1) {
      const row = Math.floor(index / page.cols);
      const col = index % page.cols;
      return `${String(page.pageNumber).padStart(3, '0')}${String(row).padStart(2, '0')}${String(col).padStart(2, '0')}`;
    }
  }
  return null; // 字符不在密码本中
}
```

### 1.2 明码解码（中文）

```typescript
// 明码（7位数字） → 汉字
function decodeFromClearCode(
  code: string,
  codebook: Codebook
): string | null {
  const pageNum = parseInt(code.slice(0, 3));
  const row = parseInt(code.slice(3, 5));
  const col = parseInt(code.slice(5, 7));

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
  return (seed * pageNumber * (position + 1)) % 10000000;
}
```

### 1.4 分层加密

```typescript
// 加密单个字符（分层加密）
function encryptChar(
  char: string,
  codebook: Codebook,
  position: number
): { cipherCode: string; type: CharType } | null {
  const charType = getCharType(char);

  switch (charType) {
    case 'chinese':
      return encryptChinese(char, codebook, position);
    case 'digit':
      return encryptDigit(char, position);
    case 'letter':
      return encryptLetter(char, position);
    case 'other':
      return null; // 标点符号过滤
  }
}

// 中文加密（豪密）
function encryptChinese(char, codebook, position) {
  const clearCode = encodeToClearCode(char, codebook);
  const pageNum = parseInt(clearCode.slice(0, 3));
  const page = codebook.pages.find(p => p.pageNumber === pageNum);
  const random = generateRandom(pageNum, page.randomSeed, position);

  let cipherCodeNum = (parseInt(clearCode) + random) % 10000000;

  // 确保不以7或8开头（保留给数字和英文）
  const firstDigit = Math.floor(cipherCodeNum / 1000000);
  if (firstDigit === 7 || firstDigit === 8) {
    cipherCodeNum = 9000000 + (cipherCodeNum % 1000000);
  }

  return String(cipherCodeNum).padStart(7, '0');
}

// 数字加密（7开头）
function encryptDigit(char, position) {
  const digit = parseInt(char);
  const random = generateRandom(900, 12345, position);
  // 7 + 数字(1位) + 随机(5位)
  const cipherNum = 7000000 + (digit * 100000) + (random % 100000);
  return String(cipherNum).padStart(7, '0');
}

// 英文加密（8开头）
function encryptLetter(char, position) {
  const ascii = char.charCodeAt(0);
  const random = generateRandom(901, 54321, position);
  // 8 + ASCII码(3位) + 随机(3位)
  const cipherNum = 8000000 + (ascii * 1000) + (random % 1000);
  return String(cipherNum).padStart(7, '0');
}
```

### 1.5 解密

```typescript
// 解密单个密文
function decryptChar(
  cipherCode: string,
  codebook: Codebook,
  position: number
): string | null {
  if (!/^\d{7}$/.test(cipherCode)) return null;

  const firstDigit = cipherCode[0];

  if (firstDigit === '7') {
    // 数字解密
    return decryptDigit(cipherCode, position);
  }

  if (firstDigit === '8') {
    // 英文解密
    return decryptLetter(cipherCode, position);
  }

  // 中文解密（0-6或9开头）
  return decryptChinese(cipherCode, codebook, position);
}
```

## 2. 密码本管理

### 2.1 默认密码本加载

```typescript
// 从三国演义.txt加载默认密码本
async function generateDefaultCodebook(): Promise<Codebook> {
  const response = await fetch('/haoMi/三国演义.txt');
  const content = await response.text();

  // 提取所有汉字（包含重复）
  const chars: string[] = [];
  for (const char of content) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      chars.push(char);
    }
  }

  // 按300字/页分页
  const charsPerPage = 300;
  const maxPages = Math.ceil(chars.length / charsPerPage);

  const pages: CodebookPage[] = [];
  for (let i = 0; i < maxPages; i++) {
    const pageChars = chars.slice(i * charsPerPage, (i + 1) * charsPerPage);
    // 补足300字
    while (pageChars.length < charsPerPage) {
      pageChars.push('');
    }

    pages.push({
      pageNumber: i + 1,
      rows: 10,
      cols: 30,
      characters: pageChars,
      randomSeed: generateRandomSeed()
    });
  }

  return {
    name: '三国演义密码本-V1',
    version: '1.0.0',
    totalPages: pages.length,
    pages
  };
}
```

### 2.2 密码本导入导出

```typescript
// 从txt文件导入密码本
function importCodebookFromTxt(content: string): Codebook {
  const chars = Array.from(content).filter(c => /[\u4e00-\u9fa5]/.test(c));

  const charsPerPage = 300;
  const totalPages = Math.ceil(chars.length / charsPerPage);
  const pages = [];

  for (let i = 0; i < totalPages; i++) {
    const pageChars = chars.slice(i * charsPerPage, (i + 1) * charsPerPage);
    while (pageChars.length < charsPerPage) {
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
    name: `自定义密码本-${new Date().toISOString().split('T')[0]}`,
    version: '1.0.0',
    totalPages: pages.length,
    pages
  };
}

// 导出密码本为txt
function exportCodebookToTxt(codebook: Codebook): string {
  return codebook.pages.flatMap(page => page.characters).join('');
}
```

## 3. 组件接口设计

### 3.1 CipherPanel Props

```typescript
interface CipherPanelProps {
  codebook: Codebook;
  mode: 'encrypt' | 'decrypt';
  onModeChange: (mode: 'encrypt' | 'decrypt') => void;
  onEncrypt?: (plaintext: string) => EncryptionResult;
  onDecrypt?: (ciphertext: string) => string;
}

interface EncryptionResult {
  plaintext: string;
  ciphertext: string;
  details: EncryptionDetail[];
  duration: number;
}

interface EncryptionDetail {
  char: string;
  type: 'chinese' | 'digit' | 'letter';
  clearCode: string;
  random: number;
  cipherCode: string;
}
```

### 3.2 CodebookPanel Props

```typescript
interface CodebookPanelProps {
  codebook: Codebook;
  currentPage: number;
  onPageChange: (page: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
}
```

### 3.3 MorseCodeModal Props

```typescript
interface MorseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ciphertext: string;
}
```

## 4. 样式规范

### 4.1 颜色变量

```css
:root {
  --primary: #8a0000;
  --primary-dark: #5e0000;
  --paper: #fcf8f3;
  --paper-dark: #e8e0d5;
  --accent: #00aa00;       /* 成功/发报完成 */
  --ink: #1d0c0c;
  --ink-light: #4a3b3b;
}
```

### 4.2 字体

```css
font-family: 'Noto Serif SC', serif;  /* 主字体 */
font-family: 'Courier New', monospace; /* 等宽字体（密文） */
```

### 4.3 组件尺寸

```css
/* 摩尔斯电码显示块 */
.morse-block {
  width: 64px;
  height: 56px;
}

/* 移动步长 */
.translate-step {
  /* 块宽(64px) + gap(4px) = 68px */
  transform: translateX(calc(50% - var(--index) * 68px - 34px));
}
```

## 5. 摩尔斯电码实现

### 5.1 数字到摩尔斯映射

```typescript
const MORSE_CODE_MAP: Record<string, string> = {
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '-': '-...-',
};
```

### 5.2 Web Audio API 音效

```typescript
class Sounder {
  private context: AudioContext;
  private oscillator: OscillatorNode;
  private gainNode: GainNode;
  private rampTime = 0.003;

  constructor() {
    this.context = new AudioContext();
    this.oscillator = this.context.createOscillator();
    this.gainNode = this.context.createGain();

    this.gainNode.gain.setValueAtTime(0, this.context.currentTime);
    this.oscillator.frequency.setValueAtTime(600, this.context.currentTime);
    this.oscillator.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
    this.oscillator.start(0);
  }

  playTone(start: number, length: number, frequency = 600): number {
    const end = start + length;
    this.oscillator.frequency.setValueAtTime(frequency, start);
    this.gainNode.gain.setTargetAtTime(1.0, start, this.rampTime);
    this.gainNode.gain.setTargetAtTime(0.0, end, this.rampTime);
    return end;
  }
}
```

## 6. 错误处理

### 6.1 错误类型

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

### 6.2 用户提示

- **字符不在密码本中**：红色提示"以下字符不在密码本中：X、Y"
- **无效密文**：红色提示"密文格式错误，请检查输入"
- **密码本加载失败**：提示"密码本加载失败，请检查文件"

## 7. 存储策略

### 7.1 密码本存储

- **不存储在localStorage**：密码本文件通常超过5MB限制
- **动态加载**：每次页面加载从 `/haoMi/三国演义.txt` 获取
- **内存缓存**：加载后缓存在内存中，避免重复请求

### 7.2 配置存储（可选）

```typescript
const STORAGE_KEYS = {
  SETTINGS: 'haomi:settings',      // 用户设置
  THEME: 'haomi:theme',            // 主题偏好
};
```

## 8. 性能优化

### 8.1 渲染优化

- 使用 `useMemo` 缓存密码本查找结果
- 分页渲染密码本（虚拟滚动）
- 加密过程使用 `requestAnimationFrame`

### 8.2 计算优化

- 密码本使用 Map 结构加速查找
- 乱数生成使用位运算优化
- 批量加密时避免频繁状态更新

### 8.3 加载优化

- 密码本文件使用 gzip 压缩
- 使用 `fetch` 的缓存策略
- 首屏优先渲染UI，密码本异步加载
