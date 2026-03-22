import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BoardMaterial, ChatMessage } from '../types/types'
import { apiGetCocreationMaterials, apiCocreationChat } from '../api/cocreation'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useCocreationStore = defineStore('cocreation', () => {
  const currentCoursewareId = ref<string>('')
  const materials = ref<BoardMaterial[]>([])
  const chatHistory = ref<ChatMessage[]>([])
  const isGenerating = ref<boolean>(false)
  const materialGenerated = ref<boolean>(false)
  const hideSummary = ref<boolean>(false)

  const loadMaterials = async (id: string) => {
    currentCoursewareId.value = id
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
    currentCoursewareId,
    materials,
    chatHistory,
    loadMaterials,
    sendChatMessage,
    addMessage,
    updateLastMessage,
    isGenerating,
    materialGenerated,
    hideSummary,
  }
})
