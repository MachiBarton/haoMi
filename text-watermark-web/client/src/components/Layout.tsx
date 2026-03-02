import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-8 px-4 max-w-7xl">
        {children}
      </main>
    </div>
  );
};

export default Layout;
