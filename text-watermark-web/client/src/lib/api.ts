import type {
  WatermarkRequest,
  WatermarkResponse,
  ExtractRequest,
  ExtractResponse,
  CompareRequest,
  CompareResponse,
} from '../../shared/types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // 添加水印
  watermark: (data: WatermarkRequest): Promise<WatermarkResponse> =>
    fetchApi<WatermarkResponse>('/watermark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 提取水印
  extract: (data: ExtractRequest): Promise<ExtractResponse> =>
    fetchApi<ExtractResponse>('/extract', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 比对文档
  compare: (data: CompareRequest): Promise<CompareResponse> =>
    fetchApi<CompareResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default api;
