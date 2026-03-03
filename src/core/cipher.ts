// 豪密密码工具 - 加密解密核心算法（分层加密方案）
import type { Codebook, EncryptionResult, EncryptionDetail } from '../types';
import { encodeToClearCode, decodeFromClearCode } from './codebook';
import { generateRandom } from './random';

// 错误类型
export enum CipherErrorType {
  CHAR_NOT_IN_CODEBOOK = 'CHAR_NOT_IN_CODEBOOK',
  INVALID_CIPHER_TEXT = 'INVALID_CIPHER_TEXT',
  INVALID_CODEBOOK = 'INVALID_CODEBOOK',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

// 自定义错误类
export class CipherError extends Error {
  constructor(
    public type: CipherErrorType,
    message: string
  ) {
    super(message);
    this.name = 'CipherError';
  }
}

// 字符类型
export type CharType = 'chinese' | 'digit' | 'letter' | 'other';

/**
 * 识别字符类型
 * @param char - 单个字符
 * @returns 字符类型
 */
export function getCharType(char: string): CharType {
  // 基本CJK汉字 + CJK扩展A-G区
  if (/[\u4e00-\u9fff\u3400-\u4dbf\u{20000}-\u{2a6df}\u{2a700}-\u{2b73f}\u{2b740}-\u{2b81f}\u{2b820}-\u{2ceaf}\u{2ceb0}-\u{2ebef}]/u.test(char)) return 'chinese';
  if (/[0-9]/.test(char)) return 'digit';
  if (/[a-zA-Z]/.test(char)) return 'letter';
  return 'other';
}

/**
 * 加密单个字符（分层加密）
 * @param char - 要加密的字符
 * @param codebook - 密码本
 * @param position - 字符在密文中的位置（用于生成乱数）
 * @returns 加密结果
 */
export function encryptChar(
  char: string,
  codebook: Codebook,
  position: number
): { cipherCode: string; type: CharType; char: string } | null {
  const charType = getCharType(char);

  switch (charType) {
    case 'chinese':
      return encryptChinese(char, codebook, position);
    case 'digit':
      return encryptDigit(char, position);
    case 'letter':
      return encryptLetter(char, position);
    case 'other':
      // 其他符号原样返回，不加密
      return { cipherCode: char, type: 'other', char };
    default:
      return null;
  }
}

/**
 * 加密中文（豪密加密）
 * @param char - 汉字
 * @param codebook - 密码本
 * @param position - 位置
 * @returns 7位密文
 */
function encryptChinese(
  char: string,
  codebook: Codebook,
  position: number
): { cipherCode: string; type: CharType; char: string } | null {
  const clearCode = encodeToClearCode(char, codebook);
  if (!clearCode) return null;

  const pageNum = parseInt(clearCode.slice(0, 3), 10);
  const page = codebook.pages.find(p => p.pageNumber === pageNum);
  if (!page) return null;

  const random = generateRandom(pageNum, page.randomSeed, position);
  const clearCodeNum = parseInt(clearCode, 10);
  let cipherCodeNum = (clearCodeNum + random) % 10000000;

  // 确保中文密文不以7或8开头（保留给数字和英文）
  const firstDigit = Math.floor(cipherCodeNum / 1000000);
  if (firstDigit === 7 || firstDigit === 8) {
    // 映射到9开头，避免冲突
    cipherCodeNum = 9000000 + (cipherCodeNum % 1000000);
  }

  const cipherCode = String(cipherCodeNum).padStart(7, '0');
  return { cipherCode, type: 'chinese', char };
}

/**
 * 加密数字
 * @param char - 数字字符 '0'-'9'
 * @param position - 位置
 * @returns 7位密文 (以7开头)
 */
function encryptDigit(
  char: string,
  position: number
): { cipherCode: string; type: CharType; char: string } | null {
  const digit = parseInt(char, 10); // 0-9
  const random = generateRandom(900, 12345, position); // 使用虚拟页码900
  // 生成以7开头的7位数字：7 + 一位数字(0-9) + 5位随机
  const cipherNum = 7000000 + (digit * 100000) + (random % 100000);
  const cipherCode = String(cipherNum).padStart(7, '0');
  return { cipherCode, type: 'digit', char };
}

/**
 * 加密英文字母
 * @param char - 字母 a-z, A-Z
 * @param position - 位置
 * @returns 7位密文 (以8开头)
 */
function encryptLetter(
  char: string,
  position: number
): { cipherCode: string; type: CharType; char: string } | null {
  const ascii = char.charCodeAt(0); // 'A'=65, 'z'=122
  const random = generateRandom(901, 54321, position); // 使用虚拟页码901
  // 生成以8开头的7位数字：8 + ASCII码(065-122) + 3位随机
  const cipherNum = 8000000 + (ascii * 1000) + (random % 1000);
  const cipherCode = String(cipherNum).padStart(7, '0');
  return { cipherCode, type: 'letter', char };
}

/**
 * 加密字符串（分层加密）
 * @param plaintext - 明文
 * @param codebook - 密码本
 * @returns 加密结果
 */
export function encrypt(
  plaintext: string,
  codebook: Codebook
): EncryptionResult {
  if (!codebook || !codebook.pages || codebook.pages.length === 0) {
    throw new CipherError(
      CipherErrorType.INVALID_CODEBOOK,
      '密码本无效或为空'
    );
  }

  const trimmedInput = plaintext.trim();
  if (!trimmedInput) {
    throw new CipherError(
      CipherErrorType.INVALID_CIPHER_TEXT,
      '输入不能为空'
    );
  }

  const startTime = performance.now();
  const chars = Array.from(plaintext);

  // 检查所有中文字符是否在密码本中
  const missingChars: string[] = [];
  for (const char of chars) {
    if (getCharType(char) === 'chinese') {
      const clearCode = encodeToClearCode(char, codebook);
      if (!clearCode) {
        missingChars.push(char);
      }
    }
  }

  if (missingChars.length > 0) {
    const uniqueChars = [...new Set(missingChars)];
    throw new CipherError(
      CipherErrorType.CHAR_NOT_IN_CODEBOOK,
      `以下字符不在密码本中：${uniqueChars.join('、')}`
    );
  }

  // 执行加密
  const cipherCodes: string[] = [];
  const details: EncryptionDetail[] = [];
  let position = 0;

  for (const char of chars) {
    const result = encryptChar(char, codebook, position);

    if (result) {
      // 过滤标点符号（other类型）
      if (result.type === 'other') {
        continue;
      }

      cipherCodes.push(result.cipherCode);
      details.push({
        char: result.char,
        type: result.type,
        clearCode: result.type === 'chinese' ? result.cipherCode : '',
        random: 0,
        cipherCode: result.cipherCode
      });

      position++;
    }
  }

  const duration = performance.now() - startTime;

  return {
    plaintext,
    ciphertext: cipherCodes.join('-'),
    details,
    duration: Math.round(duration * 100) / 100
  };
}

/**
 * 解密单个密文
 * @param cipherCode - 密文
 * @param codebook - 密码本
 * @param position - 位置
 * @returns 解密后的字符
 */
export function decryptChar(
  cipherCode: string,
  codebook: Codebook,
  position: number
): string | null {
  // 根据前缀判断类型
  // 7位数字密文解密
  if (/^\d{7}$/.test(cipherCode)) {
    const firstDigit = cipherCode[0];
    const cipherCodeNum = parseInt(cipherCode, 10);

    // 根据首位数字判断类型
    if (firstDigit === '7') {
      // 数字解密 (以7开头): 7 + 1位数字 + 5位随机
      const random = generateRandom(900, 12345, position);
      const digitCode = parseInt(cipherCode.slice(1, 2), 10);
      const expectedRandom = random % 100000;
      const actualRandom = parseInt(cipherCode.slice(2), 10);
      // 验证随机数匹配
      if (actualRandom === expectedRandom) {
        return String(digitCode);
      }
      return null;
    }

    if (firstDigit === '8') {
      // 英文解密 (以8开头): 8 + ASCII码(3位) + 3位随机
      const random = generateRandom(901, 54321, position);
      const ascii = parseInt(cipherCode.slice(1, 4), 10);
      const expectedRandom = random % 1000;
      const actualRandom = parseInt(cipherCode.slice(4), 10);
      // 验证随机数匹配，且ASCII在字母范围内
      if (actualRandom === expectedRandom &&
          ((ascii >= 65 && ascii <= 90) || (ascii >= 97 && ascii <= 122))) {
        return String.fromCharCode(ascii);
      }
      return null;
    }

    // 中文解密 (以0-6或9开头)
    // 当首位为9时，可能是原始7xxxxxx或8xxxxxx重新映射而来
    const cipherVariants: number[] = [cipherCodeNum];
    if (firstDigit === '9') {
      // 尝试还原为可能的原始值: 7xxxxxx 或 8xxxxxx
      cipherVariants.push(cipherCodeNum - 2000000); // 可能是从7重新映射来的
      cipherVariants.push(cipherCodeNum - 1000000); // 可能是从8重新映射来的
    }

    for (const page of codebook.pages) {
      for (const cipherVariant of cipherVariants) {
        const random = generateRandom(page.pageNumber, page.randomSeed, position);
        let clearCodeNum = (cipherVariant - random) % 10000000;
        if (clearCodeNum < 0) clearCodeNum += 10000000;

        const clearCode = String(clearCodeNum).padStart(7, '0');
        const pageNum = parseInt(clearCode.slice(0, 3), 10);

        if (pageNum === page.pageNumber) {
          const char = decodeFromClearCode(clearCode, codebook);
          if (char) return char;
        }
      }
    }

    return null;
  }

  // 其他符号（原样返回）- 包括emoji等多字节字符
  // 如果不是7位数字、Nxxx、Exxx格式，则原样返回
  // 但纯数字的非7位格式（如5位、8位）应返回null
  const isValidFormat = /^\d{7}$/.test(cipherCode) ||
                        /^N\d{3}$/.test(cipherCode) ||
                        /^E\d{3}$/.test(cipherCode);
  if (!isValidFormat) {
    // 如果全是数字但格式不对（如5位、8位），返回null
    if (/^\d+$/.test(cipherCode)) {
      return null;
    }
    // 非数字字符原样返回
    return cipherCode;
  }

  return null;
}

/**
 * 解密字符串
 * @param ciphertext - 密文
 * @param codebook - 密码本
 * @returns 解密后的明文字符串
 */
export function decrypt(
  ciphertext: string,
  codebook: Codebook
): string {
  if (!codebook || !codebook.pages || codebook.pages.length === 0) {
    throw new CipherError(
      CipherErrorType.INVALID_CODEBOOK,
      '密码本无效或为空'
    );
  }

  const codes = ciphertext
    .split('-')
    .map(c => c.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, '')) // trim only ASCII whitespace (space, tab, newline, CR, form feed), keep full-width space
    .filter(c => c.length > 0);

