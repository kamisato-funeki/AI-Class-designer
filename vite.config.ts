import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools({
      launchEditor: 'antigravity',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/dashscope-apiws': {
        target: 'wss://dashscope.aliyuncs.com',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dashscope-apiws/, ''),
        configure: (proxy) => {
          // http-proxy uses proxyReqWs to access WebSocket upgrade request headers
          proxy.on('proxyReqWs', (proxyReq) => {
            proxyReq.setHeader('Authorization', 'Bearer sk-9a8ff5f6129c4523a3cc7bf64655bbe6')
            proxyReq.setHeader('OpenAI-Beta', 'realtime=v1')
          })
        }
      }
    }
  }
})
