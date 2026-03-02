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
