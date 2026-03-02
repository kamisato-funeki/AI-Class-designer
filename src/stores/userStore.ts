import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types/types'
import { userApi } from '../api/api'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')

  const login = async (u: string, p: string) => {
    const res = await userApi.login(u, p)
    user.value = res.user
    token.value = res.token
  }

  const logout = async () => {
    await userApi.logout()
    user.value = null
    token.value = ''
  }

  const updateProfile = async (data: Partial<User>) => {
    const res = await userApi.updateProfile(data)
    user.value = res
  }

  return { user, token, login, logout, updateProfile }
})
