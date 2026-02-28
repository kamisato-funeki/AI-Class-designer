<template>
  <a-config-provider
    :theme="{
      token: {
        colorPrimary: '#0891B2',
        borderRadius: 12,
        fontFamily: `'Fira Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`,
      },
    }"
  >
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  // Set default theme
  document.body.setAttribute('data-theme', 'light');
});
</script>

<style>
#app {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}
</style>
