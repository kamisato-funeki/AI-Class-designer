/**
 * 知识库（RAG）文件管理 Store（Pinia）
 *
 * 业务逻辑说明：
 * 管理教学知识库中所有上传文件的状态，支持以下功能：
 * 1. files：知识库文件列表，初始化包含 2 条模拟数据
 * 2. uploadFile：上传新文件，API 失败时在本地创建"未上传"状态的临时记录，
 *    用户可通过 reuploadFile 重新上传失败的文件
 * 3. deleteFile：删除文件，采用先调 API 再本地移除的策略（非乐观更新）
 * 4. addTag / removeTag：标签的单独增删操作，内部调用 updateTags 保持一致
 * 5. reuploadFile：重试上传状态为 'unuploaded' 且有 rawFile 的文件，
 *    失败时抛出异常供 UI 层捕获展示错误
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RagFile } from '../types/types'
import {
  apiGetRagFiles,
  apiUploadRagFile,
  apiDeleteRagFile,
  apiUpdateRagFileTags,
} from '../api/rag'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

/** 获取当前时间字符串（格式：YYYY-MM-DD HH:mm:ss） */
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

/**
 * 教学知识库（RAG）索引管理 Store (useRagStore)
 * 业务职责：
 * 1. 非结构化数据池管理：维护教师上传至 RAG 引擎的各类教学文档（PDF、DOCX 等）及其向量化解析状态。
 * 2. 闭环上传协议：
 *    - 支持标准上传流。
 *    - 失败兜底逻辑：网络异常时自动转入 'unuploaded' 临时态，并封存 rawFile 数据块，允许后续“断点重连式”再上传。
 * 3. 语义标签对齐：支持文件与学科、核心素养标签的级联更新，辅助 AI 实现精准内容召回。
 * 4. 预览与清理：驱动知识库文件的在线预览指向与彻底移除。
 */
export const useRagStore = defineStore('rag', () => {
  // --- 响应式状态 (State) ---
  /**
   * RAG 文件列表
   * 初始包含几份示范课标文件，增强系统初次运行的引导感。
   */
  const files = ref<RagFile[]>([
    {
      id: 'f1',
      name: '小学英语核心词汇精选表.pdf',
      size: 1024 * 1024 * 2.15, 
      type: 'pdf',
      url: '/data/sample.pdf',
      tags: ['英语', '考纲'],
      uploadTime: now(),
      status: 'success',
    },
    {
      id: 'f2',
      name: '北师大版-四年级数学下册教案集.docx',
      size: 1024 * 542, 
      type: 'docx',
      url: '/data/sample.docx',
      tags: ['数学', '结构化教案'],
      uploadTime: now(),
      status: 'success',
    },
  ])

  // ==================== 异步业务指令 (Actions) ====================

  /**
   * 【异步指令】loadFiles
   * 作用：拉取云端知识库清单
   */
  const loadFiles = async () => {
    try {
      const res = await apiGetRagFiles()
      files.value = res.data.data
    } catch (e) {
      console.warn('RAG 库同步失败，启用演示模式', e)
    }
  }

  /**
   * 【异步指令】uploadFile
   * 作用：执行原子化上传
   * @param file 原生 File 句柄
   * 业务逻辑：先执行 API 请求，若超时或报错，则生成一个虚拟占位符（status: unuploaded）并注入列表，供 UI 组件展示“重试”按钮。
   */
  const uploadFile = async (file: File) => {
    try {
      const res = await apiUploadRagFile(file)
      const data = { ...res.data.data, status: 'success' as const }
      files.value.unshift(data) // 优先排布最新上传
      return data
    } catch {
      // 容错：创建“待补交”记录
      const newFile: RagFile = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop() || 'unknown',
        url: URL.createObjectURL(file), // 持久化本地 URL 以便 UI 端的预览/封面展示
        tags: [],
        uploadTime: now(),
        status: 'unuploaded',
        rawFile: file, // 核心：封存二进制对象，为下一次 reupload 提供弹药
      }
      files.value.unshift(newFile)
      return newFile
    }
  }

  /**
   * 【异步指令】deleteFile
   * 作用：执行物理注销
   */
  const deleteFile = async (id: string) => {
    try {
      await apiDeleteRagFile(id)
    } catch (e) {
      console.error('云端文件清理失败:', e)
    }
    files.value = files.value.filter((f) => f.id !== id)
  }

  /**
   * 【异步指令】updateTags
   * 作用：批量覆盖文档的教研标签
   */
  const updateTags = async (id: string, tags: string[]) => {
    try {
      await apiUpdateRagFileTags(id, tags)
    } catch (e) {
      console.warn('标签同步失败，执行本地缓存更新', e)
    }
    const idx = files.value.findIndex((f) => f.id === id)
    if (idx !== -1 && files.value[idx]) {
      files.value[idx].tags = tags
    }
  }

  /** 【便捷入口】为文件追溯单个标签 */
  const addTag = async (id: string, tag: string) => {
    const file = files.value.find((f) => f.id === id)
    if (file && !file.tags.includes(tag)) {
      const newTags = [...file.tags, tag]
      await updateTags(id, newTags)
    }
  }

  /** 【便捷入口】剥离错误或过期的标签 */
  const removeTag = async (id: string, tag: string) => {
    const file = files.value.find((f) => f.id === id)
    if (file) {
      const newTags = file.tags.filter((t) => t !== tag)
      await updateTags(id, newTags)
    }
  }

  /**
   * 【异步指令】reuploadFile
   * 作用：针对上传失败记录激活“断点重传”
   * @param id 临时 ID
   * 业务逻辑：唤醒封存的 rawFile，执行二次上传，成功后执行 ID 与状态的无感平替。
   */
  const reuploadFile = async (id: string) => {
    const fileIndex = files.value.findIndex((f) => f.id === id)
    if (fileIndex !== -1) {
      const file = files.value[fileIndex]
      if (file && file.status === 'unuploaded' && file.rawFile) {
        try {
          const res = await apiUploadRagFile(file.rawFile)
          // 合并服务器返回的数据，并标记为上传成功
          files.value[fileIndex] = {
            ...file,
            ...res.data.data,
            status: 'success',
          }
        } catch {
          // 重新上传仍然失败，向上层抛出异常
          throw new Error('重新上传失败')
        }
      }
    }
  }

  return {
    files,
    loadFiles,
    uploadFile,
    deleteFile,
    updateTags,
    addTag,
    removeTag,
    reuploadFile,
  }
})
