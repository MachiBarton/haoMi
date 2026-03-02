const { serializeData, deserializeData, stringToBinary, binaryToString } = require('../src/serializer');

describe('Data serializer', () => {
  test('should convert string to binary', () => {
    expect(stringToBinary('A')).toBe('01000001');
    expect(stringToBinary('Hi')).toBe('0100100001101001');
  });

  test('should convert binary to string', () => {
    expect(binaryToString('01000001')).toBe('A');
    expect(binaryToString('0100100001101001')).toBe('Hi');
  });

  test('should serialize watermark data', () => {
    const data = {
      userId: 'user123',
      timestamp: 1700000000000,
      customData: 'test'
    };
    const serialized = serializeData(data);
    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);
  });

  test('should deserialize watermark data', () => {
    const data = {
      userId: 'user123',
      timestamp: 1700000000000,
      customData: 'test'
    };
    const serialized = serializeData(data);
    const deserialized = deserializeData(serialized);
    expect(deserialized.userId).toBe(data.userId);
    expect(deserialized.timestamp).toBe(data.timestamp);
    expect(deserialized.customData).toBe(data.customData);
  });
});
