import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { BoardMaterial, ChatMessage } from '../types/types'

export function apiGetCocreationMaterials(
  coursewareId: string,
): CommonResponseData<BoardMaterial[]> {
  return defaultAxios.get(`/cocreation/${coursewareId}/materials`)
}

export function apiCocreationChat(
  message: string,
  isVoice: boolean,
  file?: File,
): CommonResponseData<ChatMessage> {
  const formData = new FormData()
  formData.append('message', message)
  formData.append('isVoice', String(isVoice))
  if (file) formData.append('file', file)
  return defaultAxios.post('/cocreation/chat', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
