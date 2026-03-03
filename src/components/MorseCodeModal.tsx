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

export function MorseCodeModal({ isOpen, onClose, ciphertext }: MorseCodeModalProps) {
  const [morseCode, setMorseCode] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [activeKey, setActiveKey] = useState<'J' | 'K' | null>(null);
  const playerRef = useRef<MorseCodePlayer | null>(null);
  const morseSequence = useRef<string[]>([]);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 初始化摩尔斯电码
  useEffect(() => {
    if (isOpen && ciphertext) {
      const morse = convertToMorse(ciphertext);
      setMorseCode(morse);
      morseSequence.current = parseMorseSequence(morse);
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

  // 手动按键处理
  const handleKeyDown = useCallback((key: 'J' | 'K') => {
    if (isPlaying || isComplete || !playerRef.current) return;

    setActiveKey(key);
    const sequence = morseSequence.current;
    const expectedChar = sequence[currentIndex];

    if ((key === 'J' && expectedChar === '.') || (key === 'K' && expectedChar === '-')) {
      // 正确输入 - 使用 Player 播放
      const player = playerRef.current;
      player.clearQueue();
      player.queueLetter(key === 'J' ? '.' : '-', 600);

      // 播放单个音
      player.start(undefined, () => {
        player.stop();
      });

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
  }, [currentIndex, isPlaying, isComplete]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a2e] rounded-lg shadow-2xl border-2 border-[#8a0000] max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-[#8a0000]/30 bg-[#0f0f1a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8a0000]/20 flex items-center justify-center">
              <Radio className="w-6 h-6 text-[#8a0000]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#e8e0d5]">模拟发报</h2>
              <p className="text-xs text-[#e8e0d5]/60">使用 J/K 键模拟电键发报</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-[#8a0000]/20 flex items-center justify-center text-[#e8e0d5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-6 space-y-6">
          {/* 密文显示 */}
          <div className="bg-[#0f0f1a] rounded p-4 border border-[#8a0000]/20">
            <div className="text-xs text-[#e8e0d5]/60 mb-2 uppercase tracking-wider">密文</div>
            <div className="font-mono text-lg text-[#e8e0d5] break-all tracking-wider">
              {ciphertext}
            </div>
          </div>

          {/* 摩尔斯电码显示 */}
          <div className="bg-[#0f0f1a] rounded p-4 border border-[#8a0000]/20">
            <div className="text-xs text-[#e8e0d5]/60 mb-2 uppercase tracking-wider">摩尔斯电码</div>
            <div className="font-mono text-xl text-[#8a0000] break-all tracking-[0.3em] leading-relaxed">
              {morseCode.split('').map((char, index) => (
                <span
                  key={index}
                  className={`inline-block transition-all duration-200 ${
                    index < currentIndex
                      ? 'text-[#00ff00] font-bold'
                      : index === currentIndex && isPlaying
                      ? 'text-[#ffff00] animate-pulse'
                      : 'text-[#8a0000]/40'
                  }`}
                >
                  {char === ' ' ? '\u00A0\u00A0\u00A0' : char}
                </span>
              ))}
            </div>
          </div>

          {/* 电码可视化 - 复古电报机样式 */}
          <div className="bg-[#0a0a14] rounded-lg p-6 border-2 border-[#3a3a4e] relative overflow-hidden">
            {/* 扫描线效果 */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="h-full w-full" style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00ff00 2px, #00ff00 4px)'
              }} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="text-xs text-[#e8e0d5]/60 uppercase tracking-wider text-center">
                发报进度
              </div>

              {/* 电码显示条 */}
              <div className="flex flex-wrap justify-center gap-1 min-h-[60px] items-center">
                {morseSequence.current.map((char, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
                      index < currentIndex
                        ? 'bg-[#00ff00] border-[#00ff00] text-[#0a0a14]'
                        : index === currentIndex
                        ? 'bg-[#ffff00] border-[#ffff00] text-[#0a0a14] animate-pulse'
                        : 'bg-transparent border-[#3a3a4e] text-[#3a3a4e]'
                    }`}
                  >
                    {char === ' ' ? (
                      <span className="text-xs">/</span>
                    ) : (
                      <span className="text-lg font-bold">{char}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* 状态指示 */}
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00ff00]" />
                  <span className="text-[#00ff00]">已发送</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ffff00] animate-pulse" />
                  <span className="text-[#ffff00]">当前</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2 border-[#3a3a4e]" />
                  <span className="text-[#e8e0d5]/40">待发送</span>
                </div>
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
                      ? 'bg-[#ffff00] border-[#ffff00] scale-95 shadow-[0_0_30px_rgba(255,255,0,0.5)]'
                      : 'bg-[#2a2a3e] border-[#3a3a4e] hover:border-[#8a0000] hover:shadow-[0_0_20px_rgba(138,0,0,0.3)]'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${activeKey === 'J' ? 'text-[#0a0a14]' : 'text-[#e8e0d5]'}`}>
                      J
                    </div>
                    <div className={`text-xs mt-1 ${activeKey === 'J' ? 'text-[#0a0a14]/70' : 'text-[#e8e0d5]/50'}`}>
                      短音 (·)
                    </div>
                  </div>
                </button>
                <div className="text-xs text-[#e8e0d5]/40">点 [dit]</div>
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
                      ? 'bg-[#00ff00] border-[#00ff00] scale-95 shadow-[0_0_30px_rgba(0,255,0,0.5)]'
                      : 'bg-[#2a2a3e] border-[#3a3a4e] hover:border-[#8a0000] hover:shadow-[0_0_20px_rgba(138,0,0,0.3)]'
                  }`}
                >
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${activeKey === 'K' ? 'text-[#0a0a14]' : 'text-[#e8e0d5]'}`}>
                      K
                    </div>
                    <div className={`text-xs mt-1 ${activeKey === 'K' ? 'text-[#0a0a14]/70' : 'text-[#e8e0d5]/50'}`}>
                      长音 (-)
                    </div>
                  </div>
                </button>
                <div className="text-xs text-[#e8e0d5]/40">划 [dah]</div>
              </div>
            </div>
          ) : (
            /* 完成提示 */
            <div className="bg-[#00ff00]/10 border-2 border-[#00ff00] rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">📻</div>
              <h3 className="text-xl font-bold text-[#00ff00] mb-2">发报完成！</h3>
              <p className="text-[#e8e0d5]">同志，你安全地传输了消息。</p>
              <p className="text-sm text-[#e8e0d5]/60 mt-1">消息已通过加密信道成功发送</p>
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
          <div className="text-center text-xs text-[#e8e0d5]/40">
            提示：可以使用键盘 J/K 键直接操作电键
          </div>
        </div>
      </div>
    </div>
  );
}

export default MorseCodeModal;
