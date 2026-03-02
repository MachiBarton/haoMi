const { compareTexts, levenshteinDistance, similarity } = require('../src/comparator');

describe('Text comparator', () => {
  test('should calculate Levenshtein distance', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
    expect(levenshteinDistance('', 'abc')).toBe(3);
  });

  test('should calculate similarity percentage', () => {
    expect(similarity('hello', 'hello')).toBe(1);
    expect(similarity('hello', 'world')).toBeLessThan(0.5);
    expect(similarity('', 'abc')).toBe(0);
  });

  test('should compare texts and return result', () => {
    const original = '第一段内容。\n\n第二段内容。';
    const suspicious = '第一段内容。\n\n修改后的第二段。';
    const result = compareTexts(original, suspicious);

    expect(result).toHaveProperty('similarity');
    expect(result).toHaveProperty('matchedParagraphs');
    expect(result).toHaveProperty('confidence');
    expect(result.similarity).toBeGreaterThan(0);
    expect(result.similarity).toBeLessThanOrEqual(1);
  });

  test('should detect exact match', () => {
    const text = '这是完全相同的文本。';
    const result = compareTexts(text, text);
    expect(result.similarity).toBe(1);
    expect(result.confidence).toBe('high');
  });

  test('should detect partial match', () => {
    const original = '第一段内容。\n\n第二段内容。\n\n第三段内容。';
    const suspicious = '第一段内容。'; // 只复制了第一段
    const result = compareTexts(original, suspicious);
    expect(result.similarity).toBeGreaterThan(0.3);
    expect(result.matchedParagraphs.length).toBeGreaterThan(0);
  });
});
