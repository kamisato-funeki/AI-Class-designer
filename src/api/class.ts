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
} from '../types/types'

export function apiGetClasses(): CommonResponseData<ClassInfo[]> {
  return defaultAxios.get('/classes')
}

export function apiCreateClass(data: Partial<ClassInfo>): CommonResponseData<ClassInfo> {
  return defaultAxios.post('/classes', data)
}

export function apiGetClassTasks(classId: string): CommonResponseData<ClassTask[]> {
  return defaultAxios.get(`/classes/${classId}/tasks`)
}

export function apiCreateClassTask(data: Partial<ClassTask>): CommonResponseData<ClassTask> {
  return defaultAxios.post(`/classes/${data.classId}/tasks`, data)
}

export function apiGetClassStudents(classId: string): CommonResponseData<StudentInfo[]> {
  return defaultAxios.get(`/classes/${classId}/students`)
}

export function apiGetClassSchedule(classId: string): CommonResponseData<CourseScheduleItem[]> {
  return defaultAxios.get(`/classes/${classId}/schedule`)
}

export function apiGetStudentMessages(studentId: string): CommonResponseData<StudentMessage[]> {
  return defaultAxios.get(`/students/${studentId}/messages`)
}

export function apiSendStudentMessage(
  studentId: string,
  content: string,
): CommonResponseData<StudentMessage> {
  return defaultAxios.post(`/students/${studentId}/messages`, { content })
}

export function apiGetGroupChats(): CommonResponseData<GroupChat[]> {
  return defaultAxios.get('/group-chats')
}

export function apiGetGroupMessages(groupId: string): CommonResponseData<GroupMessage[]> {
  return defaultAxios.get(`/group-chats/${groupId}/messages`)
}

export function apiSendGroupMessage(
  groupId: string,
  content: string,
  type: 'text' | 'image' | 'file' = 'text',
  fileData?: unknown,
): CommonResponseData<GroupMessage> {
  return defaultAxios.post(`/group-chats/${groupId}/messages`, { content, type, fileData })
}
