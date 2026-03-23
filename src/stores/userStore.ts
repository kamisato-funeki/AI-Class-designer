/**
 * 用户认证与个人信息 Store（Pinia）
 *
 * 业务逻辑说明：
 * 管理当前登录用户的所有状态和操作，包括：
 * 1. 用户信息（user）：身份、资料等，初始化为模拟数据（张老师）
 * 2. 登录 Token（token）：应用内鉴权凭证
 * 3. 所有操作均采用"尝试调用 API → 失败时使用模拟数据"的降级策略，
 *    保证在后端未接入时前端功能仍可正常运行
 *
 * 包含的操作：
 * - login：账号密码登录
 * - register：用户注册
 * - logout：退出登录（无论 API 是否成功，都会清空本地状态）
 * - updateProfile：更新个人资料
 * - updatePassword：修改密码
 * - updateAvatar：更新头像（将新头像 URL 同步至 user.avatar）
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User } from '../types/types'
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiUpdateProfile,
  apiUpdatePassword,
  apiUpdateAvatar,
} from '../api/user'
import { v4 as uuidv4 } from 'uuid'

/** 模拟默认用户数据（张老师） */
const DEFAULT_USER: User = {
  id: 'u1',
  name: '张老师',
  avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=1',
  email: 'teacher@example.com',
  role: 'teacher',
  subject: 'math',
  school: '第一实验中学',
  bio: '致力于将数学与生活实际相结合，让学生在快乐中学习数学。',
  joinTime: '2023-09-01',
  generationCount: 128,
}

/**
 * 教师账户认证与个人画像管理 Store (useUserStore)
 * 业务职责：
 * 1. 鉴权生命周期管理：执行登录（Login）、注册（Register）及登出（Logout）逻辑，维护敏感的 Token 凭证。
 * 2. 身份画像维护：存储并同步教师的姓名、教研科目、所属学校及个人简介等维度信息。
 * 3. 业务资产同步：管控用户等级或课件生成频次（generationCount）等统计数据。
 * 4. 弹性降级机制：针对认证接口提供完整的 Mock 兜底，确保在离线演示环境下账号体系依然可用。
 */
export const useUserStore = defineStore('user', () => {
  // --- 响应式核心状态 (Primary State) ---
  /**
   * 登录主体对象
   * 默认注入“张老师” Mock 身份，便于开发阶段快速介入业务流程。
   */
  const user = ref<User | null>({ ...DEFAULT_USER })

  /** 鉴权安全令牌（用于所有 API 请求的身份校验） */
  const token = ref<string>(uuidv4())

  // ==================== 身份认证指令 (Auth Actions) ====================

  /**
   * 【异步指令】login
   * 作用：建立认证会话
   * @param u 账号/手机号
   * @param p 凭据/密码
   * 逻辑：请求 API 换取真实身份，失败时回退至本地 DEFAULT_USER 模式。
   */
  const login = async (u: string, p: string) => {
    try {
      const res = await apiLogin(u, p)
      user.value = res.data.data.user
      token.value = res.data.data.token
    } catch {
      // 离线教学模式：注入默认模拟身份
      user.value = { ...DEFAULT_USER }
      token.value = uuidv4()
    }
  }

  /**
   * 【异步指令】register
   * 作用：新教师账号入库
   * @param data 注册表单细节
   */
  const register = async (data: Record<string, string>) => {
    try {
      const res = await apiRegister(data)
      user.value = res.data.data.user
      token.value = res.data.data.token
    } catch {
      // 容错：本地快速创建匿名教师身份
      user.value = {
        id: `u_${Date.now()}`,
        name: data.username || data.phone || 'AI 设计师教师',
        avatar: 'https://api.dicebear.com/7.x/miniavs/svg?seed=new_teacher',
        email: 'teacher_mock@example.com',
        role: 'teacher',
        subject: 'educational_tech',
        school: '未关联学校',
        bio: '暂无教师简介，点击编辑进行完善。',
        joinTime: new Date().toISOString().split('T')[0],
        generationCount: 0,
      }
      token.value = uuidv4()
    }
  }

  /**
   * 【异步指令】logout
   * 作用：销毁本地会话安全上下文
   * 策略：无论云端由于何种网络原因失败，都必须强制清除本地缓存，保障账户安全隐私。
   */
  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      console.warn('云端登出步失败，执行本地强制退出逻辑')
    } finally {
      user.value = null
      token.value = ''
    }
  }

  // ==================== 画像微调指令 (Profile Actions) ====================

  /**
   * 【异步指令】updateProfile
   * 作用：实时更新个人教研资料
   */
  const updateProfile = async (data: Partial<User>) => {
    try {
      const res = await apiUpdateProfile(data)
      user.value = res.data.data
    } catch {
      // 乐观更新：本地先行生效，确保 UI 反馈无延迟
      if (user.value) {
        user.value = { ...user.value, ...data }
      }
    }
  }

  /**
   * 【异步指令】updatePassword
   * 作用：更迭认证凭核
   */
  const updatePassword = async (password: string) => {
    try {
      await apiUpdatePassword(password)
    } catch (e) {
      console.error('密码修改同步错误:', e)
    }
  }

  /**
   * 【异步指令】updateAvatar
   * 作用：多媒体画像更新
   * @param dataUrl 裁剪后的 Base64 图像流
   * 业务逻辑：上传并获取云端存证 URL，异常时降级使用 DataURL 维持本地视觉展示。
   */
  const updateAvatar = async (dataUrl: string) => {
    try {
      const res = await apiUpdateAvatar(dataUrl)
      if (user.value) {
        user.value.avatar = res.data.data
      }
    } catch {
      if (user.value) {
        user.value.avatar = dataUrl
      }
    }
  }

  return { user, token, login, register, logout, updateProfile, updatePassword, updateAvatar }
})
