import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  }
]

const router = createRouter({
  // 用 createWebHistory 而不是 createWebHashHistory：
  // 地址栏里不再出现 "#/"。单路由应用，不存在深层链接刷新 404 的问题。
  //
  // base 必须显式传 import.meta.env.BASE_URL（即 vite.config.js 里的 base: '/YJmusic/'）。
  // 不传的话路由拿到的是完整路径 /YJmusic/，而路由表里只有 /，
  // 结果就是 "No match found for location with path /YJmusic/"，页面整屏黑。
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
