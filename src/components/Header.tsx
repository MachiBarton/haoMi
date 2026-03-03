import { useState } from 'react';
import { Lock, User, HelpCircle, X } from 'lucide-react';

interface HeaderProps {
  isConnected?: boolean;
  connectionStatus?: string;
}

export function Header({
  connectionStatus = '已加密'
}: HeaderProps) {
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <>
      <header className="flex-none px-6 py-4 border-b-2 border-[#8a0000]/30 flex justify-between items-end bg-[#fcf8f3]">
        {/* 左侧标题区域 */}
        <div className="flex flex-col">
          <h1 className="text-[#8a0000] text-5xl font-black tracking-tight mb-1 drop-shadow-sm">
            豪密Lite
            <span className="text-2xl font-light text-[#4a3b3b] align-middle ml-3 tracking-widest opacity-80">
              (Hao Mi Lite)
            </span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-[#8a0000] text-white text-xs px-2 py-0.5 rounded-sm font-bold tracking-widest uppercase">
              绝密
            </span>
            <p className="text-[#8a0000]/80 text-sm font-medium tracking-wide font-mono">
              仿伍豪编制 · 2026
            </p>
          </div>
        </div>

        {/* 右侧状态区域 */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-right">
            <span className="text-xs text-[#4a3b3b] uppercase tracking-wider">
              安全连接
            </span>
            <div className="flex items-center gap-1 text-[#8a0000] text-sm font-bold">
              <Lock className="w-4 h-4" />
              <span>{connectionStatus}</span>
            </div>
          </div>

          {/* 关于按钮 */}
          <button
            onClick={() => setShowAboutModal(true)}
            className="h-10 w-10 rounded-full border-2 border-[#8a0000]/30 flex items-center justify-center bg-[#8a0000]/5 text-[#8a0000] hover:bg-[#8a0000] hover:text-white transition-colors"
            title="关于"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          {/* 用户头像 */}
          <div className="h-10 w-10 rounded-full border-2 border-[#8a0000]/30 flex items-center justify-center bg-[#8a0000]/5 text-[#8a0000]">
            <User className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* 关于弹框 */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#fcf8f3] rounded-lg shadow-2xl border-2 border-[#8a0000] max-w-2xl w-full max-h-[80vh] overflow-auto">
            {/* 弹框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-[#8a0000]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8a0000]/10 flex items-center justify-center">
                  <span className="text-[#8a0000] text-xl font-bold">密</span>
                </div>
                <h2 className="text-xl font-bold text-[#8a0000]">关于豪密Lite</h2>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="h-8 w-8 rounded-full hover:bg-[#8a0000]/10 flex items-center justify-center text-[#8a0000] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹框内容 */}
            <div className="p-6 space-y-6">
              {/* 什么是豪密 */}
              <section>
                <h3 className="text-lg font-bold text-[#8a0000] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a0000]"></span>
                  什么是豪密
                </h3>
                <p className="text-[#4a3b3b] leading-relaxed text-sm">
                  「豪密」是中国共产党早期领导人周恩来（党内代号"伍豪"）于1930年代在上海主持编制的一种高级加密通信系统。
                  该密码系统采用"复式译密"技术，结合明码本、乱数表和多层加密机制，是当时中共地下党组织最高级别的保密通信手段，
                  被誉为"中国共产党第一代密码"。豪密的破译难度极高，据说直到新中国成立后才逐渐解密。
                </p>
              </section>

              {/* 本项目介绍 */}
              <section>
                <h3 className="text-lg font-bold text-[#8a0000] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a0000]"></span>
                  本项目介绍
                </h3>
                <p className="text-[#4a3b3b] leading-relaxed text-sm">
                  「豪密Lite」是一个基于现代Web技术实现的豪密密码模拟工具。本项目以《三国演义》原文作为密码本，
                  采用"页号+行号+列号"的明码定位方式，结合乱数表实现分层加密。支持中文、数字、英文字母的混合加密，
                  可用于体验和学习早期密码学的基本原理。
                </p>
              </section>

              {/* 区别说明 */}
              <section>
                <h3 className="text-lg font-bold text-[#8a0000] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8a0000]"></span>
                  本项目与豪密的区别
                </h3>
                <div className="bg-[#8a0000]/5 rounded p-4 space-y-2 text-sm">
                  <div className="flex gap-3">
                    <span className="text-[#8a0000] font-bold whitespace-nowrap">密码本：</span>
                    <span className="text-[#4a3b3b]">
                      原版豪密使用专门编制的绝密码本；本项目使用公开文本《三国演义》作为密码本
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#8a0000] font-bold whitespace-nowrap">复杂度：</span>
                    <span className="text-[#4a3b3b]">
                      原版豪密采用多重加密和动态乱数；本项目为简化演示版本，加密层级较少
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#8a0000] font-bold whitespace-nowrap">用途：</span>
                    <span className="text-[#4a3b3b]">
                      原版用于战时绝密通信；本项目仅供学习体验，不具备真正的军事级安全性
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-[#8a0000] font-bold whitespace-nowrap">技术：</span>
                    <span className="text-[#4a3b3b]">
                      原版采用机械加密和人工译码；本项目使用现代JavaScript实现，运行在浏览器中
                    </span>
                  </div>
                </div>
              </section>

              {/* 底部提示 */}
              <div className="text-center text-xs text-[#4a3b3b]/60 pt-2 border-t border-[#8a0000]/10">
                致敬周恩来总理及隐蔽战线的革命先辈
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
