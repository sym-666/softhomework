# AGENTS.md

## 项目组织和模块管理
PaperPilot 是 AI 论文学习网站。

`paper-backend/` 是 FastAPI 后端：
- `app/routers/` - HTTP 接口（auth、users、papers、reading、notes、dashboard、ai）
- `app/services/` - 业务逻辑（PDF 提取、切块、后台解析、检索、论文问答、导读、模型调用、在线检索）
- `app/models.py` - SQLAlchemy 模型
- `app/schemas.py` - 接口模型基类，输出 camelCase
- `app/deps.py`、`app/security.py` - 当前用户、密码哈希和 JWT
- `alembic/` - 数据库迁移
- `tests/` - pytest 测试

`cbaldur-frontend/` 是 React 前端（RSBuild 构建），目录名沿用原项目：
- `src/routes/` - 页面（wouter 路由）
- `src/components/` - 组件，`office/` 是 Ribbon 界面框架，`reader/` 是 PDF 阅读器，`ai/` 是问答和导读，`notes/` 是笔记
- `src/hooks/` - 自定义 Hooks
- `src/redux/` - store 和 RTK Query 接口
- `src/i18n/` - 中英文翻译
- `src/shadcn/` - shadcn/ui 组件库

`docker/` 存放部署配置（`docker-compose.yml`、`.env.example`、`nginx.conf`、`DEPLOY.md`）。

## 前端注意事项
- **UI 组件**：shadcn/ui（Radix UI primitives），样式使用 Tailwind CSS 4，图标使用 Lucide React。
- **状态管理**：Redux Toolkit，接口调用使用 RTK Query；流式接口使用 `useAiChatStream`、`useGuideStream`。
- **国际化**：新增文案同时写 `zh-CN` 和 `en`。翻译 key 可能出现在 `id="..."` 和 `id: '...'` 中，清理时两种写法都要检查。
- **标签页**：右侧学习面板中需要保留状态的 `TabsContent` 要加 `forceMount`，否则切换标签会丢失状态。
- **大体积依赖**：pdf.js、ECharts 通过 `lazy` 按需加载。

## 后端注意事项
- **接口约定**：路径由 `LowercaseApiPathMiddleware` 转小写，前端可以大小写混用；响应字段是 camelCase，错误体是 `{ success, message }`。
- **认证**：JWT 存放在 HttpOnly Cookie `AuthToken`，受保护接口依赖 `get_current_user`。
- **数据隔离**：论文库全站共享；阅读状态和笔记按用户隔离，访问别人的笔记返回 404。
- **数据库**：修改模型后用 `alembic revision --autogenerate` 生成迁移，`tests/test_migrations.py` 会检查迁移与模型一致。
- **AI**：论文内容必须通过 `build_context` 放入分隔标签，声明为数据而非指令；流式接口要在开始输出前完成校验。

## 安装方式
见 `README.md` 的“本地运行”。

## 代码风格
后端遵循 ruff 配置（行宽 100）。前端保持 TypeScript 严格模式，通过 `npm run format` 运行 Prettier。

## 测试指南
- 后端：在 `paper-backend/` 下运行 `.venv/bin/ruff check .` 和 `.venv/bin/python -m pytest`
- 前端：在 `cbaldur-frontend/` 下运行 `npm run lint`、`npm run typecheck` 和 `npm run build`

## 提交和拉取请求指南
- **Commit 规范**：遵循 Conventional Commits（例如 `feat(case): ...`、`fix(auth): ...`、`chore: ...`）。
- **分支命名**：`feature/简短描述` 或 `fix/简短描述`。
- **Pull Request 描述规范**：PR 需采用结构化模板，清晰总结从基础分支到目标特性的全量演进：

```markdown
## 📌 全量变更概述 (Overview)
简述本次 PR 解决的核心问题、业务目标与系统改造范围。

---

## 🚀 核心特性与系统演进 (Core Features)
分模块/主题系统化阐述核心演进：
1. **模块/功能名称**：
   - **子功能点**：具体实现逻辑、协议/契约规范、并发/状态设计等。

---

## 📁 关键修改文件清单 (Key Modified Files)
| 模块 | 核心文件 | 变更说明 |
| :--- | :--- | :--- |
| **前端组件/路由** | `src/components/...` | 交互与组件实现 |
| **后端接口/服务** | `app/routers/...`、`app/services/...` | API 路由与业务逻辑 |
| **数据模型** | `app/models.py`、`alembic/versions/...` | 模型与迁移 |
| **测试套件** | `paper-backend/tests/...` | 单元测试用例 |

---

## 🧪 验证结论 (Verification)
- 后端测试：`ruff check .` 和 `pytest` 通过情况。
- 前端检查：`npm run lint`、`npm run typecheck` 及 `npm run build` 情况。
```

## 安全性和配置提示
切勿提交真实的密钥。环境变量模板位于 `paper-backend/.env.example` 和 `docker/.env.example`，`.env` 已被 git 忽略。公开新端点之前，请确认身份验证和用户隔离。
