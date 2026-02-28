<template>
  <a-layout style="height: 100vh" >
    <!-- Sidebar -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      theme="light"
      :style="{ borderRight: '1px solid var(--color-border-light)', position: '' }">
      <div class="logo-container">
        <div class="logo-icon">ACD</div>
        <span v-if="!collapsed" class="logo-text">Class Designer</span>
      </div>

      <!-- Core Modules -->
      <div class="menu-container">
        <a-button v-if="!collapsed"
          type="primary"
          class="new-course-btn"
          @click="handleNewCourse">
          <template #icon>
            <PlusOutlined />
          </template>
          开启新课
        </a-button>
        <a-button v-else type="primary" shape="circle" class="new-course-btn-collapsed" @click="handleNewCourse">
          <template #icon>
            <PlusOutlined />
          </template>
        </a-button>

        <a-menu v-model:selectedKeys="selectedKeys" theme="light" mode="inline" style="border-right: none"
          @click="handleMenuClick">
          <a-menu-item key="workspace">
            <template #icon>
              <HomeOutlined />
            </template>
            工作台首页
          </a-menu-item>
          <a-menu-item key="classes">
            <template #icon>
              <TeamOutlined />
            </template>
            我的班级
          </a-menu-item>
          <a-menu-item key="rag">
            <template #icon>
              <DatabaseOutlined />
            </template>
            AI专属知识库
          </a-menu-item>
          <a-sub-menu key="courseware">
            <template #icon>
              <FolderOpenOutlined />
            </template>
            <template #title>我的课件</template>
            <a-menu-item key="course1">数学公开课</a-menu-item>
            <a-menu-item key="course2">语文阅读课</a-menu-item>
            <a-menu-item key="course3">英语听说课</a-menu-item>
            <a-menu-item key="course_all">全部课件...</a-menu-item>
          </a-sub-menu>
          <a-menu-item key="design-center">
            <template #icon>
              <AppstoreOutlined />
            </template>
            课程设计中心
          </a-menu-item>
        </a-menu>
      </div>

      <!-- Bottom Modules -->
      <div class="bottom-menu">
        <a-menu theme="light" mode="inline" style="border-right: none" @click="handleMenuClick">
          <a-menu-item key="profile">
            <template #icon>
              <UserOutlined />
            </template>
            个人中心
          </a-menu-item>
          <a-menu-item key="settings">
            <template #icon>
              <SettingOutlined />
            </template>
            设置
          </a-menu-item>
          <a-menu-item key="messages">
            <template #icon>
              <a-badge dot>
                <BellOutlined />
              </a-badge>
            </template>
            消息列表
          </a-menu-item>
        </a-menu>
      </div>
    </a-layout-sider>

    <!-- Main Content -->
    <a-layout>
      <a-layout-header
        style="background: var(--color-background-light); padding: 0 24px; display: flex; align-items: center; border-bottom: 1px solid var(--color-border-light);">
        <menu-unfold-outlined v-if="collapsed" class="trigger" @click="() => (collapsed = !collapsed)" />
        <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
        <div style="flex: 1"></div>
        <!-- Right side header items like user avatar can go here -->
      </a-layout-header>
      <a-layout-content :style="{
        margin: '24px 16px',
        padding: '24px',
        background: 'var(--color-panel-light)',
        minHeight: '280px',
        borderRadius: '12px',
        overflow: 'auto'
      }">
        <router-view />
      </a-layout-content>
    </a-layout>

    <a-modal v-model:open="newCourseModalVisible" title="新建课件" @ok="createNewCourse">
      <p>选择科目...</p>
      <!-- Form to select subject goes here -->
    </a-modal>
  </a-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  HomeOutlined,
  TeamOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  AppstoreOutlined,
  UserOutlined,
  SettingOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  PlusOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['workspace']);
const newCourseModalVisible = ref<boolean>(false);

const handleMenuClick = (info: { key: string }) => {
  if (info.key === 'workspace') router.push('/');
  if (info.key === 'rag') router.push('/rag');
  if (info.key === 'classes') router.push('/classes');
  if (info.key === 'design-center') router.push('/design');
  if (info.key === 'course_all') router.push('/courseware');
  if (info.key === 'settings') router.push('/settings');
  if (info.key === 'profile') router.push('/profile');
  if (info.key === 'messages') router.push('/messages');
  if (info.key.startsWith('course') && info.key !== 'course_all') {
    router.push('/cocreation'); // jump to workspace for specific course
  }
};

const handleNewCourse = () => {
  newCourseModalVisible.value = true;
};

const createNewCourse = () => {
  newCourseModalVisible.value = false;
  router.push('/cocreation');
};
</script>

<style scoped>
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
  overflow: hidden;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
  flex-shrink: 0;
}

.logo-text {
  margin-left: 12px;
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text-main-light);
  white-space: nowrap;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: var(--color-primary);
}

.menu-container {
  padding: 16px 0;
  height: calc(100vh - 64px - 160px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.new-course-btn {
  margin: 0 16px 16px 16px;
  border-radius: var(--border-radius);
}

.new-course-btn-collapsed {
  margin: 0 auto 16px auto;
  display: block;
}

.bottom-menu {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding-bottom: 16px;
}

/* Ant design menu override */
:deep(.ant-menu-item-selected) {
  background-color: var(--color-primary) !important;
  color: white !important;
}

:deep(.ant-menu-item-selected .anticon) {
  color: white !important;
}
</style>
