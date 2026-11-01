# Docker 部署

前端（nginx）和后端（FastAPI + SQLite）两个容器，数据保存在 `paper-data` 卷中。

## 启动

```bash
cd docker
cp .env.example .env
# 必填 JWT_KEY：openssl rand -base64 48
# 使用 AI 功能时填写 AI_OPENAI_MODEL_ID 和 AI_OPENAI_API_KEY
docker compose up -d --build
```

打开 <http://localhost:3000>。后端启动时会自动执行数据库迁移。

## 配置

| 变量 | 必填 | 说明 |
| :--- | :--- | :--- |
| `JWT_KEY` | 是 | 登录令牌签名密钥，至少 32 字符 |
| `AI_OPENAI_BASE_URL` | 否 | OpenAI 兼容接口地址，默认 DeepSeek |
| `AI_OPENAI_MODEL_ID` | 使用 AI 时 | 模型名称 |
| `AI_OPENAI_API_KEY` | 使用 AI 时 | 模型服务的 API Key |
| `SEMANTIC_SCHOLAR_API_KEY` | 否 | 在线检索的 API Key，不填时共享限流更严格 |
| `HTTP_BIND`、`HTTP_PORT` | 否 | 监听地址和端口，默认 `127.0.0.1:3000` |
| `COOKIE_SECURE` | 否 | 走 HTTPS 时设为 `true` |

## 常用命令

```bash
docker compose logs -f backend    # 查看后端日志
docker compose down               # 停止，保留数据
docker compose down -v            # 停止并删除全部数据
```

## 备份

数据库和 PDF 都在 `paper-data` 卷中：

```bash
docker run --rm -v paperpilot_paper-data:/data -v "$PWD":/backup alpine \
  tar czf /backup/paper-data.tar.gz -C /data .
```
