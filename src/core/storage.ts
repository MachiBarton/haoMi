// 豪密密码工具 - localStorage 存储封装
import type { Codebook } from '../types';
import { isValidCodebook } from './codebook';

// 存储键名
const STORAGE_KEYS = {
  CODEBOOK: 'haomi:codebook',
  SETTINGS: 'haomi:settings',
  HISTORY: 'haomi:history'
} as const;

// 设置项类型
export interface Settings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
}

// 默认设置
const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontSize: 'medium',
  autoSave: true
};

// 历史记录项
export interface HistoryItem {
  id: string;
  type: 'encrypt' | 'decrypt';
  input: string;
  output: string;
  timestamp: number;
}

/**
 * 保存密码本到 localStorage
 * @param codebook - 密码本
 * @returns 是否保存成功
 */
export function saveCodebook(codebook: Codebook): boolean {
  try {
    const data = JSON.stringify(codebook);
    localStorage.setItem(STORAGE_KEYS.CODEBOOK, data);
    return true;
  } catch (error) {
    console.error('保存密码本失败:', error);
    return false;
  }
}

/**
 * 从 localStorage 加载密码本
 * @returns 密码本，不存在或无效返回 null
 */
export function loadCodebook(): Codebook | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CODEBOOK);
    if (!data) return null;

    const parsed = JSON.parse(data);
    if (isValidCodebook(parsed)) {
      return parsed;
    }
    return null;
  } catch (error) {
    console.error('加载密码本失败:', error);
    return null;
  }
}

/**
 * 删除保存的密码本
 * @returns 是否删除成功
 */
export function removeCodebook(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.CODEBOOK);
    return true;
  } catch (error) {
    console.error('删除密码本失败:', error);
    return false;
  }
}

/**
 * 检查是否有保存的密码本
 * @returns 是否存在
 */
export function hasCodebook(): boolean {
  return localStorage.getItem(STORAGE_KEYS.CODEBOOK) !== null;
}

/**
 * 保存设置到 localStorage
 * @param settings - 设置项
 * @returns 是否保存成功
 */
export function saveSettings(settings: Settings): boolean {
  try {
    const data = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
    return true;
  } catch (error) {
    console.error('保存设置失败:', error);
    return false;
  }
}

/**
 * 从 localStorage 加载设置
 * @returns 设置项，不存在返回默认设置
 */
export function loadSettings(): Settings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(data);
    return {
      theme: parsed.theme || DEFAULT_SETTINGS.theme,
      fontSize: parsed.fontSize || DEFAULT_SETTINGS.fontSize,
      autoSave: typeof parsed.autoSave === 'boolean' ? parsed.autoSave : DEFAULT_SETTINGS.autoSave
    };
  } catch (error) {
    console.error('加载设置失败:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 添加历史记录
 * @param item - 历史记录项
 * @returns 是否添加成功
 */
export function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): boolean {
  try {
    const history = loadHistory();
    const newItem: HistoryItem = {
      ...item,
      id: generateId(),
      timestamp: Date.now()
    };

    // 最多保存50条记录，新记录添加到开头
    const updatedHistory = [newItem, ...history].slice(0, 50);

    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('添加历史记录失败:', error);
    return false;
  }
}

/**
 * 加载历史记录
 * @returns 历史记录数组
 */
export function loadHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (!data) return [];

    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed as HistoryItem[];
    }
    return [];
  } catch (error) {
    console.error('加载历史记录失败:', error);
    return [];
  }
}

/**
 * 清空历史记录
 * @returns 是否清空成功
 */
export function clearHistory(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    return true;
  } catch (error) {
    console.error('清空历史记录失败:', error);
    return false;
  }
}

/**
 * 删除单条历史记录
 * @param id - 记录ID
 * @returns 是否删除成功
 */
export function removeHistoryItem(id: string): boolean {
  try {
    const history = loadHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory));
    return true;
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return false;
  }
}

/**
 * 清除所有存储数据
 * @returns 是否清除成功
 */
export function clearAll(): boolean {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('清除所有数据失败:', error);
    return false;
  }
}

/**
 * 生成唯一ID
 * @returns ID字符串
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查 localStorage 是否可用
 * @returns 是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取存储空间使用情况
 * @returns 使用情况信息
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  try {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length * 2; // UTF-16 编码，每个字符2字节
      }
    }

    // localStorage 通常限制为 5-10MB，这里按 5MB 计算
    const total = 5 * 1024 * 1024;
    const percentage = Math.round((used / total) * 100);

    return { used, total, percentage };
  } catch {
    return { used: 0, total: 5 * 1024 * 1024, percentage: 0 };
  }
}
