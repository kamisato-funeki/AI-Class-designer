<template>
  <a-layout style="height: 100vh; position: relative;">
    <!-- Mobile Overlay -->
    <div v-if="isMobile && !collapsed" class="mobile-overlay" @click="collapsed = true"></div>

    <!-- Sidebar -->
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :collapsed-width="isMobile ? 0 : 80"
      theme="light" :class="{ 'mobile-sider': isMobile }"
      :style="{ borderRight: '1px solid var(--app-border)', zIndex: 10 }">
      <div class="logo-container">
        <div class="logo-icon">ACD</div>
        <span v-if="!collapsed" class="logo-text">Class Designer</span>
      </div>

      <!-- Core Modules -->
      <div class="menu-container">
        <a-button v-if="!collapsed" type="primary" class="new-course-btn" @click="handleNewCourse">
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
          <a-menu-item key="courseware">
            <template #icon>
              <FolderOpenOutlined />
            </template>
            我的课件
          </a-menu-item>
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
        <a-menu v-model:selectedKeys="selectedKeys" theme="light" mode="inline" style="border-right: none" @click="handleMenuClick">
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
        :style="{ background: 'var(--app-bg)', padding: isMobile ? '0 16px' : '0 24px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--app-border)' }">
        <menu-unfold-outlined v-if="collapsed" class="trigger" @click="() => (collapsed = !collapsed)" />
        <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />

        <a-tooltip :title="settingsStore.theme === 'dark' ? '点击切换明亮模式' : '点击切换黑暗模式'" placement="bottom">
          <div class="header-action-btn"
            @click="settingsStore.toggleTheme(settingsStore.theme === 'dark' ? 'light' : 'dark')">
            <BulbOutlined />
          </div>
        </a-tooltip>

        <div style="flex: 1"></div>
        <!-- Right side header items like user avatar can go here -->
        <div class="header-actions">
          <a-dropdown placement="bottomRight">
            <div class="user-avatar-trigger" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
              <a-avatar :src="userStore.user?.avatar" :size="32">
                <template #icon>
                  <UserOutlined />
                </template>
              </a-avatar>
              <span v-if="!isMobile" style="font-weight: 500;">{{ userStore.user?.name || '用户' }}</span>
            </div>
            <template #overlay>
              <a-menu @click="handleDropdownClick">
                <a-menu-item key="profile">
                  <UserOutlined /> 个人中心
                </a-menu-item>
                <a-menu-item key="classes">
                  <TeamOutlined /> 我的班级
                </a-menu-item>
                <a-menu-item key="messages">
                  <BellOutlined /> 我的消息
                </a-menu-item>
                <a-menu-item key="settings">
                  <SettingOutlined /> 设置
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" style="color: var(--color-error)">退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <a-layout-content :style="{
        margin: isMobile ? '16px 12px' : '24px 16px',
        padding: isMobile ? '16px' : '24px',
        background: 'var(--app-panel)',
        minHeight: '280px',
        borderRadius: '12px',
        overflow: 'auto'
      }">
        <router-view />
      </a-layout-content>
    </a-layout>

    <a-modal v-model:open="newCourseModalVisible" title="新建课件" @ok="createNewCourse" @cancel="closeNewCourseModal"
      :confirmLoading="creatingCourse">
      <a-form layout="vertical" :model="formState">
        <a-form-item label="课件名称" required>
          <a-input v-model:value="formState.title" placeholder="请输入课件名称" />
        </a-form-item>
        <a-form-item label="适用科目" required>
          <a-select v-model:value="formState.subject" placeholder="请选择科目">
            <a-select-option value="语文">语文</a-select-option>
            <a-select-option value="数学">数学</a-select-option>
            <a-select-option value="英语">英语</a-select-option>
            <a-select-option value="综合">综合</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="适用年级" required>
          <a-select v-model:value="formState.grade" placeholder="请选择年级">
            <a-select-option value="一年级">一年级</a-select-option>
            <a-select-option value="二年级">二年级</a-select-option>
            <a-select-option value="三年级">三年级</a-select-option>
            <a-select-option value="四年级">四年级</a-select-option>
            <a-select-option value="五年级">五年级</a-select-option>
            <a-select-option value="六年级">六年级</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
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
  PlusOutlined,
  BulbOutlined
} from '@ant-design/icons-vue';
import { useUserStore } from '../stores/userStore';
import { useCoursewareStore } from '../stores/coursewareStore';
import { useSettingsStore } from '../stores/settingsStore';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const coursewareStore = useCoursewareStore();
const settingsStore = useSettingsStore();
const collapsed = ref<boolean>(false);
const selectedKeys = ref<string[]>(['workspace']);
const newCourseModalVisible = ref<boolean>(false);
const creatingCourse = ref<boolean>(false);
const isMobile = ref<boolean>(false);

