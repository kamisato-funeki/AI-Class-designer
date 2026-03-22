<template>
  <div class="cocreation-container">
    <splitpanes>
      <pane min-size="20" size="35" class="dialogue-area-pane">
        <CocreationLeft />
      </pane>
      <pane min-size="30" size="65" class="render-area-pane">
        <CocreationRight />
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import CocreationLeft from './cocreationComp/CocreationLeft.vue';
import CocreationRight from './cocreationComp/CocreationRight.vue';
</script>

<style scoped>
.cocreation-container {
  display: flex;
  height: calc(100vh - 64px - 48px);
  margin: -24px;
}
:deep(.splitpanes--vertical > .splitpanes__splitter) {
  min-width: 6px;
  background-color: var(--app-border);
  cursor: col-resize;
  transition: background-color 0.2s;
}
:deep(.splitpanes--vertical > .splitpanes__splitter:hover) {
  background-color: var(--color-primary);
}
@media (max-width: 768px) {
  .cocreation-container {
    flex-direction: column;
    height: calc(100vh - 64px - 32px);
    margin: -16px;
  }
  :deep(.dialogue-area-pane) {
    flex: 0 0 auto !important;
    height: 400px;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }
}
</style>
