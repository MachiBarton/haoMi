# 文本水印 Web 服务实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个全栈文本水印 Web 服务，后端使用 Node.js + Express + TypeScript，前端使用 Vite + React + TypeScript + shadcn/ui，支持添加水印和文档识别对比功能

**Architecture:** 前后端分离架构，后端复用现有的水印核心库提供 REST API，前端使用 Monaco Editor 实现文本编辑和对比功能，共享类型定义确保类型安全

**Tech Stack:** Node.js, Express, TypeScript, Vite, React, Tailwind CSS, shadcn/ui, Monaco Editor

---

## 项目初始化

### Task 1: 创建项目目录结构

**Files:**
- Create: `text-watermark-web/package.json`
- Create: `text-watermark-web/shared/types.ts`
- Create: `text-watermark-web/server/package.json`
- Create: `text-watermark-web/client/package.json`

**Step 1: 创建根目录和 package.json**

```bash
cd "/Users/marcus/Desktop/digital watermark"
mkdir -p text-watermark-web/shared text-watermark-web/server/src/routes text-watermark-web/client/src
```

**Step 2: 创建根 package.json**

```json
{
  "name": "text-watermark-web",
  "version": "1.0.0",
  "description": "文本水印 Web 服务",
  "private": true,
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "npm run build:server && npm run build:client",
    "build:server": "cd server && npm run build",
    "build:client": "cd client && npm run build"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

**Step 3: 创建共享类型定义 shared/types.ts**

```typescript
// 水印请求
export interface WatermarkRequest {
  text: string;
  userId: string;
  timestamp: number;
  customData: string;
}

// 水印响应
export interface WatermarkResponse {
  success: boolean;
  watermarkedText: string;
  info: {
    originalLength: number;
    watermarkedLength: number;
    paragraphCount: number;
  };
}

// 提取请求
export interface ExtractRequest {
  text: string;
}

// 提取响应
export interface ExtractResponse {
  success: boolean;
  data?: {
    userId: string;
    timestamp: number;
    customData: string;
    confidence: 'high' | 'medium' | 'low';
  } | null;
}

// 比对请求
export interface CompareRequest {
  original: string;
  suspicious: string;
}

// 比对响应
export interface CompareResponse {
  success: boolean;
  result: {
    similarity: number;
    confidence: 'high' | 'medium' | 'low' | 'none';
    matchedCount: number;
    totalParagraphs: number;
    matchedParagraphs: Array<{
      suspiciousText: string;
      originalText: string;
      similarity: number;
      originalIndex: number;
    }>;
  };
}

// API 通用响应
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Step 4: 创建 server/package.json**

```json
{
  "name": "text-watermark-server",
  "version": "1.0.0",
  "description": "文本水印服务后端",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

**Step 5: 创建 client/package.json**

```json
{
  "name": "text-watermark-client",
  "version": "1.0.0",
  "description": "文本水印服务前端",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@monaco-editor/react": "^4.6.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.303.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.8"
  }
}
```

**Step 6: Commit**

```bash
cd text-watermark-web
git init
git add .
git commit -m "chore: initialize project structure with TypeScript

- Add root package.json with workspaces
- Add shared types for API contracts
- Add server package.json with Express + TypeScript
- Add client package.json with Vite + React + TypeScript

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 后端开发

### Task 2: 配置后端 TypeScript

**Files:**
- Create: `text-watermark-web/server/tsconfig.json`

**Step 1: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: 安装依赖**

```bash
cd text-watermark-web/server
npm install
```

**Step 3: Commit**

