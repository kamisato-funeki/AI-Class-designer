<template>
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
              <a-switch v-model:checked="isDarkMode" checked-children="暗" un-checked-children="亮" />
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
          <a-empty description="暂无通知设置详情" />
        </div>

        <div v-show="selectedKeys[0] === 'privacy'">
          <h3 class="section-title">隐私设置</h3>
          <a-empty description="暂无隐私设置详情" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const selectedKeys = ref(['general']);
const isDarkMode = ref(false);

watch(isDarkMode, (val) => {
  if (val) {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.setAttribute('data-theme', 'light');
  }
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
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  min-height: 600px;
}

.settings-menu {
  width: 200px;
  border-right: 1px solid var(--color-border-light);
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
  color: var(--color-text-sub-light);
  font-size: 14px;
}
</style>
