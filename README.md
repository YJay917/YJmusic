# 项目设计余俊20240984 - Vue3 承载版

这是从 `D:\Frontend\Javascipt\YJay\实训项目\项目设计余俊20240984` 复制出来的 Vue3 承载版本。

**原页面完整副本在 `public/exact`** —— 那才是真正的界面（原生 HTML/CSS/JS）。
`src/` 下的 Vue 工程只是一个承载外壳，用 iframe 把 `public/exact/index.html` 套进来。

---

## 一、日常开发：直接用 8080，不要另起服务

```powershell
cd ..\backend
.\run.ps1
```

然后打开 **<http://127.0.0.1:8080/>** 就够了。

Spring Boot 后端**已经把前端页面一起托管了**（`/**` 映射到 `frontend/public/exact/`），
所以改了 `public/exact/` 里的任何东西，**刷新页面就能看到，不需要构建**。

| 地址 | 谁提供 | 内容 | 是否最新 |
|---|---|---|---|
| **<http://127.0.0.1:8080/>** | Spring Boot | `public/exact/` 源码 | ✅ **永远最新（推荐）** |
| <http://127.0.0.1:5173/> | `npm run dev` | `public/exact/` 源码（经 Vite） | ✅ 最新，但要另开一个服务 |

> **只用 8080。** 后端把 `public/exact/` 当静态目录直接托管，改完刷新即可，
> 不存在「改源码 / 看构建产物」的错配。

---

## 二、命令

```powershell
npm install        # 首次：装依赖
npm run dev        # 可选：Vite 开发服务器（5173），带热更新
npm run build      # 只在「部署」或「需要 dist/」时才用
npm run deploy     # 构建 + 发布到 GitHub Pages（gh-pages -d dist）
```

### 后端端口在哪配

**只有一个地方**：

```
backend/src/main/resources/application.yaml  ->  server.port
```

`vite.config.js` 会从这个文件读端口当代理目标（`npm run dev` 时生效），
所以改端口**只需要改那一个数字**，不会出现"后端换了端口、前端代理还指着旧的"。

临时换端口（不改文件）：

```powershell
cd ..\backend
.\run.ps1 -Port 8081        # 或  $env:PORT = '8081'; .\run.ps1
```

> 注意：`-Port` / `$env:PORT` 只是临时覆盖，`vite.config.js` 读的是配置文件，
> 所以这种临时情况下 `npm run dev` 的代理仍指向配置文件里的端口。

---

## 三、目录说明

```
frontend/
├── index.html            Vue 外壳的入口（只有 <div id="app">）
├── src/                  外壳本体，共 7 个文件、82 行
│   ├── main.js           挂载 Vue
│   ├── App.vue           <RouterView />
│   ├── router/index.js   只有 1 条路由 "/"
│   └── views/Home.vue    9 行，就一个 <iframe src="./exact/index.html">
├── public/exact/         ★ 真正的界面（93 个文件），改这里
│   ├── index.html        前台首页
│   ├── admin.html        后台管理页
│   ├── js/modules/       拆分后的 15 个脚本模块
│   └── css/              样式
└── dist/                 npm run build 的产物（部署用，平时不用管）
```

---

## 四、说明

- 使用 Vite + Vue3 单文件组件结构承载原页面。
- 原 HTML、CSS、JS、图片、音乐、iframe 弹窗、登录、播放条和动态效果按原项目运行。
- 不做分页改造，尽量保持一比一还原。
- 改动集中在 `public/exact/`；`src/` 基本不需要动。
