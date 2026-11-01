# PaperPilot

AI 论文学习网站：上传论文，在站内阅读 PDF，向 AI 提问并追溯到原文页码，记录笔记和学习进度。

本项目是软件工程课程作业，界面框架基于 [fusion-simulation/cbaldur](https://github.com/fusion-simulation/cbaldur) 的前端改造，后端用 FastAPI 重新实现。

## 功能

- **论文库**：上传 PDF、保存外链论文、搜索，通过 Semantic Scholar 检索在线文献
- **PDF 阅读**：站内阅读、翻页缩放，自动记住上次页码
- **全文问答**：基于论文全文流式回答，标注来源页，点击跳转到 PDF 对应页
- **AI 导读**：生成研究问题、方法、结论、关键概念和难点，按语言缓存
- **笔记**：边读边记，记录页码，支持跨论文搜索
- **学习看板**：在读和已读统计、最近活动、继续阅读
- **中英文界面**

## 技术栈

| 部分 | 技术 |
| :--- | :--- |
| 前端 | React 19、TypeScript、Redux Toolkit、Tailwind CSS 4、shadcn/ui、react-pdf、ECharts、Rsbuild |
| 后端 | FastAPI、SQLAlchemy 2、Alembic、SQLite、PyMuPDF、rank-bm25 |
| AI | OpenAI 兼容接口，默认 DeepSeek |

## 本地运行

需要 Node.js ≥ 22 和 Python ≥ 3.12。

### 后端

```bash
cd paper-backend
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
cp .env.example .env              # 填写 JWT_KEY，使用 AI 时填写 AI_OPENAI_*
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --port 5168 --reload
```

### 前端

```bash
cd cbaldur-frontend
npm install
npm run dev
```

开发服务器会把 `/api` 代理到 `localhost:5168`。

### Docker 部署

```bash
cd docker
cp .env.example .env              # 填写 JWT_KEY
docker compose up -d --build
```

详见 [docker/DEPLOY.md](docker/DEPLOY.md)。

## 开发检查

```bash
# 后端
cd paper-backend && .venv/bin/ruff check . && .venv/bin/python -m pytest

# 前端
cd cbaldur-frontend && npm run lint && npm run typecheck && npm run build
```

## 全文问答的工作方式

1. 上传 PDF 后，后台按页提取文字并切块，保留页码。
2. 提问时在这篇论文的切块中做 BM25 检索。中文问题问英文论文时，先由模型改写成英文关键词。
3. 把相关切块交给模型，要求只依据论文内容回答，并用 `[p.页码]` 标注来源。
4. 前端只显示回答实际引用且确实检索到的页码。

## 已知限制

- 扫描版 PDF 没有文字层，不做 OCR，AI 只能基于摘要回答。
- 外链论文不在服务端抓取 PDF，AI 同样只基于摘要回答。
- 学习活动统计的是每天活跃的论文数和新增笔记数，不是阅读时长。
- SQLite 适合单机部署，不适合多实例。

## 第三方许可

PDF 解析使用的 [PyMuPDF](https://github.com/pymupdf/PyMuPDF) 采用 AGPL-3.0 许可，公开分发或对外提供服务前需要确认合规。
