import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Courseware } from '../types/types'
import { apiGetCoursewares, apiCreateCourseware } from '../api/courseware'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useCoursewareStore = defineStore('courseware', () => {
  const coursewares = ref<Courseware[]>([
    {
      id: 'cw1',
      title: '三年级语文上册-秋天的雨',
      subject: '语文',
      grade: '三年级',
      coverImage: 'https://picsum.photos/300/200?random=1',
      tags: ['公开课', '阅读'],
      createTime: now(),
      updateTime: now(),
      status: 'published',
    },
    {
      id: 'cw2',
      title: '五年级数学-分数乘法',
      subject: '数学',
      grade: '五年级',
      coverImage: 'https://picsum.photos/300/200?random=2',
      tags: ['重点', '计算'],
      createTime: now(),
      updateTime: now(),
      status: 'draft',
    },
  ])

  const loadCoursewares = async () => {
    try {
      const res = await apiGetCoursewares()
      coursewares.value = res.data.data
    } catch {}
  }

  const createCourseware = async (data: Partial<Courseware>) => {
    try {
      const res = await apiCreateCourseware(data)
      coursewares.value.unshift(res.data.data)
      return res.data.data
    } catch {
      const newCw: Courseware = {
        id: uuidv4(),
        title: data.title || '未命名课件',
        subject: data.subject || '通用',
        grade: data.grade || '通用',
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

  return { coursewares, loadCoursewares, createCourseware }
})
