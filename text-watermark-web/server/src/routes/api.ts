import { Router } from 'express';
import { embedWatermark, extractWatermark, compareTexts } from '../watermark';
import type {
  WatermarkRequest,
  WatermarkResponse,
  ExtractRequest,
  ExtractResponse,
  CompareRequest,
  CompareResponse
} from '../../../shared/types';

const router = Router();

// POST /api/watermark - 添加水印
router.post('/watermark', (req, res) => {
  try {
    const { text, userId, timestamp, customData }: WatermarkRequest = req.body;

    if (!text || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, userId'
      });
    }

    const watermarkedText = embedWatermark(text, {
      userId,
      timestamp: timestamp || Date.now(),
      customData: customData || ''
    });

    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    const response: WatermarkResponse = {
      success: true,
      watermarkedText,
      info: {
        originalLength: text.length,
        watermarkedLength: watermarkedText.length,
        paragraphCount: paragraphs.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Watermark error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to embed watermark'
    });
  }
});

// POST /api/extract - 提取水印
router.post('/extract', (req, res) => {
  try {
    const { text }: ExtractRequest = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
    }

    const data = extractWatermark(text);

    const response: ExtractResponse = {
      success: true,
      data: data ? {
        userId: data.userId || '',
        timestamp: data.timestamp || 0,
        customData: data.customData || '',
        confidence: (data.confidence as 'high' | 'medium' | 'low') || 'low'
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract watermark'
    });
  }
});

// POST /api/compare - 比对文档
router.post('/compare', (req, res) => {
  try {
    const { original, suspicious }: CompareRequest = req.body;

    if (!original || !suspicious) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: original, suspicious'
      });
    }

    const result = compareTexts(original, suspicious);

    const response: CompareResponse = {
      success: true,
      result: {
        similarity: result.similarity,
        confidence: result.confidence as 'high' | 'medium' | 'low' | 'none',
        matchedCount: result.matchedCount,
        totalParagraphs: result.totalParagraphs,
        matchedParagraphs: result.matchedParagraphs
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare texts'
    });
  }
});

export default router;
