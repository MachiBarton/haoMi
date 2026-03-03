// 豪密密码工具 - 密码本管理单元测试
import { describe, it, expect } from 'vitest';
import {
  generateDefaultCodebook,
  findCharPosition,
  getCharAtPosition,
  encodeToClearCode,
  decodeFromClearCode,
  isValidCodebook,
  exportCodebook,
  importCodebook
} from '../codebook';

describe('密码本管理', () => {
  describe('生成默认密码本', () => {
    it('应该生成有效的默认密码本', async () => {
      const codebook = await generateDefaultCodebook();
      // 测试环境使用备用密码本
      expect(codebook.name).toMatch(/三国演义密码本-V1/);
      expect(codebook.version).toBe('1.0.0');
      expect(codebook.totalPages).toBeGreaterThan(0);
      expect(codebook.pages.length).toBeGreaterThan(0);
    });

    it('每页应该有300个字符位置', async () => {
      const codebook = await generateDefaultCodebook();
      for (const page of codebook.pages) {
        expect(page.characters.length).toBe(300);
        expect(page.rows).toBe(10);
        expect(page.cols).toBe(30);
      }
    });

    it('每页应该有有效的随机种子', async () => {
      const codebook = await generateDefaultCodebook();
      for (const page of codebook.pages) {
        expect(page.randomSeed).toBeGreaterThanOrEqual(1000000);
        expect(page.randomSeed).toBeLessThan(10000000);
      }
    });
  });

  describe('查找字符位置', () => {
    it('应该找到存在的字符', async () => {
      const codebook = await generateDefaultCodebook();
      const position = findCharPosition('三', codebook);
      expect(position).not.toBeNull();
      expect(position?.pageNumber).toBe(1);
      expect(position?.row).toBe(0);
      expect(position?.col).toBe(0);
    });

    it('应该返回null当字符不存在', async () => {
      const codebook = await generateDefaultCodebook();
      const position = findCharPosition('𠀀', codebook);
      expect(position).toBeNull();
    });
  });

  describe('获取位置字符', () => {
    it('应该获取指定位置的字符', async () => {
      const codebook = await generateDefaultCodebook();
      const char = getCharAtPosition(1, 0, 0, codebook);
      expect(char).toBe('三');
    });

    it('应该返回null当页码不存在', async () => {
      const codebook = await generateDefaultCodebook();
      const char = getCharAtPosition(99, 0, 0, codebook);
      expect(char).toBeNull();
    });

    it('应该返回null当位置超出范围', async () => {
      const codebook = await generateDefaultCodebook();
      const char = getCharAtPosition(1, 10, 0, codebook); // 第10行不存在
      expect(char).toBeNull();
    });
  });

  describe('明码编码解码', () => {
    it('应该正确编码汉字为明码', async () => {
      const codebook = await generateDefaultCodebook();
      const code = encodeToClearCode('三', codebook);
      expect(code).toBe('0010000'); // 3位页码 + 2位行 + 2位列
    });

    it('应该正确解码明码为汉字', async () => {
      const codebook = await generateDefaultCodebook();
      const char = decodeFromClearCode('0010000', codebook);
      expect(char).toBe('三');
    });

    it('编码解码应该互为逆操作', async () => {
      const codebook = await generateDefaultCodebook();
      const testChars = ['三', '国', '演', '义', '罗', '贯'];
      for (const char of testChars) {
        const code = encodeToClearCode(char, codebook);
        if (code) {
          const decoded = decodeFromClearCode(code, codebook);
          expect(decoded).toBe(char);
        }
      }
    });

    it('应该返回null当明码格式错误', async () => {
      const codebook = await generateDefaultCodebook();
      expect(decodeFromClearCode('12345', codebook)).toBeNull(); // 5位
      expect(decodeFromClearCode('123456', codebook)).toBeNull(); // 6位
      expect(decodeFromClearCode('12345678', codebook)).toBeNull(); // 8位
      expect(decodeFromClearCode('abcdefg', codebook)).toBeNull(); // 非数字
    });
  });

  describe('密码本验证', () => {
    it('应该验证有效的密码本', async () => {
      const codebook = await generateDefaultCodebook();
      expect(isValidCodebook(codebook)).toBe(true);
    });

    it('应该拒绝无效的密码本', () => {
      expect(isValidCodebook(null)).toBe(false);
      expect(isValidCodebook({})).toBe(false);
      expect(isValidCodebook({ name: 'test' })).toBe(false);
    });

    it('应该拒绝页面结构错误的密码本', () => {
      const invalidCodebook = {
        name: 'test',
        version: '1.0',
        totalPages: 1,
        pages: [{ pageNumber: '1' }] // pageNumber应该是数字
      };
      expect(isValidCodebook(invalidCodebook)).toBe(false);
    });
  });

  describe('导入导出', () => {
    it('应该正确导出密码本为JSON', async () => {
      const codebook = await generateDefaultCodebook();
      const json = exportCodebook(codebook);
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed.name).toBe(codebook.name);
    });

    it('应该正确导入有效的JSON', async () => {
      const codebook = await generateDefaultCodebook();
      const json = exportCodebook(codebook);
      const imported = importCodebook(json);
      expect(imported).not.toBeNull();
      expect(imported?.name).toBe(codebook.name);
    });

    it('应该返回null当JSON格式错误', () => {
      const imported = importCodebook('invalid json');
      expect(imported).toBeNull();
    });

    it('应该返回null当密码本结构无效', () => {
      const imported = importCodebook('{"name": "test"}');
      expect(imported).toBeNull();
    });
  });
});
