# AGENTS.md

## 项目组织和模块管理
`cbaldur-backend/` 是项目的后端文件夹，使用 ASP.NET Core 构建 REST API。主要目录结构：
- `Controllers/` - HTTP 端点控制器（Auth、Case、User、Plot、Organization、Notice、Share）
- `Services/` - 业务逻辑层，包含接口定义和实现
- `Models/` - 数据传输对象（DTO）和模型定义
- `Schemas/` - 配置架构定义
- `Utils/` - 工具类和辅助函数
- `Others/` - 其他辅助资源
- `data/` - 种子数据 JSON 文件
配置文件位于 `appsettings*.json` 中，敏感信息应保存在 `appsettings.Development.json`。

`cbaldur-frontend-next/` 是当前使用的 React 前端应用（使用 RSBuild 构建）。主要结构：
- `src/routes/` - 页面路由组件（使用 wouter 进行路由管理，包含 `auth/`、`cases/`、`add-cases/` 等主要路由）
- `src/components/` - 可复用组件
- `src/hooks/` - 自定义 React Hooks
- `src/redux/` - Redux 状态管理（store、slices、RTK Query API）
- `src/shadcn/` - shadcn/ui 组件库
- `src/types/` - TypeScript 类型定义

`cbaldur-sandbox/` 存放 Docker 资源、占位符密钥和字体文件。
`cbaldur-copyright/` 存放前后端 OpenAPI 规范文件。
根目录的 `docker-compose.yml` 用于容器编排。

## 前端注意事项
前端使用 React 19 库，使用 Redux Toolkit 进行状态管理，并使用 RSBuild 进行构建。
- **UI 组件**：基于 shadcn/ui（Radix UI primitives），样式使用 Tailwind CSS 4。
- **图标库**：使用 Lucide React。
- **路由**：通过 wouter 轻量级路由库管理。
- **状态管理**：应用程序状态通过 Redux Toolkit 处理，API 调用使用 RTK Query 进行管理。
- **其他库**：`sonner` 用于 Toast 通知，`next-themes` 用于主题管理。
- **绘图库**：uPlot + uplot-react。

uplot-wrapper 的使用方式为：
```tsx
import React from 'react';
import uPlot from 'uplot';
import UplotReact from 'uplot-react';
import 'uplot/dist/uPlot.min.css';

const Chart = () => (
    <UplotReact options={options} data={data} target={target} onCreate={(chart) => {}} onDelete={(chart) => {}} />
);
``` 

你可以从 context7 中获取 uplot 的文档

## 后端注意事项
后端使用 ASP.NET Core 构建，遵循 RESTful API 设计原则。
- **数据库 ORM**：使用 `FreeSql` (MySQL)。
- **依赖注入**：使用 `Lamar` 替代默认 DI 容器。
- **缓存**：使用 `EnyimMemcached` 连接 Memcached。
- **身份验证**：使用 JWT，Token 存储在名为 `AuthToken` 的 Cookie 中。
- **文档**：Swagger/OpenAPI 集成了 Cookie 认证支持。

控制器处理 HTTP 请求并调用服务层进行业务逻辑处理。数据传输对象（DTO）定义在 `Models/` 目录中，确保前后端数据一致性。配置文件使用 JSON 格式，敏感信息应通过用户机密或环境变量管理。

## 安装方式
+ `cbaldur-backend/` 使用 `dotnet build` 进行构建，使用 `dotnet run` 启动
+ `cbaldur-frontend-next/` 使用 `npm install` 安装依赖，使用 `npm run dev` 启动开发服务器

## 代码风格

后端代码遵循默认的 .NET 格式（4个空格缩进，文件范围命名空间）。控制器和服务使用 PascalCase；异步服务方法以 `Async` 结尾，DTO 位于 `Models/` 中，配置键保持 camelCase。更倾向于使用依赖注入而不是静态状态。

前端代码保持 TypeScript 严格模式，倾向于使用 hooks 共享逻辑，并遵循现有的文件夹组织结构。在 `cbaldur-frontend-next/` 中通过 `npm run format` 运行 Prettier 格式化代码，使用 `npm run lint` 检查代码规范。Tailwind 工具类应按断点顺序排列以提高可读性。

## 测试指南
暂时无单元测试和集成测试

## 提交和拉取请求指南
commit 格式为 "YYYY/MM/DD 简短描述"，分支命名为 "feature/简短描述" 或 "bugfix/简短描述"。

## 安全性和配置提示
切勿提交真实的密钥；占位符凭据位于 `cbaldur-sandbox/` 和 `config.json` 中。通过用户机密或环境变量加载敏感值。在公开新端点之前，请检查 CORS 和身份验证设置，并确保生成的 OpenAPI 文件省略敏感架构。
