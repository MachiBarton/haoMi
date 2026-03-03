// 豪密密码工具 - 加密解密单元测试
import { describe, it, expect, beforeAll } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptChar,
  decryptChar,
  isValidCiphertext,
  formatCiphertext,
  CipherError
} from '../cipher';
import { generateDefaultCodebook, encodeToClearCode } from '../codebook';
import { generateRandom } from '../random';
import type { Codebook } from '../../types';

describe('加密解密核心算法', () => {
  let codebook: Codebook;

  beforeAll(async () => {
    codebook = await generateDefaultCodebook();
  });

  describe('明码编码', () => {
    it('应该正确编码汉字为7位明码', () => {
      // 使用三国演义密码本中的第一个字"三"
      const code = encodeToClearCode('三', codebook);
      expect(code).toBe('0010000'); // 第1页第0行第0列 (3位页码+2位行+2位列)
    });

    it('应该返回null当字符不在密码本中', () => {
      const code = encodeToClearCode('𠀀', codebook); // 生僻字
      expect(code).toBeNull();
    });
  });

  describe('乱数生成', () => {
    it('应该生成确定性的乱数', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random2 = generateRandom(1, 123456, 0);
      expect(random1).toBe(random2);
    });

    it('不同位置应该生成不同乱数', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random2 = generateRandom(1, 123456, 1);
      expect(random1).not.toBe(random2);
    });
  });

  describe('单字符加密', () => {
    it('应该正确加密单个中文字符', () => {
      const result = encryptChar('天', codebook, 0);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('chinese');
      expect(result?.cipherCode).toHaveLength(7);
      expect(result?.char).toBe('天');
    });

    it('应该正确加密数字', () => {
      const result = encryptChar('5', codebook, 0);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('digit');
      expect(result?.cipherCode).toMatch(/^7\d{6}$/); // 以7开头的7位数字
      expect(result?.char).toBe('5');
    });

    it('应该正确加密英文字母', () => {
      const result = encryptChar('A', codebook, 0);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('letter');
      expect(result?.cipherCode).toMatch(/^8\d{6}$/); // 以8开头的7位数字
      expect(result?.char).toBe('A');
    });

    it('应该原样返回其他符号', () => {
      const result = encryptChar('!', codebook, 0);
      expect(result).not.toBeNull();
      expect(result?.type).toBe('other');
      expect(result?.cipherCode).toBe('!');
    });

    it('应该返回null当字符不在密码本中', () => {
      const result = encryptChar('𠀀', codebook, 0);
      expect(result).toBeNull();
    });
  });

  describe('字符串加密', () => {
    it('应该正确加密中文字符串', () => {
      const result = encrypt('天地', codebook);
      expect(result.ciphertext).toBeTruthy();
      expect(result.details).toHaveLength(2);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('应该正确加密混合内容（中文+数字+英文）', () => {
      const result = encrypt('Hello天地2024', codebook);
      expect(result.ciphertext).toBeTruthy();
      // 5字母 + 2中文 + 4数字 = 11个加密单元
      expect(result.details).toHaveLength(11);
    });

    it('应该抛出错误当密码本无效', () => {
      expect(() => encrypt('天地', { name: '', version: '', totalPages: 0, pages: [] }))
        .toThrow(CipherError);
    });
  });

  describe('单字符解密', () => {
    it('应该正确解密中文字符', () => {
      const encrypted = encryptChar('天', codebook, 0);
      expect(encrypted).not.toBeNull();

      const decrypted = decryptChar(encrypted!.cipherCode, codebook, 0);
      expect(decrypted).toBe('天');
    });

    it('应该正确解密数字', () => {
      const encrypted = encryptChar('5', codebook, 0);
      expect(encrypted).not.toBeNull();

      const decrypted = decryptChar(encrypted!.cipherCode, codebook, 0);
      expect(decrypted).toBe('5');
    });

    it('应该正确解密英文字母', () => {
      const encrypted = encryptChar('A', codebook, 0);
      expect(encrypted).not.toBeNull();

      const decrypted = decryptChar(encrypted!.cipherCode, codebook, 0);
      expect(decrypted).toBe('A');
    });

    it('应该原样返回其他符号', () => {
      const decrypted = decryptChar('!', codebook, 0);
      expect(decrypted).toBe('!');
    });

    it('应该返回null当密文格式错误', () => {
      const result = decryptChar('12345', codebook, 0); // 5位
      expect(result).toBeNull();
    });
  });

  describe('字符串解密', () => {
    it('应该正确解密密文', () => {
      const original = '天地玄黄';
      const encrypted = encrypt(original, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(original);
    });

    it('应该处理带连字符的密文', () => {
      const decrypted = decrypt('123456-234567-345678', codebook);
      // 可能无法解密（随机数据），但不应该报错
      expect(typeof decrypted).toBe('string');
    });

    it('应该抛出错误当密码本无效', () => {
      expect(() => decrypt('123456', { name: '', version: '', totalPages: 0, pages: [] }))
        .toThrow(CipherError);
    });

    it('应该抛出错误当密文为空', () => {
      expect(() => decrypt('', codebook))
        .toThrow(CipherError);
    });
  });

  describe('加密解密一致性', () => {
    it('加密后解密应该还原原文', () => {
      const testCases = [
        '天地',
        '宇宙洪荒',
        '日月盈昃',
        '辰宿列张寒来暑往'
      ];

      for (const plaintext of testCases) {
        const encrypted = encrypt(plaintext, codebook);
        const decrypted = decrypt(encrypted.ciphertext, codebook);
        expect(decrypted).toBe(plaintext);
      }
    });
  });

  describe('密文格式验证', () => {
    it('应该验证正确的密文格式', () => {
      expect(isValidCiphertext('1234567')).toBe(true);
      expect(isValidCiphertext('1234567-2345678')).toBe(true);
      // 数字密文 (以7开头)
      expect(isValidCiphertext('7123456')).toBe(true);
      // 字母密文 (以8开头)
      expect(isValidCiphertext('8065444')).toBe(true);
      // 符号
      expect(isValidCiphertext('!')).toBe(true);
    });

    it('应该拒绝无效的密文格式', () => {
      expect(isValidCiphertext('')).toBe(false);
      expect(isValidCiphertext('12345')).toBe(false); // 5位
      expect(isValidCiphertext('12345678')).toBe(false); // 8位
      expect(isValidCiphertext('abcdef')).toBe(false); // 非数字
    });
  });

  describe('密文格式化', () => {
    it('应该正确格式化7位数字字符串', () => {
      expect(formatCiphertext('12345678901234')).toBe('1234567-8901234');
    });

    it('应该正确处理带连字符的密文', () => {
      expect(formatCiphertext('1234567-8901234')).toBe('1234567-8901234');
    });
  });
});
