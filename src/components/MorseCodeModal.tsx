import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, RotateCcw, Radio } from 'lucide-react';
import { MorseCodePlayer, QueueItem } from './MorseCodePlayer';

interface MorseCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  ciphertext: string;
}

// 数字到摩尔斯电码映射表
const MORSE_CODE_MAP: Record<string, string> = {
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '-': '-...-',
};

// 将密文转换为摩尔斯电码
function convertToMorse(ciphertext: string): string {
  return ciphertext
    .split('')
    .filter(char => /[0-9\-]/.test(char))
    .map(char => MORSE_CODE_MAP[char] || '')
    .join(' ');
}

// 解析摩尔斯电码序列（用于显示）
function parseMorseSequence(morse: string): string[] {
  return morse.split('').filter(char => char === '.' || char === '-' || char === ' ');
}

// 将摩尔斯电码分组（每个数字对应一组）
function groupMorseByDigit(ciphertext: string): { digit: string; morse: string }[] {
  const digits = ciphertext.split('').filter(char => /[0-9\-]/.test(char));
  return digits.map(digit => ({
    digit,
    morse: MORSE_CODE_MAP[digit] || ''
  }));
}

export function MorseCodeModal({ isOpen, onClose, ciphertext }: MorseCodeModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeKey, setActiveKey] = useState<'J' | 'K' | null>(null);
  const playerRef = useRef<MorseCodePlayer | null>(null);
  const morseSequence = useRef<string[]>([]);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [groupedMorse, setGroupedMorse] = useState<{ digit: string; morse: string }[]>([]);

  // 初始化摩尔斯电码
  useEffect(() => {
    if (isOpen && ciphertext) {
      const morse = convertToMorse(ciphertext);
      morseSequence.current = parseMorseSequence(morse);
      setGroupedMorse(groupMorseByDigit(ciphertext));
      setCurrentIndex(0);
      setIsComplete(false);

      // 创建新的播放器实例
      if (playerRef.current) {
        playerRef.current.stop();
      }
      playerRef.current = new MorseCodePlayer(30, 30, false);
    }
  }, [isOpen, ciphertext]);

  // 清理
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.stop();
      }
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  // 使用 morsenode.com 的 Player 自动播放
  const autoPlay = useCallback(() => {
    if (!playerRef.current || isPlaying) return;

    setIsPlaying(true);
    setCurrentIndex(0);

    const player = playerRef.current;

    // 确保音频上下文已恢复（处理浏览器自动播放限制）
    const sounder = (player as unknown as { sounder: { context: AudioContext } }).sounder;
    if (sounder.context.state === 'suspended') {
      sounder.context.resume();
    }

    player.clearQueue();

    // 将摩尔斯电码转换为 Player 可以播放的格式
    const sequence = morseSequence.current;
    sequence.forEach((char) => {
      if (char === '.') {
        player.queueLetter('.', 600);
      } else if (char === '-') {
        player.queueLetter('-', 600);
      } else if (char === ' ') {
        player.queueWord(' ', 600);
      }
    });

    // 跟踪播放进度
    let charIndex = 0;
    const totalChars = sequence.length;

    // 使用 setInterval 模拟播放进度
    playIntervalRef.current = setInterval(() => {
      if (charIndex < totalChars) {
        const char = sequence[charIndex];
        if (char === '.') {
          setActiveKey('J');
          setTimeout(() => setActiveKey(null), 100);
        } else if (char === '-') {
          setActiveKey('K');
          setTimeout(() => setActiveKey(null), 300);
        }
        setCurrentIndex(charIndex + 1);
        charIndex++;
      } else {
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
        setIsPlaying(false);
        setIsComplete(true);
      }
    }, 120); // 约 30 WPM 的速度

    // 启动播放器
    player.start(
      (item: QueueItem) => {
        // onPlayed callback
        console.log('Played:', item.word);
      },
      () => {
        // onDone callback
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
        setIsPlaying(false);
        setIsComplete(true);
      }
    );
  }, [isPlaying]);

  // 播放单个音的辅助函数
  const playSingleTone = useCallback((isDot: boolean) => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    // 确保音频上下文已恢复（处理浏览器自动播放限制）
    const sounder = (player as unknown as { sounder: { context: AudioContext; playTone: (start: number, length: number, freq?: number) => number; getTime: () => number } }).sounder;
    if (sounder.context.state === 'suspended') {
      sounder.context.resume();
    }

    // 播放单个音
    const duration = isDot ? 0.08 : 0.24; // 80ms for dot, 240ms for dash
    sounder.playTone(sounder.getTime(), duration, 600);
  }, []);

  // 手动按键处理
  const handleKeyDown = useCallback((key: 'J' | 'K') => {
    if (isPlaying || isComplete) return;

    setActiveKey(key);
    const sequence = morseSequence.current;
    const expectedChar = sequence[currentIndex];

    if ((key === 'J' && expectedChar === '.') || (key === 'K' && expectedChar === '-')) {
      // 正确输入 - 播放声音
      playSingleTone(key === 'J');

      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= sequence.length) {
          setIsComplete(true);
        }
        return next;
      });
    } else if (expectedChar === ' ') {
      // 跳过空格
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, isPlaying, isComplete, playSingleTone]);

  const handleKeyUp = useCallback(() => {
    setActiveKey(null);
  }, []);

  // 键盘事件监听
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'J' || key === 'K') {
        e.preventDefault();
        handleKeyDown(key as 'J' | 'K');
      }
    };

    const handleKeyRelease = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === 'J' || key === 'K') {
        e.preventDefault();
        handleKeyUp();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('keyup', handleKeyRelease);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('keyup', handleKeyRelease);
    };
  }, [isOpen, handleKeyDown, handleKeyUp]);

  // 重置
  const reset = () => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    setCurrentIndex(0);
    setIsComplete(false);
    setIsPlaying(false);
    setActiveKey(null);
  };

  // 计算当前显示的分组索引和组内字符索引
  const getCurrentPosition = () => {
    let charCount = 0;
    for (let i = 0; i < groupedMorse.length; i++) {
      const group = groupedMorse[i];
      const morseLen = group.morse.length;
      const groupTotalLen = morseLen + 1; // +1 for space between groups

      if (currentIndex < charCount + morseLen) {
        // 在当前组的摩尔斯电码中
        const charInGroup = currentIndex - charCount;
        return { groupIndex: i, charInGroup, isInSpace: false };
      } else if (currentIndex === charCount + morseLen && i < groupedMorse.length - 1) {
        // 在组间空格中
        return { groupIndex: i, charInGroup: morseLen - 1, isInSpace: true };
      }
      charCount += groupTotalLen;
    }
    // 已完成或最后一组
    return { groupIndex: groupedMorse.length - 1, charInGroup: 0, isInSpace: false };
  };

  const { groupIndex: currentGroupIndex } = getCurrentPosition();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fcf8f3] rounded-lg shadow-2xl border-2 border-[#8a0000] max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-[#8a0000]/20 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8a0000]/10 flex items-center justify-center">
              <Radio className="w-6 h-6 text-[#8a0000]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1d0c0c]">模拟发报</h2>
              <p className="text-xs text-[#4a3b3b]/70">使用 J/K 键模拟电键发报</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-[#8a0000]/10 flex items-center justify-center text-[#4a3b3b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-6">
          {/* 密文显示 - 逐字移动 */}
          <div className="bg-white rounded p-4 border border-[#8a0000]/20">
            <div className="text-xs text-[#4a3b3b]/60 mb-3 uppercase tracking-wider">密文</div>
            <div className="overflow-hidden">
              <div className="flex items-center justify-center gap-2 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(calc(50% - ${currentGroupIndex * 68 + 34}px))` }}>
                {groupedMorse.map((group, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-16 h-12 rounded flex items-center justify-center text-xl font-mono font-bold transition-all duration-200 ${
                      index < currentGroupIndex
                        ? 'bg-[#8a0000]/20 text-[#8a0000]/50'
                        : index === currentGroupIndex
                        ? 'bg-[#8a0000] text-white scale-110 shadow-lg'
                        : 'bg-[#f2e8e8] text-[#4a3b3b]/30'
                    }`}
                  >
                    {group.digit}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 摩尔斯电码显示 - 逐字移动 */}
          <div className="bg-white rounded p-4 border border-[#8a0000]/20">
            <div className="text-xs text-[#4a3b3b]/60 mb-3 uppercase tracking-wider">摩尔斯电码</div>
            <div className="overflow-hidden">
              <div className="flex items-center justify-center gap-2 transition-transform duration-300 ease-out"
                style={{ transform: `translateX(calc(50% - ${currentGroupIndex * 68 + 34}px))` }}>
                {groupedMorse.map((group, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-16 h-14 rounded flex items-center justify-center text-base font-mono font-bold tracking-wider transition-all duration-200 ${
                      index < currentGroupIndex
                        ? 'bg-[#00aa00]/10 text-[#00aa00]/50'
                        : index === currentGroupIndex
                        ? 'bg-[#00aa00] text-white scale-110 shadow-lg'
                        : 'bg-[#f2e8e8] text-[#4a3b3b]/30'
                    }`}
                  >
                    {group.morse}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 当前电码可视化 */}
          <div className="bg-[#f2e8e8] rounded-lg p-6 border border-[#8a0000]/20">
            <div className="text-xs text-[#4a3b3b]/60 mb-4 uppercase tracking-wider text-center">
              当前发报
            </div>
            <div className="flex justify-center gap-2 min-h-[60px] items-center">
              {morseSequence.current.slice(
                Math.max(0, currentIndex - 3),
                Math.min(morseSequence.current.length, currentIndex + 4)
              ).map((char, index) => {
                const actualIndex = Math.max(0, currentIndex - 3) + index;
                return (
                  <div
                    key={actualIndex}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                      actualIndex < currentIndex
                        ? 'bg-[#00aa00] border-[#00aa00] text-white'
                        : actualIndex === currentIndex
                        ? 'bg-[#8a0000] border-[#8a0000] text-white scale-125 animate-pulse'
                        : 'bg-white border-[#8a0000]/30 text-[#4a3b3b]/40'
                    }`}
                  >
                    <span className="text-lg font-bold">{char === ' ' ? '\u00A0' : char}</span>
                  </div>
                );
              })}
            </div>

            {/* 状态指示 */}
            <div className="flex justify-center gap-6 text-sm mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00aa00]" />
                <span className="text-[#4a3b3b]">已发送</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8a0000] animate-pulse" />
                <span className="text-[#8a0000] font-medium">当前</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-[#8a0000]/30" />
                <span className="text-[#4a3b3b]/50">待发送</span>
              </div>
            </div>
          </div>

          {/* 操作区 - 电键 */}
          {!isComplete ? (
            <div className="flex justify-center gap-8">
              {/* J键 - 短音 */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onMouseDown={() => handleKeyDown('J')}
                  onMouseUp={handleKeyUp}
                  onMouseLeave={handleKeyUp}
                  onTouchStart={(e) => { e.preventDefault(); handleKeyDown('J'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleKeyUp(); }}
                  disabled={isPlaying}
                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-75 select-none ${
                    activeKey === 'J'
                      ? 'bg-[#8a0000] border-[#8a0000] scale-95 shadow-[0_0_30px_rgba(138,0,0,0.4)]'
                      : 'bg-white border-[#8a0000]/30 hover:border-[#8a0000] hover:shadow-[0_0_20px_rgba(138,0,0,0.2)]'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${activeKey === 'J' ? 'text-white' : 'text-[#8a0000]'}`}>
                      J
                    </div>
                    <div className={`text-xs mt-1 ${activeKey === 'J' ? 'text-white/70' : 'text-[#4a3b3b]/50'}`}>
                      短音 (·)
                    </div>
                  </div>
                </button>
                <div className="text-xs text-[#4a3b3b]/50">点 [dit]</div>
              </div>

              {/* K键 - 长音 */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onMouseDown={() => handleKeyDown('K')}
                  onMouseUp={handleKeyUp}
                  onMouseLeave={handleKeyUp}
                  onTouchStart={(e) => { e.preventDefault(); handleKeyDown('K'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleKeyUp(); }}
                  disabled={isPlaying}
                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-75 select-none ${
                    activeKey === 'K'
                      ? 'bg-[#00aa00] border-[#00aa00] scale-95 shadow-[0_0_30px_rgba(0,170,0,0.4)]'
                      : 'bg-white border-[#8a0000]/30 hover:border-[#8a0000] hover:shadow-[0_0_20px_rgba(138,0,0,0.2)]'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${activeKey === 'K' ? 'text-white' : 'text-[#8a0000]'}`}>
                      K
                    </div>
                    <div className={`text-xs mt-1 ${activeKey === 'K' ? 'text-white/70' : 'text-[#4a3b3b]/50'}`}>
                      长音 (-)
                    </div>
                  </div>
                </button>
                <div className="text-xs text-[#4a3b3b]/50">划 [dah]</div>
              </div>
            </div>
          ) : (
            /* 完成提示 */
            <div className="bg-[#00aa00]/10 border-2 border-[#00aa00] rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">📻</div>
              <h3 className="text-xl font-bold text-[#00aa00] mb-2">发报完成！</h3>
              <p className="text-[#4a3b3b]">同志，你安全地传输了消息。</p>
              <p className="text-sm text-[#4a3b3b]/60 mt-1">消息已通过加密信道成功发送</p>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="flex justify-center gap-4">
            {!isComplete && (
              <button
                onClick={autoPlay}
                disabled={isPlaying}
                className="flex items-center gap-2 px-6 py-3 bg-[#8a0000] text-white rounded-lg hover:bg-[#5e0000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Play className="w-5 h-5" />
                {isPlaying ? '播放中...' : '自动播放'}
              </button>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#8a0000] text-[#8a0000] rounded-lg hover:bg-[#8a0000] hover:text-white transition-colors font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              重新开始
            </button>
          </div>

          {/* 提示信息 */}
          <div className="text-center text-xs text-[#4a3b3b]/50">
            提示：可以使用键盘 J/K 键直接操作电键
          </div>
        </div>
      </div>
    </div>
  );
}

export default MorseCodeModal;
