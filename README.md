# PaperPilot

AI 论文学习网站：上传论文，在站内阅读 PDF，向 AI 提问并追溯到原文页码，记录笔记和学习进度。

本项目是软件工程课程作业，界面框架基于 [fusion-simulation/cbaldur](https://github.com/fusion-simulation/cbaldur) 的前端改造，后端用 FastAPI 重新实现。

## 功能

- **论文库**：上传 PDF、保存外链论文、搜索，通过 Semantic Scholar 检索在线文献
- **PDF 阅读**：站内阅读、翻页缩放，自动记住上次页码
- **划词操作**：选中文字后直接提问、记笔记或高亮
- **高亮批注**：三种颜色，保存在原文位置，缩放后不错位，可以转为笔记
- **全文问答**：基于论文全文流式回答，标注来源页，点击跳转到 PDF 对应页，对话记录按用户保存
- **多论文对比**：选择 2 到 4 篇论文比较方法和结论，来源标注到具体论文和页码
- **AI 导读**：生成研究问题、方法、结论、关键概念和难点，按语言缓存
- **术语表**：提取关键术语并解释，页码由服务端在全文中查找，点击回到原文
- **自测与复习**：根据论文生成选择题和闪卡，按间隔重复安排复习，答错的内容回到待复习
- **参考文献**：从 PDF 解析参考文献，检索 Semantic Scholar 并加入论文库
- **笔记**：边读边记，记录页码，支持跨论文搜索
- **导出**：笔记导出为 Markdown，论文引用导出为 BibTeX
- **学习看板**：在读和已读统计、待复习数量、最近活动、继续阅读
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

## 演示数据

后端配置好大模型后，可以一键生成演示数据：

```bash
cd paper-backend
.venv/bin/python -m scripts.seed_demo        # 账号 demo / demo123456
```

脚本从 arXiv 获取 14 篇经典论文（Transformer、BERT、GPT-3、ResNet、ViT、CLIP、DDPM、GAN、Adam、LoRA、RAG、思维链、DQN，以及只保存外链的 Llama 2），走正常流程解析全文，并用大模型生成导读、术语表、学习卡片、笔记和问答。阅读进度、笔记、高亮和复习进度的时间分布在最近两周，是模拟的，只用于演示。脚本可以重复运行，已有内容会跳过；`--skip-ai` 只导入论文。

## 工程文档

需求规格说明、概要设计、数据库设计、接口文档、详细设计、测试报告、用户手册和开发过程见 [docs/](docs/README.md)。

## 开发检查

```bash
# 后端（加 --cov=app 查看覆盖率）
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
- 问答中途停止或失败时不保存这一轮对话；多论文对比不保存记录。
- 自测题和术语表由模型生成，内容可能有误，请对照原文。
- 推理型模型的思考过程计入 token 上限。使用 DeepSeek 时建议设置 `AI_OPENAI_REASONING_EFFORT=low`，否则偶尔会因为推理过长而生成失败。
- 参考文献按规则解析，支持 `[1]`、`1.` 和作者-年份格式，排版特殊的论文可能解析不全，标题是推测结果。
- Semantic Scholar 在没有 API Key 时限流严格，可能检索失败，需要时配置 `SEMANTIC_SCHOLAR_API_KEY`。
- SQLite 适合单机部署，不适合多实例。

## 第三方许可

PDF 解析使用的 [PyMuPDF](https://github.com/pymupdf/PyMuPDF) 采用 AGPL-3.0 许可，公开分发或对外提供服务前需要确认合规。
