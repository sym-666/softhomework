# Docker 部署

整套服务由 `docker/docker-compose.yml` 编排：

| 服务 | 说明 | 端口 |
|---|---|---|
| `frontend` | 构建 `cbaldur-frontend` 后用 nginx 托管（挂载 `docker/nginx.conf`）；`/api`、`/hubs`、`/swagger` 反向代理到 backend | `HTTP_PORT`（默认 3000） |
| `backend` | ASP.NET Core 后端（UBI9），含 AI 助手的 Python 沙箱 | 仅本机 `127.0.0.1:5168` |
| `postgres` | PostgreSQL 16，首次启动执行 `docker/postgres-init` 建 schema，表结构由 FreeSql 自动同步 | 仅本机 `127.0.0.1:5432` |
| `memcached` | 验证码、分享链接缓存 | 不对外 |

## 首次部署

```bash
cd docker
cp .env.example .env
vi .env                     # 至少填写 POSTGRES_PASSWORD、JWT_KEY；AI 助手填写 AI_OPENAI_*
docker compose up -d --build
docker compose ps           # 等待 postgres healthy、backend/frontend 运行
```

访问 `http://<服务器>:3000`。对外提供 HTTPS 时，在宿主机 nginx/Caddy 上把域名反代到 `127.0.0.1:3000`（设置 `HTTP_BIND=127.0.0.1`），并保持 SSE 不缓冲：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_buffering off;
    proxy_read_timeout 1h;
}
```

## 配置说明

- 所有敏感配置通过 `.env` → 环境变量注入，覆盖镜像内 `appsettings.json` 的同名项（`Section__Key` 形式）。`appsettings.Development.json` 不会打进镜像。
- 超算 SSH 私钥放在 `cbaldur-backend/Others/*.key`（已被 git 忽略），构建镜像时复制进去；镜像只在本机构建，不要推送到公共仓库。
- 国内服务器在 `.env` 中设置 `DOCKER_MIRROR`、`UBI_IMAGE`、`NPM_REGISTRY`、`PIP_INDEX_URL` 使用镜像源。
- AI 助手：
  - `AI_OPENAI_*` 未配置时站点正常运行，AI 入口自动隐藏。
  - `AI_EMBEDDING_*` 配置后论文检索使用向量语义匹配；向量在后续检索中逐步补齐并存入 `cbaldur.paper_embeddings`，全库索引完成前仍使用全库关键词匹配。未配置时始终使用关键词匹配。
  - Python 沙箱依赖 Bubblewrap 创建用户命名空间并挂载 `/proc`，compose 中为 backend 设置了 `seccomp=unconfined` 与 `systempaths=unconfined`（容器本身权限放宽，沙箱任务另由 bwrap 做无网络、只读、资源限制隔离）。不需要沙箱时设置 `INSTALL_AI_SANDBOX=false`、`AI_SANDBOX_ENABLED=false`，并删除这两项 `security_opt`。
  - Ubuntu 23.10+ 宿主机默认限制非特权用户命名空间，如沙箱报 `setting up uid map: Permission denied`，执行 `sudo sysctl kernel.apparmor_restrict_unprivileged_userns=0`（或为 Docker 配置相应 AppArmor 规则）。

## 数据与迁移

- 算例文件：`DATA_DIR`（默认 `./data`）→ 容器内 `/cbaldur`。
- 数据库：`POSTGRES_DATA_DIR`（默认 `./postgres`）。
- 从现有部署迁移：
  1. 旧服务器 `pg_dump -Fc fusim > fusim.dump`，新环境 `docker compose up -d postgres` 后
     `docker compose exec -T postgres pg_restore -U postgres -d fusim --clean --if-exists < fusim.dump`；
  2. 把原 `UserDir` 下的算例目录整体拷到 `DATA_DIR`；
  3. 继续使用外部数据库时，在 `docker-compose.override.yml` 中覆盖 `ConnectionStrings__PostgreSQL` 并去掉 postgres 依赖。

## 常用命令

```bash
docker compose logs -f backend          # 后端日志（亦写入 ./logs）
docker compose up -d --build backend    # 只更新后端
docker compose down                     # 停止（数据保留在宿主机目录）
```
