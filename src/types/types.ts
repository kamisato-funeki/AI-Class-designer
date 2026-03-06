export interface User {
  id: string
  name: string
  avatar: string
  email: string
  role: 'teacher' | 'student' | 'admin'
}

export interface ClassInfo {
  id: string
  name: string
  grade: string
  subject: string
  studentCount: number
  coverImage?: string
  description: string
  createTime: string
}

export interface ClassTask {
  id: string
  classId: string
  title: string
  type: 'homework' | 'discussion' | 'material'
  description: string
  dueDate?: string
  createTime: string
}

export interface Courseware {
  id: string
  title: string
  subject: string
  grade: string
  coverImage: string
  tags: string[]
  createTime: string
  updateTime: string
  status: 'draft' | 'published'
}

export interface RagFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  tags: string[]
  uploadTime: string
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  type: 'system' | 'user'
  isRead: boolean
  createTime: string
}

export interface StudentInfo {
  id: string
  name: string
  avatar: string
  classId: string
  progress: string
  grades: number[]
  activeCount: number
  createTime: string
}

export interface StudentMessage {
  id: string
  studentId: string
  senderId: string
  content: string
  isRead: boolean
  direction: 'send' | 'receive'
  createTime: string
}

export interface CourseScheduleItem {
  id: string
  classId: string
  day: string
  timeStr: string
  subject: string
  teacher: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'voice' | 'file'
  fileUrl?: string
  fileName?: string
  time: string
}

export interface BoardMaterial {
  id: string
  type: 'word' | 'ppt' | 'pdf' | 'mindmap' | 'video' | 'html'
  name: string
  url: string
}

export interface WorkspaceStats {
  courseCount: number
  classCount: number
  studentCount: number
  messageUnread: number
}

export interface GroupChat {
  id: string
  name: string
  avatar: string
  lastMessage?: string
  lastSender?: string
  lastMessageTime?: string
  unreadCount: number
  memberCount: number
}

export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  senderName: string
  senderAvatar: string
  senderRole?: string
  senderLevel?: number
  content: string
  createTime: string
  direction: 'send' | 'receive'
}
