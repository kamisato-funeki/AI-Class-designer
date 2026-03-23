/**
 * 全局类型定义文件
 *
 * 该文件集中定义了整个应用中使用的所有 TypeScript 数据类型与接口，
 * 涵盖用户、班级、课件、知识库、消息、工作台、AI 共创等核心业务实体。
 */

// ==================== 用户相关 ====================

/**
 * 用户信息
 * @property id          - 用户唯一标识
 * @property name        - 用户昵称
 * @property avatar      - 头像 URL
 * @property email       - 邮箱地址
 * @property role        - 身份角色：教师 / 学生 / 管理员
 * @property subject     - 所教学科（教师可选）
 * @property school      - 所属学校（可选）
 * @property bio         - 个人简介（可选）
 * @property joinTime    - 注册时间（可选）
 * @property generationCount - 已生成课件数量（可选）
 */
export interface User {
  id: string
  name: string
  avatar: string
  email: string
  role: 'teacher' | 'student' | 'admin'
  subject?: string
  school?: string
  bio?: string
  joinTime?: string
  generationCount?: number
}

// ==================== 班级相关 ====================

/**
 * 班级信息
 * @property id           - 班级唯一标识
 * @property name         - 班级名称
 * @property grade        - 年级
 * @property classNumber  - 班号
 * @property studentCount - 学生人数
 * @property coverImage   - 封面图片（可选）
 * @property description  - 班级描述
 * @property createTime   - 创建时间
 */
export interface ClassInfo {
  id: string
  name: string
  grade: string
  classNumber: string
  studentCount: number
  coverImage?: string
  description: string
  createTime: string
}

/**
 * 班级任务（作业/讨论/资料）
 * @property id          - 任务唯一标识
 * @property classId     - 所属班级 ID
 * @property title       - 任务标题
 * @property type        - 任务类型：作业 / 讨论 / 资料
 * @property description - 任务描述
 * @property dueDate     - 截止日期（可选）
 * @property createTime  - 创建时间
 */
export interface ClassTask {
  id: string
  classId: string
  title: string
  type: 'homework' | 'discussion' | 'material'
  description: string
  dueDate?: string
  createTime: string
}

// ==================== 课件相关 ====================

/**
 * 课件信息
 * @property id          - 课件唯一标识
 * @property title       - 课件标题
 * @property subject     - 所属学科
 * @property grade       - 适用年级
 * @property coverImage  - 封面图片 URL
 * @property tags        - 标签列表
 * @property createTime  - 创建时间
 * @property updateTime  - 最后更新时间
 * @property status      - 状态：草稿 / 已发布
 */
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

// ==================== 知识库（RAG）相关 ====================

/**
 * 知识库文件
 * @property id         - 文件唯一标识
 * @property name       - 文件名
 * @property size       - 文件大小（字节）
 * @property type       - MIME 类型
 * @property url        - 文件访问地址
 * @property tags       - 标签列表
 * @property uploadTime - 上传时间
 * @property status     - 上传状态：成功 / 未上传（可选）
 * @property rawFile    - 原始 File 对象，仅在上传前存在（可选）
 */
export interface RagFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  tags: string[]
  uploadTime: string
  status?: 'success' | 'unuploaded'
  rawFile?: File
}

// ==================== 消息相关 ====================

/**
 * 系统/用户通知消息
 * @property id           - 消息唯一标识
 * @property senderId     - 发送者 ID
 * @property senderName   - 发送者姓名
 * @property senderAvatar - 发送者头像 URL
 * @property content      - 消息内容
 * @property type         - 消息类型：系统通知 / 用户消息
 * @property isRead       - 是否已读
 * @property createTime   - 消息创建时间
 */
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

// ==================== 学生相关 ====================

/**
 * 学生详细信息
 * @property id                - 学生唯一标识
 * @property name              - 姓名
 * @property avatar            - 头像 URL
 * @property classId           - 所属班级 ID
 * @property progress          - 学习进度（百分比）
 * @property grades            - 成绩列表
 * @property activeCount       - 活跃次数
 * @property homeworkCompleted - 已完成作业数
 * @property homeworkTotal     - 作业总数
 * @property averageGrade      - 平均成绩
 * @property createTime        - 加入时间
 */
export interface StudentInfo {
  id: string
  name: string
  avatar: string
  classId: string
  progress: number
  grades: number[]
  activeCount: number
  homeworkCompleted: number
  homeworkTotal: number
  averageGrade: number
  createTime: string
}

