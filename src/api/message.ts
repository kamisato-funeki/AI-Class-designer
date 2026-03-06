import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { Message } from '../types/types'

export function apiGetMessages(): CommonResponseData<Message[]> {
  return defaultAxios.get('/messages')
}

export function apiMarkMessageAsRead(id: string): CommonResponseData<null> {
  return defaultAxios.put(`/messages/${id}/read`)
}

export function apiDeleteMessage(id: string): CommonResponseData<null> {
  return defaultAxios.delete(`/messages/${id}`)
}
