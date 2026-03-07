import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const getInitialTheme = (): 'light' | 'dark' => {
    const stored = localStorage.getItem('acd-theme')
    if (stored === 'light' || stored === 'dark') return stored
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark'
    return 'light'
  }

  const theme = ref<'light' | 'dark'>(getInitialTheme())
  const notificationsEnabled = ref<boolean>(true)

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    localStorage.setItem('acd-theme', newTheme)
    document.body.setAttribute('data-theme', newTheme)
  }

  const toggleNotifications = (enabled: boolean) => {
    notificationsEnabled.value = enabled
  }

  return { theme, notificationsEnabled, toggleTheme, toggleNotifications }
})
