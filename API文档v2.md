# API 接口文档 v2

本文档根据 `src/api` 下的各个模块接口及对应的数据类型自动生成。相比 v1 版本，本项目标注了新增和改动的内容。

## 一、基础配置 [原有]

### 1. 通用响应结构 (`CommonResponse<T>`)
所有接口返回的数据都会被包裹在统一的响应结构中：

```typescript
interface CommonResponse<T> {
  code: number;      // 状态码，200 表示成功 (CommonCode.SUCCESS)
  message: string;   // 响应提示信息
  data: T;           // 具体的响应数据
}
```

---

## 二、功能模块 API

### 用户模块 (User) [原有]

#### 1. 登录
- **函数名**: `apiLogin`
- **请求方法**: `POST`
- **请求路径**: `/auth/login`
- **请求体 (Body)**:
  ```typescript
  {
    username: string;
    password: string;
  }
  ```
- **响应数据 `data`**: `{ token: string; user: User }`

#### 2. 注册
- **函数名**: `apiRegister`
- **请求方法**: `POST`
- **请求路径**: `/auth/register`
- **请求体 (Body)**: `Record<string, string>`
- **响应数据 `data`**: `{ token: string; user: User }`

#### 3. 登出
- **函数名**: `apiLogout`
- **请求方法**: `POST`
- **请求路径**: `/auth/logout`
- **响应数据 `data`**: `null`

#### 4. 更新用户信息
- **函数名**: `apiUpdateProfile`
- **请求方法**: `PUT`
- **请求路径**: `/user/profile`
- **请求体 (Body)**: `Partial<User>`
- **响应数据 `data`**: `User`

#### 5. 修改密码
- **函数名**: `apiUpdatePassword`
- **请求方法**: `Promise.resolve` (模拟)
- **请求路径**: `/auth/password` (预留)
- **请求体 (Body)**: `{ password: string }`
- **响应数据 `data`**: `null`

#### 6. 更新头像
- **函数名**: `apiUpdateAvatar`
- **请求方法**: `Promise.resolve` (模拟)
- **请求路径**: `/user/avatar` (预留)
- **请求体 (Body)**: `{ avatarDataUrl: string }`
- **响应数据 `data`**: `string` (头像 URL/Base64)

---

### 班级模块 (Class)

#### 1. 获取班级列表 [原有]
- **函数名**: `apiGetClasses`
- **请求方法**: `GET`
- **请求路径**: `/classes`
- **响应数据 `data`**: `ClassInfo[]`

#### 2. 创建班级 [原有]
- **函数名**: `apiCreateClass`
- **请求方法**: `POST`
- **请求路径**: `/classes`
- **请求体 (Body)**: `Partial<ClassInfo>`
- **响应数据 `data`**: `ClassInfo`

#### 3. 获取班级任务 [原有]
- **函数名**: `apiGetClassTasks`
- **请求方法**: `GET`
- **请求路径**: `/classes/{classId}/tasks`
- **响应数据 `data`**: `ClassTask[]`

#### 4. 创建班级任务 [原有]
- **函数名**: `apiCreateClassTask`
- **请求方法**: `POST`
- **请求路径**: `/classes/{classId}/tasks`
- **请求体 (Body)**: `Partial<ClassTask>`
- **响应数据 `data`**: `ClassTask`

#### 5. 获取班级作业列表 [新增]
- **函数名**: `apiGetClassHomeworks`
- **请求方法**: `GET`
- **请求路径**: `/classes/{classId}/homeworks`
- **响应数据 `data`**: `HomeworkInfo[]`

#### 6. 发布班级作业 [新增]
- **函数名**: `apiCreateClassHomework`
- **请求方法**: `POST`
- **请求路径**: `/classes/{classId}/homeworks`
- **请求体 (Body)**: `Partial<HomeworkInfo>`
- **响应数据 `data`**: `HomeworkInfo`

#### 7. 更新班级作业 [新增]
- **函数名**: `apiUpdateClassHomework`
- **请求方法**: `PUT`
- **请求路径**: `/homeworks/{id}`
- **请求体 (Body)**: `Partial<HomeworkInfo>`
- **响应数据 `data`**: `HomeworkInfo`

#### 8. 删除班级作业 [新增]
- **函数名**: `apiDeleteClassHomework`
- **请求方法**: `DELETE`
- **请求路径**: `/homeworks/{id}`
- **响应数据 `data`**: `void`

#### 9. 下载作业附件 [新增]
- **函数名**: `apiDownloadHomeworkAttachment`
- **请求方法**: `GET`
- **请求路径**: `{url}`
- **参数**: `name?: string`
- **响应**: `Promise<Blob>`

