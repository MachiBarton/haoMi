// 豪密密码工具 - 乱数生成器单元测试
import { describe, it, expect } from 'vitest';
import {
  generateRandom,
  generateRandomSequence,
  generateRandomSeed
} from '../random';

describe('乱数生成器', () => {
  describe('generateRandom', () => {
    it('应该生成确定性的乱数', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random2 = generateRandom(1, 123456, 0);
      expect(random1).toBe(random2);
    });

    it('应该生成7位范围内的乱数', () => {
      const random = generateRandom(1, 123456, 0);
      expect(random).toBeGreaterThanOrEqual(0);
      expect(random).toBeLessThan(10000000);
    });

    it('不同页码应该生成不同乱数', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random2 = generateRandom(2, 123456, 0);
      expect(random1).not.toBe(random2);
    });

    it('不同位置应该生成不同乱数', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random2 = generateRandom(1, 123456, 1);
      const random3 = generateRandom(1, 123456, 2);
      expect(random1).not.toBe(random2);
      expect(random2).not.toBe(random3);
    });

    it('不同种子应该生成不同乱数', () => {
      const random1 = generateRandom(1, 123456, 0);
      const random2 = generateRandom(1, 654321, 0);
      expect(random1).not.toBe(random2);
    });

    it('应该处理边界值', () => {
      const random1 = generateRandom(1, 100000, 0);
      const random2 = generateRandom(999, 9999999, 999);
      expect(random1).toBeGreaterThanOrEqual(0);
      expect(random1).toBeLessThan(10000000);
      expect(random2).toBeGreaterThanOrEqual(0);
      expect(random2).toBeLessThan(10000000);
    });
  });

  describe('generateRandomSequence', () => {
    it('应该生成指定数量的乱数序列', () => {
      const sequence = generateRandomSequence(1, 123456, 10);
      expect(sequence).toHaveLength(10);
    });

    it('默认应该生成300个乱数', () => {
      const sequence = generateRandomSequence(1, 123456);
      expect(sequence).toHaveLength(300);
    });

    it('序列中的乱数应该在有效范围内', () => {
      const sequence = generateRandomSequence(1, 123456, 100);
      for (const random of sequence) {
        expect(random).toBeGreaterThanOrEqual(0);
        expect(random).toBeLessThan(10000000);
      }
    });

    it('相同参数应该生成相同序列', () => {
      const sequence1 = generateRandomSequence(1, 123456, 10);
      const sequence2 = generateRandomSequence(1, 123456, 10);
      expect(sequence1).toEqual(sequence2);
    });

    it('不同参数应该生成不同序列', () => {
      const sequence1 = generateRandomSequence(1, 123456, 10);
      const sequence2 = generateRandomSequence(2, 123456, 10);
      expect(sequence1).not.toEqual(sequence2);
    });
  });

  describe('generateRandomSeed', () => {
    it('应该生成7位随机种子', () => {
      const seed = generateRandomSeed();
      expect(seed).toBeGreaterThanOrEqual(1000000);
      expect(seed).toBeLessThan(10000000);
    });

    it('应该生成不同的种子', () => {
      const seeds = new Set<number>();
      for (let i = 0; i < 100; i++) {
        seeds.add(generateRandomSeed());
      }
      // 100次生成应该大部分都不同（概率极高）
      expect(seeds.size).toBeGreaterThan(90);
    });
  });
});
