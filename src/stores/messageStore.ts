import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '../types/types'
import { apiGetMessages, apiMarkMessageAsRead, apiDeleteMessage } from '../api/message'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useMessageStore = defineStore('message', () => {
  const messages = ref<Message[]>([
    {
      id: 'm1',
      senderId: 'sys',
      senderName: '系统通知',
      senderAvatar: '',
      content: '您的课件已经被审核通过。',
      type: 'system',
      isRead: false,
      createTime: now(),
    },
    {
      id: 'm2',
      senderId: 'u2',
      senderName: '学生A',
      senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
      content: '老师，今天的作业有一题不懂。',
      type: 'user',
      isRead: true,
      createTime: now(),
    },
  ])

  const unreadCount = computed(() => messages.value.filter((m) => !m.isRead).length)

  const loadMessages = async () => {
    try {
      const res = await apiGetMessages()
      messages.value = res.data.data
    } catch {} // keep mock
  }

  const markAsRead = async (id: string) => {
    try {
      await apiMarkMessageAsRead(id)
    } catch {}
    const msg = messages.value.find((m) => m.id === id)
    if (msg) msg.isRead = true
  }

  const deleteMessage = async (id: string) => {
    try {
      await apiDeleteMessage(id)
    } catch {}
    messages.value = messages.value.filter((m) => m.id !== id)
  }

  return { messages, unreadCount, loadMessages, markAsRead, deleteMessage }
})
