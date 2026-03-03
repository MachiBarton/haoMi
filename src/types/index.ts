// 豪密密码工具 - 类型定义

// 密码本页面
export interface CodebookPage {
  pageNumber: number;      // 页码 (1-99)
  rows: number;            // 行数 (固定10)
  cols: number;            // 列数 (固定30)
  characters: string[];    // 300个汉字数组
  randomSeed: number;      // 本页乱数种子
}

// 密码本
export interface Codebook {
  name: string;            // 密码本名称
  version: string;         // 版本号
  totalPages: number;      // 总页数
  pages: CodebookPage[];   // 页面数组
}

// 明码本表格单元格
export interface CodeCell {
  char: string;
  row: number;
  col: number;
  pageNumber: number;
}

// 字符类型
export type CharType = 'chinese' | 'digit' | 'letter' | 'other';

// 加密详情
export interface EncryptionDetail {
  char: string;
  type: CharType;
  clearCode: string;
  random: number;
  cipherCode: string;
}

// 加密结果
export interface EncryptionResult {
  plaintext: string;
  ciphertext: string;
  details: EncryptionDetail[];
  duration: number;
}

// 标签页类型
export type CodebookTab = 'clear' | 'random';

// 加密模式
export type CipherMode = 'encrypt' | 'decrypt';
