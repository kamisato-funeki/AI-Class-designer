/**
 * 知识库（RAG）文件管理相关 API
 *
 * 业务逻辑说明：
 * RAG（Retrieval-Augmented Generation，检索增强生成）知识库模块
 * 允许教师上传教学资料文件，供 AI 在共创时检索参考。
 * 本文件提供以下接口：
 * - 查询已上传的知识库文件列表
 * - 上传新文件至知识库
 * - 删除指定知识库文件
 * - 更新文件的标签（用于分类筛选）
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { RagFile } from '../types/types'

/**
 * 获取知识库文件列表
 * @returns 知识库文件信息数组
 */
export function apiGetRagFiles(): CommonResponseData<RagFile[]> {
  return defaultAxios.get('/rag/files')
}

/**
 * 上传文件至知识库
 * 以 multipart/form-data 格式上传，支持常见文档格式（PDF、Word、PPT 等）。
 * @param file - 需要上传的 File 对象
 * @returns 上传成功后的文件信息（含服务器分配的 id 和访问 URL）
 */
export function apiUploadRagFile(file: File): CommonResponseData<RagFile> {
  const formData = new FormData()
  formData.append('file', file)

  return defaultAxios.post('/rag/files', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 删除指定知识库文件
 * @param id - 需要删除的文件 ID
 * @returns 空数据响应
 */
export function apiDeleteRagFile(id: string): CommonResponseData<null> {
  return defaultAxios.delete(`/rag/files/${id}`)
}

/**
 * 更新指定知识库文件的标签
 * 标签用于对文件进行分类，便于检索和筛选。
 * @param id   - 文件 ID
 * @param tags - 新的标签数组（会完全覆盖旧标签）
 * @returns 更新后的文件信息
 */
export function apiUpdateRagFileTags(id: string, tags: string[]): CommonResponseData<RagFile> {
  return defaultAxios.put(`/rag/files/${id}/tags`, { tags })
}
