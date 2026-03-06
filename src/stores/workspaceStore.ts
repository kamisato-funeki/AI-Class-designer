import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WorkspaceStats } from '../types/types'
import { apiGetWorkspaceStats, apiUploadVoice } from '../api/workspace'

export const useWorkspaceStore = defineStore('workspace', () => {
  const stats = ref<WorkspaceStats>({
    courseCount: 12,
    classCount: 3,
    studentCount: 120,
    messageUnread: 5,
  })

  const uploadVoice = async (file: File) => {
    try {
      const res = await apiUploadVoice(file)
      return res.data.data
    } catch {
      return { text: '这是语音转换后的文字内容...' }
    }
  }

  const loadStats = async () => {
    try {
      const res = await apiGetWorkspaceStats()
      stats.value = res.data.data
    } catch {
      // Keep mock data
    }
  }

  return { stats, loadStats, uploadVoice }
})
