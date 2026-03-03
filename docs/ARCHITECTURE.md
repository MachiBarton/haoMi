# 豪密密码加密工具 - 架构设计文档

**版本**: v1.0
**日期**: 2026-03-02

---

## 1. 技术栈确认

| 层级 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 框架 | React | 18.x | 函数组件 + Hooks |
| 语言 | TypeScript | 5.x | 严格模式 |
| 构建工具 | Vite | 5.x | 快速开发体验 |
| 样式 | TailwindCSS | 3.x | 原子化CSS |
| UI组件 | shadcn/ui | latest | 基于Radix UI |
| 图标 | Lucide React | latest | 图标库 |
| 状态管理 | React Context + useState | - | 轻量级状态管理 |
| 存储 | localStorage | - | 浏览器本地存储 |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层 (App)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  加密页面    │  │  解密页面    │  │  密钥管理页面        │  │
│  │  Encrypt    │  │  Decrypt    │  │  KeyManagement      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      业务逻辑层 (Services)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 加密服务    │  │ 解密服务    │  │  密钥生成服务        │  │
│  │ Encryption  │  │ Decryption  │  │  KeyGeneration      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 分页服务    │  │ 乱数生成    │  │  编码转换服务        │  │
│  │ Pagination  │  │ RandomGen   │  │  Encoding           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       核心算法层 (Core)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ 页码加密    │  │ 位置加密    │  │  乱数加密            │  │
│  │ PageCipher  │  │ PosCipher   │  │  RandomCipher       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                       数据层 (Data)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ localStorage│  │  React      │  │  文件导出/导入       │  │
│  │ 持久化存储  │  │  Context    │  │  FileIO             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 加密流程

```
明文输入
    │
    ▼
┌─────────────┐
│  文本预处理  │  ← 去除多余空格、统一换行符
└─────────────┘
    │
    ▼
┌─────────────┐
│  分页处理    │  ← 按300字/页分割
└─────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│           三层加密（每页独立）            │
│  ┌─────────┐ → ┌─────────┐ → ┌────────┐ │
│  │ 页码加密 │ → │ 位置加密 │ → │ 乱数加密│ │
│  │(Page+   │ → │(行列坐标)│ → │(替换表) │ │
│  │ Offset) │   │         │   │        │ │
│  └─────────┘   └─────────┘   └────────┘ │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────┐
│  密文输出    │  ← 格式化密文 + 密钥信息
└─────────────┘
```

---

## 3. 项目目录结构

