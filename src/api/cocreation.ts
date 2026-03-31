/**
 * AI 共创（Cocreation）相关 API
 *
 * 业务逻辑说明：
 * 所有的 API 都基于 src/api/base.ts 中的 defaultAxios，面向自有后端。
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { BoardMaterial, ChatMessage, MindMapNode } from '../types/types'
import type { MaterialUrlResponse } from '../types/creationTypes'

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
 * 获取指定课件的共创历史明细（包含历史对话及思维导图等）
 * 在进入 AI 共创页面时调用，恢复上下文。
 * @param coursewareId - 目标课件 ID
 * @returns 历史对话数组与思维导图对象
 */
export function apiGetCocreationHistory(
  coursewareId: string,
): CommonResponseData<{ chatHistory: ChatMessage[], mindmapData?: MindMapNode }> {
  return defaultAxios.get(`/cocreation/${coursewareId}/history`)
}

/**
 * 流式对话接口 (面向自有后端)
 * 采用原生 fetch 进行长连接流式响应（因为 browser native 更好处理 SSE 或 NDJSON），
 * 携带 defaultAxios 配置好的 baseURL 以保持基础环境变量一致。
 * 发送文件（PPT、word、pdf、图片）以及文本指令。
 */
export async function apiStreamCocreationChat(
  message: string,
  files?: File[],
  onData?: (textChunk: string, mindmapUpdate?: MindMapNode, suggestions?: string[]) => void,
  onComplete?: (finalCourseName?: string) => void,
  onError?: (err: Error) => void,
  signal?: AbortSignal
) {
  const formData = new FormData()
  formData.append('message', message)
  if (files && files.length > 0) {
    files.forEach(file => formData.append('files', file))
  }

  // 取得 axios 的 baseURL
  const baseURL = defaultAxios.defaults.baseURL || ''
  const url = `${baseURL}/cocreation/chat/stream`

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
      // 如果后端要求跨域携带 cookie，还需加入 credentials: 'include' 等，视 base 配置而定
    })

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('浏览器不支持 ReadableStream')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      
      // 简单模拟解析 NDJSON 或 SSE
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 最后一个不完整的留到下一个 chunk

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          // 这里假定后端每一行返回一个 JSON { "type": "text", "content": "xxx" } 
          // 或 { "type": "mindmap", "mindmapData": {...} } 
          // 或 { "type": "suggestions", "suggestions": [...] }
          let parsedLine = line
          if (line.startsWith('data: ')) { // 兼容 SSE 格式
            parsedLine = line.substring(6)
            if (parsedLine === '[DONE]') continue
          }

          const data = JSON.parse(parsedLine)
          
          let textChunk = ''
          let mindmapUpdate = undefined
          let suggestions = undefined

          if (data.type === 'text' && data.content) {
            textChunk = data.content
          }
          if (data.type === 'mindmap' && data.mindmapData) {
            mindmapUpdate = data.mindmapData
          }
          if (data.type === 'suggestions' && data.suggestions) {
            suggestions = data.suggestions
          }

          if (onData) onData(textChunk, mindmapUpdate, suggestions)
        } catch {
          // console.warn('JSON 解析异常(分块过长或非JSON格式):', line)
        }
      }
    }
    
    // 强制把最后一点数据刷出
    if (buffer.trim()) {
      try {
        let parsedLine = buffer
        if (buffer.startsWith('data: ')) {
          parsedLine = buffer.substring(6)
        }
        if (parsedLine !== '[DONE]') {
           const data = JSON.parse(parsedLine)
           if (onData) onData(data.content || '', data.mindmapData, data.suggestions)
        }
      } catch { }
    }

    if (onComplete) onComplete()
  } catch (error: unknown) {
    // 忽略主动中断的报错
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    // @ts-expect-error error unknown type payload fallback
    if (onError) onError(error)
  }
}

/**
 * 中断当前课程的共创对话
 */
export function apiStopCocreationChat(coursewareId: string): CommonResponseData<unknown> {
  return defaultAxios.post(`/cocreation/${coursewareId}/chat/stop`)
}

// ==================== 课程大纲（思维导图）API ====================

/**
 * 对思维导图进行增删查改
 */
export function apiMindMapCrud(
  coursewareId: string,
  action: 'add' | 'update' | 'delete' | 'query',
  nodeData?: unknown,
  nodeId?: string
): CommonResponseData<Record<string, unknown>> {
  return defaultAxios.post(`/cocreation/${coursewareId}/mindmap/crud`, {
    action,
    nodeData,
    nodeId
  })
}

/**
 * 发送局部修改指令（重写导图某部分）
 */
export function apiModifyMindmapPartial(coursewareId: string, prompt: string, nodeId?: string): CommonResponseData<Record<string, unknown>> {
  return defaultAxios.post(`/cocreation/${coursewareId}/mindmap/modify`, {
    prompt,
    nodeId
  })
}

/**
 * 重新生成整个思维导图大纲
 */
export function apiRegenerateMindmap(coursewareId: string): CommonResponseData<Record<string, unknown>> {
  return defaultAxios.post(`/cocreation/${coursewareId}/mindmap/regenerate`)
}

/**
 * 确认大纲，发送对其他部分的生成请求 (例如选择 PPT, Doc, Video 等)
 */
export function apiGenerateMaterials(coursewareId: string, types: string[]): CommonResponseData<unknown> {
  return defaultAxios.post(`/cocreation/${coursewareId}/materials/generate`, { types })
}


// ==================== PPT、教案、相关视频、互动H5 API ====================

/**
 * 获取某种类型内容的下载链接
 * types: 'ppt' | 'doc' | 'video' | 'html'
 */
export function apiDownloadMaterial(coursewareId: string, type: string): CommonResponseData<MaterialUrlResponse> {
  return defaultAxios.get(`/cocreation/${coursewareId}/materials/${type}/download`)
}

/**
 * 针对某一类型的内容进行局部修改指令发送
 */
export function apiModifyMaterialPartial(coursewareId: string, type: string, prompt: string): CommonResponseData<unknown> {
  return defaultAxios.post(`/cocreation/${coursewareId}/materials/${type}/modify`, { prompt })
}

/**
 * 重新生成某一类型的内容
 */
export function apiRegenerateMaterial(coursewareId: string, type: string): CommonResponseData<unknown> {
  return defaultAxios.post(`/cocreation/${coursewareId}/materials/${type}/regenerate`)
}
