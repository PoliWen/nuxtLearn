import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Inspector from 'unplugin-vue-inspector/vite'

export default defineConfig({
  plugins: [vue(),Inspector()],
})
