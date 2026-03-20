import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ClassInfo,
  ClassTask,
  StudentInfo,
  CourseScheduleItem,
  StudentMessage,
  GroupChat,
  GroupMessage,
} from '../types/types'
import {
  apiGetClasses,
  apiCreateClass,
  apiGetClassTasks,
  apiCreateClassTask,
  apiGetClassStudents,
  apiGetClassSchedule,
  apiGetStudentMessages,
  apiSendStudentMessage,
  apiGetGroupChats,
  apiGetGroupMessages,
  apiSendGroupMessage,
} from '../api/class'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useClassesStore = defineStore('classes', () => {
  const classes = ref<ClassInfo[]>([])
  const currentClass = ref<ClassInfo | null>(null)

  const classTasks = ref<Record<string, ClassTask[]>>({})
  const classStudents = ref<Record<string, StudentInfo[]>>({})
  const classSchedules = ref<Record<string, CourseScheduleItem[]>>({})
  const classStudentMessages = ref<Record<string, StudentMessage[]>>({})

  const classGroupChats = ref<Record<string, GroupChat[]>>({})
  const chatMessages = ref<Record<string, GroupMessage[]>>({})
  const activeGroupChat = ref<GroupChat | null>(null)

  const currentTasks = computed(() => currentClass.value ? classTasks.value[currentClass.value.id] || [] : [])
  const students = computed(() => currentClass.value ? classStudents.value[currentClass.value.id] || [] : [])
  const currentSchedule = computed(() => currentClass.value ? classSchedules.value[currentClass.value.id] || [] : [])
  const groupChats = computed(() => currentClass.value ? classGroupChats.value[currentClass.value.id] || [] : [])
  const currentGroupMessages = computed(() => activeGroupChat.value ? chatMessages.value[activeGroupChat.value.id] || [] : [])
  const currentStudentMessages = computed(() => []) // Kept for backwards compatibility

  const loadClasses = async () => {
    try {
      const res = await apiGetClasses()
      classes.value = res.data.data
    } catch {
      if (classes.value.length === 0) {
        classes.value = [
          {
            id: 'c1',
            name: '理科实验班',
            grade: '三年级',
            classNumber: '1班',
            studentCount: 45,
            createTime: now(),
            description: '活泼好动的理科强班',
          },
          {
            id: 'c2',
            name: '英语特色班',
            grade: '五年级',
            classNumber: '2班',
            studentCount: 42,
            createTime: now(),
            description: '英语特色班',
          },
        ]
      }
    }
    if (classes.value.length > 0 && !currentClass.value) {
      currentClass.value = classes.value[0] || null
    }
  }

  const selectClass = async (classId: string) => {
    const found = classes.value.find((c) => c.id === classId)
    if (found) {
      currentClass.value = found
      await loadTasks(classId)

      try {
        const res = await apiGetClassStudents(classId)
        classStudents.value[classId] = res.data.data
      } catch {
        const list = []
        for (let i = 1; i <= 45; i++) {
          const grades = [
            Math.floor(Math.random() * 30 + 70), 
            Math.floor(Math.random() * 30 + 70),
            Math.floor(Math.random() * 30 + 70),
            Math.floor(Math.random() * 30 + 70)
          ];
          const averageGrade = Math.round(grades.reduce((a, b) => a + b, 0) / grades.length);
          list.push({
            id: `stu_${i}`,
            name: `学生${i}`,
            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
            classId: classId,
            progress: Math.floor(Math.random() * 20 + 80),
            grades,
            averageGrade,
            activeCount: Math.floor(Math.random() * 20),
            homeworkCompleted: Math.floor(Math.random() * 5 + 10),
            homeworkTotal: 15,
            createTime: now(),
          })
        }
        classStudents.value[classId] = list
      }

      try {
        const res = await apiGetClassSchedule(classId)
        classSchedules.value[classId] = res.data.data
      } catch {
        classSchedules.value[classId] = [
          { id: 's1', classId, day: '周一', timeStr: '08:00 - 08:45', subject: '语文', teacher: '张老师' },
          { id: 's2', classId, day: '周一', timeStr: '09:00 - 09:45', subject: '数学', teacher: '李老师' },
          { id: 's3', classId, day: '周二', timeStr: '10:00 - 10:45', subject: '英语', teacher: '王老师' },
        ]
      }

      await loadGroupChats(classId)
    }
  }

  const loadTasks = async (classId: string) => {
    try {
      const res = await apiGetClassTasks(classId)
      classTasks.value[classId] = res.data.data
    } catch {
      classTasks.value[classId] = [
        { id: 't1', classId, title: '第一单元练习', type: 'homework', description: '完成课后第1-3题', createTime: now() },
        { id: 't2', classId, title: '课前提问', type: 'discussion', description: '思考关于重力的问题', createTime: now() },
      ]
    }
  }

  const createClass = async (data: Partial<ClassInfo>) => {
    try {
      const res = await apiCreateClass(data)
      classes.value.push(res.data.data)
      return res.data.data
    } catch {
      const newClass: ClassInfo = {
        id: uuidv4(),
        name: data.name || '新班级',
        grade: data.grade || '一年级',
        classNumber: data.classNumber || '1班',
        studentCount: data.studentCount || 45,
        createTime: now(),
        description: data.description || '',
      }
      classes.value.push(newClass)
      return newClass
    }
  }

  const createTask = async (data: Partial<ClassTask>) => {
    const classId = data.classId || 'c1'
    try {
      const res = await apiCreateClassTask(data)
      if (!classTasks.value[classId]) classTasks.value[classId] = []
      classTasks.value[classId].push(res.data.data)
      return res.data.data
    } catch {
      const task: ClassTask = {
        id: uuidv4(),
        classId,
        title: data.title || '新任务',
        type: data.type || 'homework',
        description: data.description || '',
        createTime: now(),
        dueDate: data.dueDate,
      }
      if (!classTasks.value[classId]) classTasks.value[classId] = []
      classTasks.value[classId].push(task)
      return task
    }
  }

  const loadGroupChats = async (classId: string) => {
    if (classGroupChats.value[classId] && classGroupChats.value[classId].length > 0) return;
    try {
      const res = await apiGetGroupChats()
      classGroupChats.value[classId] = res.data.data
    } catch {
      classGroupChats.value[classId] = [
        { id: `g1_${classId}`, name: '班级通知群', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g1', lastMessage: '同学们好', lastSender: '老师', lastMessageTime: '16:27', unreadCount: 0, memberCount: 45 },
        { id: `g2_${classId}`, name: '课后讨论组', avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g2', lastMessage: '第3题怎么做？', lastSender: '学生A', lastMessageTime: '15:52', unreadCount: 2, memberCount: 12 },
      ]
    }
  }

  const selectGroupChat = async (chat: GroupChat) => {
    chat.unreadCount = 0;
    activeGroupChat.value = chat
    if (chatMessages.value[chat.id]) return;
    try {
      const res = await apiGetGroupMessages(chat.id)
      chatMessages.value[chat.id] = res.data.data
    } catch {
      chatMessages.value[chat.id] = [
        {
          id: 'm1',
          groupId: chat.id,
          senderId: 'teacher',
          senderName: '张老师',
          senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=t1',
          senderRole: '老师',
          senderLevel: 20,
          content: '大家好，这是群聊。',
          createTime: now(),
          direction: 'receive',
        }
      ]
    }
  }

  const sendGroupMessage = async (
    groupId: string,
    content: string,
    type: 'text' | 'image' | 'file' = 'text',
    fileData?: unknown,
  ) => {
    try {
      const res = await apiSendGroupMessage(groupId, content, type, fileData)
      if (!chatMessages.value[groupId]) chatMessages.value[groupId] = []
      chatMessages.value[groupId].push(res.data.data)
      return res.data.data
    } catch {
      const newMsg: GroupMessage = {
        id: uuidv4(),
        groupId,
        senderId: 'u4',
        senderName: '我',
        senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u4',
        senderRole: '管理员',
        senderLevel: 7,
        content,
        createTime: now(),
        direction: 'send',
      }
      const finalMsg = { ...newMsg, msgType: type, fileData } as unknown as GroupMessage
      if (!chatMessages.value[groupId]) chatMessages.value[groupId] = []
      chatMessages.value[groupId].push(finalMsg)
      return finalMsg
    }
  }

  const loadStudentMessages = async (studentId: string) => {
    try {
      const res = await apiGetStudentMessages(studentId)
      classStudentMessages.value[studentId] = res.data.data
    } catch {
      classStudentMessages.value[studentId] = [
        { id: 'msg1', studentId, senderId: studentId, content: '老师好', isRead: true, direction: 'receive', createTime: now() },
        { id: 'msg2', studentId, senderId: 'teacher', content: '你好', isRead: true, direction: 'send', createTime: now() }
      ]
    }
  }

  const sendStudentMessage = async (studentId: string, content: string) => {
    try {
      const res = await apiSendStudentMessage(studentId, content)
      if (!classStudentMessages.value[studentId]) classStudentMessages.value[studentId] = []
      classStudentMessages.value[studentId].push(res.data.data)
      return res.data.data
    } catch {
      const newMsg: StudentMessage = { id: uuidv4(), studentId, senderId: 'teacher', content, isRead: false, direction: 'send', createTime: now() }
      if (!classStudentMessages.value[studentId]) classStudentMessages.value[studentId] = []
      classStudentMessages.value[studentId].push(newMsg)
      return newMsg
    }
  }

  const findOrCreateStudentChat = async (classId: string, student: StudentInfo) => {
    if (!classGroupChats.value[classId]) {
      classGroupChats.value[classId] = []
    }
    const existing = classGroupChats.value[classId].find(chat => chat.name === student.name)
    if (existing) {
      await selectGroupChat(existing)
      return existing.id
    }
    const newChat: GroupChat = {
      id: `chat_${student.id}`,
      name: student.name,
      avatar: student.avatar,
      lastMessage: '',
      lastSender: '',
      lastMessageTime: now().split(' ')[1],
      unreadCount: 0,
      memberCount: 2
    }
    classGroupChats.value[classId].unshift(newChat)
    await selectGroupChat(newChat)
    return newChat.id
  }

  return {
    classes,
    currentClass,
    classTasks,
    classStudents,
    classSchedules,
    classGroupChats,
    chatMessages,
    currentTasks,
    students,
    currentSchedule,
    groupChats,
    currentGroupMessages,
    activeGroupChat,
    currentStudentMessages,
    loadClasses,
    selectClass,
    loadTasks,
    createClass,
    createTask,
    loadGroupChats,
    selectGroupChat,
    sendGroupMessage,
    loadStudentMessages,
    sendStudentMessage,
    findOrCreateStudentChat
  }
})