#### 10. 获取学生作业提交详情 [新增]
- **函数名**: `apiGetStudentHomeworkDetail`
- **请求方法**: `GET`
- **请求路径**: `/homeworks/{homeworkId}/students/{studentId}`
- **响应数据 `data`**: `unknown` (具体视业务而定)

#### 11. 更新学生作业评分和评语 [新增]
- **函数名**: `apiUpdateStudentHomeworkEvaluation`
- **请求方法**: `PUT`
- **请求路径**: `/homeworks/{homeworkId}/students/{studentId}/evaluation`
- **请求体 (Body)**: `{ grade: number; evaluation: string }`
- **响应数据 `data`**: `unknown`

#### 12. 获取班级学生列表 [原有]
- **函数名**: `apiGetClassStudents`
- **请求方法**: `GET`
- **请求路径**: `/classes/{classId}/students`
- **响应数据 `data`**: `StudentInfo[]`

#### 13. 获取班级课表 [原有]
- **函数名**: `apiGetClassSchedule`
- **请求方法**: `GET`
- **请求路径**: `/classes/{classId}/schedule`
- **响应数据 `data`**: `CourseScheduleItem[]`

#### 14. 获取学生留言 [原有]
- **函数名**: `apiGetStudentMessages`
- **请求方法**: `GET`
- **请求路径**: `/students/{studentId}/messages`
- **响应数据 `data`**: `StudentMessage[]`

#### 15. 发送学生留言 [原有]
- **函数名**: `apiSendStudentMessage`
- **请求方法**: `POST`
- **请求路径**: `/students/{studentId}/messages`
- **请求体 (Body)**: `{ content: string }`
- **响应数据 `data`**: `StudentMessage`

#### 16. 获取群聊列表 [原有]
- **函数名**: `apiGetGroupChats`
- **请求方法**: `GET`
- **请求路径**: `/group-chats`
- **响应数据 `data`**: `GroupChat[]`

#### 17. 获取群聊消息 [原有]
- **函数名**: `apiGetGroupMessages`
- **请求方法**: `GET`
- **请求路径**: `/group-chats/{groupId}/messages`
- **响应数据 `data`**: `GroupMessage[]`

#### 18. 发送群聊消息 [原有]
- **函数名**: `apiSendGroupMessage`
- **请求方法**: `POST`
- **请求路径**: `/group-chats/{groupId}/messages`
- **请求体 (Body)**: `{ content: string; type: 'text' | 'image' | 'file'; fileData?: unknown }`
- **响应数据 `data`**: `GroupMessage`

---

### 课件模块 (Courseware) [原有]

#### 1. 获取课件列表
- **函数名**: `apiGetCoursewares`
- **请求方法**: `GET`
- **请求路径**: `/courseware`
- **响应数据 `data`**: `Courseware[]`

#### 2. 创建课件
- **函数名**: `apiCreateCourseware`
- **请求方法**: `POST`
- **请求路径**: `/courseware`
- **请求体 (Body)**: `Partial<Courseware>`
- **响应数据 `data`**: `Courseware`

#### 3. 更新课件
- **函数名**: `apiUpdateCourseware`
- **请求方法**: `PUT`
- **请求路径**: `/courseware/{id}`
- **请求体 (Body)**: `Partial<Courseware>`
- **响应数据 `data`**: `Courseware`

#### 4. 删除课件
- **函数名**: `apiDeleteCourseware`
- **请求方法**: `DELETE`
- **请求路径**: `/courseware/{id}`
- **响应数据 `data`**: `unknown`

---

### 共创模块 (Cocreation) [原有]

#### 1. 获取共创素材
- **函数名**: `apiGetCocreationMaterials`
- **请求方法**: `GET`
- **请求路径**: `/cocreation/{coursewareId}/materials`
- **响应数据 `data`**: `BoardMaterial[]`

#### 2. 共创沟通对话
- **函数名**: `apiCocreationChat`
- **请求方法**: `POST`
- **请求路径**: `/cocreation/chat`
- **请求体 (FormData)**:
  - `message`: string (文字内容)
  - `isVoice`: boolean (String) (是否为语音输入)
  - `file`: File (可选附件)
- **响应数据 `data`**: `ChatMessage`

---

### 消息模块 (Message) [原有]

#### 1. 获取通知消息列表
- **函数名**: `apiGetMessages`
- **请求方法**: `GET`
- **请求路径**: `/messages`
- **响应数据 `data`**: `Message[]`

#### 2. 将消息标记为已读
- **函数名**: `apiMarkMessageAsRead`
- **请求方法**: `PUT`
- **请求路径**: `/messages/{id}/read`
- **响应数据 `data`**: `null`

#### 3. 删除消息
- **函数名**: `apiDeleteMessage`
- **请求方法**: `DELETE`
- **请求路径**: `/messages/{id}`
- **响应数据 `data`**: `null`