```
haomi-cipher/
├── public/                     # 静态资源
│   └── favicon.ico
├── src/
│   ├── components/             # 通用组件
│   │   ├── ui/                 # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── alert.tsx
│   │   │   └── label.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx      # 顶部导航
│   │   │   ├── Sidebar.tsx     # 侧边栏（如需要）
│   │   │   └── Footer.tsx      # 底部信息
│   │   ├── cipher/
│   │   │   ├── TextInput.tsx   # 文本输入区
│   │   │   ├── TextOutput.tsx  # 密文输出区
│   │   │   ├── KeyDisplay.tsx  # 密钥显示组件
│   │   │   ├── PageIndicator.tsx # 页码指示器
│   │   │   └── ActionButtons.tsx # 操作按钮组
│   │   └── common/
│   │       ├── CopyButton.tsx  # 复制按钮
│   │       ├── FileUploader.tsx # 文件上传
│   │       └── Toast.tsx       # 提示消息
│   │
│   ├── pages/                  # 页面组件
│   │   ├── EncryptPage.tsx     # 加密页面
│   │   ├── DecryptPage.tsx     # 解密页面
│   │   └── KeyManagementPage.tsx # 密钥管理页面
│   │
│   ├── hooks/                  # 自定义Hooks
│   │   ├── useLocalStorage.ts  # localStorage Hook
│   │   ├── useEncryption.ts    # 加密逻辑Hook
│   │   ├── useDecryption.ts    # 解密逻辑Hook
│   │   └── useCipherHistory.ts # 历史记录Hook
│   │
│   ├── services/               # 业务服务层
│   │   ├── encryption/
│   │   │   ├── index.ts        # 加密服务入口
│   │   │   ├── pageCipher.ts   # 页码加密
│   │   │   ├── positionCipher.ts # 位置加密
│   │   │   └── randomCipher.ts # 乱数加密
│   │   ├── decryption/
│   │   │   ├── index.ts        # 解密服务入口
│   │   │   ├── pageDecipher.ts # 页码解密
│   │   │   ├── positionDecipher.ts # 位置解密
│   │   │   └── randomDecipher.ts # 乱数解密
│   │   ├── key/
│   │   │   ├── index.ts        # 密钥服务入口
│   │   │   ├── generator.ts    # 密钥生成器
│   │   │   ├── parser.ts       # 密钥解析器
│   │   │   └── validator.ts    # 密钥验证器
│   │   └── pagination/
│   │       ├── index.ts        # 分页服务入口
│   │       └── textPaginator.ts # 文本分页器
│   │
│   ├── core/                   # 核心算法
│   │   ├── constants.ts        # 常量定义
│   │   ├── types.ts            # 核心类型定义
│   │   ├── utils.ts            # 工具函数
│   │   ├── cipherTable.ts      # 密码表定义
│   │   └── charMapping.ts      # 字符映射
│   │
│   ├── context/                # React Context
│   │   ├── CipherContext.tsx   # 加密上下文
│   │   └── SettingsContext.tsx # 设置上下文
│   │
│   ├── types/                  # 全局类型定义
│   │   ├── index.ts            # 类型入口
│   │   ├── cipher.ts           # 加密相关类型
│   │   └── storage.ts          # 存储相关类型
│   │
│   ├── utils/                  # 工具函数
│   │   ├── index.ts            # 工具入口
│   │   ├── textProcessor.ts    # 文本处理
│   │   ├── fileHandler.ts      # 文件处理
│   │   └── formatter.ts        # 格式化工具
│   │
│   ├── styles/                 # 样式文件
│   │   └── globals.css         # 全局样式
│   │
│   ├── App.tsx                 # 应用根组件
│   ├── main.tsx                # 应用入口
│   └── vite-env.d.ts           # Vite类型声明
│
├── docs/                       # 文档
│   ├── ARCHITECTURE.md         # 架构设计文档
│   └── PLAN.md                 # 开发计划文档
│
├── index.html                  # HTML入口
├── package.json                # 依赖配置
├── tsconfig.json               # TypeScript配置
├── vite.config.ts              # Vite配置
├── tailwind.config.ts          # Tailwind配置
├── components.json             # shadcn/ui配置
└── README.md                   # 项目说明
```

---

## 4. 模块划分与接口设计

### 4.1 核心类型定义

```typescript
// types/cipher.ts

// 加密密钥结构
interface CipherKey {
  pageOffset: number;           // 页码偏移量 (1-9999)
  rowColKey: string;            // 行列坐标密钥
  randomTable: RandomTable;     // 乱数替换表
  createdAt: number;            // 创建时间戳
}

// 乱数替换表
interface RandomTable {
  forward: Map<string, string>; // 加密映射
  reverse: Map<string, string>; // 解密映射
}

// 分页结果
interface PageResult {
  pages: TextPage[];            // 分页数组
  totalChars: number;           // 总字符数
  totalPages: number;           // 总页数
}

// 单页数据
interface TextPage {
  index: number;                // 页索引
  content: string;              // 页内容
  charCount: number;            // 字符数
}

// 加密结果
interface EncryptionResult {
  ciphertext: string;           // 密文
  key: CipherKey;               // 密钥
  metadata: EncryptionMetadata; // 元数据
}

// 加密元数据
interface EncryptionMetadata {
  originalLength: number;       // 原文长度
  encryptedLength: number;      // 密文长度
  pageCount: number;            // 页数
  timestamp: number;            // 时间戳
}

// 解密结果
interface DecryptionResult {
  plaintext: string;            // 明文
  success: boolean;             // 是否成功
  error?: string;               // 错误信息
}

// 存储的历史记录
interface CipherHistory {
  id: string;                   // 记录ID
  type: 'encrypt' | 'decrypt';  // 操作类型
  preview: string;              // 内容预览
  key: CipherKey;               // 密钥
  timestamp: number;            // 时间戳
}
```

### 4.2 加密服务接口

