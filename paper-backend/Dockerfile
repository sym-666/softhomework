ARG PYTHON_IMAGE=python:3.13-slim
FROM ${PYTHON_IMAGE}

ARG PIP_INDEX_URL=https://pypi.org/simple

WORKDIR /app
COPY pyproject.toml alembic.ini ./
COPY app ./app
COPY alembic ./alembic
RUN pip install --no-cache-dir --index-url "$PIP_INDEX_URL" .

# 以非 root 用户运行；data 目录提前创建，命名卷才会继承这个所有者
RUN useradd --create-home --uid 1000 app && mkdir data && chown app:app data
USER app

ENV DATA_DIR=/app/data
ENV DATABASE_URL=sqlite:////app/data/app.db

EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8000"]
