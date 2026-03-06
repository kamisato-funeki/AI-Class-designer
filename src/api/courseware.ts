import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { Courseware } from '../types/types'

export function apiGetCoursewares(): CommonResponseData<Courseware[]> {
  return defaultAxios.get('/courseware')
}

export function apiCreateCourseware(data: Partial<Courseware>): CommonResponseData<Courseware> {
  return defaultAxios.post('/courseware', data)
}
