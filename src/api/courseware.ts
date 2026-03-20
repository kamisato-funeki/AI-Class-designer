import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { Courseware } from '../types/types'

export function apiGetCoursewares(): CommonResponseData<Courseware[]> {
  return defaultAxios.get('/courseware')
}

export function apiCreateCourseware(data: Partial<Courseware>): CommonResponseData<Courseware> {
  return defaultAxios.post('/courseware', data)
}

export function apiUpdateCourseware(id: string, data: Partial<Courseware>): CommonResponseData<Courseware> {
  return defaultAxios.put(`/courseware/${id}`, data)
}

export function apiDeleteCourseware(id: string): CommonResponseData<unknown> {
  return defaultAxios.delete(`/courseware/${id}`)
}
