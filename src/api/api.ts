import type {
  User,
  ClassInfo,
  ClassTask,
  Courseware,
  RagFile,
  Message,
  ChatMessage,
  BoardMaterial,
  WorkspaceStats,
} from '../types/types'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

// Mock delay function
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper for generating mock dates
const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

// API Definitions
// All API URLs are left blank intentionally as requested, using standard fetch pattern.
// Currently returning mocked data.

export const userApi = {
  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    // url: '/api/auth/login'
    await delay(500)
    return {
      token: uuidv4(),
      user: {
        id: 'u1',
        name: '张老师',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
        email: 'teacher@example.com',
        role: 'teacher',
      },
    }
  },
  logout: async (): Promise<void> => {
    // url: '/api/auth/logout'
    await delay(300)
  },
  updateProfile: async (data: Partial<User>): Promise<User> => {
    // url: '/api/user/profile'
    await delay(500)
    return {
      id: 'u1',
      name: data.name || '张老师',
      avatar: data.avatar || '',
      email: data.email || '',
      role: 'teacher',
    }
  },
}

export const workspaceApi = {
  getStats: async (): Promise<WorkspaceStats> => {
    // url: '/api/workspace/stats'
    await delay(300)
    return {
      courseCount: 12,
      classCount: 3,
      studentCount: 120,
      messageUnread: 5,
    }
  },
  uploadVoice: async (file: File): Promise<{ text: string }> => {
    // url: '/api/workspace/voice'
    await delay(1000)
    return { text: '这是语音转换后的文字内容...' }
  },
}

export const classApi = {
  getClasses: async (): Promise<ClassInfo[]> => {
    // url: '/api/classes'
    await delay(500)
    return [
      {
        id: 'c1',
        name: '三年级1班',
        grade: '三年级',
        subject: '全部',
        studentCount: 45,
        createTime: now(),
        description: '活泼好动的理科强班',
      },
      {
        id: 'c2',
        name: '五年级2班',
        grade: '五年级',
        subject: '全部',
        studentCount: 42,
        createTime: now(),
        description: '英语特色班',
      },
    ]
  },
  createClass: async (data: Partial<ClassInfo>): Promise<ClassInfo> => {
    // url: '/api/classes'
    await delay(600)
    return {
      id: uuidv4(),
      name: data.name || '新班级',
      grade: data.grade || '一年级',
      subject: data.subject || '全部',
      studentCount: 0,
      createTime: now(),
      description: data.description || '',
    }
  },
  getClassTasks: async (classId: string): Promise<ClassTask[]> => {
    // url: `/api/classes/${classId}/tasks`
    await delay(400)
    return [
      {
        id: 't1',
        classId,
        title: '第一单元练习',
        type: 'homework',
        description: '完成课后第1-3题',
        createTime: now(),
      },
      {
        id: 't2',
        classId,
        title: '课前提问',
        type: 'discussion',
        description: '思考关于重力的问题',
        createTime: now(),
      },
    ]
  },
  createTask: async (data: Partial<ClassTask>): Promise<ClassTask> => {
    // url: `/api/classes/${data.classId}/tasks`
    await delay(500)
    return {
      id: uuidv4(),
      classId: data.classId || 'c1',
      title: data.title || '新任务',
      type: data.type || 'homework',
      description: data.description || '',
      createTime: now(),
      dueDate: data.dueDate,
    }
  },
}

export const ragApi = {
  getFiles: async (): Promise<RagFile[]> => {
    // url: '/api/rag/files'
    await delay(600)
    return [
      {
        id: 'f1',
        name: '小学英语词汇表.pdf',
        size: 1024 * 1024 * 2,
        type: 'pdf',
        url: '/data/sample.pdf',
        tags: ['英语', '词汇'],
        uploadTime: now(),
      },
      {
        id: 'f2',
        name: '四年级数学教案.docx',
        size: 1024 * 500,
        type: 'docx',
        url: '/data/sample.docx',
        tags: ['数学', '教案'],
        uploadTime: now(),
      },
    ]
  },
  uploadFile: async (file: File): Promise<RagFile> => {
    // url: '/api/rag/files'
    await delay(1200)
    return {
      id: uuidv4(),
      name: file.name,
      size: file.size,
      type: file.name.split('.').pop() || 'unknown',
      url: '/data/sample.pdf', // Mock URL
      tags: [],
      uploadTime: now(),
    }
  },
  deleteFile: async (id: string): Promise<void> => {
    // url: `/api/rag/files/${id}`
    await delay(400)
  },
  updateTags: async (id: string, tags: string[]): Promise<RagFile> => {
    // url: `/api/rag/files/${id}/tags`
    await delay(300)
    return { id, name: 'file', size: 0, type: 'pdf', url: '', tags, uploadTime: now() }
  },
}

export const coursewareApi = {
  getCoursewares: async (): Promise<Courseware[]> => {
    // url: '/api/courseware'
    await delay(500)
    return [
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
    ]
  },
  createCourseware: async (data: Partial<Courseware>): Promise<Courseware> => {
    // url: '/api/courseware'
    await delay(600)
    return {
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
  },
}

export const messageApi = {
  getMessages: async (): Promise<Message[]> => {
    // url: '/api/messages'
    await delay(400)
    return [
      {
        id: 'm1',
        senderId: 'sys',
        senderName: '系统通知',
        senderAvatar: '',
        content: '您的课件已经被审核通过。',
        type: 'system',
        isRead: false,
        createTime: now(),
      },
      {
        id: 'm2',
        senderId: 'u2',
        senderName: '学生A',
        senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=2',
        content: '老师，今天的作业有一题不懂。',
        type: 'user',
        isRead: true,
        createTime: now(),
      },
    ]
  },
  markAsRead: async (id: string): Promise<void> => {
    // url: `/api/messages/${id}/read`
    await delay(200)
  },
  deleteMessage: async (id: string): Promise<void> => {
    // url: `/api/messages/${id}`
    await delay(300)
  },
}

export const cocreationApi = {
  getMaterials: async (coursewareId: string): Promise<BoardMaterial[]> => {
    // url: `/api/cocreation/${coursewareId}/materials`
    await delay(500)
    return [
      { id: 'mat1', type: 'ppt', name: '课堂讲义.pptx', url: '/data/sample.pptx' },
      { id: 'mat2', type: 'word', name: '教案详情.docx', url: '/data/sample.docx' },
      { id: 'mat3', type: 'pdf', name: '拓展阅读.pdf', url: '/data/sample.pdf' },
    ]
  },
  chat: async (message: string, isVoice: boolean, file?: File): Promise<ChatMessage> => {
    // url: '/api/cocreation/chat'
    await delay(1500)
    return {
      id: uuidv4(),
      role: 'assistant',
      content: '我收到了你的消息。针对这个知识点，我建议你可以用以下的方式进行讲解...',
      type: 'text',
      time: now(),
    }
  },
}
