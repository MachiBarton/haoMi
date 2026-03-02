/**
 * 将字符串转换为二进制表示
 * @param {string} str - 输入字符串
 * @returns {string} 二进制字符串
 */
function stringToBinary(str) {
  return str.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
}

/**
 * 将二进制字符串转换为普通字符串
 * @param {string} binary - 二进制字符串
 * @returns {string} 普通字符串
 */
function binaryToString(binary) {
  const bytes = binary.match(/.{8}/g) || [];
  return bytes.map(byte => {
    return String.fromCharCode(parseInt(byte, 2));
  }).join('');
}

/**
 * 序列化水印数据为二进制字符串
 * 格式: [version:4bit][userIdLength:8bit][userId][timestamp:64bit][customDataLength:8bit][customData]
 * @param {Object} data - { userId, timestamp, customData }
 * @returns {string} 二进制字符串
 */
function serializeData(data) {
  const version = '0001'; // 版本 1

  const userIdBinary = stringToBinary(data.userId);
  const userIdLength = data.userId.length.toString(2).padStart(8, '0');

  const timestampBinary = BigInt(data.timestamp).toString(2).padStart(64, '0');

  const customDataBinary = stringToBinary(data.customData);
  const customDataLength = data.customData.length.toString(2).padStart(8, '0');

  return version + userIdLength + userIdBinary + timestampBinary + customDataLength + customDataBinary;
}

/**
 * 反序列化二进制字符串为水印数据
 * @param {string} binary - 二进制字符串
 * @returns {Object|null} 水印数据对象或null
 */
function deserializeData(binary) {
  try {
    let offset = 4; // 跳过版本号

    const userIdLength = parseInt(binary.slice(offset, offset + 8), 2);
    offset += 8;

    const userIdBinary = binary.slice(offset, offset + userIdLength * 8);
    const userId = binaryToString(userIdBinary);
    offset += userIdLength * 8;

    const timestamp = parseInt(binary.slice(offset, offset + 64), 2);
    offset += 64;

    const customDataLength = parseInt(binary.slice(offset, offset + 8), 2);
    offset += 8;

    const customDataBinary = binary.slice(offset, offset + customDataLength * 8);
    const customData = binaryToString(customDataBinary);

    return { userId, timestamp, customData };
  } catch (e) {
    return null;
  }
}

module.exports = {
  stringToBinary,
  binaryToString,
  serializeData,
  deserializeData
};
