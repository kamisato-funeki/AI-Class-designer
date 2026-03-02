import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '../types/types'
import { messageApi } from '../api/api'

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([])

  const unreadCount = computed(() => messages.value.filter((m) => !m.isRead).length)

  const loadMessages = async () => {
    messages.value = await messageApi.getMessages()
  }

  const markAsRead = async (id: string) => {
    await messageApi.markAsRead(id)
    const msg = messages.value.find((m) => m.id === id)
    if (msg) msg.isRead = true
  }

  const deleteMessage = async (id: string) => {
    await messageApi.deleteMessage(id)
    messages.value = messages.value.filter((m) => m.id !== id)
  }

  return { messages, unreadCount, loadMessages, markAsRead, deleteMessage }
})
