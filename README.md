# CBaldur 项目总览

CBaldur 是一个集成前后端的案例管理与仿真平台，包含后端（ASP.NET Core 8）、前端（React 19+ Tailwind CSS + TypeScript）及沙箱环境。支持案例管理、用户管理、仿真任务、数据可视化等功能。

- `cbaldur-backend/` 后端服务，基于 .NET 8
- `cbaldur-frontend-next/` 前端项目，基于 React 19
- `cbaldur-sandbox/` 代码运行沙箱
- 根目录包含 Docker 部署相关内容（`docker-compose.yml`、`config.json` 等）

## AI 辅助编程使用须知

如果使用诸如Codex、Github Copilot等AI辅助编程工具，请注意：
- 请使用兼容`AGENTS.md`的代码工具，如果使用Claude Code请手动迁移至`CLAUDE.md`。
- *务必*在AI辅助编程工具中添加`context7` MCP，以确保AI工具能访问最新的项目文档和代码规范，可以参考[https://github.com/upstash/context7](https://github.com/upstash/context7)。



## 安装与运行

### 写在前面

请提前配置好环境变量，防止 corepack 对 `package.json` 造成不兼容的修改。

```bash
export COREPACK_ENABLE_AUTO_PIN=0
```

```fish
set -x COREPACK_ENABLE_AUTO_PIN 0
```

### 后端

1. 进入 `cbaldur-backend` 目录。
2. 推荐开发工具：Rider > Visual Studio > VS Code。
3. 运行命令：

   ```bash
   dotnet run         # 仅运行
   dotnet watch       # 运行并监听文件变更
   ```

4. 配置数据库连接、JWT 密钥、Memcached 等（见 `appsettings.json`）。

### 前端

1. 进入 `cbaldur-frontend` 目录。
2. 复制环境变量模板：

   ```bash
   cp .env.example .env
   ```

3. 安装依赖：

   ```bash
   yarn           # 或 npm install / pnpm install / cnpm install
   ```

4. 启动开发环境：

   ```bash
   yarn dev       # 或 npm run dev / pnpm dev / cnpm run dev
   ```

5. 构建生产包：

   ```bash
   yarn build     # 或 npm run build / pnpm build / cnpm run build
   ```

### 沙箱

沙箱环境和字体文件位于 `cbaldur-sandbox` 目录，供后端/前端调用。

## 配置说明

- 后端配置文件：`cbaldur-backend/appsettings.json`
  - 数据库连接字符串、JWT 密钥、Memcached 主机等
- 前端配置文件：`cbaldur-frontend/.env`

## 主要功能

- 用户注册、登录、权限管理
- 案例的创建、编辑、运行、结果可视化
- 文件上传、下载、在线编辑与执行（支持 Python 等）
- 通知、组织、分享等模块
- 支持中英文界面与中文字体

## 依赖与环境

- Node.js ≥ 16（前端）
- .NET 8 SDK（后端）
- MySQL 数据库
- Memcached 缓存服务
- Docker（可选，支持容器化部署）

## 贡献与开发

- 前后端均支持主流开发环境
- 代码风格与提交规范请参考各自子项目 README

如需详细开发文档，请分别查阅 `cbaldur-backend/README.MD` 与 `cbaldur-frontend/README.md`。
