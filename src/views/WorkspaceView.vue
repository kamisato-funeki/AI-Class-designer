<template>
  <div class="workspace-wrapper">
    <!-- 动态背景 -->
    <div class="dynamic-bg">
      <div v-for="shape in staticShapes" :key="'s'+shape.id" :class="['bg-shape', 'static-shape', shape.type]" :style="shape.style"></div>
      <div v-for="shape in clickShapes" :key="'c'+shape.id" :class="['bg-shape', 'click-anim', shape.type]" :style="shape.style"></div>
    </div>

    <!-- 主滚动区域 -->
    <div class="workspace-scroll-container" @click="handleBgClick" @scroll="handleScroll" ref="scrollContainer">
      <!-- Top Section (100vh - Header) -> Centered greeting, bottom input -->
      <div class="hero-section">
        <div class="hero-content">
          <GreetingSection />
        </div>
        <div class="hero-bottom-input">
          <InputCore />
        </div>
        <!-- 滚动滑出的毛玻璃蒙版 -->
        <div class="scroll-mask" :style="{ opacity: maskOpacity }"></div>
      </div>

      <!-- Content Layout -->
      <div class="dashboard-content">
        <div class="dashboard-grid">
          <!-- Left Column: Courseware Stats, etc. (Can extract if needed, but keeping simple) -->
          <div class="left-col">
            <!-- 常用模板 -->
            <div class="section-card">
              <div class="section-header">
                <h3>常用模板</h3>
                <a-button type="link" @click="$router.push('/courseware')">查看全部</a-button>
              </div>
              <div class="course-list">
                <a-card hoverable class="course-item" v-for="cw in coursewareStore.coursewares.slice(0, 3)"
                  :key="'tpl' + cw.id" @click="$router.push('/cocreation')">
                  <template #cover>
                    <div class="course-cover-placeholder"
                      :style="{ backgroundImage: `url(${cw.coverImage})`, backgroundSize: 'cover' }">
                      <div class="cw-tag">{{ cw.subject }}·{{ cw.grade }}</div>
                    </div>
                  </template>
                  <a-card-meta :title="cw.title" :description="`${cw.updateTime} 编辑`" />
                </a-card>
                <a-empty v-if="coursewareStore.coursewares.length === 0" description="暂无课件"
                  style="grid-column: span 3; margin: 24px 0;" />
              </div>
            </div>

            <!-- 最近课件 -->
            <div class="section-card">
              <div class="section-header">
                <h3>最近课件</h3>
                <a-button type="link" @click="$router.push('/courseware')">查看全部</a-button>
              </div>
              <div class="course-list">
                <a-card hoverable class="course-item" v-for="cw in coursewareStore.coursewares.slice(0, 3)"
                  :key="'cw' + cw.id" @click="$router.push('/cocreation')">
                  <template #cover>
                    <div class="course-cover-placeholder"
                      :style="{ backgroundImage: `url(${cw.coverImage})`, backgroundSize: 'cover' }">
                      <div class="cw-tag">{{ cw.subject }}·{{ cw.grade }}</div>
                    </div>
                  </template>
                  <a-card-meta :title="cw.title" :description="`${cw.updateTime} 编辑`" />
                </a-card>
                <a-empty v-if="coursewareStore.coursewares.length === 0" description="暂无课件"
                  style="grid-column: span 3; margin: 24px 0;" />
              </div>
            </div>
          </div>

          <!-- Right Column: Class Dynamics -->
          <div class="right-col">
            <ClassDynamicsCard />
          </div>
        </div>

        <!-- 底部教育新闻 -->
        <EducationNewsSection />
      </div>
    </div>

    <!-- 悬浮回到顶部 -->
    <a-button v-show="showBackTop" class="back-top-btn" type="primary" shape="circle" size="large" @click="scrollToTop">
      <template #icon>
        <UpOutlined />
      </template>
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { UpOutlined } from '@ant-design/icons-vue';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { useCoursewareStore } from '../stores/coursewareStore';

import GreetingSection from './workSpaceComp/GreetingSection.vue';
import InputCore from './workSpaceComp/InputCore.vue';
import ClassDynamicsCard from './workSpaceComp/ClassDynamicsCard.vue';
import EducationNewsSection from './workSpaceComp/EducationNewsSection.vue';

const workspaceStore = useWorkspaceStore();
const coursewareStore = useCoursewareStore();

const scrollContainer = ref<HTMLElement | null>(null);
const maskOpacity = ref(1); // 1 = 完全模糊遮挡
const showBackTop = ref(false);

const handleScroll = () => {
  if (!scrollContainer.value) return;
  const scrollTop = scrollContainer.value.scrollTop;

  // Mask opacity calc (0 at top, 1 at 300px scroll)
  // Wait, the requirement says "中部以下的部分逐渐半透明，用户向上滑动时逐渐使不透明度恢复100%"
  // That means: when at top (scrollTop=0), opacity is 1. When scrolled down, opacity approaches 0.
  let newOpacity = 1 - scrollTop / 300;
  if (newOpacity < 0) newOpacity = 0;
  if (newOpacity > 1) newOpacity = 1;
  maskOpacity.value = newOpacity;

  // Show back to top if input is out of view (around 80vh scrolled)
  const threshold = window.innerHeight * 0.8;
  showBackTop.value = scrollTop > threshold;
};

const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

// 动态背景逻辑
interface BgShape {
  id: number;
  type: string;
  style: Record<string, string | number>;
}

const staticShapes = ref<BgShape[]>([]);
const clickShapes = ref<BgShape[]>([]);
let shapeIdCounter = 0;
const shapeTypes = ['square', 'circle', 'triangle', 'diamond', 'cross'];

const handleBgClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.closest('.section-card, .input-core-container, .greeting-section, .news-section, .ant-btn, .file-preview-item')) return;

  const id = shapeIdCounter++;
  const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)] as string;
  const size = 30 + Math.random() * 40; // 30px to 70px

  const shape: BgShape = {
    id,
    type: shapeType,
    style: {
      left: `${e.clientX - size/2}px`,
      top: `${e.clientY - size/2}px`,
      width: `${size}px`,
      height: `${size}px`,
      '--click-x': `${(Math.random() - 0.5) * 300}px`,
      '--click-y': `${(Math.random() - 0.5) * 300 - 150}px`,
    }
  };

  // 限制同时存在的点击动画数量，避免性能消耗过多
  if (clickShapes.value.length >= 10) {
    clickShapes.value.shift(); // 移除最旧的
  }
  clickShapes.value.push(shape);

  setTimeout(() => {
    clickShapes.value = clickShapes.value.filter(s => s.id !== id);
  }, 1500);
};

onMounted(() => {
  workspaceStore.loadStats();
  coursewareStore.loadCoursewares();

  // 生成初始背景图形 (减少数量以优化性能)
  const initialCount = 16;
  for (let i = 0; i < initialCount; i++) {
    const size = 20 + Math.random() * 30;
    staticShapes.value.push({
      id: shapeIdCounter++,
      type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)] as string,
      style: {
        left: `${Math.random() * 100}vw`,
        bottom: `-20vh`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${10 + Math.random() * 15}s`,
        animationDelay: `${Math.random() * 5}s`,
        opacity: 0.2 + Math.random() * 0.4
      }
    });
  }
});
</script>

<style scoped>
.workspace-wrapper {
  position: relative;
  /* height: calc(100vh - 64px); */
  height: 100%;
  /* assuming top nav is 64px */
  overflow: hidden;
  background-color: var(--app-bg);
  /* Fallback */
}

/* 动态背景仿照01.css */
.dynamic-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background-color: #ffffff15;
}

.bg-shape {
  position: absolute;
  pointer-events: none;
  opacity: 0;
  will-change: transform, opacity;
  transform: translateZ(0); /* 强制开启GPU加速 */
}

.bg-shape.square {
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
}

.bg-shape.circle {
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  border-radius: 50%;
}

.bg-shape.triangle {
  width: 0 !important;
  height: 0 !important;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-bottom: 30px solid var(--color-primary);
  background: transparent !important;
}

.bg-shape.diamond {
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  transform: rotate(45deg);
}

.bg-shape.cross {
  width: 30px !important;
  height: 10px !important;
  background-color: var(--color-primary);
  position: relative;
}
.bg-shape.cross::after {
  content: "";
  position: absolute;
  top: -10px;
  left: 10px;
  width: 10px;
  height: 30px;
  background-color: var(--color-primary);
}

.bg-shape.static-shape {
  animation: floatUp linear infinite;
}

.bg-shape.click-anim {
  animation: clickExplode 1.5s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
}

@keyframes floatUp {
  0% { transform: translateY(0) scale(0) rotate(0deg); opacity: 0.6; }
  100% { transform: translateY(-120vh) scale(3) rotate(1000deg); opacity: 0; }
}

@keyframes clickExplode {
  0% { transform: scale(0) rotate(0deg) translate(0, 0); opacity: 0.8; }
  100% { transform: scale(2.5) rotate(360deg) translate(var(--click-x), var(--click-y)); opacity: 0; }
}

/* 内部滚动层 */
.workspace-scroll-container {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-behavior: smooth;
}

.hero-section {
  position: relative;
  height: 90vh;
  /* make it almost full height */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 5vh;
}

.hero-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-bottom-input {
  margin-bottom: 2rem;
  position: relative;
  z-index: 5;
}

/* 蒙版背景模糊效 */
.scroll-mask {
  position: absolute;
  bottom: -20vh;
  left: 0;
  width: 100%;
  height: 60%;
  background: linear-gradient(to bottom, transparent, var(--app-bg) 80%);
  backdrop-filter: blur(4px); /* 降低磨砂半径以减少GPU开销 */
  -webkit-backdrop-filter: blur(4px);
  z-index: 2;
  /* behind input */
  pointer-events: none;
}

/* 内容区域 */
.dashboard-content {
  width: 85%;
  max-width: 1300px;
  margin: 0 auto;
  padding-bottom: 60px;
  position: relative;
  z-index: 5;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.left-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-card {
  background: color-mix(in srgb, var(--app-panel) 50%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.3s ease;
}

.section-card:hover {
  box-shadow: var(--shadow-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--app-text);
}

.course-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.course-item {
  border-radius: 8px;
  overflow: hidden;
}

.course-cover-placeholder {
  height: 120px;
  background: linear-gradient(135deg, #ECFEFF 0%, #CFFAFE 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-weight: 500;
}

.cw-tag {
  background: rgba(255, 255, 255, 0.7);
  padding: 4px 8px;
  border-radius: 4px;
}

/* 回到顶部 */
.back-top-btn {
  position: absolute;
  right: 40px;
  bottom: 80px;
  z-index: 100;
  background: color-mix(in srgb, var(--color-primary) 60%, transparent) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.3) !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.4);
  transition: all 0.3s ease;
}

.back-top-btn:hover {
  background: color-mix(in srgb, var(--color-primary) 80%, transparent) !important;
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(var(--color-primary-rgb), 0.6);
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
</style>
