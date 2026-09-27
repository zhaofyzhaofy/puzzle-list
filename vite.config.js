import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 的站点地址是 https://zhaofyzhaofy.github.io/puzzle-list/，
// 静态资源必须带 /puzzle-list/ 前缀才能被正确加载。
// 若将来绑定自定义域名或部署到根路径，把 base 改回 '/'。
export default defineConfig({
  base: '/puzzle-list/',
  plugins: [react(), tailwindcss()],
})
