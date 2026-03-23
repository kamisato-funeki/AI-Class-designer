import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BoardMaterial, ChatMessage, CourseCocreationData } from '../types/types'
import { apiGetCocreationMaterials, apiCocreationChat } from '../api/cocreation'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useCocreationStore = defineStore('cocreation', () => {
  const currentCoursewareId = ref<string>('')
  const coursesData = ref<Record<string, CourseCocreationData>>({})

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
      }
    }
    return coursesData.value[id]
  }

  const currentData = computed(() => {
    if (!currentCoursewareId.value) return null
    return getOrCreateCourseData(currentCoursewareId.value)
  })

  const materials = computed({
    get: () => currentData.value?.materials || [],
    set: (val: BoardMaterial[]) => { if (currentData.value) currentData.value.materials = val }
  })

  const chatHistory = computed({
    get: () => currentData.value?.chatHistory || [],
    set: (val: ChatMessage[]) => { if (currentData.value) currentData.value.chatHistory = val }
  })

  const isGenerating = computed({
    get: () => currentData.value?.isGenerating || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.isGenerating = val }
  })

  const materialGenerated = computed({
    get: () => currentData.value?.materialGenerated || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.materialGenerated = val }
  })

  const generateOptions = computed({
    get: () => currentData.value?.generateOptions || ['ppt', 'doc', 'video', 'html'],
    set: (val: string[]) => { if (currentData.value) currentData.value.generateOptions = val }
  })

  const generatedOptions = computed({
    get: () => currentData.value?.generatedOptions || [],
    set: (val: string[]) => { if (currentData.value) currentData.value.generatedOptions = val }
  })

  const hideSummary = computed({
    get: () => currentData.value?.hideSummary || false,
    set: (val: boolean) => { if (currentData.value) currentData.value.hideSummary = val }
  })

  const mindmapData = computed({
    get: () => currentData.value?.mindmapData || null,
    set: (val: object | null) => { if (currentData.value) currentData.value.mindmapData = val ?? undefined }
  })

  const loadMaterials = async (id: string) => {
    currentCoursewareId.value = id
    // Ensure the data structure exists for this id
    getOrCreateCourseData(id)
    try {
      const res = await apiGetCocreationMaterials(id)
      materials.value = res.data.data
    } catch {
      materials.value = [
        { id: 'mat1', type: 'ppt', name: '课堂讲义.pptx', url: '/data/sample.pptx' },
        { id: 'mat2', type: 'word', name: '教案详情.docx', url: '/data/sample.docx' },
        { id: 'mat3', type: 'pdf', name: '拓展阅读.pdf', url: '/data/sample.pdf' },
      ]
    }
  }

  const sendChatMessage = async (content: string, isVoice: boolean = false, file?: File) => {
    try {
      const res = await apiCocreationChat(content, isVoice, file)
      chatHistory.value.push(res.data.data)
      return res.data.data
    } catch {
      const mockReply: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '我收到了你的消息。针对这个知识点，我建议你可以用以下的方式进行讲解...',
        type: 'text',
        time: now(),
      }
      chatHistory.value.push(mockReply)
      return mockReply
    }
  }

  const addMessage = (msg: ChatMessage) => {
    chatHistory.value.push(msg)
  }

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
