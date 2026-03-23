/**
 * 全局偏好设置管理 Store (useSettingsStore)
 * 业务职责：
 * 1. 个性化视觉方案控制：管理应用的亮色/深色主题切换，并利用浏览器生态（localStorage, prefers-color-scheme）实现跨会话的视觉一致性。
 * 2. 交互通知策略：维护业务级的消息推送开关状态。
 * 3. 样式沙盒集成：通过动态微调 document.body 的 data-theme 属性，驱动 Vanilla CSS 变量集的无感切换。
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  /**
   * 【内部初始化函数】getInitialTheme
   * 作用：智能嗅探用户偏好
   * 优先级策略：
   * 1. 显式记录：检查 localStorage ('acd-theme') 是否有历史设置。
   * 2. 环境感知：通过 matchMedia 查询系统级深色模式偏好。
   * 3. 默认安全：回退至 'light' 亮色模式。
   */
  const getInitialTheme = (): 'light' | 'dark' => {
    const stored = localStorage.getItem('acd-theme')
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark'
    return 'light'
  }

  // --- 响应式状态 (State) ---
  const theme = ref<'light' | 'dark'>(getInitialTheme()) // 当前激活的主题标识
  const notificationsEnabled = ref<boolean>(true)        // 是否允许展示应用内的 Toast/弹窗通知

  // ==================== 操作指令 (Actions) ====================

  /**
   * 【操作指令】toggleTheme
   * 作用：执行主题的热切换
   * @param newTheme 目标主题标识
   * 业务同步逻辑：
   * 1. 修改内存状态，驱动 Vue 组件重绘。
   * 2. 持久化至磁盘，确保刷新页面后配置不丢失。
   * 3. 物理修改 DOM 属性，触发 CSS 变量生效。
   */
  const toggleTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem('acd-theme', newTheme)
    document.body.setAttribute('data-theme', newTheme)
  }

  /**
   * 【操作指令】toggleNotifications
   * 作用：变更消息中心推送策略
   */
  const toggleNotifications = (enabled: boolean) => {
    notificationsEnabled.value = enabled
  }

  return { theme, notificationsEnabled, toggleTheme, toggleNotifications }
})
