<template>
  <a-config-provider :theme="{
    algorithm: settingsStore.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#0891B2',
      colorBgContainer: settingsStore.theme === 'dark' ? '#1f2937' : '#ffffff',
      borderRadius: 12,
      fontFamily: `'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
    },
  }">
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { theme } from 'ant-design-vue';
import { useSettingsStore } from './stores/settingsStore';

const settingsStore = useSettingsStore();

onMounted(() => {
  // Set default theme attribute is handled by settingsStore during initialization usually,
  // but if needed explicitly to match the document body:
  document.body.setAttribute('data-theme', settingsStore.theme);
});
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}
</style>
