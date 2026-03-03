// 豪密密码工具 - 核心模块导出

// 类型导出
export type {
  Settings,
  HistoryItem
} from './storage';

export {
  CipherErrorType,
  CipherError
} from './cipher';

// 加密解密
export {
  encrypt,
  decrypt,
  encryptChar,
  decryptChar,
  isValidCiphertext,
  formatCiphertext
} from './cipher';

// 密码本管理
export {
  generateDefaultCodebook,
  findCharPosition,
  getCharAtPosition,
  encodeToClearCode,
  decodeFromClearCode,
  isValidCodebook,
  exportCodebook,
  importCodebook
} from './codebook';

// 乱数生成
export {
  generateRandom,
  generateRandomSequence,
  generateRandomSeed
} from './random';

// 存储
export {
  saveCodebook,
  loadCodebook,
  removeCodebook,
  hasCodebook,
  saveSettings,
  loadSettings,
  addHistory,
  loadHistory,
  clearHistory,
  removeHistoryItem,
  clearAll,
  isStorageAvailable,
  getStorageUsage
} from './storage';
