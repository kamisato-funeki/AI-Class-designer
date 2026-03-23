<!--
  工作台主页 (WorkspaceView)
  业务逻辑：
  1. 作为用户登录后的首屏，展示核心入口和全局动态。
  2. 视觉特效：包含基于鼠标点击和自动漂浮的动态几何背景。
  3. 沉浸式交互：Hero 区域包含 AI 指令输入框，随滚动产生毛玻璃蒙版渐变效果。
  4. 数据展示：聚合展示常用模板、最近编辑的课件以及班级动态。
  5. 响应式布局：在宽屏下采用双栏分部，移动端自动堆叠。
-->
<template>
  <div class="workspace-wrapper">
    <!-- 动态几何背景（装饰用） -->
    <div class="dynamic-bg">
      <div v-for="shape in staticShapes" :key="'s'+shape.id" :class="['bg-shape', 'static-shape', shape.type]" :style="shape.style"></div>
      <div v-for="shape in clickShapes" :key="'c'+shape.id" :class="['bg-shape', 'click-anim', shape.type]" :style="shape.style"></div>
    </div>

    <!-- 主滚动容器 -->
    <div class="workspace-scroll-container" @click="handleBgClick" @scroll="handleScroll" ref="scrollContainer">
      <!-- 英雄区 (Hero Section)：包含欢迎语与核心输入框 -->
      <div class="hero-section">
        <div class="hero-content">
          <GreetingSection />
        </div>
        <div class="hero-bottom-input">
          <InputCore />
        </div>
        <!-- 滚动滑出的毛玻璃蒙版：随滚动透明度变化，产生沉浸式过渡 -->
        <div class="scroll-mask" :style="{ opacity: maskOpacity }"></div>
      </div>

      <!-- 仪表盘内容区域 -->
      <div class="dashboard-content">
        <div class="dashboard-grid">
          <!-- 左侧：课件列表与统计 -->
          <div class="left-col">
            <!-- 常用模板板块 -->
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

            <!-- 最近编辑的课件 -->
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

          <!-- 右侧：班级动态卡片 -->
          <div class="right-col">
            <ClassDynamicsCard />
          </div>
        </div>

        <!-- 底部：教育新闻资讯 -->
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

/**
 * 状态仓库初始化
 */
const workspaceStore = useWorkspaceStore(); // 工作台状态仓库：管理全局数据汇总与统计指标
const coursewareStore = useCoursewareStore(); // 课件状态仓库：管理最近编辑课件及常用模板数据

/**
 * 【响应式变量】UI 控制与滚动状态
 */
const scrollContainer = ref<HTMLElement | null>(null); // 主滚动容器 DOM 引用，用于监听 scroll 事件
const maskOpacity = ref(1);                            // 英雄区磨砂蒙版的透明度，随滚动产生渐变效果
const showBackTop = ref(false);                        // 控制“回到顶部”悬浮按钮的显示与隐藏

/**
 * 【函数】handleScroll
 * 作用：核心 UI 交互响应函数 - 同步滚动进度与视觉效果
 * 业务逻辑：
 * 1. 随着页面向下滚动，根据滚动距离 (0-300px) 计算 `maskOpacity`，实现欢迎区蒙版的淡出。
 * 2. 实时监测滚动距离，超过 80% 视口高度时自动显示“回到顶部”按钮。
 */
const handleScroll = () => {
  if (!scrollContainer.value) return;
  const scrollTop = scrollContainer.value.scrollTop;

  // 1. 设置 Hero 区域蒙版淡出系数
  let newOpacity = 1 - scrollTop / 300;
  if (newOpacity < 0) newOpacity = 0;
  if (newOpacity > 1) newOpacity = 1;
  maskOpacity.value = newOpacity;

  // 2. 切换回到顶部按钮状态
  const threshold = window.innerHeight * 0.8;
  showBackTop.value = scrollTop > threshold;
};

/**
 * 【函数】scrollToTop
 * 作用：平滑回滚至页面最顶端
 */
const scrollToTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

/**
 * 【动态背景特效】图形接口与状态集
 */
interface BgShape {
  id: number;
  type: string;
  style: Record<string, string | number>;
}

const staticShapes = ref<BgShape[]>([]); // 初始加载时生成的背景自动漂浮图形
const clickShapes = ref<BgShape[]>([]);  // 用户点击背景时产生的瞬时交互图形
let shapeIdCounter = 0;                  // 全局唯一图形 ID 计数器
const shapeTypes = ['square', 'circle', 'triangle', 'diamond', 'cross']; // 支持的随机图形库

/**
 * 【函数】handleBgClick
 * 作用：背景“点击爆炸”动效实现
 * @param e 鼠标点击事件，用于提取相对于视口的 (x, y) 坐标
 * 业务逻辑：
 * 1. 过滤：若点击在卡片、按钮等交互区域则不触发背景特效。
 * 2. 生成：在点击位置实例化一个随机形状，并注入 CSS 变量以控制扩散方向。
 * 3. 销毁：1.5秒后（匹配动画时长）自动从 DOM 数组中剔除，释放内存。
 */
const handleBgClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  // 排除点击在业务组件上的情况
  if (target.closest('.section-card, .input-core-container, .greeting-section, .news-section, .ant-btn, .file-preview-item')) return;

  const id = shapeIdCounter++;
  const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)] as string;
  const size = 30 + Math.random() * 40; 

  const shape: BgShape = {
    id,
    type: shapeType,
    style: {
      left: `${e.clientX - size/2}px`,
      top: `${e.clientY - size/2}px`,
      width: `${size}px`,
      height: `${size}px`,
      '--click-x': `${(Math.random() - 0.5) * 300}px`, // 随机 X 轴扩散位移
      '--click-y': `${(Math.random() - 0.5) * 300 - 150}px`, // 随机 Y 轴扩散位移
    }
  };

  // 动画队列管理
  if (clickShapes.value.length >= 10) {
    clickShapes.value.shift(); 
  }
  clickShapes.value.push(shape);

  // 定时销毁，匹配 CSS 动画时长
  setTimeout(() => {
    clickShapes.value = clickShapes.value.filter(s => s.id !== id);
  }, 1500);
};

/**
 * 【生命周期钩子】onMounted
 * 作用：初始化工作台数据并生成背景装饰图形
 */
onMounted(() => {
  // 1. 并行加载核心业务数据
  workspaceStore.loadStats();
  coursewareStore.loadCoursewares();

  // 2. 生成初始的装饰性几何图形（自动漂浮型）
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