```typescript
// services/encryption/index.ts

interface IEncryptionService {
  /**
   * 加密文本
   * @param plaintext 明文
   * @param key 加密密钥（可选，不传则自动生成）
   * @returns 加密结果
   */
  encrypt(plaintext: string, key?: Partial<CipherKey>): EncryptionResult;

  /**
   * 生成新密钥
   * @returns 完整密钥
   */
  generateKey(): CipherKey;

  /**
   * 验证密钥有效性
   * @param key 待验证密钥
   * @returns 是否有效
   */
  validateKey(key: Partial<CipherKey>): boolean;
}

class EncryptionService implements IEncryptionService {
  constructor(
    private pageCipher: PageCipherService,
    private positionCipher: PositionCipherService,
    private randomCipher: RandomCipherService,
    private paginator: TextPaginatorService
  ) {}

  encrypt(plaintext: string, key?: Partial<CipherKey>): EncryptionResult;
  generateKey(): CipherKey;
  validateKey(key: Partial<CipherKey>): boolean;
}
```

### 4.3 解密服务接口

```typescript
// services/decryption/index.ts

interface IDecryptionService {
  /**
   * 解密密文
   * @param ciphertext 密文
   * @param key 解密密钥
   * @returns 解密结果
   */
  decrypt(ciphertext: string, key: CipherKey): DecryptionResult;

  /**
   * 从密钥字符串解析密钥
   * @param keyString 密钥字符串
   * @returns 解析后的密钥
   */
  parseKey(keyString: string): CipherKey | null;
}

class DecryptionService implements IDecryptionService {
  constructor(
    private pageDecipher: PageDecipherService,
    private positionDecipher: PositionDecipherService,
    private randomDecipher: RandomDecipherService
  ) {}

  decrypt(ciphertext: string, key: CipherKey): DecryptionResult;
  parseKey(keyString: string): CipherKey | null;
}
```

### 4.4 分页服务接口

```typescript
// services/pagination/index.ts

interface IPaginationConfig {
  charsPerPage: number;         // 每页字符数（默认300）
  preserveWords: boolean;       // 是否保持单词完整
}

interface ITextPaginatorService {
  /**
   * 分页文本
   * @param text 原文
   * @param config 分页配置
   * @returns 分页结果
   */
  paginate(text: string, config?: Partial<IPaginationConfig>): PageResult;

  /**
   * 合并分页
   * @param pages 页数组
   * @returns 合并后的文本
   */
  mergePages(pages: TextPage[]): string;
}
```

### 4.5 存储服务接口

```typescript
// hooks/useLocalStorage.ts

interface IStorageService<T> {
  /**
   * 获取数据
   */
  get(): T | null;

  /**
   * 保存数据
   */
  set(data: T): void;

  /**
   * 删除数据
   */
  remove(): void;

  /**
   * 清空所有数据
   */
  clear(): void;
}

// 历史记录存储
interface IHistoryStorage {
  getAll(): CipherHistory[];
  add(record: CipherHistory): void;
  remove(id: string): void;
  clear(): void;
}
```

---

## 5. 组件清单

### 5.1 页面组件

| 组件名 | 路径 | 职责 | 复杂度 |
|--------|------|------|--------|
| EncryptPage | pages/EncryptPage.tsx | 加密功能主页面 | 高 |
| DecryptPage | pages/DecryptPage.tsx | 解密功能主页面 | 高 |
| KeyManagementPage | pages/KeyManagementPage.tsx | 密钥管理页面 | 中 |

### 5.2 业务组件

| 组件名 | 路径 | 职责 | 复杂度 |
|--------|------|------|--------|
| TextInput | components/cipher/TextInput.tsx | 多行文本输入区 | 中 |
| TextOutput | components/cipher/TextOutput.tsx | 密文/明文输出区 | 中 |
| KeyDisplay | components/cipher/KeyDisplay.tsx | 密钥显示与复制 | 中 |
| PageIndicator | components/cipher/PageIndicator.tsx | 页码指示器 | 低 |
| ActionButtons | components/cipher/ActionButtons.tsx | 加密/解密/清空按钮 | 低 |

### 5.3 通用组件

| 组件名 | 路径 | 职责 | 复杂度 |
|--------|------|------|--------|
| CopyButton | components/common/CopyButton.tsx | 复制到剪贴板 | 低 |
| FileUploader | components/common/FileUploader.tsx | 文件上传处理 | 中 |
| Toast | components/common/Toast.tsx | 消息提示 | 低 |
| Header | components/layout/Header.tsx | 顶部导航栏 | 低 |

### 5.4 shadcn/ui 组件

