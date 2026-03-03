import { useState, useMemo } from 'react';
import {
  BookOpen,
  Dices,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  FileText
} from 'lucide-react';
import type { Codebook, CodebookTab } from '../types';

interface CodebookPanelProps {
  codebook: Codebook;
  currentPage: number;
  onPageChange: (page: number) => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

export function CodebookPanel({
  codebook,
  currentPage,
  onPageChange,
  onImport,
  onExport
}: CodebookPanelProps) {
  const [activeTab, setActiveTab] = useState<CodebookTab>('clear');
  const [pageInput, setPageInput] = useState(String(currentPage).padStart(2, '0'));

  // 获取当前页数据
  const currentPageData = useMemo(() => {
    return codebook.pages.find(p => p.pageNumber === currentPage);
  }, [codebook, currentPage]);

  // 生成明码本表格数据 (10行 x 30列)
  const codebookGrid = useMemo(() => {
    if (!currentPageData) return [];
    const grid: string[][] = [];
    for (let row = 0; row < 10; row++) {
      const rowChars: string[] = [];
      for (let col = 0; col < 30; col++) {
        const index = row * 30 + col;
        rowChars.push(currentPageData.characters[index] || '');
      }
      grid.push(rowChars);
    }
    return grid;
  }, [currentPageData]);

  // 生成乱数表数据
  const randomNumbers = useMemo(() => {
    if (!currentPageData) return [];
    const { randomSeed, pageNumber } = currentPageData;
    const numbers: number[] = [];
    for (let i = 0; i < 20; i++) {
      // LCG算法简化版
      const random = (randomSeed * pageNumber * (i + 1)) % 1000000;
      numbers.push(random);
    }
    return numbers;
  }, [currentPageData]);

  // 处理页码输入
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setPageInput(value);
  };

  const handlePageInputBlur = () => {
    const page = parseInt(pageInput, 10);
    if (page >= 1 && page <= codebook.totalPages) {
      onPageChange(page);
    } else {
      setPageInput(String(currentPage).padStart(2, '0'));
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
    }
  };

