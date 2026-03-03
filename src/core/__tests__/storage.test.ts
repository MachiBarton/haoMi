// 豪密密码工具 - 存储模块单元测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
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
  getStorageUsage,
  type Settings,
} from '../storage';
import { generateDefaultCodebook } from '../codebook';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
});

describe('存储模块', () => {
  beforeEach(() => {
    // 清理存储
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('密码本存储', () => {
    it('应该保存和加载密码本', async () => {
      const codebook = await generateDefaultCodebook();
      const saved = saveCodebook(codebook);
      expect(saved).toBe(true);

      const loaded = loadCodebook();
      expect(loaded).not.toBeNull();
      expect(loaded?.name).toBe(codebook.name);
      expect(loaded?.totalPages).toBe(codebook.totalPages);
    });

    it('应该返回null当没有保存的密码本', () => {
      const loaded = loadCodebook();
      expect(loaded).toBeNull();
    });

    it('应该正确检查密码本是否存在', async () => {
      expect(hasCodebook()).toBe(false);

      const codebook = await generateDefaultCodebook();
      saveCodebook(codebook);

      expect(hasCodebook()).toBe(true);
    });

    it('应该删除密码本', async () => {
      const codebook = await generateDefaultCodebook();
      saveCodebook(codebook);
      expect(hasCodebook()).toBe(true);

      const removed = removeCodebook();
      expect(removed).toBe(true);
      expect(hasCodebook()).toBe(false);
    });

    it('应该拒绝加载无效的密码本数据', () => {
      localStorage.setItem('haomi:codebook', JSON.stringify({ invalid: true }));
      const loaded = loadCodebook();
      expect(loaded).toBeNull();
    });
  });

  describe('设置存储', () => {
    it('应该保存和加载设置', () => {
      const settings: Settings = {
        theme: 'dark',
        fontSize: 'large',
        autoSave: false
      };

      const saved = saveSettings(settings);
      expect(saved).toBe(true);

      const loaded = loadSettings();
      expect(loaded.theme).toBe('dark');
      expect(loaded.fontSize).toBe('large');
      expect(loaded.autoSave).toBe(false);
    });

    it('应该返回默认设置当没有保存的设置', () => {
      const loaded = loadSettings();
      expect(loaded.theme).toBe('light');
      expect(loaded.fontSize).toBe('medium');
      expect(loaded.autoSave).toBe(true);
    });

    it('应该合并部分设置', () => {
      localStorage.setItem('haomi:settings', JSON.stringify({ theme: 'dark' }));

      const loaded = loadSettings();
      expect(loaded.theme).toBe('dark');
      expect(loaded.fontSize).toBe('medium'); // 默认值
      expect(loaded.autoSave).toBe(true); // 默认值
    });
  });

  describe('历史记录存储', () => {
    it('应该添加历史记录', () => {
      const added = addHistory({
        type: 'encrypt',
        input: '天地',
        output: '123456-234567'
      });
      expect(added).toBe(true);

      const history = loadHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe('encrypt');
      expect(history[0].input).toBe('天地');
      expect(history[0].output).toBe('123456-234567');
    });

    it('应该添加多条历史记录', () => {
      addHistory({ type: 'encrypt', input: '天地', output: '111111' });
      addHistory({ type: 'decrypt', input: '222222', output: '玄黄' });

      const history = loadHistory();
      expect(history).toHaveLength(2);
    });

    it('新记录应该添加到开头', () => {
      addHistory({ type: 'encrypt', input: '第一条', output: '111111' });
      addHistory({ type: 'encrypt', input: '第二条', output: '222222' });

      const history = loadHistory();
      expect(history[0].input).toBe('第二条');
      expect(history[1].input).toBe('第一条');
    });

    it('应该清空历史记录', () => {
      addHistory({ type: 'encrypt', input: '天地', output: '111111' });
      expect(loadHistory()).toHaveLength(1);

      const cleared = clearHistory();
      expect(cleared).toBe(true);
      expect(loadHistory()).toHaveLength(0);
    });

    it('应该删除单条历史记录', () => {
      addHistory({ type: 'encrypt', input: '第一条', output: '111111' });
      addHistory({ type: 'encrypt', input: '第二条', output: '222222' });

      const history = loadHistory();
      const idToRemove = history[0].id;

      const removed = removeHistoryItem(idToRemove);
      expect(removed).toBe(true);

      const updatedHistory = loadHistory();
      expect(updatedHistory).toHaveLength(1);
      expect(updatedHistory[0].input).toBe('第一条');
    });

    it('应该限制历史记录数量为50条', () => {
      for (let i = 0; i < 55; i++) {
        addHistory({
          type: 'encrypt',
          input: `记录${i}`,
          output: `${i}`.padStart(6, '0')
        });
      }

      const history = loadHistory();
      expect(history).toHaveLength(50);
    });
  });

  describe('清除所有数据', () => {
    it('应该清除所有存储数据', async () => {
      const codebook = await generateDefaultCodebook();
      saveCodebook(codebook);
      saveSettings({ theme: 'dark', fontSize: 'large', autoSave: false });
      addHistory({ type: 'encrypt', input: '天地', output: '111111' });

      expect(hasCodebook()).toBe(true);
      expect(loadHistory()).toHaveLength(1);

      const cleared = clearAll();
      expect(cleared).toBe(true);

      expect(hasCodebook()).toBe(false);
      expect(loadHistory()).toHaveLength(0);
    });
  });

  describe('存储可用性检查', () => {
    it('应该检测到localStorage可用', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe('存储使用情况', () => {
    it('应该返回存储使用情况', () => {
      const usage = getStorageUsage();
      expect(usage.used).toBeGreaterThanOrEqual(0);
      expect(usage.total).toBe(5 * 1024 * 1024); // 5MB
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });
  });
});
