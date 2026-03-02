import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WorkspaceStats } from '../types/types'
import { workspaceApi } from '../api/api'

export const useWorkspaceStore = defineStore('workspace', () => {
  const stats = ref<WorkspaceStats>({
    courseCount: 0,
    classCount: 0,
    studentCount: 0,
    messageUnread: 0,
  })

  const uploadVoice = async (file: File) => {
    return await workspaceApi.uploadVoice(file)
  }

  const loadStats = async () => {
    stats.value = await workspaceApi.getStats()
  }

  return { stats, loadStats, uploadVoice }
})
