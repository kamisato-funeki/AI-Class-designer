import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BoardMaterial, ChatMessage } from '../types/types'
import { cocreationApi } from '../api/api'

export const useCocreationStore = defineStore('cocreation', () => {
  const currentCoursewareId = ref<string>('')
  const materials = ref<BoardMaterial[]>([])
  const chatHistory = ref<ChatMessage[]>([])

  const loadMaterials = async (id: string) => {
    currentCoursewareId.value = id
    materials.value = await cocreationApi.getMaterials(id)
  }

  const sendChatMessage = async (content: string, isVoice: boolean = false, file?: File) => {
    // For mock backward compatibility, if this is called directly, we mock
    const res = await cocreationApi.chat(content, isVoice, file)
    chatHistory.value.push(res)
    return res
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
  }
})
