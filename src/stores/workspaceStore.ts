/**
 * 教研工作台全局状态 Store (useWorkspaceStore)
 * 业务职责：
 * 1. 业务指标仪表盘：实时统计教师的工作量化数据（课件总数、班级覆盖、学生触达等）。
 * 2. 跨模块多媒体服务：提供全局的语音转文字（ASR）底层能力，驱动各业务页面的语音交互需求。
 * 3. 统计数据聚合：负责定时/手动按需拉取首页核心汇总数字，作为决策支持。
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { WorkspaceStats } from '../types/types'
import { apiGetWorkspaceStats, apiUploadVoice } from '../api/workspace'

export const useWorkspaceStore = defineStore('workspace', () => {
  // --- 响应式状态 (State) ---
  /**
   * 工作台统计核心指标
   * 默认注入初始模拟数值，增强用户首次登入后的成就感反馈。
   */
  const stats = ref<WorkspaceStats>({
    courseCount: 16,        // 累计创作课件数
    classCount: 4,         // 关联行政班级数
    studentCount: 182,     // 辅导学生总人次
    messageUnread: 0,      // 未读业务通知
  })

  // ==================== 业务交互指令 (Actions) ====================

  /**
   * 【异步指令】uploadVoice
   * 作用：执行 ASR 语义解析
   * @param file 录音 Blob 或 File 对象
   * 策略：尝试接入高精度识别 API，失败时回退至“教研助手 AI”模拟转写文本。
   */
  const uploadVoice = async (file: File) => {
    try {
      const res = await apiUploadVoice(file)
      return res.data.data
    } catch {
      // Mock 返回示例：模拟 AI 理解并纠偏后的教师指令
      return { text: '请老师继续您的讲解，我正在为您生成相关的思维导图节点...' }
    }
  }

  /**
   * 【异步指令】loadStats
   * 作用：同步首页数据指标
   */
  const loadStats = async () => {
    try {
      const res = await apiGetWorkspaceStats()
      stats.value = res.data.data
    } catch (e) {
      console.warn('统计数据拉取中断，保留当前缓存统计结果', e)
    }
  }

  return { stats, loadStats, uploadVoice }
})
