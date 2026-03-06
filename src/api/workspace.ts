import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { WorkspaceStats } from '../types/types'

export function apiGetWorkspaceStats(): CommonResponseData<WorkspaceStats> {
  return defaultAxios.get('/workspace/stats')
}

export function apiUploadVoice(file: File): CommonResponseData<{ text: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return defaultAxios.post('/workspace/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