  if (codes.length === 0) {
    throw new CipherError(
      CipherErrorType.INVALID_CIPHER_TEXT,
      '密文格式错误，请输入有效的密文'
    );
  }

  const chars: string[] = [];
  let position = 0;

  for (const code of codes) {
    const char = decryptChar(code, codebook, position);
    if (char) {
      chars.push(char);
      // 只有解密的字符才增加位置计数（中文、数字、字母）
      if (/^\d{7}$/.test(code) || code.startsWith('N') || code.startsWith('E')) {
        position++;
      }
    } else {
      console.warn(`无法解密密文 "${code}"`);
    }
  }

  return chars.join('');
}

/**
 * 验证密文格式
 * @param ciphertext - 密文
 * @returns 是否有效
 */
export function isValidCiphertext(ciphertext: string): boolean {
  if (!ciphertext || ciphertext.trim().length === 0) return false;

  const codes = ciphertext
    .split('-')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  if (codes.length === 0) return false;

  return codes.every(code => {
    // 所有密文统一为7位数字（中文/数字/英文）
    if (/^\d{7}$/.test(code)) return true;
    // 其他符号：单个非数字字符（如emoji、标点）原样返回
    // 拒绝多字符字母字符串如'abcdef'
    if (!/^\d+$/.test(code) && code.length === 1) return true;
    return false;
  });
}

/**
 * 格式化密文（添加连字符）
 * @param input - 原始输入
 * @returns 格式化后的密文
 */
export function formatCiphertext(input: string): string {
  // 处理混合格式的密文 - 统一7位数字格式
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    if (/\d/.test(input[i])) {
      // 数字序列，取7位
      let digits = '';
      while (i < input.length && /\d/.test(input[i]) && digits.length < 7) {
        digits += input[i];
        i++;
      }
      if (digits.length === 7) {
        tokens.push(digits);
      } else if (digits.length > 0) {
        tokens.push(digits);
      }
    } else if (/[^\d\s\-]/.test(input[i])) {
      // 非数字、非空白、非连字符的其他符号（如emoji）
      tokens.push(input[i]);
      i++;
    } else {
      // 跳过空白和连字符等分隔符
      i++;
    }
  }

  return tokens.join('-');
}
