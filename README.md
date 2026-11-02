# YJayMusic 前端（纯静态页面）

站点本体是原生 HTML / CSS / JS，全部位于 `public/exact/`，由 Spring Boot 后端在 **8080** 端口直接托管
（`WebMvcConfig` 把 `/**` 映射到该目录）。**没有构建步骤**：改完保存、刷新浏览器即生效。

## 启动

```powershell
# 项目根目录，二选一
.\start.cmd          # 双击也可以
.\backend\run.ps1
```

打开 <http://127.0.0.1:8080/>。

## 目录结构

```
public/exact/
├── index.html            首页（轮播、推荐、音质卡片、榜单）
├── admin.html            后台管理
├── html/                 歌手页 / 专辑页 / 收藏 / 最近播放 / 播放列表
├── css/                  index.css 全站样式，其余按页面拆分，toast.css 统一提示
├── js/
│   ├── modules/          00-16 数字前缀 = 加载顺序，不要调换
│   │                     00-api（统一接口层）→ 01-guard → 05-page-features
│   │                     → 10-auth → 11-carousels → 12-page-init → 13-player
│   │                     → 14-search → 15-lyrics → 16-cover
│   ├── common/           toast 等通用组件
│   └── *.js              各独立页面脚本（artistpage / albumpage / favorite …）
├── 歌手/ 专辑/ 歌曲/ 排行/ 轮播图1~3/ 背景/   首页与详情页用图
```

## 写代码时的三条约定

1. **接口一律写 `/api/xxx`**。8080 由 `ApiPrefixFilter` 剥掉前缀；写裸路径在历史上有过坑（被兜底返回 HTML）。
2. **图片路径写成 `/assets/...` 开头**（以斜杠起头）。后端把 `/assets/**` 映射到项目根的 `assets/` 目录；相对路径在 iframe 场景下会解析错。
3. **改完 js/css 没生效**：给引入处加版本号（`11-carousels.js?v=2`），再按 `Ctrl + F5` 强刷。浏览器缓存很固执。

## 备注

- 这里曾有一个 Vue 3 + Vite 外壳（5173 热更新，用 iframe 套 `public/exact`），已移除。需要时副本在
  `C:\Users\YJay\Desktop\YJayMusic-archive-20261102\_已移除-20261102\frontend-vue-shell\`。
- `.idea/` 是 IDEA 的模块配置，与运行无关，可忽略。
