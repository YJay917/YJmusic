import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * 后端端口的**唯一配置处**是：
 *     backend/src/main/resources/application.yaml  ->  server.port
 *
 * 这里把它读出来当代理目标，于是"改端口"只需要改那一个文件。
 * （backend/run.ps1 也是从同一个文件读的，两边口径一致，
 *   不会出现"后端在 9090、代理却还指向 8080"这种错配。）
 */
function readBackendPort() {
  try {
    const here = dirname(fileURLToPath(import.meta.url))
    const yamlPath = resolve(here, '../backend/src/main/resources/application.yaml')
    const yaml = readFileSync(yamlPath, 'utf8')
    // 取 server: 段下的第一个 port:（用 [ \t] 而不是 \s，避免正则跨行乱匹配）
    const matched = yaml.match(/^[ \t]*server[ \t]*:[\s\S]*?^[ \t]*port[ \t]*:[ \t]*(\d+)/m)
    return matched ? Number(matched[1]) : 8080
  } catch {
    return 8080 // 配置文件缺失时不阻塞启动，退回默认端口
  }
}

// 环境变量 PORT 优先（对应 backend/run.ps1 的 -Port / $env:PORT 临时换端口）
const BACKEND_PORT = Number(process.env.PORT) || readBackendPort()
const BACKEND = `http://127.0.0.1:${BACKEND_PORT}`

export default defineConfig({
  base: '/YJmusic/',
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      },
      '/assets': {
        target: BACKEND,
        changeOrigin: true
      }
    }
  }

  // 说明：原来的 preview 配置（vite preview，默认 4173）已移除。
  // 它提供的是 dist/ 构建产物，而 dist/ 只有跑过 npm run build 才会更新 ——
  // 很容易出现"改了 public/exact，刷新却没变化"的困惑。
  // 现在统一走后端 8080：它直接托管 frontend/public/exact，永远是最新的源码。
})
