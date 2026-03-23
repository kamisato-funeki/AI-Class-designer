<!--
  工作台 - 欢迎问候语组件 (GreetingSection)
  业务逻辑：
  1. 展示个性化的教师欢迎语，包含姓名识别。
  2. 实现打字机动画效果，增加视觉灵动感。
  3. 自动轮换：每隔一段时间更换问候语和艺术字体组合。
-->
<template>
  <div class="greeting-section">
    <h2 class="typewriter-text" :style="{ fontFamily: titleFont }">
      {{ displayedText }}<span class="cursor">|</span>
    </h2>
    <p class="subtitle" :class="{ 'fade-in': typingDone }" :style="{ fontFamily: subFont }">
      {{ currentSub }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../../stores/userStore';

/**
 * 用户状态仓库：获取当前登录教师的姓名
 */
const userStore = useUserStore();

/**
 * 【配置项】展示文本集合
 * 包含：
 * - main: 主问候语（函数形式，动态插入姓名）
 * - sub: 副标题/鼓励语
 */
const greetings = [
  { main: () => `早上好，${userStore.user?.name || '老师'}！`, sub: '开启下一堂课的精彩旅程' },
  { main: () => `新的一天，${userStore.user?.name || '老师'}！`, sub: '教书育人，您辛苦了' },
  { main: () => `欢迎回来，${userStore.user?.name || '老师'}！`, sub: '让我们继续探索教育的无限可能' },
  { main: () => `充满活力，${userStore.user?.name || '老师'}！`, sub: '准备好迎接充满希望的一天' },
  { main: () => `您好，${userStore.user?.name || '老师'}！`, sub: '用AI赋能每一堂课，激发学生潜能' }
];

/**
 * 可选的艺术字体家族
 */
const availableFonts = ['XuanZongTi', 'QijiCombo', 'AiDianFengYaHei'];

/**
 * 【响应式变量】状态管理
 */
const currentMain = ref('');      // 当前选中的主问候语全文
const currentSub = ref('');       // 当前选中的副标题
const displayedText = ref('');    // 正在打字机渲染的当前片段
const typingDone = ref(false);     // 打字机是否结束（由透明度过渡控制 CSS 动画触发）

const titleFont = ref('XuanZongTi'); // 随机分配的主标题字体
const subFont = ref('QijiCombo');     // 随机分配的副标题字体

let typingTimer: number | null = null;   // 打字机轮询定时器
let rotationTimer: number | null = null; // 自动巡回更新问候语的定时器

/**
 * 【辅助函数】pickRandom
 * 作用：从数组中随机抽取元素，支持排除指定项（防止连续两次一样）
 */
const pickRandom = <T>(arr: T[], exclude?: T): T => {
  let item: T;
  do {
    item = arr[Math.floor(Math.random() * arr.length)] as T;
  } while (item === exclude && arr.length > 1);
  return item;
};

/**
 * 【核心函数】refreshGreeting
 * 作用：核心业务逻辑 - 更新文案并重启打字机
 * 业务逻辑：
 * 1. 清理现有计时器并归零显示片段。
 * 2. 随机选取新问候语与字体对。
 * 3. 启动 `setInterval` 逐字截取 `currentMain` 赋值给 `displayedText`。
 */
const refreshGreeting = () => {
  if (typingTimer) clearInterval(typingTimer);
  displayedText.value = '';
  typingDone.value = false;

  const previousSub = currentSub.value;
  const newGreeting = pickRandom(greetings, greetings.find(g => g.sub === previousSub));
  currentMain.value = newGreeting.main();
  currentSub.value = newGreeting.sub;

  const f1 = pickRandom(availableFonts);
  const f2 = pickRandom(availableFonts, f1);
  titleFont.value = f1;
  subFont.value = f2;

  let i = 0;
  typingTimer = window.setInterval(() => {
    if (i < currentMain.value.length) {
      displayedText.value += currentMain.value.charAt(i);
      i++;
    } else {
      if (typingTimer) clearInterval(typingTimer);
      typingDone.value = true;
    }
  }, 100);
};

/**
 * 生命周期管理：启动与销毁定时器
 */
onMounted(() => {
  refreshGreeting();
  // 每30秒自动轮换一次
  rotationTimer = window.setInterval(() => {
    refreshGreeting();
  }, 30000);
});

onUnmounted(() => {
  if (typingTimer) clearInterval(typingTimer);
  if (rotationTimer) clearInterval(rotationTimer);
});
</script>

<style scoped>
/* 引入外部字体 */
@font-face {
  font-family: 'XuanZongTi';
  src: url('../../assets/fonts/XuanZongTi.otf') format('opentype');
}
@font-face {
  font-family: 'QijiCombo';
  src: url('../../assets/fonts/qiji-combo-TTF.ttf') format('truetype');
}
@font-face {
  font-family: 'AiDianFengYaHei';
  src: url('../../assets/fonts/爱点风雅黑.ttf') format('truetype');
}

.greeting-section {
  text-align: center;
  margin-top: 10vh; /* 中部稍偏上 */
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.typewriter-text {
  margin: 0;
  font-weight: 800;
  font-size: 3rem;
  /* 灵动的慢慢渐变动态配色 */
  background: linear-gradient(120deg, var(--color-primary), #818cf8, #c084fc, var(--color-primary));
  background-size: 200% auto;
  color: transparent;
  -webkit-background-clip: text;
  background-clip: text;
  animation: gradientFlow 5s ease infinite;
  letter-spacing: 2px;
  line-height: 1.5;
}

.cursor {
  display: inline-block;
  color: var(--color-primary);
  opacity: 1;
  font-weight: 300;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.subtitle {
  margin-top: 10px;
  font-size: 1.2rem;
  color: var(--app-text-sub);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.8s ease-out;
}

.subtitle.fade-in {
  opacity: 1;
  transform: translateY(0);
}

@keyframes gradientFlow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>

