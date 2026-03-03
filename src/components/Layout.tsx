import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: ReactNode;
  codebookName?: string;
  status?: 'ready' | 'processing' | 'error';
  charCount?: number;
  duration?: number;
}

export function Layout({
  children,
  codebookName = '红色星火-1930-V1.book',
  status = 'ready',
  charCount = 0,
  duration = 0
}: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#fcf8f3] font-['Noto_Serif_SC',serif]">
      {/* 背景纹理层 */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-vintage-grid z-0" />
      <div className="fixed inset-0 pointer-events-none opacity-60 z-0 bg-paper-texture" />

      {/* 主容器 */}
      <div className="relative z-10 flex flex-col h-screen w-full max-w-[1600px] mx-auto overflow-hidden shadow-2xl border-x border-[#8a0000]/20 bg-[#fcf8f3]/90 backdrop-blur-sm">
        {/* 顶部导航 */}
        <Header />

        {/* 主内容区 */}
        <main className="flex-1 flex overflow-hidden">
          {children}
        </main>

        {/* 底部信息 */}
        <Footer
          codebookName={codebookName}
          status={status}
          charCount={charCount}
          duration={duration}
        />
      </div>
    </div>
  );
}

export default Layout;
