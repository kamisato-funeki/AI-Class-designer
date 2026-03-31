/**
 * AI 共创业务状态中心 (useCocreationStore)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import type { BoardMaterial, ChatMessage, CourseCocreationData, MindMapNode } from '../types/types'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'
import {
  apiGetCocreationMaterials,
  apiGetCocreationHistory,
  apiStreamCocreationChat,
  apiMindMapCrud,
  apiModifyMindmapPartial,
  apiRegenerateMindmap,
  apiGenerateMaterials,
  apiDownloadMaterial,
  apiModifyMaterialPartial,
  apiRegenerateMaterial,
  apiStopCocreationChat
} from '../api/cocreation'

/** 获取当前时间字符串（格式：YYYY-MM-DD HH:mm:ss） */
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useCocreationStore = defineStore('cocreation', () => {
  /** 当前选中的课件 ID */
  const currentCoursewareId = ref<string>('')
  /** 多个课件的数据存储字典，按课件 ID 索引 */
  const coursesData = ref<Record<string, CourseCocreationData>>({})

  /** 内部控制中止请求的实例 */
  let abortController: AbortController | null = null

  /**
   * 获取或初始化指定课件的数据容器
   * @param id 课件 ID
   * @returns 课件对应的状态数据对象
   */
  const getOrCreateCourseData = (id: string) => {
    if (!coursesData.value[id]) {
      coursesData.value[id] = {
        coursewareId: id,
        materials: [],
        chatHistory: [],
        isGenerating: false,
        materialGenerated: false,
        generateOptions: ['ppt', 'doc', 'video', 'html'],
        generatedOptions: [],
        hideSummary: false,
        generationProgress: 0,
      }
    }
    return coursesData.value[id]
  }

  /** 当前活跃课件的完整数据对象 (Computed) */
  const currentData = computed(() => {
    if (!currentCoursewareId.value) return null
    return getOrCreateCourseData(currentCoursewareId.value)
  })

  // ==================== 业务属性映射 (Computed Get/Set) ====================

  /** 课件相关的资料列表（如 PPT、教案等） */
  const materials = computed({
    get: () => currentData.value?.materials || [],
    set: (val: BoardMaterial[]) => { if (currentData.value) currentData.value.materials = val },
  })

  /** AI 对话的历史记录 */
  const chatHistory = computed({
    get: () => currentData.value?.chatHistory || [],
    set: (val: ChatMessage[]) => { if (currentData.value) currentData.value.chatHistory = val },
  })

  /** 是否正在生成内容（Loading 状态） */
  const isGenerating = computed({
    get: () => currentData.value?.isGenerating || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.isGenerating = val },
  })

  /** 资料是否已全部生成完毕 */
  const materialGenerated = computed({
    get: () => currentData.value?.materialGenerated || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.materialGenerated = val },
  })

  /** 需要生成的资料选项类型（默认：ppt, doc, video, html） */
  const generateOptions = computed({
    get: () => currentData.value?.generateOptions || ['ppt', 'doc', 'video', 'html'],
    set: (val: string[]) => { if (currentData.value) currentData.value.generateOptions = val },
  })

  /** 已经成功生成的资料类型列表 */
  const generatedOptions = computed({
    get: () => currentData.value?.generatedOptions || [],
    set: (val: string[]) => { if (currentData.value) currentData.value.generatedOptions = val },
  })

  /** 是否隐藏生成摘要信息 */
  const hideSummary = computed({
    get: () => currentData.value?.hideSummary || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.hideSummary = val },
  })

  /** 生成流程进度：0 - 100 */
  const generationProgress = computed({
    get: () => currentData.value?.generationProgress || 0,
    set: (val: number) => { if (currentData.value) currentData.value.generationProgress = val },
  })

  /** 课程大纲思维导图数据 */
  const mindmapData = computed({
    get: () => currentData.value?.mindmapData || null,
    set: (val: MindMapNode | null) => {
      if (currentData.value) currentData.value.mindmapData = val ?? undefined
    },
  })

  // ==================== 异步业务指令 (Actions) ====================

  /**
   * 加载指定课件的资料资产列表
   * @param id 课件 ID
   */
  const loadMaterials = async (id: string) => {
    currentCoursewareId.value = id
    getOrCreateCourseData(id)

    try {
      const res = await apiGetCocreationMaterials(id)
      materials.value = res.data.data
    } catch {
      materials.value = [
        { id: 'mat1', type: 'ppt', name: '全景课堂大纲.pptx', url: '/data/sample.pptx' },
        { id: 'mat2', type: 'word', name: '教师参考教案.docx', url: '/data/sample.docx' },
        { id: 'mat3', type: 'pdf', name: '学生预习手册.pdf', url: '/data/sample.pdf' },
      ]
    }
  }

  /**
   * 加载指定课件的历史对话记录与思维导图数据
   * @param id 课件 ID
   */
  const loadCourseHistory = async (id: string) => {
    currentCoursewareId.value = id
    getOrCreateCourseData(id)

    try {
      const res = await apiGetCocreationHistory(id)
      if (res.data.data) {
        if (res.data.data.chatHistory && res.data.data.chatHistory.length > 0) {
          chatHistory.value = res.data.data.chatHistory
        }
        if (res.data.data.mindmapData) {
          mindmapData.value = res.data.data.mindmapData
        }
      }
    } catch (error) {
      console.warn('获取共创历史失败或为空:', error)
    }
  }

  /**
   * 发送流式对话消息，并处理 AI 返回的文本、思维导图更新和建议
   * @param content 用户输入的文本内容
   * @param isVoice 是否为语音输入（影响消息类型显示）
   * @param files 附件文件列表（可选）
   * @param onToken 每次接收到流式 Token 时的回调
   * @param onCompleteCb 对话完成后的回调（包含解析出的课件名称建议）
   */
  const sendStreamChatMessage = async (
    content: string,
    files?: File[],
    onToken?: () => void,
    onCompleteCb?: (parsedName?: string) => void
  ) => {
    isGenerating.value = true
    abortController = new AbortController()

    // 添加 AI 占位消息
    const assistantMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      type: 'text',
      time: now(),
    }
    chatHistory.value.push(assistantMsg)

    try {
      await apiStreamCocreationChat(
        content,
        files,
        (textChunk: string, mindmapUpdate?: MindMapNode, suggestions?: string[]) => {
          assistantMsg.content += textChunk
          if (mindmapUpdate) {
            // 全量覆盖数据
            mindmapData.value = mindmapUpdate
          }
          if (suggestions && suggestions.length > 0) {
            assistantMsg.suggestions = suggestions
          }
          if (onToken) onToken()
        },
        (parsedName?: string) => {
          isGenerating.value = false
          if (onCompleteCb) onCompleteCb(parsedName)
        },
        (err: Error) => {
          isGenerating.value = false
          message.error(`流式请求异常：${err.message || '未知错误'}`)
        },
        abortController.signal
      )
    } catch (error: unknown) {
      const e = error as { name?: string, message?: string };
      if (e.name !== 'AbortError') {
        isGenerating.value = false
        message.error(`提交流式请求失败：${e.message || '未知错误'}`)
      }
    }
  }

  /**
   * 中断当前正在进行的对话流，并向后端发送中止指令
   */
  const stopGeneration = async () => {
    if (!isGenerating.value) return
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isGenerating.value = false
    message.warning('对话已中断')
    if (currentCoursewareId.value) {
      try {
        await apiStopCocreationChat(currentCoursewareId.value)
      } catch (error: unknown) {
        // 后端无法中止等小报错，可静默处理或提示
        console.warn('后端中止通知失败:', error)
      }
    }
  }

  /**
   * 清理当前会话下的一些临时、不需要保留在 store 中的状态，例如避免切换课件时仍保持“正在生成”等错误状态
   */
  const cleanupCurrentData = () => {
    if (isGenerating.value) stopGeneration()
    generationProgress.value = 0
  }

  /**
   * 手动向对话历史中添加一条消息
   * @param msg 消息对象
   */
  const addMessage = (msg: ChatMessage) => {
    chatHistory.value.push(msg)
  }

  /**
   * 更新历史记录中最后一条消息的内容（通常用于流式更新后的最终修正）
   * @param content 新的内容字符串
   */
  const updateLastMessage = (content: string) => {
    if (chatHistory.value.length > 0) {
      const idx = chatHistory.value.length - 1
      const lastMsg = chatHistory.value[idx]
      if (lastMsg) {
        lastMsg.content = content
      }
    }
  }

  // ============== 思维导图相关操作 ==============

  /**
   * 对课件大纲思维导图执行 CRUD 操作
   * @param action 操作类型：'add' | 'update' | 'delete' | 'query'
   * @param nodeData 节点数据（新增或修改时需要）
   * @param nodeId 目标节点 ID（修改或删除时需要）
   */
  const mindMapCrud = async (action: 'add'|'update'|'delete'|'query', nodeData?: unknown, nodeId?: string) => {
    if (!currentCoursewareId.value) return
    try {
      const res = await apiMindMapCrud(currentCoursewareId.value, action, nodeData, nodeId)
      mindmapData.value = res.data.data.mindmapData as MindMapNode
    } catch (error: unknown) { 
      const e = error as { message?: string };
      message.error(`大纲节点操作失败：${e.message || '未知错误'}`)
    }
  }

  /**
   * 针对思维导图的局部节点进行 AI 修改
   * @param prompt 修改指令/提示
   * @param nodeId 目标节点 ID
   */
  const modifyMindmapPartial = async (prompt: string, nodeId?: string) => {
    if (!currentCoursewareId.value) return
    try {
      const res = await apiModifyMindmapPartial(currentCoursewareId.value, prompt, nodeId)
      mindmapData.value = res.data.data.mindmapData as MindMapNode
    } catch (error: unknown) { 
      const e = error as { message?: string };
      message.error(`局部修改导图失败：${e.message || '未知错误'}`)
    }
  }

  /**
   * 重新生成完整的思维导图大纲
   */
  const regenerateMindmap = async () => {
    if (!currentCoursewareId.value) return
    try {
      const res = await apiRegenerateMindmap(currentCoursewareId.value)
      mindmapData.value = res.data.data.mindmapData as MindMapNode
    } catch (error: unknown) {
      const e = error as { message?: string };
      message.error(`重新生成导图失败：${e.message || '未知错误'}`)
    }
  }

  /**
   * 根据当前思维导图大纲，批量开始生成指定类型的课件资料（如生成 PPT、教案等）
   * @param types 需要生成的资料类型列表
   */
  const generateMaterialsTarget = async (types: string[]) => {
    if (!currentCoursewareId.value) return
    let timer: ReturnType<typeof setInterval>
    try {
      // 启动伪轮询进度模拟 (0 -> 90%)
      generationProgress.value = 0
      timer = setInterval(() => {
        if (generationProgress.value < 90) {
          generationProgress.value += Math.floor(Math.random() * 8) + 2
        }
      }, 500)

      await apiGenerateMaterials(currentCoursewareId.value, types)
      
      // 完成时填满 100
      clearInterval(timer)
      generationProgress.value = 100

      // 生成完成后主动刷新资料列表，获取最新真实 URL
      await loadMaterials(currentCoursewareId.value)
    } catch (error: unknown) { 
      clearInterval(timer!)
      generationProgress.value = 0
      const e = error as { message?: string };
      message.error(`生成相关资料失败：${e.message || '未知错误'}`)
      throw error;
    }
  }

  // ============== 资料资产相关操作 ==============

  /**
   * 获取指定类型资料的下载/查看链接
   * @param type 资料类型 (ppt, word, pdf, h5, video 等)
   * @returns 资料的 URL 地址，失败返回 null
   */
  const downloadMaterialByName = async (type: string) => {
    if (!currentCoursewareId.value) return null
    try {
      const res = await apiDownloadMaterial(currentCoursewareId.value, type)
      return res.data.data.url
    } catch (error: unknown) { 
      const e = error as { message?: string };
      message.error(`获取资料 ${type} 失败：${e.message || '未知错误'}`)
      return null 
    }
  }

  /**
   * 针对已生成的具体资料进行 AI 局部修正
   * @param type 资料类型
   * @param prompt 修改指令
   */
  const modifyMaterialPartial = async (type: string, prompt: string) => {
    if (!currentCoursewareId.value) return
    try {
      await apiModifyMaterialPartial(currentCoursewareId.value, type, prompt)
      // 修改完成后刷新列表获取最新链接
      await loadMaterials(currentCoursewareId.value)
    } catch (error: unknown) { 
      const e = error as { message?: string };
      message.error(`内容修改指令发送失败：${e.message || '未知错误'}`)
      throw error;
    }
  }

  /**
   * 重新生成指定类型的具体课件资料
   * @param type 资料类型
   */
  const regenerateMaterialTarget = async (type: string) => {
    if (!currentCoursewareId.value) return
    try {
      await apiRegenerateMaterial(currentCoursewareId.value, type)
      // 重新生成后刷新列表获取最新链接
      await loadMaterials(currentCoursewareId.value)
    } catch (error: unknown) { 
      const e = error as { message?: string };
      message.error(`内容重新生成请求失败：${e.message || '未知错误'}`)
      throw error;
    }
  }

  return {
    coursesData,
    currentCoursewareId,
    materials,
    chatHistory,
    isGenerating,
    materialGenerated,
    generateOptions,
    generatedOptions,
    hideSummary,
    generationProgress,
    mindmapData,
    loadMaterials,
    loadCourseHistory,
    sendStreamChatMessage,
    stopGeneration,
    cleanupCurrentData,
    addMessage,
    updateLastMessage,
    // mindmap
    mindMapCrud,
    modifyMindmapPartial,
    regenerateMindmap,
    generateMaterialsTarget,
    // materials
    downloadMaterialByName,
    modifyMaterialPartial,
    regenerateMaterialTarget
  }
})
