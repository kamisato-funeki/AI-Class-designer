import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  const notificationsEnabled = ref<boolean>(true)

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    document.body.setAttribute('data-theme', newTheme)
  }

  const toggleNotifications = (enabled: boolean) => {
    notificationsEnabled.value = enabled
  }

  return { theme, notificationsEnabled, toggleTheme, toggleNotifications }
})
