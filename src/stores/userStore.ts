import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types/types'
import { apiLogin, apiRegister, apiLogout, apiUpdateProfile, apiUpdatePassword, apiUpdateAvatar } from '../api/user'
import { v4 as uuidv4 } from 'uuid'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>({
    id: 'u1',
    name: '张老师',
    avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
    email: 'teacher@example.com',
    role: 'teacher',
    subject: 'math',
    school: '第一实验中学',
    bio: '致力于将数学与生活实际相结合，让学生在快乐中学习数学。',
    joinTime: '2023-09-01',
    generationCount: 128
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
        subject: 'math',
        school: '第一实验中学',
        bio: '致力于将数学与生活实际相结合，让学生在快乐中学习数学。',
        joinTime: '2023-09-01',
        generationCount: 128
      }
      token.value = uuidv4()
    }
  }

  const register = async (data: Record<string, string>) => {
    try {
      const res = await apiRegister(data)
      user.value = res.data.data.user
      token.value = res.data.data.token
    } catch {
      // Mock fallback for successful registration
      user.value = {
        id: 'u2',
        name: data.username || data.phone || '新用户',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
        email: 'newuser@example.com',
        role: 'teacher',
        subject: 'unknown',
        school: '未知学校',
        bio: '暂无简介',
        joinTime: new Date().toISOString().split('T')[0],
        generationCount: 0
      }
      token.value = uuidv4()
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore network errors, force local logout
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

  const updatePassword = async (password: string) => {
    try {
      await apiUpdatePassword(password)
    } catch {
      // Mock success
    }
  }

  const updateAvatar = async (dataUrl: string) => {
    try {
      const res = await apiUpdateAvatar(dataUrl)
      if (user.value) {
        user.value.avatar = res.data.data
      }
    } catch {
      if (user.value) {
        user.value.avatar = dataUrl
      }
    }
  }

  return { user, token, login, register, logout, updateProfile, updatePassword, updateAvatar }
})
