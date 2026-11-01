import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: 'PaperPilot',
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/hubs': {
        target: 'http://localhost:5168',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:5168', // 替换为你的后端API地址
        changeOrigin: true,
        // Long-lived SSE (/api/Case/StatusEvents) must not be buffered/timed out
        timeout: 0,
        proxyTimeout: 0,
        onProxyRes(proxyRes) {
          const contentType = proxyRes.headers['content-type'];
          if (
            typeof contentType === 'string' &&
            contentType.includes('text/event-stream')
          ) {
            proxyRes.headers['cache-control'] = 'no-cache, no-store';
            proxyRes.headers['x-accel-buffering'] = 'no';
          }
        },
      },
    },
  },
});
