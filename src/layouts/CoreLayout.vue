<!-- 
  核心布局组件 (CoreLayout)
  业务逻辑：
  1. 提供应用的整体框架，包含侧边栏导航、顶部栏和主内容区。
  2. 处理响应式布局（移动端适配）。
  3. 维护全局状态（主题切换、用户登录态、课件创建弹出框）。
  4. 集成路由导航功能。
-->
<template>
  <a-layout style="height: 100vh; position: relative;">
    <!-- Mobile Overlay -->
    <div v-if="isMobile && !collapsed" class="mobile-overlay" @click="collapsed = true"></div>

    <!-- Sidebar -->
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :collapsed-width="isMobile ? 0 : 80"
      theme="light" :class="{ 'mobile-sider': isMobile }"
      :style="{ borderRight: '1px solid var(--app-border)', zIndex: 10 }">
      <!-- 侧边栏主体：品牌 Logo 和 导航菜单 -->
      <div class="logo-container">
        <div class="logo-icon">ACD</div>
        <span v-if="!collapsed" class="logo-text">AI 课件设计师</span>
      </div>

      <!-- 核心功能模块菜单 -->
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

      <!-- 底部辅助模块菜单 (个人中心、设置、消息) -->
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

    <!-- 右侧主内容区域 -->
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

    <!-- 新建课件弹窗 -->
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

/**
 * 全局状态与核心服务初始化
 */
const router = useRouter();                    // 路由控制器：管理全站页面跳转
const route = useRoute();                      // 路由元信息：用于实时感知当前位置并同步 UI 高亮
const userStore = useUserStore();              // 用户仓库：管控登录态与教师个人画像
const coursewareStore = useCoursewareStore();  // 课件仓库：支撑“开启新课”业务流程
const settingsStore = useSettingsStore();      // 设置仓库：响应主题（深色/浅色）与国际化变更

/**
 * 【响应式状态】UI 布局控制
 */
const collapsed = ref<boolean>(false);        // 侧边栏物理收起状态（支持手动触发与移动端自动折叠）
const selectedKeys = ref<string[]>(['workspace']); // 导航菜单当前的激活项（与路由路径保持单向同步）
const newCourseModalVisible = ref<boolean>(false); // “开启新课”全局业务弹窗显隐
const creatingCourse = ref<boolean>(false);        // 课件持久化过程中的 Loading 锁定
const isMobile = ref<boolean>(false);              // 响应式断点感知：true 表示处于移动端/窄屏模式

/**
 * 【侦听器】路由同步逻辑
 * 作用：当用户通过返回键、直接 URL 输入或程序化跳转改变路径时，确保侧边栏高亮项与之匹配。
 */
watch(() => route.path, (newPath) => {
  if (newPath === '/') selectedKeys.value = ['workspace'];
  else if (newPath.startsWith('/classes')) selectedKeys.value = ['classes'];
  else if (newPath.startsWith('/rag')) selectedKeys.value = ['rag'];
  else if (newPath.startsWith('/courseware')) selectedKeys.value = ['courseware'];
  else if (newPath.startsWith('/design')) selectedKeys.value = ['design-center'];
  else if (newPath.startsWith('/settings')) selectedKeys.value = ['settings'];
  else if (newPath.startsWith('/profile')) selectedKeys.value = ['profile'];
  else if (newPath.startsWith('/messages')) selectedKeys.value = ['messages'];
  else selectedKeys.value = []; // 针对共创空间等无侧边项页面，执行清空
}, { immediate: true });

/**
 * 【表单状态】新建课件载体
 */
const formState = ref({
  title: '',     // 建议书/课件标题
  subject: undefined, // 映射科目分类
  grade: undefined    // 映射年级段
});

/**
 * 【核心函数】checkMobile
 * 作用：窗口尺寸嗅探与布局转换
 * 策略：当宽度 <= 768px 时，强制执行侧边栏隐匿模式并切换为移动端交互。
 */
const checkMobile = () => {
  const currentIsMobile = window.innerWidth <= 768;
  if (isMobile.value !== currentIsMobile) {
    isMobile.value = currentIsMobile;
    collapsed.value = currentIsMobile;
  }
};

/**
 * 【生命周期钩子】onMounted
 * 1. 注册全局窗口缩放监听器。
 * 2. 模拟自动登录流：若用户尚未鉴权，则触发 Mock 登录以保证开发环境数据连通。
 */
onMounted(async () => {
  checkMobile();
  window.addEventListener('resize', checkMobile);

  if (!userStore.user) {
    try {
      await userStore.login('admin', 'admin');
    } catch (e) {
      console.warn('Layout 自动登录尝试失败:', e);
    }
  }
});

/**
 * 【生命周期钩子】onUnmounted
 * 清理副作用，防止内存泄漏。
 */
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

/**
 * 【业务函数】handleMenuClick
 * 作用：处理导航菜单的人机交互响应
 * @param info Ant Design Menu 传回的点击元数据
 */
const handleMenuClick = (info: { key: string }) => {
  // A. 执行逻辑重定向
  const pathMap: Record<string, string> = {
    workspace: '/',
    rag: '/rag',
    classes: '/classes',
    'design-center': '/design',
    courseware: '/courseware',
    settings: '/settings',
    profile: '/profile',
    messages: '/messages'
  };
  
  const targetPath = pathMap[info.key];
  if (targetPath) {
    router.push(targetPath);
  }
  
  // B. 移动端优化：点击导航后自动收起侧边遮罩面板
  if (isMobile.value) {
    collapsed.value = true;
  }
};

/**
 * 【业务函数】handleDropdownClick
 * 作用：处理顶部头像区域的扩展指令（如：个人中心、登出）
 */
const handleDropdownClick = async (info: { key: string }) => {
  if (info.key === 'logout') {
    await userStore.logout();
    router.push('/login');
    message.success('已安全退出系统');
  } else {
    // 复用通用的导航处理逻辑
    handleMenuClick(info);
  }
};

/**
 * 【业务函数】handleNewCourse
 * 作用：调起“开启新课”向弹窗
 */
const handleNewCourse = () => {
  formState.value = { title: '', subject: undefined, grade: undefined };
  newCourseModalVisible.value = true;
};

/**
 * 【业务函数】closeNewCourseModal
 * 作用：安全关闭向导弹窗
 */
const closeNewCourseModal = () => {
  newCourseModalVisible.value = false;
};

/**
 * 【异步业务函数】createNewCourse
 * 作用：执行新课件的原子化创建并进行工作区深度路由跳转
 * 业务逻辑：
 * 1. 前端层级必填校验。
 * 2. 向 store 发起创建指令。
 * 3. 获取新课件 UUID 后，利用 push 方法导航至 Cocreation 协同空间。
 */
const createNewCourse = async () => {
  if (!formState.value.title || !formState.value.subject || !formState.value.grade) {
    message.warning('请填写完整的课程基本信息');
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
  
  // 窄屏适配：跳转后确保遮挡侧边栏已折叠
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
