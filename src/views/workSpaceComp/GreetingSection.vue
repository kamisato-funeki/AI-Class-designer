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

const userStore = useUserStore();

// 定义问候语集合
const greetings = [
  { main: () => `早上好，${userStore.user?.name || '老师'}！`, sub: '开启下一堂课的精彩旅程' },
  { main: () => `新的一天，${userStore.user?.name || '老师'}！`, sub: '教书育人，您辛苦了' },
  { main: () => `欢迎回来，${userStore.user?.name || '老师'}！`, sub: '让我们继续探索教育的无限可能' },
  { main: () => `充满活力，${userStore.user?.name || '老师'}！`, sub: '准备好迎接充满希望的一天' },
  { main: () => `您好，${userStore.user?.name || '老师'}！`, sub: '用AI赋能每一堂课，激发学生潜能' }
];

// 定义可用的字体
const availableFonts = ['XuanZongTi', 'QijiCombo', 'AiDianFengYaHei'];

// 状态
const currentMain = ref('');
const currentSub = ref('');
const displayedText = ref('');
const typingDone = ref(false);

const titleFont = ref('XuanZongTi');
const subFont = ref('QijiCombo');

let typingTimer: number | null = null;
let rotationTimer: number | null = null;

const pickRandom = <T>(arr: T[], exclude?: T): T => {
  let item: T;
  do {
    item = arr[Math.floor(Math.random() * arr.length)] as T;
  } while (item === exclude && arr.length > 1);
  return item;
};

const refreshGreeting = () => {
  // 重置状态
  if (typingTimer) clearInterval(typingTimer);
  displayedText.value = '';
  typingDone.value = false;

  // 随机挑选问候语（确保不要连续重复）
  const previousSub = currentSub.value;
  const newGreeting = pickRandom(greetings, greetings.find(g => g.sub === previousSub));
  currentMain.value = newGreeting.main();
  currentSub.value = newGreeting.sub;

  // 随机挑选两种不同的字体
  const f1 = pickRandom(availableFonts);
  const f2 = pickRandom(availableFonts, f1); // 保证两个字体不同
  titleFont.value = f1;
  subFont.value = f2;

  // 重新开始打字动画
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

onMounted(() => {
  refreshGreeting();
  // 每5分钟刷新一次 (300000ms)
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

