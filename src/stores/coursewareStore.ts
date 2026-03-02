import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Courseware } from '../types/types'
import { coursewareApi } from '../api/api'

export const useCoursewareStore = defineStore('courseware', () => {
  const coursewares = ref<Courseware[]>([])

  const loadCoursewares = async () => {
    coursewares.value = await coursewareApi.getCoursewares()
  }

  const createCourseware = async (data: Partial<Courseware>) => {
    const cw = await coursewareApi.createCourseware(data)
    coursewares.value.push(cw)
    return cw
  }

  return { coursewares, loadCoursewares, createCourseware }
})