```bash
cd text-watermark-web
git add server/tsconfig.json
git commit -m "chore: add server TypeScript configuration

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: 实现后端 API

**Files:**
- Create: `text-watermark-web/server/src/index.ts`
- Create: `text-watermark-web/server/src/routes/api.ts`

**Step 1: 复制核心水印库到 server**

```bash
cp -r "../src" text-watermark-web/server/src/watermark
```

**Step 2: 创建 server/src/index.ts**

```typescript
import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 路由
app.use('/api', apiRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 3: 创建 server/src/routes/api.ts**

```typescript
import { Router } from 'express';
import { embedWatermark, extractWatermark, compareTexts } from '../watermark';
import type {
  WatermarkRequest,
  WatermarkResponse,
  ExtractRequest,
  ExtractResponse,
  CompareRequest,
  CompareResponse
} from '../../shared/types';

const router = Router();

// POST /api/watermark - 添加水印
router.post('/watermark', (req, res) => {
  try {
    const { text, userId, timestamp, customData }: WatermarkRequest = req.body;

    if (!text || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, userId'
      });
    }

    const watermarkedText = embedWatermark(text, {
      userId,
      timestamp: timestamp || Date.now(),
      customData: customData || ''
    });

    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    const response: WatermarkResponse = {
      success: true,
      watermarkedText,
      info: {
        originalLength: text.length,
        watermarkedLength: watermarkedText.length,
        paragraphCount: paragraphs.length
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Watermark error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to embed watermark'
    });
  }
});

// POST /api/extract - 提取水印
router.post('/extract', (req, res) => {
  try {
    const { text }: ExtractRequest = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
    }

    const data = extractWatermark(text);

    const response: ExtractResponse = {
      success: true,
      data: data ? {
        userId: data.userId || '',
        timestamp: data.timestamp || 0,
        customData: data.customData || '',
        confidence: (data.confidence as 'high' | 'medium' | 'low') || 'low'
      } : null
    };

    res.json(response);
  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract watermark'
    });
  }
});

// POST /api/compare - 比对文档
router.post('/compare', (req, res) => {
  try {
    const { original, suspicious }: CompareRequest = req.body;

    if (!original || !suspicious) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: original, suspicious'
      });
    }

    const result = compareTexts(original, suspicious);

    const response: CompareResponse = {
      success: true,
      result: {
        similarity: result.similarity,
        confidence: result.confidence as 'high' | 'medium' | 'low' | 'none',
        matchedCount: result.matchedCount,
        totalParagraphs: result.totalParagraphs,
        matchedParagraphs: result.matchedParagraphs
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare texts'
    });
  }
});

export default router;
```

**Step 4: 为水印库添加类型声明**

创建 `text-watermark-web/server/src/watermark/index.d.ts`:

```typescript
export interface WatermarkData {
  userId: string;
  timestamp: number;
  customData: string;
  confidence?: string;
}

export interface CompareResult {
  similarity: number;
  confidence: string;
  matchedCount: number;
  totalParagraphs: number;
  matchedParagraphs: Array<{
    suspiciousText: string;
    originalText: string;
    similarity: number;
    originalIndex: number;
  }>;
}

export function embedWatermark(text: string, data: Omit<WatermarkData, 'confidence'>): string;
export function extractWatermark(text: string): WatermarkData | null;
export function compareTexts(original: string, suspicious: string): CompareResult;
```

**Step 5: 测试后端启动**

```bash
cd text-watermark-web/server
npm run dev
```
Expected: Server running on port 3001

**Step 6: Commit**

```bash
cd text-watermark-web
git add server/
git commit -m "feat: implement backend API with TypeScript

- Add Express server with CORS
- Add /api/watermark endpoint
- Add /api/extract endpoint
- Add /api/compare endpoint
- Copy watermark core library
- Add type declarations

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 前端开发

### Task 4: 配置前端 TypeScript 和 Tailwind

**Files:**
- Create: `text-watermark-web/client/tsconfig.json`
- Create: `text-watermark-web/client/tsconfig.node.json`
- Create: `text-watermark-web/client/vite.config.ts`
- Create: `text-watermark-web/client/tailwind.config.ts`
- Create: `text-watermark-web/client/postcss.config.js`

**Step 1: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Step 2: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 3: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**Step 4: 创建 tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

**Step 5: 创建 postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 6: 安装依赖**

```bash
cd text-watermark-web/client
npm install
npm install -D tailwindcss-animate
```

**Step 7: Commit**

```bash
cd text-watermark-web
git add client/tsconfig.json client/tsconfig.node.json client/vite.config.ts client/tailwind.config.ts client/postcss.config.js
git commit -m "chore: configure frontend TypeScript and Tailwind

- Add tsconfig.json with React and path aliases
- Add vite.config.ts with proxy to backend
- Add tailwind.config.ts with shadcn theme
- Add postcss.config.js

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: 初始化 shadcn/ui

**Files:**
- Create: `text-watermark-web/client/components.json`
- Create: `text-watermark-web/client/src/lib/utils.ts`
- Create: `text-watermark-web/client/src/styles/globals.css`

**Step 1: 创建 components.json**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Step 2: 创建 src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 3: 创建 src/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 4: Commit**

```bash
cd text-watermark-web
git add client/components.json client/src/lib/utils.ts client/src/styles/globals.css
git commit -m "chore: initialize shadcn/ui configuration

- Add components.json with shadcn settings
- Add utils.ts with cn() helper
- Add globals.css with CSS variables

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: 创建 shadcn/ui 组件

**Files:**
- Create: `text-watermark-web/client/src/components/ui/button.tsx`
- Create: `text-watermark-web/client/src/components/ui/card.tsx`
- Create: `text-watermark-web/client/src/components/ui/input.tsx`
- Create: `text-watermark-web/client/src/components/ui/label.tsx`
- Create: `text-watermark-web/client/src/components/ui/badge.tsx`
- Create: `text-watermark-web/client/src/components/ui/progress.tsx`
- Create: `text-watermark-web/client/src/components/ui/separator.tsx`
- Create: `text-watermark-web/client/src/components/ui/tabs.tsx`

**Step 1: 创建 Button 组件**

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

**Step 2: 创建 Card 组件**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-lg border bg-card text-card-foreground shadow-sm',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-2xl font-semibold leading-none tracking-tight',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

**Step 3: 创建 Input 组件**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
```

**Step 4: 创建 Label 组件**

```typescript
import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

**Step 5: 创建 Badge 组件**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

**Step 6: 创建 Progress 组件**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, ...props }, ref) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
```

**Step 7: 创建 Separator 组件**

```typescript
import * as React from 'react';
import { cn } from '@/lib/utils';

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = 'Separator';

export { Separator };
```

**Step 8: 创建 Tabs 组件**

```typescript
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

**Step 9: 安装 radix-ui 依赖**

```bash
cd text-watermark-web/client
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-tabs
```

**Step 10: Commit**

```bash
cd text-watermark-web
git add client/src/components/ui/
git commit -m "feat: add shadcn/ui components

- Add Button, Card, Input, Label components
- Add Badge, Progress, Separator, Tabs components
- Install radix-ui dependencies

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: 创建 Monaco Editor 组件

**Files:**
- Create: `text-watermark-web/client/src/components/MonacoEditor.tsx`

**Step 1: 安装 Monaco Editor**

```bash
cd text-watermark-web/client
npm install @monaco-editor/react
```

**Step 2: 创建 MonacoEditor 组件**

```typescript
import React from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  className?: string;
  language?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  height = '300px',
  readOnly = false,
  className,
  language = 'plaintext',
}) => {
  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(value) => onChange?.(value || '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          automaticLayout: true,
        }}
        theme="vs-light"
      />
    </div>
  );
};

export default MonacoEditor;
```

**Step 3: Commit**

```bash
cd text-watermark-web
git add client/src/components/MonacoEditor.tsx
git commit -m "feat: add Monaco Editor component

- Install @monaco-editor/react
- Create MonacoEditor wrapper component
- Support read-only mode and custom height

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: 创建 API 客户端

**Files:**
- Create: `text-watermark-web/client/src/lib/api.ts`

**Step 1: 创建 api.ts**

```typescript
import type {
  WatermarkRequest,
  WatermarkResponse,
  ExtractRequest,
  ExtractResponse,
  CompareRequest,
  CompareResponse,
} from '../../shared/types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // 添加水印
  watermark: (data: WatermarkRequest): Promise<WatermarkResponse> =>
    fetchApi<WatermarkResponse>('/watermark', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 提取水印
  extract: (data: ExtractRequest): Promise<ExtractResponse> =>
    fetchApi<ExtractResponse>('/extract', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 比对文档
  compare: (data: CompareRequest): Promise<CompareResponse> =>
    fetchApi<CompareResponse>('/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default api;
```

**Step 2: Commit**

```bash
cd text-watermark-web
git add client/src/lib/api.ts
git commit -m "feat: add API client

- Create api.ts with fetch wrapper
- Add watermark, extract, compare methods
- Use shared TypeScript types

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: 创建添加水印页面

**Files:**
- Create: `text-watermark-web/client/src/pages/WatermarkPage.tsx`

**Step 1: 创建 WatermarkPage.tsx**

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MonacoEditor } from '@/components/MonacoEditor';
import { api } from '@/lib/api';
import { Copy, Download, Trash2 } from 'lucide-react';

export const WatermarkPage: React.FC = () => {
  const [originalText, setOriginalText] = useState('');
  const [userId, setUserId] = useState('');
  const [customData, setCustomData] = useState('');
  const [watermarkedText, setWatermarkedText] = useState('');
  const [info, setInfo] = useState<{ originalLength: number; watermarkedLength: number; paragraphCount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!originalText || !userId) return;

    setLoading(true);
    try {
      const response = await api.watermark({
        text: originalText,
        userId,
        timestamp: Date.now(),
        customData,
      });

      if (response.success) {
        setWatermarkedText(response.watermarkedText);
        setInfo(response.info);
      }
    } catch (error) {
      console.error('Failed to generate watermark:', error);
      alert('生成水印失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(watermarkedText);
  };

  const handleDownload = () => {
    const blob = new Blob([watermarkedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watermarked-text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setOriginalText('');
    setWatermarkedText('');
    setInfo(null);
    setUserId('');
    setCustomData('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <Label className="text-lg font-semibold">原文本</Label>
            <div className="mt-2">
              <MonacoEditor
                value={originalText}
                onChange={setOriginalText}
                height="300px"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="userId">用户ID</Label>
              <Input
                id="userId"
                placeholder="输入用户ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timestamp">时间戳</Label>
              <Input
                id="timestamp"
                value={new Date().toLocaleString()}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="customData">自定义数据</Label>
              <Input
                id="customData"
                placeholder="授权信息等"
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={loading || !originalText || !userId}
          >
            {loading ? '生成中...' : '生成水印'}
          </Button>
        </CardContent>
      </Card>

      {watermarkedText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>带水印文本</span>
              <div className="flex gap-2">
                <Badge variant="secondary">原始: {info?.originalLength} 字符</Badge>
                <Badge variant="outline">水印: {info?.watermarkedLength} 字符</Badge>
                <Badge>段落: {info?.paragraphCount}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonacoEditor
              value={watermarkedText}
              height="300px"
              readOnly
            />
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              复制
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              下载
            </Button>
            <Button variant="ghost" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-2" />
              清空
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default WatermarkPage;
```

**Step 2: Commit**

```bash
cd text-watermark-web
git add client/src/pages/WatermarkPage.tsx
git commit -m "feat: add watermark page

- Create WatermarkPage with form inputs
- Integrate Monaco Editor for text editing
- Add generate, copy, download, clear functionality
- Use shadcn/ui Card, Button, Input, Label, Badge

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: 创建文档识别页面

**Files:**
- Create: `text-watermark-web/client/src/pages/ComparePage.tsx`

**Step 1: 创建 ComparePage.tsx**

```typescript
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MonacoEditor } from '@/components/MonacoEditor';
import { api } from '@/lib/api';
import type { CompareResponse } from '../../shared/types';
import Editor from '@monaco-editor/react';

export const ComparePage: React.FC = () => {
  const [originalText, setOriginalText] = useState('');
  const [suspiciousText, setSuspiciousText] = useState('');
  const [result, setResult] = useState<CompareResponse['result'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const handleCompare = async () => {
    if (!originalText || !suspiciousText) return;

    setLoading(true);
    setShowDiff(false);
    try {
      const response = await api.compare({
        original: originalText,
        suspicious: suspiciousText,
      });

      if (response.success) {
        setResult(response.result);
        setShowDiff(true);
      }
    } catch (error) {
      console.error('Failed to compare:', error);
      alert('比对失败');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getConfidenceText = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return '无';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>原始文本</CardTitle>
          </CardHeader>
          <CardContent>
            <MonacoEditor
              value={originalText}
              onChange={setOriginalText}
              height="200px"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>第三方文本</CardTitle>
          </CardHeader>
          <CardContent>
            <MonacoEditor
              value={suspiciousText}
              onChange={setSuspiciousText}
              height="200px"
            />
          </CardContent>
        </Card>
      </div>

      {showDiff && (
        <Card>
          <CardHeader>
            <CardTitle>差异对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] border rounded-md overflow-hidden">
              <Editor
                height="300px"
                language="plaintext"
                original={originalText}
                value={suspiciousText}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  renderSideBySide: true,
                  renderWhitespace: 'all',
                }}
                theme="vs-light"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>比对结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label>相似度</Label>
                <span className="font-bold text-lg">{(result.similarity * 100).toFixed(1)}%</span>
              </div>
              <Progress value={result.similarity * 100} className="h-3" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="block mb-2">置信度</Label>
                <Badge variant={getConfidenceColor(result.confidence)}>
                  {getConfidenceText(result.confidence)}
                </Badge>
              </div>
              <div>
                <Label className="block mb-2">匹配段落</Label>
                <Badge variant="outline">
                  {result.matchedCount} / {result.totalParagraphs}
                </Badge>
              </div>
            </div>

            {result.matchedParagraphs.length > 0 && (
              <div>
                <Label className="block mb-2">匹配详情</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {result.matchedParagraphs.map((match, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-md text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">段落 {match.originalIndex + 1}</span>
                        <Badge variant="secondary">
                          {(match.similarity * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground truncate">{match.suspiciousText}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={handleCompare}
        disabled={loading || !originalText || !suspiciousText}
      >
        {loading ? '比对中...' : '开始比对'}
      </Button>
    </div>
  );
};

export default ComparePage;
```

**Step 2: Commit**

```bash
cd text-watermark-web
git add client/src/pages/ComparePage.tsx
git commit -m "feat: add compare page

- Create ComparePage with dual Monaco Editors
- Add Monaco Diff Editor for visual comparison
- Display similarity progress bar
- Show confidence badge and match details

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: 创建布局和路由

**Files:**
- Create: `text-watermark-web/client/src/components/Layout.tsx`
- Create: `text-watermark-web/client/src/components/Header.tsx`
- Create: `text-watermark-web/client/src/App.tsx`
- Create: `text-watermark-web/client/src/main.tsx`
- Create: `text-watermark-web/client/index.html`

**Step 1: 创建 Layout.tsx**

```typescript
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
```

**Step 2: 创建 Header.tsx**

```typescript
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
```

**Step 3: 创建 App.tsx**

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { WatermarkPage } from '@/pages/WatermarkPage';
import { ComparePage } from '@/pages/ComparePage';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Header />
        <Routes>
          <Route path="/" element={<WatermarkPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
```

**Step 4: 创建 main.tsx**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 5: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>文本水印系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 6: Commit**

```bash
cd text-watermark-web
git add client/src/components/Layout.tsx client/src/components/Header.tsx client/src/App.tsx client/src/main.tsx client/index.html
git commit -m "feat: add layout and routing

- Create Layout component with container
- Create Header with navigation tabs
- Add React Router configuration
- Create main entry point

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 12: 根目录配置和启动脚本

**Files:**
- Modify: `text-watermark-web/package.json`
- Create: `text-watermark-web/README.md`

**Step 1: 更新根 package.json**

```json
{
  "name": "text-watermark-web",
  "version": "1.0.0",
  "description": "文本水印 Web 服务",
  "private": true,
  "workspaces": [
    "server",
    "client"
  ],
  "scripts": {
    "install:all": "npm install && cd server && npm install && cd ../client && npm install",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && npm run dev",
    "dev:client": "cd client && npm run dev",
    "build": "npm run build:server && npm run build:client",
    "build:server": "cd server && npm run build",
    "build:client": "cd client && npm run build",
    "start": "cd server && npm start"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

**Step 2: 创建 README.md**

```markdown
# 文本水印 Web 服务

基于零宽字符的文本水印系统，支持添加水印和文档识别对比。

## 功能

- **添加水印**: 在文本中嵌入不可见的用户信息（用户ID、时间戳、自定义数据）
- **文档识别**: 对比原始文本和第三方文本，检测相似度和抄袭行为
- **差异对比**: 使用 Monaco Editor 的 Diff 视图直观展示文本差异

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **编辑器**: Monaco Editor

## 快速开始

### 安装依赖

```bash
npm run install:all
```

### 开发模式

```bash
npm run dev
```

后端运行在 http://localhost:3001
前端运行在 http://localhost:5173

### 构建

```bash
npm run build
```

### 生产启动

```bash
npm run build
npm start
```

## API 接口

- `POST /api/watermark` - 添加水印
- `POST /api/extract` - 提取水印
- `POST /api/compare` - 比对文档
```

**Step 3: 安装根目录依赖**

```bash
cd text-watermark-web
npm install
```

**Step 4: Commit**

```bash
git add package.json README.md
git commit -m "chore: add root configuration and documentation

- Update root package.json with workspace scripts
- Add README.md with setup instructions
- Configure concurrently for parallel dev

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 13: 最终验证

**Step 1: 启动后端**

```bash
cd text-watermark-web/server
npm run dev
```
Expected: Server running on port 3001

**Step 2: 启动前端（新终端）**

```bash
cd text-watermark-web/client
npm run dev
```
Expected: Vite server running on port 5173

**Step 3: 测试 API**

```bash
curl -X POST http://localhost:3001/api/watermark \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello World","userId":"test123","timestamp":1700000000000,"customData":"test"}'
```

**Step 4: 最终提交**

```bash
cd text-watermark-web
git add .
git commit -m "feat: complete text watermark web service

- Full-stack TypeScript implementation
- Backend: Express API with watermark core library
- Frontend: React + Vite + shadcn/ui + Monaco Editor
- Features: Add watermark, Document comparison with diff view
- Shared TypeScript types between frontend and backend

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 项目结构

```
text-watermark-web/
├── shared/
│   └── types.ts                 # 共享类型定义
├── server/
│   ├── src/
│   │   ├── index.ts            # Express 入口
│   │   ├── routes/
│   │   │   └── api.ts          # API 路由
│   │   └── watermark/          # 核心水印库
│   ├── package.json
│   └── tsconfig.json
├── client/
│   ├── src/
│   │   ├── main.tsx            # React 入口
│   │   ├── App.tsx             # 路由配置
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui 组件
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MonacoEditor.tsx
│   │   ├── pages/
│   │   │   ├── WatermarkPage.tsx
│   │   │   └── ComparePage.tsx
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── api.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
├── package.json
└── README.md
```

---

## 使用说明

### 开发

```bash
cd text-watermark-web
npm run dev
```

### 访问

- 前端: http://localhost:5173
- 后端 API: http://localhost:3001

### 功能

1. **添加水印页面** (`/`)
   - 输入原文本
   - 填写用户ID和自定义数据
   - 点击"生成水印"
   - 复制或下载带水印的文本

2. **文档识别页面** (`/compare`)
   - 粘贴原始带水印文本
   - 粘贴第三方文本
   - 点击"开始比对"
   - 查看差异对比和相似度分析
