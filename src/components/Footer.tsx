import { BookOpen } from 'lucide-react';

interface FooterProps {
  codebookName: string;
  status: 'ready' | 'processing' | 'error';
  charCount?: number;
  duration?: number;
}

export function Footer({
  codebookName,
  status,
  charCount = 0,
  duration = 0
}: FooterProps) {
  const statusConfig = {
    ready: {
      text: '就绪',
      color: 'text-green-400',
      bgColor: 'bg-green-400'
    },
    processing: {
      text: '处理中',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400'
    },
    error: {
      text: '错误',
      color: 'text-red-400',
      bgColor: 'bg-red-400'
    }
  };

  const currentStatus = statusConfig[status];

  return (
    <footer className="flex-none bg-[#1d0c0c] text-[#f5f5dc] px-4 py-2 text-xs font-mono border-t-4 border-[#8a0000]/50 flex justify-between items-center shadow-[0_-5px_15px_rgba(0,0,0,0.3)] z-20">
      {/* 左侧信息 */}
      <div className="flex items-center gap-6">
        {/* 密码本名称 */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-red-400" />
          <span className="opacity-70">当前密码本:</span>
          <span className="font-bold text-white">{codebookName}</span>
        </div>

        <div className="h-3 w-px bg-white/20" />

        {/* 连接状态 */}
        <div className="flex items-center gap-2">
          <span className="opacity-70">状态:</span>
          <span className={`${currentStatus.color} flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.bgColor} animate-pulse`} />
            {currentStatus.text}
          </span>
        </div>
      </div>

      {/* 右侧统计 */}
      <div className="flex items-center gap-6">
        {/* 字数统计 */}
        <div className="flex items-center gap-2">
          <span className="opacity-70">字数:</span>
          <span className="font-bold">{charCount}</span>
        </div>

        {/* 用时统计 */}
        <div className="flex items-center gap-2">
          <span className="opacity-70">用时:</span>
          <span className="font-bold">{duration}ms</span>
        </div>

        {/* 机密标识 */}
        <div className="text-red-400 font-bold tracking-wider ml-4">
          机密
        </div>
      </div>
    </footer>
  );
}

export default Footer;
