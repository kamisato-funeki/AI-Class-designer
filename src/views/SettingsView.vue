<!--
  系统设置页面 (SettingsView)
  业务逻辑：
  1. 提供应用级别的配置项，通过侧边菜单划分不同的设置维度。
  2. 通用设置：支持暗黑/亮色主题实时切换、语言和时区配置。
  3. 通知设置：控制系统通知的开启与关闭。
  4. 逻辑集成：与 settingsStore 深度绑定以保持全局状态同步。
-->
<template>
  <a-spin :spinning="loading">
    <div class="settings-container">
      <div class="page-header">
        <h2>系统设置</h2>
      </div>

      <div class="settings-layout">
        <!-- 左侧菜单：设置分类导航 -->
        <div class="settings-menu">
          <a-menu v-model:selectedKeys="selectedKeys" mode="inline" style="border-right: 0">
            <a-menu-item key="general">通用设置</a-menu-item>
            <a-menu-item key="notifications">通知设置</a-menu-item>
            <a-menu-item key="privacy">隐私设置</a-menu-item>
          </a-menu>
        </div>

        <!-- 右侧面板：设置详情项 -->
        <div class="settings-content">
          <div v-show="selectedKeys[0] === 'general'">
            <h3 class="section-title">通用设置</h3>

            <div class="setting-item">
              <div class="setting-info">
                <h4>主题切换</h4>
                <p>实时切换亮色/暗色模式</p>
              </div>
              <div class="setting-action">
                <a-switch :checked="settingsStore.theme === 'dark'"
                  @change="(val: boolean) => settingsStore.toggleTheme(val ? 'dark' : 'light')" checked-children="暗"
                  un-checked-children="亮" />
              </div>
            </div>
            <a-divider />

            <div class="setting-item">
              <div class="setting-info">
                <h4>系统语言</h4>
                <p>切换界面语言</p>
              </div>
              <div class="setting-action">
                <a-select defaultValue="zh-cn" style="width: 120px">
                  <a-select-option value="zh-cn">简体中文</a-select-option>
                  <a-select-option value="en">English</a-select-option>
                </a-select>
              </div>
            </div>
            <a-divider />

            <div class="setting-item">
              <div class="setting-info">
                <h4>时区设置</h4>
                <p>当前系统使用的时区</p>
              </div>
              <div class="setting-action">
                <a-select defaultValue="cst" style="width: 200px">
                  <a-select-option value="cst">(GMT+08:00) 北京时间</a-select-option>
                </a-select>
              </div>
            </div>
          </div>

          <div v-show="selectedKeys[0] === 'notifications'">
            <h3 class="section-title">通知设置</h3>
            <div class="setting-item">
              <div class="setting-info">
                <h4>系统通知</h4>
                <p>接收平台重要更新和通知</p>
              </div>
              <div class="setting-action">
                <a-switch :checked="settingsStore.notificationsEnabled" @change="settingsStore.toggleNotifications" />
              </div>
            </div>
          </div>

          <div v-show="selectedKeys[0] === 'privacy'">
            <h3 class="section-title">隐私设置</h3>
            <a-empty description="暂无隐私设置详情" />
          </div>
        </div>
      </div>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/userStore';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * 状态仓库初始化
 */
const userStore = useUserStore();   // 用户及认证仓库：提供当前登录者的元信息以供设置页预览
const settingsStore = useSettingsStore(); // 全局设置仓库：管理系统的 UI 主题、语言映射以及通知分发等核心配置

/**
 * 【响应式变量】UI 路由控制
 */
const selectedKeys = ref(['general']); // 当前激活的设置分类导航项 (v-model)
const loading = ref(true);             // 设置页面初始化加载锁

/**
 * 【预览表单容器】profileForm
 * 作用：作为用户资料的本地快照，用于在设置界面顶层进行基础反馈
 */
const profileForm = ref({
  name: '',
  email: '',
  avatar: ''
});

/**
 * 【生命周期钩子】onMounted
 * 作用：从持久化/全局仓库中拉取数据完成设置视图的初始化
 */
onMounted(() => {
  loading.value = true;
  // 同步用户简介（如果有可用数据）
  if (userStore.user) {
    profileForm.value = {
      name: userStore.user.name,
      email: userStore.user.email,
      avatar: userStore.user.avatar,
    };
  }
  loading.value = false;
});
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.settings-layout {
  display: flex;
  background: var(--app-panel);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--app-shadow);
  min-height: 600px;
}

.settings-menu {
  width: 200px;
  border-right: 1px solid var(--app-border);
  padding: 16px 0;
}

.settings-content {
  flex: 1;
  padding: 32px;
}

.section-title {
  margin-bottom: 32px;
  font-size: 20px;
  font-weight: 500;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.setting-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
}

.setting-info p {
  margin: 0;
  color: var(--app-text-sub);
  font-size: 14px;
}
</style>
