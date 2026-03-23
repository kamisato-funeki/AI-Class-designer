/**
 * 消息中心相关 API
 *
 * 业务逻辑说明：
 * 提供系统通知和用户消息的管理接口：
 * - 拉取消息列表
 * - 标记消息为已读
 * - 删除消息
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { Message } from '../types/types'

/**
 * 获取当前用户的所有消息列表（含系统通知和用户消息）
 * @returns 消息数组
 */
export function apiGetMessages(): CommonResponseData<Message[]> {
  return defaultAxios.get('/messages')
}

/**
 * 将指定消息标记为已读
 * @param id - 消息 ID
 * @returns 空数据响应
 */
export function apiMarkMessageAsRead(id: string): CommonResponseData<null> {
  return defaultAxios.put(`/messages/${id}/read`)
}

/**
 * 删除指定消息
 * @param id - 消息 ID
 * @returns 空数据响应
 */
export function apiDeleteMessage(id: string): CommonResponseData<null> {
  return defaultAxios.delete(`/messages/${id}`)
}