watch(() => route.path, (newPath) => {
  if (newPath === '/') selectedKeys.value = ['workspace'];
  else if (newPath.startsWith('/classes')) selectedKeys.value = ['classes'];
  else if (newPath.startsWith('/rag')) selectedKeys.value = ['rag'];
  else if (newPath.startsWith('/courseware')) selectedKeys.value = ['courseware'];
  else if (newPath.startsWith('/design') || newPath.startsWith('/cocreation')) selectedKeys.value = ['design-center'];
  else if (newPath.startsWith('/settings')) selectedKeys.value = ['settings'];
  else if (newPath.startsWith('/profile')) selectedKeys.value = ['profile'];
  else if (newPath.startsWith('/messages')) selectedKeys.value = ['messages'];
}, { immediate: true });

const formState = ref({
  title: '',
  subject: undefined,
  grade: undefined
});

const checkMobile = () => {
  const currentIsMobile = window.innerWidth <= 768;
  if (isMobile.value !== currentIsMobile) {
    isMobile.value = currentIsMobile;
    collapsed.value = currentIsMobile;
  }
};

onMounted(async () => {
  checkMobile();
  window.addEventListener('resize', checkMobile);

  // Auto login mock for testing
  if (!userStore.user) {
    try {
      await userStore.login('admin', 'admin');
    } catch {
      // ignore
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const handleMenuClick = (info: { key: string }) => {
  if (info.key === 'workspace') router.push('/');
  if (info.key === 'rag') router.push('/rag');
  if (info.key === 'classes') router.push('/classes');
  if (info.key === 'design-center') router.push('/design');
  if (info.key === 'courseware') router.push('/courseware');
  if (info.key === 'settings') router.push('/settings');
  if (info.key === 'profile') router.push('/profile');
  if (info.key === 'messages') router.push('/messages');
  if (isMobile.value) {
    collapsed.value = true;
  }
};

const handleDropdownClick = async (info: { key: string }) => {
  if (info.key === 'logout') {
    await userStore.logout();
    router.push('/login');
  } else {
    handleMenuClick(info);
  }
};

const handleNewCourse = () => {
  formState.value = { title: '', subject: undefined, grade: undefined };
  newCourseModalVisible.value = true;
};

const closeNewCourseModal = () => {
  newCourseModalVisible.value = false;
};

const createNewCourse = async () => {
  if (!formState.value.title || !formState.value.subject || !formState.value.grade) {
    message.warning('名称、科目和年级为必填项');
    return;
  }
  creatingCourse.value = true;
  try {
    const newCw = await coursewareStore.createCourseware(formState.value);
    newCourseModalVisible.value = false;
    router.push(`/cocreation?id=${newCw.id}`);
  } finally {
    creatingCourse.value = false;
  }
  if (isMobile.value) {
    collapsed.value = true;
  }
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
  color: var(--app-text-main);
  white-space: nowrap;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
  color: var(--app-text-main);
}

.trigger:hover {
  color: var(--color-primary);
}

.header-action-btn {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.3s;
  margin-left: 16px;
  color: var(--app-text-main);
  font-size: 18px;
}

.header-action-btn:hover {
  background-color: var(--app-hover);
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

.mobile-sider {
  position: absolute !important;
  height: 100vh;
}

.mobile-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9;
}
</style>
