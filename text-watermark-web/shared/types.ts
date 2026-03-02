// 水印请求
export interface WatermarkRequest {
  text: string;
  userId: string;
  timestamp: number;
  customData: string;
}

// 水印响应
export interface WatermarkResponse {
  success: boolean;
  watermarkedText: string;
  info: {
    originalLength: number;
    watermarkedLength: number;
    paragraphCount: number;
  };
}

// 提取请求
export interface ExtractRequest {
  text: string;
}

// 提取响应
export interface ExtractResponse {
  success: boolean;
  data?: {
    userId: string;
    timestamp: number;
    customData: string;
    confidence: 'high' | 'medium' | 'low';
  } | null;
}

// 比对请求
export interface CompareRequest {
  original: string;
  suspicious: string;
}

// 比对响应
export interface CompareResponse {
  success: boolean;
  result: {
    similarity: number;
    confidence: 'high' | 'medium' | 'low' | 'none';
    matchedCount: number;
    totalParagraphs: number;
    matchedParagraphs: Array<{
      suspiciousText: string;
      originalText: string;
      similarity: number;
      originalIndex: number;
    }>;
  };
}

// API 通用响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
