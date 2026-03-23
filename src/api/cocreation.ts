/**
 * AI 共创（Cocreation）相关 API
 *
 * 业务逻辑说明：
 * AI 共创模块允许教师与 AI 助手协作生成和完善课件内容。
 * 本文件提供两个核心接口：
 * 1. 获取指定课件的共创素材（已生成的内容）
 * 2. 发送对话消息至 AI（支持文字、语音、文件三种形式）
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { BoardMaterial, ChatMessage } from '../types/types'

/**
 * 获取指定课件的共创看板素材列表
 * 在进入 AI 共创页面时调用，加载已生成的课件内容。
 * @param coursewareId - 目标课件 ID
 * @returns 看板素材数组（PPT、思维导图、视频等）
 */
export function apiGetCocreationMaterials(
  coursewareId: string,
): CommonResponseData<BoardMaterial[]> {
  return defaultAxios.get(`/cocreation/${coursewareId}/materials`)
}

/**
 * 向 AI 发送共创对话消息
 * 支持文字输入、语音转写内容及文件附件，统一以 multipart/form-data 格式上传。
 * @param message - 用户输入的文本消息内容
 * @param isVoice - 是否为语音转写内容（true = 语音输入）
 * @param file    - 可选附件文件（如课件原稿、参考资料等）
 * @returns AI 回复的聊天消息对象
 */
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
