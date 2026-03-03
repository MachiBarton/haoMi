import { useState, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Zap,
  Copy,
  Check,
  Edit3,
  ArrowDown
} from 'lucide-react';
import type { Codebook, CipherMode, EncryptionResult } from '../types';
import { CipherError } from '../core/cipher';

interface CipherPanelProps {
  codebook: Codebook;
  mode: CipherMode;
  onModeChange: (mode: CipherMode) => void;
  onEncrypt?: (plaintext: string) => EncryptionResult;
  onDecrypt?: (ciphertext: string) => string;
}

export function CipherPanel({
  codebook: _codebook,
  mode,
  onModeChange,
  onEncrypt,
  onDecrypt
}: CipherPanelProps) {
  // 加密和解密使用独立的输入状态
  const [encryptInput, setEncryptInput] = useState('');
  const [decryptInput, setDecryptInput] = useState('');
  const [outputText, setOutputText] = useState('');
  const [result, setResult] = useState<EncryptionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 根据当前模式获取对应的输入值和设置函数
  const inputText = mode === 'encrypt' ? encryptInput : decryptInput;
  const setInputText = mode === 'encrypt' ? setEncryptInput : setDecryptInput;

  // 处理加密
  const handleEncrypt = useCallback(() => {
    if (!encryptInput.trim() || !onEncrypt) return;

    try {
      setShowErrorModal(false);
      const encryptionResult = onEncrypt(encryptInput);
      setResult(encryptionResult);
      setOutputText(encryptionResult.ciphertext);
    } catch (err) {
      if (err instanceof CipherError) {
        setErrorMessage(err.message);
        setShowErrorModal(true);
      } else {
        setErrorMessage('加密失败，请检查输入');
        setShowErrorModal(true);
      }
    }
  }, [encryptInput, onEncrypt]);

  // 处理解密
  const handleDecrypt = useCallback(() => {
    if (!decryptInput.trim() || !onDecrypt) return;

    try {
      setShowErrorModal(false);
      const decrypted = onDecrypt(decryptInput);
      setOutputText(decrypted);
    } catch (err) {
      if (err instanceof CipherError) {
        setErrorMessage(err.message);
        setShowErrorModal(true);
      } else {
        setErrorMessage('解密失败，请检查密文格式');
        setShowErrorModal(true);
      }
    }
  }, [decryptInput, onDecrypt]);

  // 执行操作
  const handleExecute = () => {
    if (mode === 'encrypt') {
      handleEncrypt();
    } else {
      handleDecrypt();
    }
  };

  // 复制结果
  const handleCopy = async () => {
    if (!outputText) return;

    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="w-3/5 flex flex-col bg-[#fcf8f3] relative">
      {/* 绝密印章装饰 */}
      <div className="absolute top-4 right-4 opacity-10 pointer-events-none rotate-12 z-0">
        <div className="border-4 border-[#8a0000] rounded-full w-32 h-32 flex items-center justify-center">
          <span className="text-[#8a0000] font-bold text-xl uppercase transform -rotate-12">
            绝密文件
          </span>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex border-b border-[#8a0000]/20 pt-4 px-6 gap-6 z-10">
        <TabButton
          active={mode === 'encrypt'}
          onClick={() => onModeChange('encrypt')}
          icon={<Lock className="w-5 h-5" />}
          label="🔒 加密"
        />
        <TabButton
          active={mode === 'decrypt'}
          onClick={() => onModeChange('decrypt')}
          icon={<Unlock className="w-5 h-5" />}
          label="🔓 解密"
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6 z-10 flex flex-col gap-6">
        {/* 输入框 */}
        <div className="flex flex-col gap-2">
          <label className="text-[#8a0000] font-bold text-sm tracking-wide uppercase flex items-center justify-between">
            <span>{mode === 'encrypt' ? '明文（输入要加密的内容）' : '密文（输入要解密的内容）'}</span>
            <span className="text-xs text-[#4a3b3b]/70 normal-case font-normal">
              {mode === 'encrypt' ? '请输入中文字符进行加密' : '请输入数字密文进行解密'}
            </span>
          </label>
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encrypt' ? '请在此处输入消息内容... (例如: 天地玄黄)' : '请输入密文... (例如: 1234567-7890123)'}
              className="w-full h-32 p-4 bg-white/60 border border-[#8a0000]/30 rounded focus:ring-2 focus:ring-[#8a0000]/20 focus:border-[#8a0000] focus:outline-none text-lg text-[#1d0c0c] resize-none shadow-inner placeholder-[#4a3b3b]/30"
            />
            <Edit3 className="absolute bottom-3 right-3 w-5 h-5 text-[#8a0000]/30" />
          </div>
        </div>

        {/* 加密过程可视化 */}
        {mode === 'encrypt' && result && result.details.length > 0 && (
          <div className="border border-[#8a0000]/20 rounded-lg bg-[#e8e0d5]/30 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold text-[#4a3b3b] uppercase tracking-wider">
                加密过程
              </h3>
              <span className="text-xs font-mono text-[#8a0000]">
                耗时: {result.duration}ms
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {result.details.slice(0, 5).map((detail, index) => (
                <div key={index} className="flex-none flex flex-col items-center gap-1 min-w-[60px]">
                  {/* 原字符 */}
                  <div className="w-10 h-10 border border-[#8a0000]/40 bg-white flex items-center justify-center font-bold text-lg rounded shadow-sm">
                    {detail.char}
                  </div>
                  <ArrowDown className="w-3 h-3 text-[#8a0000]/40" />
                  {/* 明码 */}
                  <div className="bg-[#8a0000]/10 px-2 py-0.5 rounded text-xs font-mono text-[#8a0000] font-bold">
                    {detail.clearCode}
                  </div>
                  <span className="text-[10px] text-[#4a3b3b]">+{detail.random}</span>
                  {/* 密文 */}
                  <div className="bg-[#1d0c0c] text-white px-2 py-0.5 rounded text-xs font-mono">
                    {detail.cipherCode}
                  </div>
                </div>
              ))}
              {result.details.length > 5 && (
                <div className="flex-none flex flex-col items-center justify-center gap-1 min-w-[40px] opacity-30">
                  <span className="text-2xl">...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 执行按钮 */}
        <div className="flex justify-center my-2">
          <button
            onClick={handleExecute}
            disabled={!inputText.trim()}
            className="group relative px-8 py-3 bg-[#8a0000] text-white font-bold tracking-widest uppercase rounded shadow-[4px_4px_0px_0px_rgba(138,0,0,0.2)] hover:translate-y-0.5 hover:shadow-none transition-all duration-150 flex items-center gap-3 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <Zap className="w-5 h-5 relative z-10" />
            <span className="relative z-10">
              {mode === 'encrypt' ? '执行加密' : '执行解密'}
            </span>
          </button>
        </div>

        {/* 输出框 */}
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-[#8a0000] font-bold text-sm tracking-wide uppercase flex items-center justify-between">
            <span>{mode === 'encrypt' ? '密文（复制发送）' : '明文（解密结果）'}</span>
            {outputText && (
              <button
                onClick={handleCopy}
                className="text-xs text-[#8a0000] underline decoration-dotted hover:text-[#5e0000] flex items-center gap-1 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    复制
                  </>
                )}
              </button>
            )}
          </label>
          <div className="relative flex-1">
            <textarea
              value={outputText}
              readOnly
              placeholder="结果将显示在这里..."
              className="w-full h-full min-h-[140px] p-4 bg-[#f2e8e8] border-2 border-dashed border-[#8a0000]/40 rounded focus:outline-none font-mono text-lg text-[#8a0000] tracking-widest leading-loose resize-none cursor-text"
            />
            {outputText && (
              <div className="absolute bottom-4 right-4 border-2 border-green-700 text-green-700 rounded p-1 px-3 -rotate-3 opacity-80 font-bold uppercase text-sm flex items-center gap-1">
                <Check className="w-4 h-4" />
                已验证
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 错误弹窗 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#fcf8f3] rounded-lg shadow-2xl border-2 border-[#8a0000] p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-[#8a0000]">加密错误</h3>
            </div>
            <p className="text-[#1d0c0c] mb-6 leading-relaxed">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-6 py-2 bg-[#8a0000] text-white rounded hover:bg-[#5e0000] transition-colors font-medium"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 标签页按钮组件
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        pb-3 border-b-2 text-lg flex items-center gap-2 transition-colors
        ${active
          ? 'border-[#8a0000] text-[#8a0000] font-bold'
          : 'border-transparent text-[#4a3b3b]/50 font-medium hover:text-[#8a0000]/70'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default CipherPanel;
