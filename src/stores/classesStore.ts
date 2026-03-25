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
  HomeworkInfo,
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
  apiGetClassHomeworks,
  apiCreateClassHomework,
  apiUpdateClassHomework,
  apiDeleteClassHomework,
  apiUpdateStudentHomeworkEvaluation,
} from '../api/class'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

/**
 * 班级管理全局状态中心 (useClassesStore)
 * 业务职责：
 * 1. 班级全生命周期管理：维护教师名下的所有班级列表及其基本画像。
 * 2. 联动数据聚合：负责异步加载与当前选中班级强相关的任务、学生明细、课表排期及即时通讯（IM）记录。
 * 3. 弹性 Mock 机制：在离线或 API 异常时，通过内置逻辑生成高仿真的教学业务数据，保障前端 UI 的平滑运行。
 * 4. 实时交互中转：驱动班级群聊与学生私聊的信令收发。
 */
export const useClassesStore = defineStore('classes', () => {
  // --- 响应式状态 (State) ---
  const classes = ref<ClassInfo[]>([])              // 教师管辖的全量班级集合
  const currentClass = ref<ClassInfo | null>(null)   // 当前正在视口中交互的班级上下文对象

  const classTasks = ref<Record<string, ClassTask[]>>({})            // 任务缓存映射表：按 ClassId 归档作业、讨论等
  const classHomeworks = ref<Record<string, HomeworkInfo[]>>({})     // 作业缓存映射表：按 ClassId 归档扩展版班级作业
  const classStudents = ref<Record<string, StudentInfo[]>>({})       // 学员名册映射表：存储每个班级的学生画像
  const classSchedules = ref<Record<string, CourseScheduleItem[]>>({}) // 课表排行映射表：存储班级的课程时间线
  const classStudentMessages = ref<Record<string, StudentMessage[]>>({}) // 私聊历史映射表：维护教师与学生间的 1对1 记录

  const classGroupChats = ref<Record<string, GroupChat[]>>({})       // 班级群组映射表：存储班级内的多个讨论群
  const chatMessages = ref<Record<string, GroupMessage[]>>({})       // 消息流映射表：按 GroupId 聚合存储所有 IM 消息块
  const activeGroupChat = ref<GroupChat | null>(null)                // 当前桌面/视口中激活的聊天会话对象

  // --- 衍生计算状态 (Computed) ---
  // 根据 currentClass 的变化，自动切片并暴露给 UI 层直接使用的子集数据
  const currentTasks = computed(() => currentClass.value ? classTasks.value[currentClass.value.id] || [] : [])
  const students = computed(() => currentClass.value ? classStudents.value[currentClass.value.id] || [] : [])
  const currentHomeworks = computed(() => currentClass.value ? classHomeworks.value[currentClass.value.id] || [] : [])
  const currentSchedule = computed(() => currentClass.value ? classSchedules.value[currentClass.value.id] || [] : [])
  const groupChats = computed(() => currentClass.value ? classGroupChats.value[currentClass.value.id] || [] : [])
  const currentGroupMessages = computed(() => activeGroupChat.value ? chatMessages.value[activeGroupChat.value.id] || [] : [])
  // 预留占位，用于兼容旧版私聊逻辑
  const currentStudentMessages = computed(() => []) 

  /**
   * 【异步指令】loadClasses
   * 作用：初始化班级数据源
   * 业务逻辑：尝试从后端拉取班级列表，若失败或为空，则注入一套完整的 Mock 数据并默认选中首个项。
   */
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
            description: '专注于理科思维培养，包含物理、化学探究小组。',
          },
          {
            id: 'c2',
            name: '英语特色班',
            grade: '五年级',
            classNumber: '2班',
            studentCount: 42,
            createTime: now(),
            description: '浸润式英语环境设计，支持口语 AI 测评。',
          },
        ]
      }
    }
    // 策略：初始空状态下自动激活第一顺位班级
    if (classes.value.length > 0 && !currentClass.value) {
      currentClass.value = classes.value[0] || null
    }
  }

  /**
   * 【异步指令】selectClass
   * 作用：切换业务上下文 ID
   * @param classId 目标班级 ID
   * 业务逻辑：
   * 1. 切换 currentClass 指针。
   * 2. 并行/串行加载任务、学生（带生成算法）、课表及 IM 列表，实现视图的级联刷新。
   */
  const selectClass = async (classId: string) => {
    const found = classes.value.find((c) => c.id === classId)
    if (found) {
      currentClass.value = found
      // A. 同步加载班级任务及作业
      await loadTasks(classId)
      await loadHomeworks(classId)

      // B. 加载动态生成的小组学生名单 (Mock 算法：生成 45 名具有随机成绩分布的虚拟学生)
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

      // C. 加载课程排期
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

      // D. 加载 IM IM 会话列表
      await loadGroupChats(classId)
    }
  }

  /**
   * 【异步指令】loadTasks
   * 作用：拉取班级内的作业与互动任务
   */
  const loadTasks = async (classId: string) => {
    try {
      const res = await apiGetClassTasks(classId)
      classTasks.value[classId] = res.data.data
    } catch {
      classTasks.value[classId] = [
        { id: 't1', classId, title: '第一单元练习', type: 'homework', description: '完成课后第1-3题并拍照上传。', createTime: now() },
        { id: 't2', classId, title: '课前提问', type: 'discussion', description: '思考一下重力如果不复存在，世界会变成什么样？', createTime: now() },
      ]
    }
  }

  /**
   * 【异步指令】loadHomeworks
   * 作用：拉取班级内的所有作业，包含详情
   */
  const loadHomeworks = async (classId: string) => {
    try {
      const res = await apiGetClassHomeworks(classId)
      classHomeworks.value[classId] = res.data.data
    } catch {
      // 提供丰富的 Mock 作业数据，扩展至 20 条
      const mocks: HomeworkInfo[] = [];
      const baseDate = dayjs();
      
      for (let i = 0; i < 20; i++) {
        const createTime = baseDate.subtract(i * 2, 'day').format('YYYY-MM-DD HH:mm:ss');
        const dueDate = baseDate.subtract(i * 2 - 3, 'day').format('YYYY-MM-DD HH:mm:ss');
        const completed = Math.floor(Math.random() * 20) + 25; // 25 to 44
        const total = 45;
        
        // 模拟学生提交详情
        const studentStats = Array.from({ length: 8 }).map((_, j) => {
          const names = ['李华', '张三', '王五', '赵六', '陈七', '林八', '刘九', '孙十'];
          const isExcellent = Math.random() > 0.5;
          const hasAttachment = Math.random() > 0.5;
          return {
            studentId: `stu_hw_${i}_${j}`,
            name: names[j] || '学生',
            grade: isExcellent ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 20) + 70,
            avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=hw_${i}_${j}`,
            submittedContent: `【${names[j]}的作业提交】\n本次作业我认真复习了课堂所学知识。第1题的答案是A，第2题我使用了新学的公式进行推导...`,
            attachments: hasAttachment ? [{ name: `${names[j]}的附加证明文件.pdf`, url: `blob:mock-student-${i}-${j}.pdf` }] : undefined,
            evaluation: isExcellent ? '做得非常好！思路清晰，计算准确，继续保持。' : '基础掌握得不错，但是部分细节还需要再检查一下，注意书写规范。'
          };
        });

        mocks.push({
          id: `hw_mock_${i}`,
          classId,
          title: i === 0 ? '最新随堂练习及作业' : `第 ${20 - i} 次课后作业任务`,
          description: `这是第 ${20 - i} 次作业的详细描述。请同学们仔细阅读相关材料，按时完成。注意：不仅要写出结果，还要有详细的推导过程。`,
          attachments: i % 3 === 0 ? [{ name: `参考资料_${i}.pdf`, url: `blob:mock-url-${i}.pdf` }] : [{ name: `阅读材料_${i}.docx`, url: `blob:mock-url-read-${i}.docx` }, { name: '模板.xlsx', url: `blob:mock-template.xlsx` }],
          dueDate,
          createTime,
          completedCount: completed,
          totalCount: total,
          studentStats,
        });
      }
      classHomeworks.value[classId] = mocks;
    }
  }

  /**
   * 【异步指令】createClass
   * 作用：执行新班级的入库持久化
   * @param data 班级表单信息 (Partial)
   */
  const createClass = async (data: Partial<ClassInfo>) => {
    try {
      const res = await apiCreateClass(data)
      classes.value.push(res.data.data)
      return res.data.data
    } catch {
      // 降级：执行本地事务存储，赋予唯一 UUID
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

  /**
   * 【异步指令】createTask
   * 作用：发布新的教学任务
   * @param data 任务载体信息
   */
  const createTask = async (data: Partial<ClassTask>) => {
    const classId = data.classId || 'c1'
    try {
      const res = await apiCreateClassTask(data)
      if (!classTasks.value[classId]) classTasks.value[classId] = []
      classTasks.value[classId].push(res.data.data)
      return res.data.data
    } catch {
      // 降级：本地 Mock 发布
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

  /**
   * 【异步指令】createHomework
   * 作用：发布班级作业
   */
  const createHomework = async (data: Partial<HomeworkInfo>) => {
    const classId = data.classId || currentClass.value?.id || 'c1'
    try {
      const res = await apiCreateClassHomework(data)
      if (!classHomeworks.value[classId]) classHomeworks.value[classId] = []
      classHomeworks.value[classId].unshift(res.data.data)
      return res.data.data
    } catch {
      const hw: HomeworkInfo = {
        id: uuidv4(),
        classId,
        title: data.title || '新作业',
        description: data.description || '',
        attachments: data.attachments || [],
        dueDate: data.dueDate || '',
        createTime: now(),
        completedCount: 0,
        totalCount: currentClass.value?.studentCount || 45,
        studentStats: []
      }
      if (!classHomeworks.value[classId]) classHomeworks.value[classId] = []
      classHomeworks.value[classId].unshift(hw)
      return hw
    }
  }

  /**
   * 【异步指令】updateHomework
   * 作用：修改现有班级作业
   */
  const updateHomework = async (id: string, data: Partial<HomeworkInfo>) => {
    const classId = data.classId || currentClass.value?.id || 'c1'
    try {
      const res = await apiUpdateClassHomework(id, data)
      if (classHomeworks.value[classId]) {
        const idx = classHomeworks.value[classId].findIndex(h => h.id === id)
        if (idx !== -1) classHomeworks.value[classId][idx] = { ...classHomeworks.value[classId][idx], ...res.data.data } as HomeworkInfo
      }
    } catch {
      if (classHomeworks.value[classId]) {
        const idx = classHomeworks.value[classId].findIndex(h => h.id === id)
        if (idx !== -1) classHomeworks.value[classId][idx] = { ...classHomeworks.value[classId][idx], ...data } as HomeworkInfo
      }
    }
  }

  /**
   * 【异步指令】deleteHomework
   * 作用：删除现有班级作业
   */
  const deleteHomework = async (classId: string, id: string) => {
    try {
      await apiDeleteClassHomework(id)
      if (classHomeworks.value[classId]) {
        classHomeworks.value[classId] = classHomeworks.value[classId].filter(h => h.id !== id)
      }
    } catch {
      if (classHomeworks.value[classId]) {
        classHomeworks.value[classId] = classHomeworks.value[classId].filter(h => h.id !== id)
      }
    }
  }

  /**
   * 【异步指令】updateStudentEvaluation
   * 作用：修改学生个人的作业完成评价及分数
   */
  const updateStudentEvaluation = async (classId: string, homeworkId: string, studentId: string, payload: { grade: number; evaluation: string }) => {
    try {
      await apiUpdateStudentHomeworkEvaluation(homeworkId, studentId, payload)
    } catch {
      console.warn('Update student evaluation fell back to mock due to missing API.')
    }
    const hwList = classHomeworks.value[classId]
    if (hwList) {
      const hw = hwList.find(h => h.id === homeworkId)
      if (hw) {
        const student = hw.studentStats.find(s => s.studentId === studentId)
        if (student) {
          student.grade = payload.grade
          student.evaluation = payload.evaluation
        }
      }
    }
  }

  /**
   * 【异步指令】loadGroupChats
   * 作用：拉取当前班级的所有群聊组
   */
  const loadGroupChats = async (classId: string) => {
    // 策略：缓存优先，避免重复拉取
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

  /**
   * 【异步指令】selectGroupChat
   * 作用：激活特定的会话窗口并加载历史流
   * @param chat 目标群聊元数据
   */
  const selectGroupChat = async (chat: GroupChat) => {
    chat.unreadCount = 0; // 交互策略：点击即视为已读
    activeGroupChat.value = chat
    if (chatMessages.value[chat.id]) return; 
    
    try {
      const res = await apiGetGroupMessages(chat.id)
      chatMessages.value[chat.id] = res.data.data
    } catch {
      // 提供初始群聊公告/欢迎语作为 Mock 记录
      chatMessages.value[chat.id] = [
        {
          id: 'm1',
          groupId: chat.id,
          senderId: 'teacher',
          senderName: '张老师',
          senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=t1',
          senderRole: '老师',
          senderLevel: 20,
          content: '大家好，欢迎进入此讨论空间，我是张老师。',
          createTime: now(),
          direction: 'receive',
        }
      ]
    }
  }

  /**
   * 【异步指令】sendGroupMessage
   * 作用：向 IM 服务发送新消息
   * @param groupId 目标群 ID
   * @param content 散装内容主体
   * @param type 消息类型支持
   * @param fileData 携带的文件或流对象
   */
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
      // 离线发送模拟：本地直接落库
      const newMsg: GroupMessage = {
        id: uuidv4(),
        groupId,
        senderId: 'u4',
        senderName: '我',
        senderAvatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=u4',
        senderRole: '教研员',
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

  /**
   * 【异步指令】loadStudentMessages
   * 作用：加载与特定学生之间的 1对1 历史记录
   */
  const loadStudentMessages = async (studentId: string) => {
    try {
      const res = await apiGetStudentMessages(studentId)
      classStudentMessages.value[studentId] = res.data.data
    } catch {
      classStudentMessages.value[studentId] = [
        { id: 'msg1', studentId, senderId: studentId, content: '老师好，我想咨询一下这次作业的难点。', isRead: true, direction: 'receive', createTime: now() },
        { id: 'msg2', studentId, senderId: 'teacher', content: '好的，稍后我会在课堂上进行专题讲解。', isRead: true, direction: 'send', createTime: now() }
      ]
    }
  }

  /**
   * 【异步指令】sendStudentMessage
   * 作用：执私聊回复逻辑
   */
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

  /**
   * 【高阶指令】findOrCreateStudentChat
   * 作用：面向 UI 的便捷接口，点击学生列表直接发起/唤回对话
   * @param classId 班级上下文
   * @param student 目标学生画像
   * 业务逻辑：
   * 1. 根据学生姓名在当前班级会话池中进行检索。
   * 2. 若命中，则激活该会话。
   * 3. 若未命中，则静默插入一个私信类型的 Mock 会话并激活。
   */
  const findOrCreateStudentChat = async (classId: string, student: StudentInfo) => {
    if (!classGroupChats.value[classId]) {
      classGroupChats.value[classId] = []
    }
    const existing = classGroupChats.value[classId].find(chat => chat.name === student.name)
    if (existing) {
      await selectGroupChat(existing)
      return existing.id
    }
    // 注入私信会话载体
    const newChat: GroupChat = {
      id: `chat_${student.id}`,
      name: student.name,
      avatar: student.avatar,
      lastMessage: '点击开始与学生进行 1对1 沟通',
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
    classHomeworks,
    classStudents,
    classSchedules,
    classGroupChats,
    chatMessages,
    currentTasks,
    currentHomeworks,
    students,
    currentSchedule,
    groupChats,
    currentGroupMessages,
    activeGroupChat,
    currentStudentMessages,
    loadClasses,
    selectClass,
    loadTasks,
    loadHomeworks,
    createClass,
    createTask,
    createHomework,
    updateHomework,
    deleteHomework,
    updateStudentEvaluation,
    loadGroupChats,
    selectGroupChat,
    sendGroupMessage,
    loadStudentMessages,
    sendStudentMessage,
    findOrCreateStudentChat
  }
})
