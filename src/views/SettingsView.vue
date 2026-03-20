<template>
  <a-spin :spinning="loading">
    <div class="settings-container">
      <div class="page-header">
        <h2>系统设置</h2>
      </div>

      <div class="settings-layout">
        <!-- Left Menu -->
        <div class="settings-menu">
          <a-menu v-model:selectedKeys="selectedKeys" mode="inline" style="border-right: 0">
            <a-menu-item key="general">通用设置</a-menu-item>
            <a-menu-item key="notifications">通知设置</a-menu-item>
            <a-menu-item key="privacy">隐私设置</a-menu-item>
          </a-menu>
        </div>

        <!-- Right Panel -->
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


const userStore = useUserStore();
const settingsStore = useSettingsStore();

const selectedKeys = ref(['profile']);
const loading = ref(true);

const profileForm = ref({
  name: '',
  email: '',
  avatar: ''
});

onMounted(() => {
  loading.value = true;
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