| 组件名 | 用途 |
|--------|------|
| Button | 操作按钮 |
| Card | 内容卡片容器 |
| Input | 单行输入 |
| Textarea | 多行文本输入 |
| Tabs | 页面切换 |
| Dialog | 弹窗对话框 |
| Select | 下拉选择 |
| Alert | 警告提示 |
| Label | 表单标签 |

---

## 6. 核心算法设计

### 6.1 页码加密算法

```typescript
// 页码加密：将页码转换为偏移后的编码
// 公式: encodedPage = (pageIndex + pageOffset) % 10000

function pageEncrypt(pageIndex: number, pageOffset: number): string {
  const encoded = (pageIndex + pageOffset) % 10000;
  return encoded.toString().padStart(4, '0');
}

function pageDecrypt(encodedPage: string, pageOffset: number): number {
  const encoded = parseInt(encodedPage, 10);
  let pageIndex = (encoded - pageOffset) % 10000;
  if (pageIndex < 0) pageIndex += 10000;
  return pageIndex;
}
```

### 6.2 位置加密算法

```typescript
// 位置加密：将字符在页内的位置转换为行列坐标
// 假设每行30字，每页10行（共300字）

const ROWS_PER_PAGE = 10;
const COLS_PER_ROW = 30;

interface Position {
  row: number;      // 行号 (0-9)
  col: number;      // 列号 (0-29)
}

function positionEncrypt(charIndex: number, key: string): Position {
  // 使用密钥派生行列映射
  const row = charIndex % ROWS_PER_PAGE;
  const col = Math.floor(charIndex / ROWS_PER_PAGE);
  // 根据密钥进行置换
  return applyKeyTransform({ row, col }, key);
}

function positionDecrypt(pos: Position, key: string): number {
  const reversed = reverseKeyTransform(pos, key);
  return reversed.col * ROWS_PER_PAGE + reversed.row;
}
```

### 6.3 乱数加密算法

```typescript
// 乱数加密：使用替换表进行字符替换

class RandomCipher {
  private forwardTable: Map<string, string>;
  private reverseTable: Map<string, string>;

  constructor(seed: string) {
    const tables = this.generateTables(seed);
    this.forwardTable = tables.forward;
    this.reverseTable = tables.reverse;
  }

  encrypt(char: string): string {
    return this.forwardTable.get(char) || char;
  }

  decrypt(char: string): string {
    return this.reverseTable.get(char) || char;
  }

  private generateTables(seed: string): { forward: Map<string, string>, reverse: Map<string, string> } {
    // 基于种子生成伪随机替换表
    // 确保可逆性
  }
}
```

---

## 7. 数据流设计

### 7.1 加密流程数据流

```
用户输入
    │
    ▼
┌─────────────────┐
│   TextInput     │ ──onChange──┐
│   (受控组件)     │              │
└─────────────────┘              │
    │                            │
    ▼                            ▼
┌─────────────────┐     ┌─────────────────┐
│ CipherContext   │◄────│   useState      │
│   (状态管理)     │     │   (本地状态)     │
└─────────────────┘     └─────────────────┘
    │
    ▼ 用户点击加密
┌─────────────────┐
│ EncryptionService│
│   (加密服务)     │
└─────────────────┘
    │
    ├──► PageCipher ──► PositionCipher ──► RandomCipher
    │
    ▼
┌─────────────────┐
│ EncryptionResult│
└─────────────────┘
    │
    ├──► TextOutput (显示密文)
    ├──► KeyDisplay (显示密钥)
    └──► localStorage (保存历史)
```

### 7.2 Context 结构

```typescript
// context/CipherContext.tsx

interface CipherState {
  // 输入状态
  plaintext: string;
  ciphertext: string;
  currentKey: CipherKey | null;

  // UI状态
  isEncrypting: boolean;
  isDecrypting: boolean;
  error: string | null;

  // 历史记录
  history: CipherHistory[];
}

type CipherAction =
  | { type: 'SET_PLAINTEXT'; payload: string }
  | { type: 'SET_CIPHERTEXT'; payload: string }
  | { type: 'SET_KEY'; payload: CipherKey }
  | { type: 'ENCRYPT_START' }
  | { type: 'ENCRYPT_SUCCESS'; payload: EncryptionResult }
  | { type: 'ENCRYPT_ERROR'; payload: string }
  | { type: 'DECRYPT_START' }
  | { type: 'DECRYPT_SUCCESS'; payload: DecryptionResult }
  | { type: 'DECRYPT_ERROR'; payload: string }
  | { type: 'CLEAR' }
  | { type: 'ADD_HISTORY'; payload: CipherHistory }
  | { type: 'CLEAR_HISTORY' };
```

