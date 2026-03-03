import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Play, RotateCcw, Radio } from 'lucide-react';

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
  '-': '-...-', // 连字符
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const morseSequence = useRef<string[]>([]);

  // 初始化摩尔斯电码
  useEffect(() => {
    if (isOpen && ciphertext) {
      const morse = convertToMorse(ciphertext);
      setMorseCode(morse);
      morseSequence.current = parseMorseSequence(morse);
      setCurrentIndex(0);
      setIsComplete(false);
    }
  }, [isOpen, ciphertext]);

  // 电报机音频播放函数 - 模拟真实电报机声音
  const playTone = useCallback((duration: number) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const durationSec = duration / 1000;

      // 主振荡器 - 752Hz 电报机标准频率
      const oscillator = ctx.createOscillator();
      oscillator.frequency.setValueAtTime(752, now);
      oscillator.type = 'sine';

      // 第二振荡器 - 添加丰富谐波，使声音更浑厚
      const oscillator2 = ctx.createOscillator();
      oscillator2.frequency.setValueAtTime(1504, now); // 二次谐波
      oscillator2.type = 'sine';

      // 带通滤波器 - 模拟电报机的音频特性
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(752, now);
      bandpass.Q.setValueAtTime(15, now); // 较高的Q值产生明亮的声音

      // 主音量节点
      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, now);

      // 谐波音量节点
      const harmonicGain = ctx.createGain();
      harmonicGain.gain.setValueAtTime(0, now);

      // 信号路径：osillator -> gain -> bandpass -> destination
      oscillator.connect(mainGain);
      mainGain.connect(bandpass);
      oscillator2.connect(harmonicGain);
      harmonicGain.connect(bandpass);
      bandpass.connect(ctx.destination);

      // 包络设置 - 模拟电钥按下的响应
      const attackTime = 0.005; // 5ms 攻击时间
      const decayTime = 0.015; // 15ms 衰减开始

      // 主振荡器包络
      mainGain.gain.linearRampToValueAtTime(0.35, now + attackTime);
      mainGain.gain.setValueAtTime(0.35, now + durationSec - decayTime);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      // 谐波包络（较低的音量）
      harmonicGain.gain.linearRampToValueAtTime(0.08, now + attackTime);
      harmonicGain.gain.setValueAtTime(0.08, now + durationSec - decayTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      // 启动和停止
      oscillator.start(now);
      oscillator2.start(now);
      oscillator.stop(now + durationSec + 0.05);
      oscillator2.stop(now + durationSec + 0.05);

    } catch (e) {
      console.error('Audio play failed:', e);
    }
  }, []);

  // 自动播放摩尔斯电码
  const autoPlay = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setCurrentIndex(0);

    const sequence = morseSequence.current;

    for (let i = 0; i < sequence.length; i++) {
      const char = sequence[i];

      if (char === '.') {
        setActiveKey('J');
        playTone(80);  // 点：80ms
        await new Promise(resolve => setTimeout(resolve, 80));
        setActiveKey(null);
        await new Promise(resolve => setTimeout(resolve, 80)); // 元素间隔
      } else if (char === '-') {
        setActiveKey('K');
        playTone(240); // 划：240ms（3倍于点）
        await new Promise(resolve => setTimeout(resolve, 240));
        setActiveKey(null);
        await new Promise(resolve => setTimeout(resolve, 80)); // 元素间隔
      } else if (char === ' ') {
        await new Promise(resolve => setTimeout(resolve, 160)); // 字符间隔（额外2倍点时长）
      }

      setCurrentIndex(i + 1);
    }

    setIsPlaying(false);
    setIsComplete(true);
  }, [isPlaying, playTone]);

  // 手动按键处理
  const handleKeyDown = useCallback((key: 'J' | 'K') => {
    if (isPlaying || isComplete) return;

    setActiveKey(key);
    const sequence = morseSequence.current;
    const expectedChar = sequence[currentIndex];

    if ((key === 'J' && expectedChar === '.') || (key === 'K' && expectedChar === '-')) {
      // 正确输入
      playTone(key === 'J' ? 80 : 240);
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
  }, [currentIndex, isPlaying, isComplete, playTone]);

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
    setCurrentIndex(0);
    setIsComplete(false);
    setIsPlaying(false);
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
