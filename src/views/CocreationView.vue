<!--
  AI 协同创作页面 (CocreationView)
  业务逻辑：
  1. 提供教师与 AI 共同创作课件的交互空间。
  2. 采用左右分割布局：左侧为对话引导区，右侧为内容呈现与编辑区。
  3. 根据 URL 中的 id 参数加载对应的课件素材。
  4. 支持响应式布局，在移动端切换为上下叠放模式。
-->
<template>
  <div class="cocreation-container">
    <splitpanes>
      <!-- 左侧：对话交互与指令输入区 -->
      <pane min-size="20" size="35" class="dialogue-area-pane">
        <CocreationLeft />
      </pane>
      <!-- 右侧：课件内容渲染与大纲预览区 -->
      <pane min-size="30" size="65" class="render-area-pane">
        <CocreationRight />
      </pane>
    </splitpanes>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';
import CocreationLeft from './cocreationComp/CocreationLeft.vue';
import CocreationRight from './cocreationComp/CocreationRight.vue';
import { useCocreationStore } from '../stores/cocreationStore';

/**
 * 路由与状态仓库初始化
 */
const route = useRoute(); // 路由对象：用于提取 URL 中的课件 ID 并监听其变化
const cocreationStore = useCocreationStore(); // 共创协作仓库：管理当前正在编辑的课件素材、大纲节点数据及 AI 对话流

/**
 * 【核心初始化函数】initCourseware
 * 作用：建立当前协作会话的上下文
 * 业务逻辑：从 URL Query 参数中提取 `id`，若有效则驱动 store 加载对应的脑图大纲、PPT/Doc 模板等基础资产。
 */
const initCourseware = () => {
  const id = route.query.id as string;
  if (id) {
    cocreationStore.loadMaterials(id);
    cocreationStore.loadCourseHistory(id);
  }
};

/**
 * 【生命周期钩子】onMounted
 */
onMounted(() => {
  initCourseware(); 
});

/**
 * 【侦听器】watch
 * 作用：处理无刷新页面时的课件 ID 切换
 * 业务逻辑：当用户从侧边栏快捷切换另一个课件 ID 时，立即重置并加载新课件的素材，保证视图数据的一致性。
 */
watch(() => route.query.id, () => {
  initCourseware();
});
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