/**
 * 师生私信消息
 * @property id         - 消息唯一标识
 * @property studentId  - 关联学生 ID
 * @property senderId   - 发送者 ID
 * @property content    - 消息内容
 * @property isRead     - 是否已读
 * @property direction  - 方向：发送 / 接收
 * @property createTime - 发送时间
 */
export interface StudentMessage {
  id: string
  studentId: string
  senderId: string
  content: string
  isRead: boolean
  direction: 'send' | 'receive'
  createTime: string
}

/**
 * 课程表条目
 * @property id      - 条目唯一标识
 * @property classId - 所属班级 ID
 * @property day     - 星期几
 * @property timeStr - 上课时间段字符串
 * @property subject - 课程学科
 * @property teacher - 授课教师
 */
export interface CourseScheduleItem {
  id: string
  classId: string
  day: string
  timeStr: string
  subject: string
  teacher: string
}

// ==================== AI 共创对话相关 ====================

/**
 * AI 对话消息
 * @property id          - 消息唯一标识
 * @property role        - 发送角色：用户 / AI 助手
 * @property content     - 消息文本内容
 * @property type        - 消息类型：文字 / 语音 / 文件
 * @property fileUrl     - 附件 URL（可选）
 * @property fileName    - 附件文件名（可选）
 * @property time        - 发送时间
 * @property suggestions - AI 推荐的后续提问（可选）
 */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'voice' | 'file'
  fileUrl?: string
  fileName?: string
  time: string
  suggestions?: string[]
}

/**
 * 共创看板素材
 * @property id   - 素材唯一标识
 * @property type - 素材类型：Word / PPT / PDF / 思维导图 / 视频 / HTML
 * @property name - 素材名称
 * @property url  - 素材访问地址
 */
export interface BoardMaterial {
  id: string
  type: 'word' | 'ppt' | 'pdf' | 'mindmap' | 'video' | 'html'
  name: string
  url: string
}

// ==================== 工作台相关 ====================

/**
 * 工作台统计数据
 * @property courseCount    - 课件总数
 * @property classCount     - 班级总数
 * @property studentCount   - 学生总数
 * @property messageUnread  - 未读消息数
 */
export interface WorkspaceStats {
  courseCount: number
  classCount: number
  studentCount: number
  messageUnread: number
}

// ==================== 群聊相关 ====================

/**
 * 群聊会话
 * @property id              - 群聊唯一标识
 * @property name            - 群名称
 * @property avatar          - 群头像 URL
 * @property lastMessage     - 最新消息预览（可选）
 * @property lastSender      - 最新消息发送者（可选）
 * @property lastMessageTime - 最新消息时间（可选）
 * @property unreadCount     - 未读消息数
 * @property memberCount     - 成员数量
 */
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

/**
 * 群聊消息
 * @property id          - 消息唯一标识
 * @property groupId     - 所属群聊 ID
 * @property senderId    - 发送者 ID
 * @property senderName  - 发送者昵称
 * @property senderAvatar- 发送者头像 URL
 * @property senderRole  - 发送者角色（可选）
 * @property senderLevel - 发送者等级（可选）
 * @property content     - 消息内容
 * @property createTime  - 发送时间
 * @property direction   - 方向：发送 / 接收
 */
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

// ==================== 资讯相关 ====================

/**
 * 教育新闻条目
 * @property id           - 新闻唯一标识
 * @property title        - 新闻标题
 * @property source       - 来源媒体
 * @property commentCount - 评论数量
 * @property time         - 发布时间描述（如"3小时前"）
 * @property images       - 配图 URL 列表
 */
export interface EducationNews {
  id: string
  title: string
  source: string
  commentCount: number
  time: string
  images: string[]
}

// ==================== AI 共创课件数据（Store 状态） ====================

/**
 * 课件 AI 共创完整状态
 * @property coursewareId      - 关联课件 ID
 * @property materials         - 看板素材列表
 * @property chatHistory       - 对话历史记录
 * @property isGenerating      - 是否正在 AI 生成中
 * @property materialGenerated - 是否已完成素材生成
 * @property generateOptions   - 待生成的选项列表
 * @property generatedOptions  - 已生成的选项列表
 * @property hideSummary       - 是否折叠摘要面板
 * @property mindmapData       - 思维导图数据（可选）
 */
export interface CourseCocreationData {
  coursewareId: string
  materials: BoardMaterial[]
  chatHistory: ChatMessage[]
  isGenerating: boolean
  materialGenerated: boolean
  generateOptions: string[]
  generatedOptions: string[]
  hideSummary: boolean
  mindmapData?: object
}
