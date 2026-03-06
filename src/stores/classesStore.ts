import { defineStore } from 'pinia'
import { ref } from 'vue'
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
  const currentTasks = ref<ClassTask[]>([])
  const students = ref<StudentInfo[]>([])
  const currentSchedule = ref<CourseScheduleItem[]>([])
  const currentStudentMessages = ref<StudentMessage[]>([])

  const groupChats = ref<GroupChat[]>([])
  const currentGroupMessages = ref<GroupMessage[]>([])
  const activeGroupChat = ref<GroupChat | null>(null)

  const loadClasses = async () => {
    try {
      const res = await apiGetClasses()
      classes.value = res.data.data
    } catch {
      if (classes.value.length === 0) {
        classes.value = [
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
        students.value = res.data.data
      } catch {
        const list = []
        for (let i = 1; i <= 45; i++) {
          list.push({
            id: `stu_${i}`,
            name: `学生${i}`,
            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${i}`,
            classId: classId,
            progress: `${Math.floor(Math.random() * 40 + 60)}%`,
            grades: [Math.floor(Math.random() * 30 + 70), Math.floor(Math.random() * 30 + 70)],
            activeCount: Math.floor(Math.random() * 20),
            createTime: now(),
          })
        }
        students.value = list
      }

      try {
        const res = await apiGetClassSchedule(classId)
        currentSchedule.value = res.data.data
      } catch {
        currentSchedule.value = [
          {
            id: 's1',
            classId,
            day: '周一',
            timeStr: '08:00 - 08:45',
            subject: '语文',
            teacher: '张老师',
          },
          {
            id: 's2',
            classId,
            day: '周一',
            timeStr: '09:00 - 09:45',
            subject: '数学',
            teacher: '李老师',
          },
          {
            id: 's3',
            classId,
            day: '周二',
            timeStr: '10:00 - 10:45',
            subject: '英语',
            teacher: '王老师',
          },
        ]
      }
    }
  }

  const loadStudentMessages = async (studentId: string) => {
    try {
      const res = await apiGetStudentMessages(studentId)
      currentStudentMessages.value = res.data.data
    } catch {
      currentStudentMessages.value = [
        {
          id: 'msg1',
          studentId,
          senderId: studentId,
          content: '老师好，我不太理解这节课的作业。',
          isRead: true,
          direction: 'receive',
          createTime: now(),
        },
        {
          id: 'msg2',
          studentId,
          senderId: 'teacher',
          content: '好的，哪里不理解呢？',
          isRead: true,
          direction: 'send',
          createTime: now(),
        },
      ]
    }
  }

  const sendStudentMessage = async (studentId: string, content: string) => {
    try {
      const res = await apiSendStudentMessage(studentId, content)
      currentStudentMessages.value.push(res.data.data)
      return res.data.data
    } catch {
      const newMsg: StudentMessage = {
        id: uuidv4(),
        studentId,
        senderId: 'teacher',
        content,
        isRead: false,
        direction: 'send',
        createTime: now(),
      }
      currentStudentMessages.value.push(newMsg)
      return newMsg
    }
  }

  const loadTasks = async (classId: string) => {
    try {
      const res = await apiGetClassTasks(classId)
      currentTasks.value = res.data.data
    } catch {
      currentTasks.value = [
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
        subject: data.subject || '全部',
        studentCount: 0,
        createTime: now(),
        description: data.description || '',
      }
      classes.value.push(newClass)
      return newClass
    }
  }

  const createTask = async (data: Partial<ClassTask>) => {
    try {
      const res = await apiCreateClassTask(data)
      currentTasks.value.push(res.data.data)
      return res.data.data
    } catch {
      const task: ClassTask = {
        id: uuidv4(),
        classId: data.classId || 'c1',
        title: data.title || '新任务',
        type: data.type || 'homework',
        description: data.description || '',
        createTime: now(),
        dueDate: data.dueDate,
      }
      currentTasks.value.push(task)
      return task
    }
  }

  const loadGroupChats = async () => {
    try {
      const res = await apiGetGroupChats()
      groupChats.value = res.data.data
    } catch {
      if (groupChats.value.length === 0) {
        groupChats.value = [
          {
            id: 'g1',
            name: '25凌睿建筑工地',
            avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g1',
            lastMessage: '别管',
            lastSender: 'shyler',
            lastMessageTime: '16:27',
            unreadCount: 100,
            memberCount: 50,
          },
          {
            id: 'g2',
            name: '明月微星',
            avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g2',
            lastMessage: '收到',
            lastSender: '',
            lastMessageTime: '15:52',
            unreadCount: 0,
            memberCount: 2,
          },
          {
            id: 'g3',
            name: '404NotFound',
            avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g3',
            lastMessage: '中',
            lastSender: 'UI-徐燊',
            lastMessageTime: '14:51',
            unreadCount: 0,
            memberCount: 5,
          },
          {
            id: 'g4',
            name: '2025工业软件综合设计群',
            avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g4',
            lastMessage: 'MyVSYosys-pub.rar',
            lastSender: '何',
            lastMessageTime: '14:47',
            unreadCount: 0,
            memberCount: 100,
          },
          {
            id: 'g5',
            name: '白老师的C++群',
            avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=g5',
            lastMessage: '@全体成员各位同学，git有...',
            lastSender: '老白',
            lastMessageTime: '10:29',
            unreadCount: 0,
            memberCount: 80,
          },
        ]
      }
    }
  }

  const selectGroupChat = async (chat: GroupChat) => {
    activeGroupChat.value = chat
    try {
      const res = await apiGetGroupMessages(chat.id)
      currentGroupMessages.value = res.data.data
    } catch {
      if (chat.id === 'g3') {
        currentGroupMessages.value = [
          {
            id: 'm1',
            groupId: 'g3',
            senderId: 'u2',
            senderName: '明月微星',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u2',
            senderRole: '管理员',
            senderLevel: 14,
            content: '现在公示期也过了',
            createTime: '2026/01/15 23:44',
            direction: 'send',
          },
          {
            id: 'm2',
            groupId: 'g3',
            senderId: 'u2',
            senderName: '明月微星',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u2',
            senderRole: '管理员',
            senderLevel: 14,
            content: '问问傅老？',
            createTime: '2026/01/15 23:45',
            direction: 'send',
          },
          {
            id: 'm3',
            groupId: 'g3',
            senderId: 'u3',
            senderName: '0913023张馨木',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u3',
            senderRole: '群主',
            senderLevel: 17,
            content: '我问了两个老师，都说等通知，应该先不用管了',
            createTime: '2026/01/15 23:46',
            direction: 'receive',
          },
          {
            id: 'm4',
            groupId: 'g3',
            senderId: 'u2',
            senderName: '明月微星',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u2',
            senderRole: '管理员',
            senderLevel: 14,
            content: 'OK',
            createTime: '2026/01/15 23:47',
            direction: 'send',
          },
          {
            id: 'm5',
            groupId: 'g3',
            senderId: 'u3',
            senderName: '0913023张馨木',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u3',
            senderRole: '群主',
            senderLevel: 17,
            content: '那个大创的钱快发了，老师让我填信息，我先写我的到时候再分吧',
            createTime: '14:37',
            direction: 'receive',
          },
          {
            id: 'm6',
            groupId: 'g3',
            senderId: 'u2',
            senderName: '明月微星',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u2',
            senderRole: '管理员',
            senderLevel: 14,
            content: 'OK',
            createTime: '14:38',
            direction: 'send',
          },
          {
            id: 'm7',
            groupId: 'g3',
            senderId: 'u4',
            senderName: 'UI-徐燊',
            senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u4',
            senderRole: '管理员',
            senderLevel: 7,
            content: '中',
            createTime: '14:51',
            direction: 'receive',
          },
        ]
      } else {
        currentGroupMessages.value = []
      }
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
      currentGroupMessages.value.push(res.data.data)
      return res.data.data
    } catch {
      const newMsg: GroupMessage = {
        id: uuidv4(),
        groupId,
        senderId: 'u4',
        senderName: 'UI-徐燊',
        senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u4',
        senderRole: '管理员',
        senderLevel: 7,
        content,
        createTime: now(),
        direction: 'send',
      }
      // If it has specialized typing, store it on the object dynamically for UI purposes (cast since we haven't typed GroupMessage fully for files yet)
      const finalMsg = { ...newMsg, msgType: type, fileData } as unknown as GroupMessage
      currentGroupMessages.value.push(finalMsg)
      return finalMsg
    }
  }

  return {
    classes,
    currentClass,
    currentTasks,
    students,
    currentSchedule,
    currentStudentMessages,
    loadClasses,
    selectClass,
    loadTasks,
    createClass,
    createTask,
    loadStudentMessages,
    sendStudentMessage,
    groupChats,
    currentGroupMessages,
    activeGroupChat,
    loadGroupChats,
    selectGroupChat,
    sendGroupMessage,
  }
})
