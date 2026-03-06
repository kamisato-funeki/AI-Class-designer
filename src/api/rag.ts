import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { RagFile } from '../types/types'

export function apiGetRagFiles(): CommonResponseData<RagFile[]> {
  return defaultAxios.get('/rag/files')
}

export function apiUploadRagFile(file: File): CommonResponseData<RagFile> {
  const formData = new FormData()
  formData.append('file', file)
  return defaultAxios.post('/rag/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function apiDeleteRagFile(id: string): CommonResponseData<null> {
  return defaultAxios.delete(`/rag/files/${id}`)
}

export function apiUpdateRagFileTags(id: string, tags: string[]): CommonResponseData<RagFile> {
  return defaultAxios.put(`/rag/files/${id}/tags`, { tags })
}
