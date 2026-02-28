import { createRouter, createWebHistory } from 'vue-router'
import CoreLayout from '../layouts/CoreLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      component: CoreLayout,
      children: [
        {
          path: '',
          name: 'workspace',
          component: () => import('../views/WorkspaceView.vue')
        },
        {
          path: 'cocreation',
          name: 'cocreation',
          component: () => import('../views/CocreationView.vue')
        },
        {
          path: 'rag',
          name: 'rag',
          component: () => import('../views/RagView.vue')
        },
        {
          path: 'classes',
          name: 'classes',
          component: () => import('../views/ClassesView.vue')
        },
        {
          path: 'courseware',
          name: 'courseware',
          component: () => import('../views/CoursewareView.vue')
        },
        {
          path: 'design',
          name: 'design',
          component: () => import('../views/DesignCenterView.vue')
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/ProfileView.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue')
        },
        {
          path: 'messages',
          name: 'messages',
          component: () => import('../views/MessagesView.vue')
        }
      ]
    }
  ]
})

export default router
