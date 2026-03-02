import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, GitCompare } from 'lucide-react';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab = location.pathname === '/compare' ? 'compare' : 'watermark';

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary rounded-lg">
          <FileText className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold">文本水印系统</h1>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => navigate(value === 'compare' ? '/compare' : '/')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="watermark" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            添加水印
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            文档识别
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default Header;
