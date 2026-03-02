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
    const res = await cocreationApi.chat(content, isVoice, file)
    chatHistory.value.push(res)
    return res
  }

  return { currentCoursewareId, materials, chatHistory, loadMaterials, sendChatMessage }
})
