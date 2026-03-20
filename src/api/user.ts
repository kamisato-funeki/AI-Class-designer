import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { User } from '../types/types'
import type { InternalAxiosRequestConfig } from 'axios'

export function apiLogin(
  username: string,
  password: string,
): CommonResponseData<{ token: string; user: User }> {
  return defaultAxios.post('/auth/login', { username, password })
}

export function apiRegister(
  data: Record<string, string>
): CommonResponseData<{ token: string; user: User }> {
  return defaultAxios.post('/auth/register', data)
}

export function apiLogout(): CommonResponseData<null> {
  return defaultAxios.post('/auth/logout')
}

export function apiUpdateProfile(data: Partial<User>): CommonResponseData<User> {
  return defaultAxios.put('/user/profile', data)
}

export function apiUpdatePassword(password: string): CommonResponseData<null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve({ data: { code: 200, message: 'success', data: null }, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig<any> })
}

export function apiUpdateAvatar(avatarDataUrl: string): CommonResponseData<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve({ data: { code: 200, message: 'success', data: avatarDataUrl }, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig<any> })
}
