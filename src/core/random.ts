// 豪密密码工具 - 乱数生成器
// 基于LCG（线性同余生成器）算法

/**
 * 生成乱数
 * @param pageNumber - 页码 (1-999)
 * @param seed - 随机种子
 * @param position - 字符位置（在密文中的索引）
 * @returns 7位乱数 (0-9999999)
 */
export function generateRandom(
  pageNumber: number,
  seed: number,
  position: number
): number {
  // LCG算法简化版
  // 使用页码、种子和位置生成确定性乱数
  const a = 1664525;  // 乘数
  const c = 1013904223; // 增量

  // 基于种子、页码和位置生成伪随机数
  const state = (seed * pageNumber + position * a + c) >>> 0;
  return state % 10000000;
}

/**
 * 生成一页的乱数序列
 * @param pageNumber - 页码
 * @param seed - 随机种子
 * @param count - 乱数个数（默认300，对应一页的字数）
 * @returns 乱数数组
 */
export function generateRandomSequence(
  pageNumber: number,
  seed: number,
  count: number = 300
): number[] {
  const sequence: number[] = [];
  for (let i = 0; i < count; i++) {
    sequence.push(generateRandom(pageNumber, seed, i));
  }
  return sequence;
}

/**
 * 生成随机种子
 * @returns 7位随机种子 (1000000-9999999)
 */
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 9000000) + 1000000;
}
