/**
 * 班级管理相关 API
 *
 * 业务逻辑说明：
 * 提供班级模块的所有后端接口，涵盖：
 * - 班级的查询与创建
 * - 班级任务（作业/讨论/资料）的管理
 * - 班级学生列表查询
 * - 班级课程表查询
 * - 师生私信的收发
 * - 群聊会话与群消息的管理
 */

import { defaultAxios } from './base'
import type { CommonResponseData } from './base'
import type {
  ClassInfo,
  ClassTask,
  StudentInfo,
  CourseScheduleItem,
  StudentMessage,
  GroupChat,
  GroupMessage,
  HomeworkInfo,
} from '../types/types'

// ==================== 班级基础操作 ====================

/**
 * 获取当前用户的所有班级列表
 * @returns 班级信息数组
 */
export function apiGetClasses(): CommonResponseData<ClassInfo[]> {
  return defaultAxios.get('/classes')
}

/**
 * 创建新班级
 * @param data - 班级创建表单数据（部分字段）
 * @returns 创建成功的班级信息
 */
export function apiCreateClass(data: Partial<ClassInfo>): CommonResponseData<ClassInfo> {
  return defaultAxios.post('/classes', data)
}

// ==================== 班级任务操作 ====================

/**
 * 获取指定班级的任务列表
 * @param classId - 班级 ID
 * @returns 班级任务数组
 */
export function apiGetClassTasks(classId: string): CommonResponseData<ClassTask[]> {
  return defaultAxios.get(`/classes/${classId}/tasks`)
}

/**
 * 为指定班级创建新任务
 * @param data - 任务创建数据（包含 classId）
 * @returns 创建成功的任务信息
 */
export function apiCreateClassTask(data: Partial<ClassTask>): CommonResponseData<ClassTask> {
  return defaultAxios.post(`/classes/${data.classId}/tasks`, data)
}

// ==================== 班级作业操作 ====================

/**
 * 获取指定班级的作业列表
 * @param classId - 班级 ID
 * @returns 班级作业数组
 */
export function apiGetClassHomeworks(classId: string): CommonResponseData<HomeworkInfo[]> {
  return defaultAxios.get(`/classes/${classId}/homeworks`)
}

/**
 * 为指定班级发布新作业
 * @param data - 作业数据
 * @returns 创建成功的作业信息
 */
export function apiCreateClassHomework(data: Partial<HomeworkInfo>): CommonResponseData<HomeworkInfo> {
  return defaultAxios.post(`/classes/${data.classId}/homeworks`, data)
}

/**
 * 更新班级作业
 * @param id - 作业 ID
 * @param data - 更新的作业数据
 */
export function apiUpdateClassHomework(id: string, data: Partial<HomeworkInfo>): CommonResponseData<HomeworkInfo> {
  return defaultAxios.put(`/homeworks/${id}`, data)
}

/**
 * 删除班级作业
 * @param id - 作业 ID
 */
export function apiDeleteClassHomework(id: string): CommonResponseData<void> {
  return defaultAxios.delete(`/homeworks/${id}`)
}

/**
 * 下载作业附件
 * @param url - 附件地址
 * @param name - 附件名称
 * @returns Blob文件流 (在真实场景中返回二进制)
 */
export function apiDownloadHomeworkAttachment(url: string, name?: string): Promise<Blob> {
  // 此处模拟文件下载请求，实际场景一般是设定 responseType: 'blob'
  return defaultAxios.get(url, { responseType: 'blob', params: { name } })
}


/**
 * 更新学生作业的评分和评语
 * @param homeworkId - 作业 ID
 * @param studentId - 学生 ID
 * @param data - 更新的数据包括分数和评议
 */
export function apiUpdateStudentHomeworkEvaluation(homeworkId: string, studentId: string, data: { grade: number; evaluation: string }): Promise<unknown> {
  return defaultAxios.put(`/homeworks/${homeworkId}/students/${studentId}/evaluation`, data)
}

// ==================== 班级学生操作 ====================

/**
 * 获取指定班级的学生列表
 * @param classId - 班级 ID
 * @returns 学生信息数组
 */
export function apiGetClassStudents(classId: string): CommonResponseData<StudentInfo[]> {
  return defaultAxios.get(`/classes/${classId}/students`)
}

// ==================== 班级课程表操作 ====================

/**
 * 获取指定班级的课程表
 * @param classId - 班级 ID
 * @returns 课程表条目数组
 */
export function apiGetClassSchedule(classId: string): CommonResponseData<CourseScheduleItem[]> {
  return defaultAxios.get(`/classes/${classId}/schedule`)
}

// ==================== 师生私信操作 ====================

/**
 * 获取与指定学生的私信记录
 * @param studentId - 学生 ID
 * @returns 私信消息数组
 */
export function apiGetStudentMessages(studentId: string): CommonResponseData<StudentMessage[]> {
  return defaultAxios.get(`/students/${studentId}/messages`)
}

/**
 * 向指定学生发送私信
 * @param studentId - 接收学生 ID
 * @param content   - 消息文本内容
 * @returns 发送成功的消息对象
 */
export function apiSendStudentMessage(
  studentId: string,
  content: string,
): CommonResponseData<StudentMessage> {
  return defaultAxios.post(`/students/${studentId}/messages`, { content })
}

// ==================== 群聊操作 ====================

/**
 * 获取当前用户加入的所有群聊列表
 * @returns 群聊会话数组
 */
export function apiGetGroupChats(): CommonResponseData<GroupChat[]> {
  return defaultAxios.get('/group-chats')
}

/**
 * 获取指定群聊的消息记录
 * @param groupId - 群聊 ID
 * @returns 群消息数组
 */
export function apiGetGroupMessages(groupId: string): CommonResponseData<GroupMessage[]> {
  return defaultAxios.get(`/group-chats/${groupId}/messages`)
}

/**
 * 向指定群聊发送消息
 * @param groupId  - 目标群聊 ID
 * @param content  - 消息内容
 * @param type     - 消息类型：text（默认） / image / file
 * @param fileData - 文件数据（仅 type 为 image/file 时传入，可选）
 * @returns 发送成功的群消息对象
 */
export function apiSendGroupMessage(
  groupId: string,
  content: string,
  type: 'text' | 'image' | 'file' = 'text',
  fileData?: unknown,
): CommonResponseData<GroupMessage> {
  return defaultAxios.post(`/group-chats/${groupId}/messages`, { content, type, fileData })
}
