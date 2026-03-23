/**
 * 消息中心 Store（Pinia）
 *
 * 业务逻辑说明：
 * 管理系统通知与用户消息的全局状态，提供以下功能：
 * 1. messages：消息列表，初始化为两条模拟数据（系统通知 + 学生消息）
 * 2. unreadCount：计算属性，实时统计未读消息数量，供导航栏徽标显示
 * 3. loadMessages：从后端拉取最新消息列表，API 失败时保留模拟数据
 * 4. markAsRead：标记指定消息为已读（本地立即更新，同时异步通知后端）
 * 消息提醒与通知中心 Store (useMessageStore)
 * 业务职责：
 * 1. 站内信聚合：汇总系统公告、作业审批提醒及学生 1对1 咨询消息。
 * 2. 未读徽标驱动：通过 unreadCount 计算属性，为全局导航栏的消息图标提供实时数值支撑。
 * 3. 异步交互同步：处理消息的“标记已读”与“物理删除”指令，确保多端状态最终一致性。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Message } from '../types/types'
import { apiGetMessages, apiMarkMessageAsRead, apiDeleteMessage } from '../api/message'
import dayjs from 'dayjs'

/** 获取当前时间字符串（格式：YYYY-MM-DD HH:mm:ss） */
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useMessageStore = defineStore('message', () => {
  // --- 响应式状态 (State) ---
  /**
   * 全量消息列表
   * 包含系统推送到教师侧的所有历史通知。
   */
  const messages = ref<Message[]>([
    {
      id: 'm1',
      senderId: 'sys',
      senderName: '智脑系统',
      senderAvatar: '',
      content: '您的《秋天的雨》课件已通过教研组审核，现已正式发布。',
      type: 'system',
      isRead: false,
      createTime: now(),
    },
    {
      id: 'm2',
      senderId: 'u2',
      senderName: '学生：林达',
      senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
      content: '老师，今天的导数大题我还有一些步骤没看懂，能再讲一下吗？',
      type: 'user',
      isRead: true,
      createTime: now(),
    },
  ])

  // --- 衍生状态 (Computed) ---
  /**
   * 未读消息计数器
   * 算法：过滤 isRead 为 false 的集合长度。
   */
  const unreadCount = computed(() => messages.value.filter((m) => !m.isRead).length)

  // ==================== 异步业务指令 (Actions) ====================

  /**
   * 【异步指令】loadMessages
   * 作用：拉取最新的站内通知流
   */
  const loadMessages = async () => {
    try {
      const res = await apiGetMessages()
      messages.value = res.data.data
    } catch {
      // 降级：保留本地 Mock 记录，不进行清空
    }
  }

  /**
   * 【异步指令】markAsRead
   * 作用：销项操作
   * @param id 消息 ID
   * 逻辑：执行前端先行（Optimistic），立即消除未读红点。
   */
  const markAsRead = async (id: string) => {
    try {
      await apiMarkMessageAsRead(id)
    } catch (e) {
      console.warn('标记已读同步失败:', e)
    }
    const msg = messages.value.find((m) => m.id === id)
    if (msg) msg.isRead = true
  }

  /**
   * 【异步指令】deleteMessage
   * 作用：消息闭环移除
   * @param id 消息 ID
   */
  const deleteMessage = async (id: string) => {
    try {
      await apiDeleteMessage(id)
    } catch (e) {
      console.warn('删除指令同步失败:', e)
    }
    messages.value = messages.value.filter((m) => m.id !== id)
  }

  return { messages, unreadCount, loadMessages, markAsRead, deleteMessage }
})
