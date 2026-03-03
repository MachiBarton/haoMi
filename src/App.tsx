import { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CodebookPanel } from './components/CodebookPanel';
import { CipherPanel } from './components/CipherPanel';
import { generateDefaultCodebook } from './core/codebook';
import { encrypt, decrypt } from './core/cipher';
import type { Codebook, CipherMode, EncryptionResult } from './types';

function App() {
  const [codebook, setCodebook] = useState<Codebook | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState<CipherMode>('encrypt');
  const [charCount, setCharCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState<'ready' | 'processing' | 'error'>('ready');
  const [isLoading, setIsLoading] = useState(true);

  // 加载密码本
  useEffect(() => {
    const initCodebook = async () => {
      setIsLoading(true);
      try {
        // 优先从文件加载默认密码本（确保使用最新的txt文件）
        const defaultCodebook = await generateDefaultCodebook();
        setCodebook(defaultCodebook);
        // 不保存到localStorage（密码本太大，超过5MB限制）
      } catch (error) {
        console.error('加载密码本失败:', error);
        setStatus('error');
      } finally {
        setIsLoading(false);
      }
    };
    initCodebook();
  }, []);

  // 处理加密
  const handleEncrypt = useCallback((plaintext: string): EncryptionResult => {
    if (!codebook) throw new Error('密码本未加载');
    setStatus('processing');
    try {
      const result = encrypt(plaintext, codebook);
      setCharCount(result.details.length);
      setDuration(result.duration);
      setStatus('ready');
      return result;
    } catch (error) {
      setStatus('error');
      console.error('加密失败:', error);
      throw error;
    }
  }, [codebook]);

  // 处理解密
  const handleDecrypt = useCallback((ciphertext: string): string => {
    if (!codebook) throw new Error('密码本未加载');
    setStatus('processing');
    try {
      const startTime = performance.now();
      const result = decrypt(ciphertext, codebook);
      const dur = performance.now() - startTime;
      setCharCount(result.length);
      setDuration(Math.round(dur * 100) / 100);
      setStatus('ready');
      return result;
    } catch (error) {
      setStatus('error');
      console.error('解密失败:', error);
      return '';
    }
  }, [codebook]);

  // 处理密码本导入（支持txt和json格式）
  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // 尝试解析为JSON格式（包含完整的密码本数据+乱数种子）
        if (file.name.endsWith('.json')) {
          const importedCodebook = JSON.parse(content) as Codebook;

          // 验证密码本格式
          if (!importedCodebook.pages || !Array.isArray(importedCodebook.pages)) {
            alert('密码本格式错误：缺少pages字段');
            return;
          }

          // 确保每页都有randomSeed
          for (const page of importedCodebook.pages) {
            if (typeof page.randomSeed !== 'number') {
              alert(`密码本格式错误：第${page.pageNumber}页缺少randomSeed`);
              return;
            }
          }

          setCodebook(importedCodebook);
          const totalChars = importedCodebook.pages.reduce((sum, p) =>
            sum + p.characters.filter(c => c).length, 0);
          alert(`密码本导入成功！共导入 ${totalChars} 个字符，${importedCodebook.totalPages} 页`);
          return;
        }

        // txt格式导入（仅汉字文本，使用固定种子确保可重复）
        if (file.name.endsWith('.txt')) {
          // 提取所有汉字
          const chars = Array.from(content).filter(c => /[\u4e00-\u9fa5]/.test(c));

          if (chars.length === 0) {
            alert('文件中没有找到中文字符');
            return;
          }

          // 按300字/页生成密码本
          const charsPerPage = 300;
          const totalPages = Math.ceil(chars.length / charsPerPage);
          const pages = [];

          for (let i = 0; i < totalPages; i++) {
            const startIdx = i * charsPerPage;
            const endIdx = Math.min(startIdx + charsPerPage, chars.length);

            let pageChars = chars.slice(startIdx, endIdx);
            // 补足300字
            while (pageChars.length < charsPerPage) {
              pageChars.push('');
            }

            // 使用固定种子：基于页码的确定性种子
            // 这样同样的文本总是生成同样的种子，确保跨设备可解密
            const fixedSeed = 100000 + (i + 1) * 1234;

            pages.push({
              pageNumber: i + 1,
              rows: 10,
              cols: 30,
              characters: pageChars,
              randomSeed: fixedSeed
            });
          }

          const newCodebook: Codebook = {
            name: file.name.replace('.txt', ''),
            version: '1.0.0',
            totalPages: pages.length,
            pages
          };

          setCodebook(newCodebook);
          alert(`密码本导入成功！共导入 ${chars.length} 个字符，生成 ${pages.length} 页\n\n注意：txt导入使用固定乱数种子。如需保留原始乱数种子，请使用json格式导出。`);
          return;
        }

        alert('不支持的文件格式，请上传.txt或.json文件');
      } catch (error) {
        console.error('导入失败:', error);
        alert('密码本导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  }, []);

  // 处理密码本导出（导出为json格式，包含完整的乱数种子）
  const handleExport = useCallback(() => {
    if (!codebook) return;
    // 导出完整的密码本数据（包含randomSeed）
    const exportData = JSON.stringify(codebook, null, 2);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${codebook.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [codebook]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">正在加载密码本...</p>
        </div>
      </div>
    );
  }

  if (!codebook) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">密码本加载失败</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout
      codebookName={codebook.name}
      status={status}
      charCount={charCount}
      duration={duration}
    >
      {/* 左侧密码本区域 */}
      <CodebookPanel
        codebook={codebook}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onImport={handleImport}
        onExport={handleExport}
      />

      {/* 右侧操作区域 */}
      <CipherPanel
        codebook={codebook}
        mode={mode}
        onModeChange={setMode}
        onEncrypt={handleEncrypt}
        onDecrypt={handleDecrypt}
      />
    </Layout>
  );
}

export default App;
