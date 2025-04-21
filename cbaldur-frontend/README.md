# CBaldur 前端项目指南

## 1. 前端项目介绍

前端项目采用Nuxt + Tailwind CSS + Typescript的开发模式进行开发，使用的库大致如下

+ antv/g2
+ nuxt ui
+ monaco-editor
+ d3
+ markdown-it

## 2. 前端开发须知

1. 前端开发可以在任意操作系统进行运行，对Linux or Win Or Mac没有任何要求
2. 建议的SDK版本为nodejs@lts，yarn@1.22.22 或者 npm@10+

## 3. 前端运行流程

1. 将案例环境变量转换为项目环境变量

```bash
cp .env.example .env
```

2. 安装依赖
```bash
yarn #如果使用yarn
npm install #如果使用npm
pnpm install #如果使用pnpm
cnpm install #如果使用cnpm
```
3. 运行项目

```bash
yarn dev #如果使用yarn
npm run dev #如果使用npm
pnpm dev #如果使用pnpm
cnpm run dev #如果使用cnpm
```

4. 项目构建

```bash
yarn build #如果使用yarn
npm run build #如果使用npm
pnpm build #如果使用pnpm
cnpm run build #如果使用cnpm
```