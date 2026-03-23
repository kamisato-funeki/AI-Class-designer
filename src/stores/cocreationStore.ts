/**
 * AI 共创业务状态中心 (useCocreationStore)
 * 业务职责：
 * 1. 多课件并行态管理：采用 coursesData 字典结构落地“一课一态”隔离机制，支持教师在多个 AI 共创任务间无感切换。
 * 2. 对话脉络维护：实时记录并同步用户与 AI 设计助手之间的对话流，支持语音、文件及文本的多模态输入。
 * 3. 素材状态编排：管控 PPT、教案、短视频等多元教学素材的生成进度（isGenerating）与最终产物（materials）。
 * 4. 实时流式响应支持：通过 updateLastMessage 接口驱动打字机效果，提升人机协作的即时感。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BoardMaterial, ChatMessage, CourseCocreationData } from '../types/types'
import { apiGetCocreationMaterials, apiCocreationChat } from '../api/cocreation'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

/** 获取当前时间字符串（格式：YYYY-MM-DD HH:mm:ss） */
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useCocreationStore = defineStore('cocreation', () => {
  /** 当前正在操作的课件 ID */
  const currentCoursewareId = ref<string>('')

  /**
   * 所有课件的共创数据字典
   * 以课件 ID 为键，存储各自独立的共创状态，
   * 支持多课件并行操作而不互相干扰。
   */
  const coursesData = ref<Record<string, CourseCocreationData>>({})

  /**
   * 【内部辅助函数】getOrCreateCourseData
   * 作用：状态兜底初始化
   * @param id 课件 ID
   * @returns 保证返回一个标准的共创数据结构
   */
  const getOrCreateCourseData = (id: string) => {
    if (!coursesData.value[id]) {
      coursesData.value[id] = {
        coursewareId: id,
        materials: [],
        chatHistory: [],
        isGenerating: false,
        materialGenerated: false,
        generateOptions: ['ppt', 'doc', 'video', 'html'], // 业务默认支持的生成矩阵
        generatedOptions: [],
        hideSummary: false,
      }
    }
    return coursesData.value[id]
  }

  /**
   * 【派生状态】currentData
   * 作用：根据 currentCoursewareId 自动解包对应的数据块，简化上层模板的调用。
   */
  const currentData = computed(() => {
    if (!currentCoursewareId.value) return null
    return getOrCreateCourseData(currentCoursewareId.value)
  })

  // ==================== 业务属性映射 (Computed Get/Set) ====================

  /** 关键素材产物列表 */
  const materials = computed({
    get: () => currentData.value?.materials || [],
    set: (val: BoardMaterial[]) => { if (currentData.value) currentData.value.materials = val },
  })

  /** AI 对话回放记录 */
  const chatHistory = computed({
    get: () => currentData.value?.chatHistory || [],
    set: (val: ChatMessage[]) => { if (currentData.value) currentData.value.chatHistory = val },
  })

  /** AI 生成引擎状态锁 */
  const isGenerating = computed({
    get: () => currentData.value?.isGenerating || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.isGenerating = val },
  })

  /** 业务开关：是否已产出可视化教学素材 */
  const materialGenerated = computed({
    get: () => currentData.value?.materialGenerated || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.materialGenerated = val },
  })

  /** 允许用户选取的生成选项集合 */
  const generateOptions = computed({
    get: () => currentData.value?.generateOptions || ['ppt', 'doc', 'video', 'html'],
    set: (val: string[]) => { if (currentData.value) currentData.value.generateOptions = val },
  })

  /** 已成功入库的生成项 */
  const generatedOptions = computed({
    get: () => currentData.value?.generatedOptions || [],
    set: (val: string[]) => { if (currentData.value) currentData.value.generatedOptions = val },
  })

  /** UI 侧边栏/摘要面板折叠态 */
  const hideSummary = computed({
    get: () => currentData.value?.hideSummary || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.hideSummary = val },
  })

  /** 思维导图底层数据模型 */
  const mindmapData = computed({
    get: () => currentData.value?.mindmapData || null,
    set: (val: object | null) => {
      if (currentData.value) currentData.value.mindmapData = val ?? undefined
    },
  })

  // ==================== 异步业务指令 (Actions) ====================

  /**
   * 【异步指令】loadMaterials
   * 作用：拉取共创空间的初始化资产
   * @param id 目标课件 ID
   * 业务逻辑：设置上下文 ID，尝试请求 API，并在异常时注入 Mock 教研素材预览。
   */
  const loadMaterials = async (id: string) => {
    currentCoursewareId.value = id
    getOrCreateCourseData(id) // 确保数据结构已初始化

    try {
      const res = await apiGetCocreationMaterials(id)
      materials.value = res.data.data
    } catch {
      // API 降级演练，确保教学流程不中断
      materials.value = [
        { id: 'mat1', type: 'ppt', name: '全景课堂大纲.pptx', url: '/data/sample.pptx' },
        { id: 'mat2', type: 'word', name: '教师参考教案.docx', url: '/data/sample.docx' },
        { id: 'mat3', type: 'pdf', name: '学生预习手册.pdf', url: '/data/sample.pdf' },
      ]
    }
  }

  /**
   * 【异步指令】sendChatMessage
   * 作用：执行核心 AI 推理对话
   * @param content 文字内容
   * @param isVoice 语音转文字标识
   * @param file 附加物（如教参、图片）
   * 业务逻辑：同步发送至后端 API，并实时更新 chatHistory 对话轨。
   */
  const sendChatMessage = async (
    content: string,
    isVoice: boolean = false,
    file?: File,
  ) => {
    try {
      const res = await apiCocreationChat(content, isVoice, file)
      chatHistory.value.push(res.data.data)
      return res.data.data
    } catch {
      // Mock 返回 AI 的启发式思考
      const mockReply: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '我已深入分析您提供的教学资源。针对这一节课，我建议您可以尝试引导式提问来增强学生的互动感...',
        type: 'text',
        time: now(),
      }
      chatHistory.value.push(mockReply)
      return mockReply
    }
  }

  /**
   * 【操作指令】addMessage
   * 作用：即时同步用户输入到界面对话轨
   */
  const addMessage = (msg: ChatMessage) => {
    chatHistory.value.push(msg)
  }

  /**
   * 【操作指令】updateLastMessage
   * 作用：支持 WebSocket/流式 API 效果的核心更新接口
   * 策略：不产生新的消息记录，而是通过响应式特性实时微调最后一条消息的 Content 文本。
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
    mindmapData,
    loadMaterials,
    sendChatMessage,
    addMessage,
    updateLastMessage,
  }
})
