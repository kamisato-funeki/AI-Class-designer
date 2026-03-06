import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types/types'
import { apiLogin, apiLogout, apiUpdateProfile } from '../api/user'
import { v4 as uuidv4 } from 'uuid'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>({
    id: 'u1',
    name: '张老师',
    avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
    email: 'teacher@example.com',
    role: 'teacher',
  })
  const token = ref<string>(uuidv4())

  const login = async (u: string, p: string) => {
    try {
      const res = await apiLogin(u, p)
      user.value = res.data.data.user
      token.value = res.data.data.token
    } catch {
      // Mock fallback
      user.value = {
        id: 'u1',
        name: '张老师',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
        email: 'teacher@example.com',
        role: 'teacher',
      }
      token.value = uuidv4()
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } finally {
      user.value = null
      token.value = ''
    }
  }

  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await apiUpdateProfile(data)
      user.value = res.data.data
    } catch {
      if (user.value) {
        user.value = { ...user.value, ...data }
      }
    }
  }

  return { user, token, login, logout, updateProfile }
})
