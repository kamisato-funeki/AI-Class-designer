import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { User } from '../types/types'

export function apiLogin(
  username: string,
  password: string,
): CommonResponseData<{ token: string; user: User }> {
  return defaultAxios.post('/auth/login', { username, password })
}

export function apiLogout(): CommonResponseData<null> {
  return defaultAxios.post('/auth/logout')
}

export function apiUpdateProfile(data: Partial<User>): CommonResponseData<User> {
  return defaultAxios.put('/user/profile', data)
}
