FROM docker.hlug.cn/library/node:lts-alpine3.19 as build
COPY . /app
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com
RUN npm install
RUN npm run build
FROM docker.hlug.cn/library/node:lts-alpine3.19


COPY --from=build /app/.output /app/.output
WORKDIR /app
ENV PORT=3200
EXPOSE 3200
ENTRYPOINT  ["node","/app/.output/server/index.mjs"]