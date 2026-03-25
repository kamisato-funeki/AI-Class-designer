/**
 * 路由配置文件
 *
 * 业务逻辑说明：
 * 该应用采用 history 模式路由，整体分为两个层级：
 *
 * 1. 独立页面（无需登录布局）：
 *    - /login：登录/注册页面
 *
 * 2. 主布局（CoreLayout）下的子页面（需登录后访问）：
 *    - /            → 工作台（首页）
 *    - /cocreation  → AI 共创页（必须携带 ?id=课件ID 参数，否则重定向至首页）
 *    - /rag         → 知识库管理页
 *    - /classes     → 班级管理页（包含学生、课表、动态、聊天四个子路由）
 *    - /courseware  → 课件管理页
 *    - /design      → 设计中心页
 *    - /profile     → 个人主页
 *    - /settings    → 系统设置页
 *    - /messages    → 消息中心页
 *
 * 路由守卫：
 * - cocreation 路由在进入前校验 query.id 是否存在，
 *   防止在无课件上下文时进入 AI 共创页面。
 */

import { createRouter, createWebHistory } from 'vue-router'
import CoreLayout from '../layouts/CoreLayout.vue'

const router = createRouter({
  // 使用 HTML5 History 模式，基础路径由环境变量决定
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ==================== 独立页面 ====================
    {
      path: '/login',
      name: 'login',
      // 登录/注册页：懒加载
      component: () => import('../views/LoginView.vue'),
    },

    // ==================== 主布局下的子页面 ====================
    {
      path: '/',
      component: CoreLayout, // 主布局容器（包含侧边栏和顶栏）
      children: [
        {
          path: '',
          name: 'workspace',
          // 工作台首页：展示统计数据、动态、教育资讯等
          component: () => import('../views/WorkspaceView.vue'),
        },
        {
          path: 'cocreation',
          name: 'cocreation',
          // AI 共创页：与 AI 协同生成课件内容
          component: () => import('../views/CocreationView.vue'),
          // 路由守卫：必须携带课件 ID 才允许进入
          beforeEnter: (to, from, next) => {
            if (!to.query.id) {
              // 缺少课件 ID，重定向回工作台
              next('/')
            } else {
              next()
            }
          },
        },
        {
          path: 'rag',
          name: 'rag',
          // 知识库（RAG）管理页：上传、管理知识文件
          component: () => import('../views/RagView.vue'),
        },
        {
          path: 'classes',
          name: 'classes',
          // 班级管理页：查看和管理所有班级
          component: () => import('../views/ClassesView.vue'),
          children: [
            {
              // 班级学生列表
              path: ':classId/students',
              name: 'class-students',
              component: () => import('../views/classesComp/ClassStudents.vue'),
            },
            {
              // 班级课程表
              path: ':classId/schedule',
              name: 'class-schedule',
              component: () => import('../views/classesComp/ClassSchedule.vue'),
            },
            {
              // 班级作业
              path: ':classId/homework',
              name: 'class-homework',
              component: () => import('../views/classesComp/ClassHomework.vue'),
            },
            {
              // 班级动态
              path: ':classId/dynamics',
              name: 'class-dynamics',
              component: () => import('../views/classesComp/ClassDynamics.vue'),
            },
            {
              // 班级群聊
              path: ':classId/chats',
              name: 'class-chats',
              component: () => import('../views/classesComp/ClassChats.vue'),
            },
          ],
        },
        {
          path: 'courseware',
          name: 'courseware',
          // 课件管理页：浏览、创建、编辑课件
          component: () => import('../views/CoursewareView.vue'),
        },
        {
          path: 'design',
          name: 'design',
          // 设计中心页
          component: () => import('../views/DesignCenterView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          // 个人主页：查看和编辑个人信息
          component: () => import('../views/ProfileView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          // 系统设置页：主题、语言等偏好设置
          component: () => import('../views/SettingsView.vue'),
        },
        {
          path: 'messages',
          name: 'messages',
          // 消息中心页：查看系统消息和用户消息
          component: () => import('../views/MessagesView.vue'),
        },
      ],
    },
  ],
})

export default router
