# 豪密 - 红色密码加密工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)

> 致敬历史，传承红色密码文化。基于周恩来"伍豪"编制的豪密加密系统原理实现的纯前端加密工具。

![豪密界面预览](./docs/screenshot.png)

## 项目简介

豪密（Hao Mi）是一款具有历史情怀的中文文本加密工具，采用"页码+位置+乱数"三层加密机制，灵感来源于1930年代中国共产党使用的高级密码通信系统。

### 核心特性

- **历史传承**：还原豪密加密原理，传承红色文化
- **纯前端实现**：所有加密运算在浏览器本地完成，无需服务器
- **可视化加密**：实时展示加密过程，便于理解算法原理
- **密码本管理**：支持自定义密码本，导入导出功能
- **复古UI设计**：红色特工风格，沉浸式体验

## 技术栈

- **框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5
- **样式**：TailwindCSS 3
- **图标**：Lucide React
- **存储**：localStorage

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

构建产物位于 `dist/` 目录

### 运行测试

```bash
npm test
```

## 加密原理

### 明码编码

每个汉字编码为6位数字：
```
明码 = 页码(2位) + 行号(2位) + 列号(2位)

示例："中" 在第05页第03行第12列
明码 = 050312
```

### 乱数生成

基于LCG算法生成确定性乱数：
```
乱数 = (seed × pageNumber × position) % 1000000
```

### 加密公式

```
密文 = (明码 + 乱数) % 1000000
```

### 解密公式

```
明码 = (密文 - 乱数 + 1000000) % 1000000
```

## 项目结构

```
haomi-cipher/
├── docs/                      # 项目文档
│   ├── REQUIREMENTS.md        # 需求文档
│   ├── TECH_SPEC.md          # 技术规范
│   ├── PRD.md                # 产品需求文档
│   ├── ARCHITECTURE.md       # 架构设计
│   ├── PLAN.md               # 开发计划
│   ├── ACCEPTANCE_CHECKLIST.md # 验收清单
│   └── ACCEPTANCE_REPORT.md  # 验收报告
├── src/
│   ├── core/                  # 核心算法
│   │   ├── cipher.ts         # 加密解密算法
│   │   ├── codebook.ts       # 密码本管理
│   │   ├── random.ts         # 乱数生成器
│   │   ├── storage.ts        # 本地存储
│   │   └── __tests__/        # 单元测试
│   ├── components/            # UI组件
│   │   ├── Layout.tsx        # 整体布局
│   │   ├── Header.tsx        # 顶部导航
│   │   ├── Footer.tsx        # 底部信息
│   │   ├── CodebookPanel.tsx # 密码本面板
│   │   └── CipherPanel.tsx   # 加密解密面板
│   ├── types/                 # TypeScript类型
│   │   └── index.ts
│   ├── styles/                # 样式文件
│   │   └── index.css
│   ├── App.tsx               # 主应用
│   └── main.tsx              # 入口文件
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

## 功能清单

### 核心功能

- [x] 中文文本加密
- [x] 密文解密
- [x] 密码本查看（明码本/密文表/乱数表）
- [x] 密码本分页浏览（300字/页）
- [x] 密码本导入/导出（JSON格式）
- [x] 加密过程可视化
- [x] 一键复制密文/明文

### 界面特性

- [x] 复古红色特工风格
- [x] 左右分栏布局（40%/60%）
- [x] 响应式设计
- [x] 动画效果
- [x] 印章装饰元素

## 默认密码本

使用《千字文》前3000字作为默认密码本：
- 共10页，每页300字
- 每页分配不同的随机种子
- 支持自定义密码本

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 安全说明

- 纯前端实现，数据不上传服务器
- 密码本存储在浏览器 localStorage
- 支持离线使用

## 开发团队

- **产品经理**：需求分析、验收标准
- **开发经理**：架构设计、项目管理
- **前端开发1**：核心算法实现
- **前端开发2**：UI组件开发
- **测试**：功能测试、质量保证

## 项目统计

- 文档数量：7个
- 源代码文件：20个
- 代码总行数：2,378行
- 单元测试：69个（全部通过）
- 构建产物：~200KB (gzip)

## 许可证

MIT License

## 致谢

致敬周恩来同志在密码工作中的卓越贡献，传承红色文化。