---

### RAG 知识库模块 (RAG) [原有]

#### 1. 获取 RAG 文件列表
- **函数名**: `apiGetRagFiles`
- **请求方法**: `GET`
- **请求路径**: `/rag/files`
- **响应数据 `data`**: `RagFile[]`

#### 2. 上传 RAG 文件
- **函数名**: `apiUploadRagFile`
- **请求方法**: `POST`
- **请求路径**: `/rag/files`
- **请求体 (FormData)**:
  - `file`: File
- **响应数据 `data`**: `RagFile`

#### 3. 删除 RAG 文件
- **函数名**: `apiDeleteRagFile`
- **请求方法**: `DELETE`
- **请求路径**: `/rag/files/{id}`
- **响应数据 `data`**: `null`

#### 4. 更新 RAG 文件标签
- **函数名**: `apiUpdateRagFileTags`
- **请求方法**: `PUT`
- **请求路径**: `/rag/files/{id}/tags`
- **请求体 (Body)**: `{ tags: string[] }`
- **响应数据 `data`**: `RagFile`

---

### 工作空间模块 (Workspace)

#### 1. 获取空间统计信息 [原有]
- **函数名**: `apiGetWorkspaceStats`
- **请求方法**: `GET`
- **请求路径**: `/workspace/stats`
- **响应数据 `data`**: `WorkspaceStats`

#### 2. 上传语音 [原有]
- **函数名**: `apiUploadVoice`
- **请求方法**: `POST`
- **请求路径**: `/workspace/voice`
- **请求体 (FormData)**:
  - `file`: File
- **响应数据 `data`**: `{ text: string }`

#### 3. 获取教育新闻列表 [改动]
- **函数名**: `apiGetEducationNews`
- **请求方法**: `GET` (模拟网络延迟 500ms)
- **参数**: `page: number`, `size: number`
- **响应数据 `data`**: `{ total: number; list: EducationNews[] }`

---

## 三、数据类型定义 (Types)

### 核心业务实体

#### 1. User [原有]
```typescript
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
```

#### 2. ClassInfo [原有]
```typescript
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
```

#### 3. ClassTask [原有]
```typescript
export interface ClassTask {
  id: string
  classId: string
  title: string
  type: 'homework' | 'discussion' | 'material'
  description: string
  dueDate?: string
  createTime: string
}
```

#### 4. HomeworkInfo [新增]
```typescript
export interface HomeworkInfo {
  id: string
  classId: string
  title: string
  description: string
  attachments: { name: string; url: string }[]
  dueDate: string
  createTime: string
  completedCount: number
  totalCount: number
  studentStats: {
    studentId: string
    name: string
    grade: number
    avatar: string
    submittedContent?: string
    attachments?: { name: string; url: string }[]
    evaluation?: string
  }[]
}
```

#### 5. Courseware [原有]
```typescript
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
```

#### 6. RagFile [原有]
```typescript
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
```

#### 7. Message [原有]
```typescript
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
```

#### 8. StudentInfo [原有]
```typescript
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
```

#### 9. StudentMessage [原有]
```typescript
export interface StudentMessage {
  id: string
  studentId: string
  senderId: string
  content: string
  isRead: boolean
  direction: 'send' | 'receive'
  createTime: string
}
```

#### 10. CourseScheduleItem [改动]
```typescript
export interface CourseScheduleItem {
  id: string
  classId: string
  day: string
  timeStr: string
  subject: string
  teacher: string
  room?: string         // [新增] 教室
  dayOfWeek?: number    // [新增] 星期几（1-7）
  period?: number       // [新增] 开始节次
  length?: number       // [新增] 持续节次数
}
```

#### 11. ChatMessage [改动]
```typescript
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'voice' | 'file'
  fileUrl?: string
  fileName?: string
  time: string
  suggestions?: string[] // [新增] AI 推荐问题
}
```

#### 12. BoardMaterial [原有]
```typescript
export interface BoardMaterial {
  id: string
  type: 'word' | 'ppt' | 'pdf' | 'mindmap' | 'video' | 'html'
  name: string
  url: string
}
```

#### 13. WorkspaceStats [原有]
```typescript
export interface WorkspaceStats {
  courseCount: number
  classCount: number
  studentCount: number
  messageUnread: number
}
```

#### 14. GroupChat [原有]
```typescript
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
```

#### 15. GroupMessage [原有]
```typescript
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
```

#### 16. EducationNews [原有]
```typescript
export interface EducationNews {
  id: string
  title: string
  source: string
  commentCount: number
  time: string
  images: string[]
}
```

#### 17. CourseCocreationData [新增]
```typescript
/** Store 状态类型，非接口直接返回 */
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
```
