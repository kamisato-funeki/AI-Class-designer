/**
 * 应用程序入口文件
 *
 * 负责创建 Vue 应用实例，并注册全局插件：
 * - Pinia：全局状态管理
 * - Vue Router：客户端路由管理
 * - Ant Design Vue（Antd）：UI 组件库
 *
 * 最终将应用挂载至 index.html 中的 #app 容器。
 */

// 引入全局样式
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 根组件
import App from './App.vue'
// 路由配置
import router from './router'
// Ant Design Vue 组件库及其重置样式
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 注册 Pinia 状态管理
app.use(createPinia())
// 注册路由
app.use(router)
// 注册 Ant Design Vue 组件库
app.use(Antd)

// 将应用挂载至 DOM
app.mount('#app')
