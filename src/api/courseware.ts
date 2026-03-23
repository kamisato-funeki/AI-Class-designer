/**
 * 课件管理相关 API
 *
 * 业务逻辑说明：
 * 提供课件（Courseware）的完整 CRUD 操作接口：
 * - 查询课件列表
 * - 创建新课件
 * - 更新课件信息
 * - 删除课件
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type { Courseware } from '../types/types'

/**
 * 获取当前用户的课件列表
 * @returns 课件信息数组
 */
export function apiGetCoursewares(): CommonResponseData<Courseware[]> {
  return defaultAxios.get('/courseware')
}

/**
 * 创建新课件
 * @param data - 课件创建表单数据（部分字段）
 * @returns 创建成功的课件信息（包含服务器生成的 id、时间等）
 */
export function apiCreateCourseware(data: Partial<Courseware>): CommonResponseData<Courseware> {
  return defaultAxios.post('/courseware', data)
}

/**
 * 更新指定课件的信息
 * @param id   - 需要更新的课件 ID
 * @param data - 需要更新的字段（部分更新）
 * @returns 更新后的完整课件信息
 */
export function apiUpdateCourseware(id: string, data: Partial<Courseware>): CommonResponseData<Courseware> {
  return defaultAxios.put(`/courseware/${id}`, data)
}

/**
 * 删除指定课件
 * @param id - 需要删除的课件 ID
 * @returns 空数据响应
 */
export function apiDeleteCourseware(id: string): CommonResponseData<unknown> {
  return defaultAxios.delete(`/courseware/${id}`)
}
