# AGENTS.md

## 项目组织和模块管理
`cbaldur-backend/` 是项目的后端文件夹，使用ASP .NET Core构建REST API。主要目录结构：
- `Controllers/` - HTTP端点控制器（Auth、Case、User、Plot、Organization、Notice、Share）
- `Services/` - 业务逻辑层，包含接口定义和实现
- `Models/` - 数据传输对象（DTO）和模型定义
- `Schemas/` - 配置架构定义
- `Utils/` - 工具类和辅助函数
- `Others/` - 其他辅助资源
- `data/` - 种子数据JSON文件
配置文件位于 `appsettings*.json` 中，敏感信息应保存在 `appsettings.Development.json`。

`cbaldur-frontend-next/` 是当前使用的React前端应用（使用RSBuild构建）。主要结构：
- `src/routes/` - 页面路由组件（使用wouter进行路由管理）
- `src/components/` - 可复用组件
- `src/hooks/` - 自定义React Hooks
- `src/redux/` - Redux状态管理（store、slices、RTK Query API）
- `src/shadcn/` - shadcn/ui组件库
- `src/types/` - TypeScript类型定义

`cbaldur-sandbox/` 存放Docker资源、占位符密钥和字体文件。
`cbaldur-copyright/` 存放前后端OpenAPI规范文件。
根目录的 `docker-compose.yml` 用于容器编排。

## 前端注意事项
前端使用React 19库，使用Redux Toolkit进行状态管理，并使用RSBuild进行构建。UI组件主要基于shadcn/ui（Radix UI primitives），样式使用Tailwind CSS 4。路由通过wouter轻量级路由库管理，应用程序状态通过Redux Toolkit处理。API调用使用RTK Query进行管理。

目前的绘图库uPlot+uplot-Wrapper。

uplot-wrapper的使用方式为：
```tsx
import React from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';

const Chart = () => (
    <UplotReact options={options} data={data} target={target} onCreate={(chart) => {}} onDelete={(chart) => {}} />
);
``` 

你可以从context7中获取uplot的文档

## 后端注意事项
后端使用ASP .NET Core构建，遵循RESTful API设计原则。控制器处理HTTP请求并调用服务层进行业务逻辑处理。数据传输对象（DTO）定义在 `Models/` 目录中，确保前后端数据一致性。配置文件使用JSON格式，敏感信息应通过用户机密或环境变量管理。API文档通过OpenAPI规范生成，确保接口清晰可用。

## 安装方式
+ `cbaldur-backend/` 使用`dotnet build`进行构建，使用`dotnet run` 启动
+ `cbaldur-frontend-next/` 使用`npm install`安装依赖，使用`npm run dev`启动开发服务器


## 代码风格

后端代码遵循默认的 .NET 格式（4个空格缩进，文件范围命名空间）。控制器和服务使用 PascalCase；异步服务方法以 `Async` 结尾，DTO 位于 `Models/` 中，配置键保持 camelCase。更倾向于使用依赖注入而不是静态状态。

前端代码保持 TypeScript 严格模式，倾向于使用 hooks 共享逻辑，并遵循现有的文件夹组织结构。在 `cbaldur-frontend-next/` 中通过 `npm run format` 运行 Prettier 格式化代码，使用 `npm run lint` 检查代码规范。Tailwind 工具类应按断点顺序排列以提高可读性。

## 测试指南
暂时无单元测试和集成测试

## 提交和拉取请求指南
commit格式为"YYYY/MM/DD 简短描述"，分支命名为"feature/简短描述"或"bugfix/简短描述"。

## 安全性和配置提示
切勿提交真实的密钥；占位符凭据位于 `cbaldur-sandbox/` 和 `config.json` 中。通过用户机密或环境变量加载敏感值。在公开新端点之前，请检查 CORS 和身份验证设置，并确保生成的 OpenAPI 文件省略敏感架构。
