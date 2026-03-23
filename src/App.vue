<!--
  App.vue — 根组件
  =====================
  业务逻辑说明：
  作为整个应用的顶层容器，负责：
  1. 通过 Ant Design Vue 的 <a-config-provider> 提供全局主题配置
     - 支持明/暗两种主题（读取 settingsStore.theme）
     - 设置主色调（青蓝色 #0891B2）、圆角、字体等设计 Token
  2. 渲染 <router-view> 以展示当前路由对应的页面
  3. 在挂载时将主题写入 document.body 的 data-theme 属性，
     以便 CSS 变量或第三方库可根据该属性切换样式
-->
<template>
  <a-config-provider
    :theme="{
      algorithm: settingsStore.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#0891B2',
        colorBgContainer: settingsStore.theme === 'dark' ? '#1f2937' : '#ffffff',
        borderRadius: 12,
        fontFamily: `'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
      },
    }"
  >
    <!-- 路由出口：渲染当前路由对应的页面组件 -->
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { theme } from 'ant-design-vue'
import { useSettingsStore } from './stores/settingsStore'

// 获取设置 Store，用于读取当前主题偏好
const settingsStore = useSettingsStore()

onMounted(() => {
  // 将当前主题写入 body 的 data-theme 属性，
  // 供 CSS 自定义属性（CSS Variables）或第三方库读取
  document.body.setAttribute('data-theme', settingsStore.theme)
})
</script>

<style>
/* 设置根容器占满整个视口，并允许内容滚动 */
#app {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}
</style>
