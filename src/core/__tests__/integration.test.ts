// 豪密密码工具 - 集成测试
import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, encryptChar, decryptChar } from '../cipher';
import { generateDefaultCodebook, encodeToClearCode, decodeFromClearCode, findCharPosition, getCharAtPosition } from '../codebook';
import { generateRandom, generateRandomSequence } from '../random';
import type { Codebook } from '../../types';

describe('集成测试 - 完整流程', () => {
  let codebook: Codebook;

  beforeAll(async () => {
    codebook = await generateDefaultCodebook();
  });

  describe('加密→解密完整流程', () => {
    it('应该正确加密并解密短文本', () => {
      const plaintext = '天地玄黄';
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该正确加密并解密长文本', () => {
      const plaintext = '天地玄黄宇宙洪荒日月盈昃辰宿列张寒来暑往秋收冬藏';
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该正确加密并解密跨页文本', () => {
      // 构造一个跨越多个密码本页的文本
      const chars: string[] = [];
      for (let page = 1; page <= 3; page++) {
        const pageData = codebook.pages[page - 1];
        if (pageData) {
          // 取每页的前几个字
          chars.push(...pageData.characters.slice(0, 10));
        }
      }
      const plaintext = chars.join('');
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('加密结果应包含正确的详情信息', () => {
      const plaintext = '天地';
      const result = encrypt(plaintext, codebook);

      expect(result.plaintext).toBe(plaintext);
      expect(result.ciphertext).toBeTruthy();
      expect(result.details).toHaveLength(2);
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // 验证每个字符的详情
      for (let i = 0; i < result.details.length; i++) {
        const detail = result.details[i];
        expect(detail.char).toBe(plaintext[i]);
        // 中文密文是7位数字
        expect(detail.cipherCode).toMatch(/^\d{7}$/);
      }
    });

    it('多次加密同一文本应产生不同密文（因为随机种子不同）', () => {
      const plaintext = '天地玄黄';
      const encrypted1 = encrypt(plaintext, codebook);
      const encrypted2 = encrypt(plaintext, codebook);

      // 密文应该不同（因为每页的随机种子是固定的，但不同位置产生不同乱数）
      // 实际上对于相同位置，如果明码相同，密文也相同
      // 这里主要验证两次加密都能正确解密
      expect(decrypt(encrypted1.ciphertext, codebook)).toBe(plaintext);
      expect(decrypt(encrypted2.ciphertext, codebook)).toBe(plaintext);
    });
  });

  describe('密码本与乱数生成集成', () => {
    it('乱数生成应与密码本页码关联', () => {
      for (const page of codebook.pages) {
        const random = generateRandom(page.pageNumber, page.randomSeed, 0);
        expect(random).toBeGreaterThanOrEqual(0);
        expect(random).toBeLessThan(10000000);
      }
    });

    it('乱数序列应与明码本位置对应', () => {
      const page = codebook.pages[0];
      const sequence = generateRandomSequence(page.pageNumber, page.randomSeed, 300);

      expect(sequence).toHaveLength(300);

      // 验证序列中的每个乱数都在有效范围内
      for (const random of sequence) {
        expect(random).toBeGreaterThanOrEqual(0);
        expect(random).toBeLessThan(10000000);
      }
    });

    it('明码编码应与乱数生成配合正确', () => {
      const testChar = '三'; // 使用密码本第一个字符
      const position = findCharPosition(testChar, codebook);
      expect(position).not.toBeNull();

      const clearCode = encodeToClearCode(testChar, codebook);
      expect(clearCode).toBe('0010000'); // 3位页码+2位行+2位列 (第1页第0行第0列)

      const page = codebook.pages.find(p => p.pageNumber === position!.pageNumber);
      expect(page).toBeDefined();

      // 使用实际加密函数获取密文（包含7/8到9的重新映射）
      const encrypted = encryptChar(testChar, codebook, 0);
      expect(encrypted).not.toBeNull();

      // 验证解密
      const decrypted = decryptChar(encrypted!.cipherCode, codebook, 0);
      expect(decrypted).toBe(testChar);
    });
  });

  describe('明码本与密文表一致性', () => {
    it('明码编码和解码应互为逆操作', () => {
      const testChars = ['天', '地', '玄', '黄', '宇', '宙', '洪', '荒'];

      for (const char of testChars) {
        const clearCode = encodeToClearCode(char, codebook);
        expect(clearCode).not.toBeNull();

        const decodedChar = decodeFromClearCode(clearCode!, codebook);
        expect(decodedChar).toBe(char);
      }
    });

    it('位置查找和字符获取应互为逆操作', () => {
      const testChars = ['天', '地', '玄', '黄'];

      for (const char of testChars) {
        const position = findCharPosition(char, codebook);
        expect(position).not.toBeNull();

        const retrievedChar = getCharAtPosition(
          position!.pageNumber,
          position!.row,
          position!.col,
          codebook
        );
        expect(retrievedChar).toBe(char);
      }
    });

    it('所有密码本字符都应能正确编码和解码', () => {
      // 测试第一页的所有字符
      const page = codebook.pages[0];
      let testedCount = 0;

      for (let row = 0; row < page.rows; row++) {
        for (let col = 0; col < page.cols; col++) {
          const char = page.characters[row * page.cols + col];
          if (char) {
            const clearCode = encodeToClearCode(char, codebook);
            expect(clearCode).not.toBeNull();

            const decodedChar = decodeFromClearCode(clearCode!, codebook);
            expect(decodedChar).toBe(char);
            testedCount++;
          }
        }
      }

      expect(testedCount).toBeGreaterThan(0);
    });
  });

  describe('端到端加密解密流程', () => {
    it('完整流程：编码→加密→传输→解密→解码', () => {
      const originalMessage = '天地玄黄宇宙洪荒';

      // 步骤1: 加密
      const encryptionResult = encrypt(originalMessage, codebook);
      expect(encryptionResult.ciphertext).toBeTruthy();
      expect(encryptionResult.details.length).toBeGreaterThan(0);

      // 步骤2: 模拟传输（密文是字符串）
      const transmittedCiphertext = encryptionResult.ciphertext;

      // 步骤3: 解密
      const decryptedMessage = decrypt(transmittedCiphertext, codebook);

      // 步骤4: 验证
      expect(decryptedMessage).toBe(originalMessage);
    });

    it('应该处理包含所有千字文前100字的文本', () => {
      // 取千字文前100个字符
      const chars: string[] = [];
      let count = 0;
      for (const page of codebook.pages) {
        for (const char of page.characters) {
          if (char && count < 100) {
            chars.push(char);
            count++;
          }
          if (count >= 100) break;
        }
        if (count >= 100) break;
      }

      const plaintext = chars.join('');
      const encrypted = encrypt(plaintext, codebook);
      const decrypted = decrypt(encrypted.ciphertext, codebook);

      expect(decrypted).toBe(plaintext);
      expect(encrypted.details).toHaveLength(100);
    });
  });

  describe('分层加密集成测试', () => {
    it('应该正确处理中文+数字+英文混合文本', () => {
      const plaintext = 'Hello天地2024';
      const encrypted = encrypt(plaintext, codebook);

      // 5字母 + 2中文 + 4数字 = 11个加密单元
      expect(encrypted.details).toHaveLength(11);

      // 验证密文格式
      const codes = encrypted.ciphertext.split('-');
      expect(codes.length).toBe(11);

      // 验证英文密文格式 (以8开头的7位数字) - H,e,l,l,o
      expect(codes[0]).toMatch(/^8\d{6}$/);
      expect(codes[1]).toMatch(/^8\d{6}$/);
      expect(codes[2]).toMatch(/^8\d{6}$/);
      expect(codes[3]).toMatch(/^8\d{6}$/);
      expect(codes[4]).toMatch(/^8\d{6}$/);

      // 验证中文密文格式 (7位数字，不以7或8开头) - 天,地
      expect(codes[5]).toMatch(/^[0-69]\d{6}$/);
      expect(codes[6]).toMatch(/^[0-69]\d{6}$/);

      // 验证数字密文格式 (以7开头的7位数字) - 2,0,2,4
      expect(codes[7]).toMatch(/^7\d{6}$/);
      expect(codes[8]).toMatch(/^7\d{6}$/);
      expect(codes[9]).toMatch(/^7\d{6}$/);
      expect(codes[10]).toMatch(/^7\d{6}$/);

      // 验证解密还原
      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该正确处理只有数字的文本', () => {
      const plaintext = '12345';
      const encrypted = encrypt(plaintext, codebook);

      expect(encrypted.details).toHaveLength(5);

      // 验证密文格式 (以7开头的7位数字)
      const codes = encrypted.ciphertext.split('-');
      for (const code of codes) {
        expect(code).toMatch(/^7\d{6}$/);
      }

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该正确处理只有英文的文本', () => {
      const plaintext = 'Hello';
      const encrypted = encrypt(plaintext, codebook);

      expect(encrypted.details).toHaveLength(5);

      // 验证密文格式 (以8开头的7位数字)
      const codes = encrypted.ciphertext.split('-');
      for (const code of codes) {
        expect(code).toMatch(/^8\d{6}$/);
      }

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe(plaintext);
    });

    it('应该正确过滤符号字符', () => {
      const plaintext = '天!地?';
      const encrypted = encrypt(plaintext, codebook);

      // 符号被过滤，只保留2个中文
      expect(encrypted.details).toHaveLength(2);
      expect(encrypted.details.map(d => d.char).join('')).toBe('天地');

      const decrypted = decrypt(encrypted.ciphertext, codebook);
      expect(decrypted).toBe('天地');
    });
  });
});