  // 分页导航
  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      onPageChange(newPage);
      setPageInput(String(newPage).padStart(2, '0'));
    }
  };

  const goToNextPage = () => {
    if (currentPage < codebook.totalPages) {
      const newPage = currentPage + 1;
      onPageChange(newPage);
      setPageInput(String(newPage).padStart(2, '0'));
    }
  };

  // 处理文件导入
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // 重置input以便可以重复选择同一文件
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f4ef]">
      {/* 标签页切换 */}
      <div className="flex border-b border-[#8a0000]/20 bg-[#fcf8f3]/50 px-4 pt-2 gap-1">
        <TabButton
          active={activeTab === 'clear'}
          onClick={() => setActiveTab('clear')}
          icon={<BookOpen className="w-4 h-4" />}
          label="明码本"
        />
        <TabButton
          active={activeTab === 'random'}
          onClick={() => setActiveTab('random')}
          icon={<Dices className="w-4 h-4" />}
          label="乱数表"
        />
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4 bg-[#fcf8f3] shadow-[inset_0_0_20px_rgba(139,69,19,0.1)]">
        {activeTab === 'clear' && (
          <div className="border border-[#8a0000]/30 rounded bg-white/50 backdrop-blur-sm">
            {/* 明码本表格 - 10x30网格 */}
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-[#8a0000]/10 text-[#8a0000] border-b border-[#8a0000]/30">
                  <th className="p-2 text-xs font-bold border-r border-[#8a0000]/20 w-12">行/列</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="p-2 text-xs font-bold border-r border-[#8a0000]/20 last:border-r-0">
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#1d0c0c] text-base">
                {codebookGrid.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-[#8a0000]/5 transition-colors group">
                    <td className="p-2 border-r border-b border-[#8a0000]/20 text-xs font-mono text-[#8a0000]/70 bg-[#e8e0d5]/30">
                      {String(rowIndex).padStart(2, '0')}
                    </td>
                    {row.slice(0, 10).map((char, colIndex) => (
                      <td
                        key={colIndex}
                        className="p-2 border-r border-b border-[#8a0000]/20 cursor-help hover:text-[#8a0000] hover:font-bold transition-colors"
                        title={`第${String(currentPage).padStart(2, '0')}页-第${String(rowIndex).padStart(2, '0')}行-第${colIndex}列`}
                      >
                        {char || '·'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 显示剩余列的简化视图 */}
            <div className="border-t border-[#8a0000]/20 p-2 bg-[#fcf8f3]/50">
              <div className="text-xs text-[#4a3b3b] mb-2 font-medium">第 10-29 列</div>
              <div className="grid grid-cols-10 gap-1">
                {codebookGrid.slice(0, 10).map((row, rowIndex) => (
                  row.slice(10).map((char, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className="text-center text-sm py-1 px-0.5 border border-[#8a0000]/10 rounded hover:bg-[#8a0000]/5 hover:text-[#8a0000] cursor-help transition-colors"
                      title={`第${String(currentPage).padStart(2, '0')}页-第${String(rowIndex).padStart(2, '0')}行-第${colIndex + 10}列`}
                    >
                      {char || '·'}
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'random' && (
          <div className="border border-[#8a0000]/30 rounded bg-white/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-[#8a0000]">乱数序列</h4>
              <span className="text-xs text-[#4a3b3b]">种子: {currentPageData?.randomSeed}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {randomNumbers.map((num, index) => (
                <div
                  key={index}
                  className="text-center py-2 px-1 bg-[#8a0000]/5 border border-[#8a0000]/10 rounded font-mono text-sm text-[#8a0000]"
                >
                  {String(num).padStart(6, '0')}
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-[#4a3b3b]/60 text-center">
              乱数 = (种子 × 页码 × 位置) % 1000000
            </div>
          </div>
        )}
      </div>

      {/* 底部控制区 */}
      <div className="flex-none p-4 bg-[#e8e0d5]/30 border-t border-[#8a0000]/20 flex flex-col gap-3">
        {/* 分页器 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="h-8 w-8 rounded-full border border-[#8a0000]/30 flex items-center justify-center hover:bg-[#8a0000] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="前一页"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center bg-white border border-[#8a0000]/30 rounded px-2 h-8">
              <span className="text-xs text-[#4a3b3b] mr-1">第</span>
              <input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                onBlur={handlePageInputBlur}
                onKeyDown={handlePageInputKeyDown}
                className="w-8 text-center text-sm font-mono font-bold text-[#8a0000] focus:outline-none bg-transparent"
              />
              <span className="text-xs text-[#4a3b3b] ml-1">页 / {String(codebook.totalPages).padStart(2, '0')}</span>
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= codebook.totalPages}
              className="h-8 w-8 rounded-full border border-[#8a0000]/30 flex items-center justify-center hover:bg-[#8a0000] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="后一页"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 密码本信息 */}
          <div className="flex items-center gap-2 text-xs text-[#4a3b3b]">
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{codebook.name}</span>
          </div>
        </div>

        {/* 导入/导出按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-center gap-2 px-3 py-2 border border-[#8a0000]/40 bg-white rounded text-[#8a0000] text-sm font-medium hover:bg-[#8a0000]/5 shadow-sm cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>导入txt</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-[#8a0000]/40 bg-white rounded text-[#8a0000] text-sm font-medium hover:bg-[#8a0000]/5 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>导出txt</span>
          </button>
        </div>
      </div>
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
        flex items-center gap-2 px-4 py-3 text-sm rounded-t transition-all
        ${active
          ? 'bg-[#fcf8f3] border-t-2 border-x border-[#8a0000] text-[#8a0000] font-bold translate-y-[1px] shadow-[0_-2px_5px_rgba(0,0,0,0.05)]'
          : 'text-[#4a3b3b]/70 hover:text-[#8a0000] hover:bg-[#fcf8f3]/50 font-medium'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default CodebookPanel;