---

## 8. 存储设计

### 8.1 localStorage 结构

```typescript
// 存储键名常量
const STORAGE_KEYS = {
  HISTORY: 'haomi:history',           // 历史记录
  SETTINGS: 'haomi:settings',         // 用户设置
  CURRENT_KEY: 'haomi:currentKey',    // 当前密钥缓存
  DRAFT: 'haomi:draft',               // 草稿
} as const;

// 历史记录存储格式
interface HistoryStorage {
  version: number;                    // 数据版本
  records: CipherHistory[];           // 记录数组
  lastUpdated: number;                // 最后更新时间
}

// 设置存储格式
interface SettingsStorage {
  version: number;
  charsPerPage: number;               // 每页字符数
  autoSave: boolean;                  // 自动保存
  theme: 'light' | 'dark' | 'auto';   // 主题设置
}
```

### 8.2 存储限制处理

- 历史记录最多保存50条
- 单条记录密文最大长度10000字符
- 使用LRU策略清理旧记录
- 定期自动清理过期数据（30天）

---

## 9. 安全设计

### 9.1 密钥安全

- 密钥仅在内存中处理，不持久化存储
- 提供密钥导出功能，用户自行保存
- 支持密钥导入，便于跨设备解密

### 9.2 数据安全

- 所有加密操作在浏览器本地完成
- 无服务端交互，无网络传输
- localStorage数据可被用户清除

---

## 10. 性能优化

### 10.1 渲染优化

- 使用 React.memo 优化纯展示组件
- 使用 useMemo 缓存计算结果
- 使用 useCallback 稳定回调函数引用
- 虚拟滚动处理长文本（如需要）

### 10.2 计算优化

- 加密操作使用 Web Worker（大文本）
- 分页计算防抖处理
- 密钥生成缓存

### 10.3 存储优化

- 历史记录异步保存
- 大文本分片存储
- 定期清理过期数据

---

## 11. 错误处理

### 11.1 错误类型

```typescript
enum CipherErrorType {
  INVALID_KEY = 'INVALID_KEY',           // 密钥无效
  INVALID_CIPHERTEXT = 'INVALID_CIPHERTEXT', // 密文格式错误
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',   // 解密失败
  STORAGE_FULL = 'STORAGE_FULL',         // 存储空间不足
  TEXT_TOO_LONG = 'TEXT_TOO_LONG',       // 文本过长
}

interface CipherError {
  type: CipherErrorType;
  message: string;
  details?: unknown;
}
```

### 11.2 错误处理策略

- 用户输入错误：即时提示，不阻断操作
- 加密错误：显示错误信息，保留原文
- 解密错误：显示错误信息，提供调试信息
- 存储错误：降级处理，提示用户

---

## 12. 扩展性设计

### 12.1 算法扩展

- 加密算法模块化，支持新增算法
- 通过策略模式切换算法
- 预留插件接口

### 12.2 功能扩展

- 支持多种导出格式（文本、PDF、图片）
- 支持批量加密/解密
- 支持文件加密（未来）

---

## 13. 浏览器兼容性

### 13.1 目标浏览器

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 13.2 降级策略

- 使用 core-js  polyfill
- CSS 使用 autoprefixer
- 功能检测优先于浏览器检测

---

## 14. 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 架构设计 | docs/ARCHITECTURE.md | 本文档 |
| 开发计划 | docs/PLAN.md | 开发计划与里程碑 |
| API文档 | docs/API.md | 接口详细文档（开发中） |
| 用户手册 | docs/USER_GUIDE.md | 用户使用说明（开发中） |

---

## 15. 附录

### 15.1 术语表

| 术语 | 说明 |
|------|------|
| 豪密 | 本项目采用的加密算法名称 |
| 页码加密 | 第一层加密，基于页码偏移 |
| 位置加密 | 第二层加密，基于字符位置坐标 |
| 乱数加密 | 第三层加密，基于随机替换表 |
| 密钥 | 包含页码偏移、行列密钥、乱数表 |

### 15.2 参考资料

- 豪密加密算法规范
- React 18 官方文档
- shadcn/ui 组件文档
- TailwindCSS 文档
