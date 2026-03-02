export interface WatermarkData {
  userId: string;
  timestamp: number;
  customData: string;
  confidence?: string;
  fingerprints?: any[];
  message?: string;
}

export interface CompareResult {
  similarity: number;
  confidence: string;
  matchedCount: number;
  totalParagraphs: number;
  matchedParagraphs: Array<{
    suspiciousText: string;
    originalText: string;
    similarity: number;
    originalIndex: number;
  }>;
}

export function embedWatermark(text: string, data: Omit<WatermarkData, 'confidence'>): string;
export function extractWatermark(text: string): WatermarkData | null;
export function compareTexts(original: string, suspicious: string): CompareResult;
