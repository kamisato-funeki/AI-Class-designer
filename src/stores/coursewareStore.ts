/**
 * 课件管理 Store（Pinia）
 *
 * 业务逻辑说明：
 * 管理课件（Courseware）列表的完整增删改查状态：
 * 1. coursewares：课件列表，初始化包含 2 条模拟数据
 * 2. API 优先，失败时降级为本地操作（乐观更新策略）
 * 3. 支持标签的单独添加/删除（addTag / removeTag），
 *    内部调用 updateCourseware 保证数据一致性
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Courseware } from '../types/types'
import {
  apiGetCoursewares,
  apiCreateCourseware,
  apiUpdateCourseware,
  apiDeleteCourseware,
} from '../api/courseware'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

/** 获取当前时间字符串（格式：YYYY-MM-DD HH:mm:ss） */
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useCoursewareStore = defineStore('courseware', () => {
  // --- 响应式状态 (State) ---
  /**
   * 核心课件列表
   * 默认注入几条种子数据，用于保证应用启动时的视觉丰满度。
   */
  const coursewares = ref<Courseware[]>([
    {
      id: 'cw1',
      title: '三年级语文上册-秋天的雨',
      subject: '语文',
      grade: '三年级',
      coverImage: 'https://picsum.photos/300/200?random=1',
      tags: ['公开课', '名师范例'],
      createTime: now(),
      updateTime: now(),
      status: 'published',
    },
    {
      id: 'cw2',
      title: '五年级数学-分数乘法深度解析',
      subject: '数学',
      grade: '五年级',
      coverImage: 'https://picsum.photos/300/200?random=2',
      tags: ['备课中', '难点突破'],
      createTime: now(),
      updateTime: now(),
      status: 'draft',
    },
  ])

  // ==================== 异步业务指令 (Actions) ====================

  /**
   * 【异步指令】loadCoursewares
   * 作用：同步远端课件库
   */
  const loadCoursewares = async () => {
    try {
      const res = await apiGetCoursewares()
      coursewares.value = res.data.data
    } catch (e) {
      console.warn('课件拉取失败，启用本地缓存数据', e)
    }
  }

  /**
   * 【异步指令】createCourseware
   * 作用：初始化并开启一本新课件
   * @param data 基础表单信息
   * 策略：API 成功则更新为服务端生成的完整对象；API 失败则在本地内存中完成“草稿”创建，确保用户能立即进入编辑页（Cocreation）。
   */
  const createCourseware = async (data: Partial<Courseware>) => {
    try {
      const res = await apiCreateCourseware(data)
      coursewares.value.unshift(res.data.data) // 将最新成果置顶
      return res.data.data
    } catch {
      // 容错：本地事务创建
      const newCw: Courseware = {
        id: uuidv4(),
        title: data.title || '未命名动态课件',
        subject: data.subject || '通用',
        grade: data.grade || '全阶段',
        coverImage: 'https://picsum.photos/300/200?random=3',
        tags: [],
        createTime: now(),
        updateTime: now(),
        status: 'draft',
      }
      coursewares.value.unshift(newCw)
      return newCw
    }
  }

  /**
   * 【异步指令】updateCourseware
   * 作用：微调课件属性（标题、标签、状态等）
   * @param id 目标 ID
   * @param data 变更差异包
   * 逻辑：执行“乐观更新”，无论网络延迟如何，本地状态第一时间发生变化。
   */
  const updateCourseware = async (id: string, data: Partial<Courseware>) => {
    const index = coursewares.value.findIndex((c) => c.id === id)

    try {
      await apiUpdateCourseware(id, data)
    } catch (e) {
      console.error('课件更新同步失败:', e)
    }

    // 核心：本地响应式状态强行同步
    if (index > -1) {
      coursewares.value[index] = { ...coursewares.value[index], ...data } as Courseware
    }
  }

  /**
   * 【异步指令】deleteCourseware
   * 作用：从教师的课件柜中移除
   */
  const deleteCourseware = async (id: string) => {
    try {
      await apiDeleteCourseware(id)
    } catch (e) {
      console.warn('远端删除指令未送达，执行本地清理', e)
    }

    const index = coursewares.value.findIndex((c) => c.id === id)
    if (index > -1) {
      coursewares.value.splice(index, 1)
    }
  }

  /**
   * 为指定课件添加一个标签
   * 若标签已存在则不重复添加。
   * @param id  - 课件 ID
   * @param tag - 要添加的标签字符串
   */
  const addTag = async (id: string, tag: string) => {
    const cw = coursewares.value.find((c) => c.id === id)
    if (cw && !cw.tags.includes(tag)) {
      const newTags = [...cw.tags, tag]
      await updateCourseware(id, { tags: newTags })
    }
  }

  /**
   * 从指定课件移除一个标签
   * @param id  - 课件 ID
   * @param tag - 要移除的标签字符串
   */
  const removeTag = async (id: string, tag: string) => {
    const cw = coursewares.value.find((c) => c.id === id)
    if (cw) {
      const newTags = cw.tags.filter((t) => t !== tag)
      await updateCourseware(id, { tags: newTags })
    }
  }

  return {
    coursewares,
    loadCoursewares,
    createCourseware,
    updateCourseware,
    deleteCourseware,
    addTag,
    removeTag,
  }
})
