/**
 * 用户认证与个人信息 API
 *
 * 业务逻辑说明：
 * 提供用户账户相关的所有接口，包括：
 * - 登录 / 注册 / 退出
 * - 更新个人资料
 * - 修改密码（当前为模拟实现）
 * - 更新头像（当前为本地 Base64 模拟，未真正上传至服务器）
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { User } from '../types/types'
import type { InternalAxiosRequestConfig } from 'axios'

/**
 * 用户登录
 * @param username - 用户名（账号）
 * @param password - 密码
 * @returns 包含 JWT token 和用户信息的响应
 */
export function apiLogin(
  username: string,
  password: string,
): CommonResponseData<{ token: string; user: User }> {
  return defaultAxios.post('/auth/login', { username, password })
}

/**
 * 用户注册
 * @param data - 注册表单数据（键值对形式）
 * @returns 包含 JWT token 和用户信息的响应
 */
export function apiRegister(
  data: Record<string, string>,
): CommonResponseData<{ token: string; user: User }> {
  return defaultAxios.post('/auth/register', data)
}

/**
 * 用户退出登录
 * @returns 空数据响应
 */
export function apiLogout(): CommonResponseData<null> {
  return defaultAxios.post('/auth/logout')
}

/**
 * 更新个人资料
 * @param data - 需要更新的用户字段（部分更新）
 * @returns 更新后的完整用户信息
 */
export function apiUpdateProfile(data: Partial<User>): CommonResponseData<User> {
  return defaultAxios.put('/user/profile', data)
}

/**
 * 修改密码
 * 注意：当前为模拟实现，直接返回成功，未真正调用后端接口。
 * @param password - 新密码
 * @returns 空数据响应
 */
export function apiUpdatePassword(_password: string): CommonResponseData<null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve({ data: { code: 200, message: 'success', data: null }, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig<any> })
}

/**
 * 更新头像
 * 注意：当前为本地 Base64 模拟实现，直接将传入的 Data URL 作为新头像返回，
 * 实际场景中应上传至 CDN 并返回图片 URL。
 * @param avatarDataUrl - 头像的 Base64 Data URL 字符串
 * @returns 新的头像 URL
 */
export function apiUpdateAvatar(avatarDataUrl: string): CommonResponseData<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Promise.resolve({ data: { code: 200, message: 'success', data: avatarDataUrl }, status: 200, statusText: 'OK', headers: {}, config: {} as InternalAxiosRequestConfig<any> })
}
