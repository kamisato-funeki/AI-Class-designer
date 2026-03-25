<!--
  班级课表显示组件 (ClassSchedule)
  业务逻辑：
  1. 以漂亮的 CSS Grid 形式渲染当前班级的排课计划，匹配移动端课表常用的设计规范。
  2. 展示日期、时间段、科目以及任课教师与教室。
  3. 当期高亮当前访问教师（用户本人）的主讲课程。
  4. 支持明暗双重本题无缝切换。
-->
<template>
  <div class="schedule-container">
    <!-- 顶栏：星期与日期 -->
    <div class="grid-header">
      <div class="corner-cell">
        <div class="month-text">3<br/>月</div>
      </div>
      <div v-for="(day, index) in days" :key="index" class="day-cell">
        <div class="day-name">{{ day.name }}</div>
        <div class="day-date">{{ day.date }}</div>
      </div>
    </div>

    <!-- 主体内容区：时间列 + 课程网格 -->
    <div class="grid-body">
      <!-- 最左侧的时间列 -->
      <div class="time-column">
        <div v-for="period in periods" :key="period.num" class="time-cell">
          <div class="period-num">{{ period.num }}</div>
          <div class="period-times">
            <span>{{ period.start }}</span>
            <span>{{ period.end }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧课表卡片网格 -->
      <div class="schedule-grid">
        <div
          v-for="item in classesStore.currentSchedule"
          :key="item.id"
          class="class-card"
          :class="{ 'is-my-class': item.teacher === userStore.user?.name }"
          :style="getCardStyle(item)"
        >
          <div class="subject">{{ item.subject }}</div>
          <div class="room" v-if="item.room">{{ item.room }}</div>
          <div class="teacher">{{ item.teacher }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useClassesStore } from '../../stores/classesStore';
import { useUserStore } from '../../stores/userStore';
import type { CourseScheduleItem } from '../../types/types';

/**
 * 状态仓库集
 */
const classesStore = useClassesStore(); // 班级仓库，提供当前班级的课程排期数据 (currentSchedule)
const userStore = useUserStore();       // 用户仓库，提供当前访问者的身份识别 (user)

/**
 * 结构数据：节次定义
 */
const periods = [
  { num: 1, start: '08:00', end: '08:45' },
  { num: 2, start: '08:55', end: '09:40' },
  { num: 3, start: '10:00', end: '10:45' },
  { num: 4, start: '10:55', end: '11:40' },
  { num: 5, start: '14:00', end: '14:45' },
  { num: 6, start: '14:55', end: '15:40' },
  { num: 7, start: '16:00', end: '16:45' },
  { num: 8, start: '16:55', end: '17:40' },
  { num: 9, start: '18:30', end: '19:15' },
  { num: 10, start: '19:25', end: '20:10' },
  { num: 11, start: '20:20', end: '21:05' }
];

/**
 * 结构数据：表头日期定义
 */
const days = [
  { name: '一', date: '9' },
  { name: '二', date: '10' },
  { name: '三', date: '11' },
  { name: '四', date: '12' },
  { name: '五', date: '13' },
  { name: '六', date: '14' },
  { name: '日', date: '15' }
];

/**
 * 调色盘与哈希计算机制，保证同一个学科渲染出一致且悦目的背景色
 */
const colors = [
  '#ec7a95', '#7ea4f4', '#7bdfb0', '#f19e6b', '#baa3ef',
  '#7eb4f5', '#5782bd', '#dcab62', '#da859e'
];

const getColorForSubject = (subject: string) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * 样式映射派发，计算课表卡片的绝对行列定位及主题色
 * @param item 具体的课程排期对象
 */
const getCardStyle = (item: CourseScheduleItem) => {
  const col = item.dayOfWeek || 1;
  const rowStart = item.period || 1;
  const rowEnd = rowStart + (item.length || 1);
  const bgColor = getColorForSubject(item.subject);

  return {
    gridColumn: col,
    gridRow: `${rowStart} / ${rowEnd}`,
    backgroundColor: bgColor
  };
};
</script>

<style scoped>
/**
 * 高度定制化的 CSS 课表呈现方案
 * 采用全局变量 var(--app-bg), var(--app-text-main) 等，与应用的全局主题系统保持一致
 */
.schedule-container {
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-soft, #eaedf4);
  background: var(--app-bg, #eaedf4);
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 200px);
  min-height: 400px;
  color: var(--app-text-main, #333);
  font-family: 'Helvetica Neue', Arial, 'Microsoft YaHei', sans-serif;
}

/* 兼容暗模式底层背景颜色 */
html[data-theme='dark'] .schedule-container {
  background: var(--app-panel, #1f2937);
}

.grid-header {
  display: flex;
  padding: 8px 12px 6px 0;
  border-bottom: 1px solid var(--color-border-dark, #e5e7eb);
  background: transparent;
}

.corner-cell {
  width: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--app-text-main, #333);
}

.month-text {
  text-align: center;
  line-height: 1.2;
}

.day-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--app-text-sub, #999);
}

.day-name {
  font-weight: 500;
  color: var(--app-text-main, #333);
  margin-bottom: 4px;
}

.grid-body {
  display: flex;
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px 12px 0;
}

/* 自定义滚动条风格 */
.grid-body::-webkit-scrollbar {
  width: 6px;
}
.grid-body::-webkit-scrollbar-thumb {
  background: rgba(144, 147, 153, 0.3);
  border-radius: 4px;
}

.time-column {
  width: 40px;
  flex-shrink: 0;
  display: grid;
  grid-template-rows: repeat(11, 55px); /* 11 节课基本高度定性 */
}

.time-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 6px;
  font-size: 11px;
  color: var(--app-text-sub, #999);
}

.period-num {
  font-size: 14px;
  font-weight: bold;
  color: var(--app-text-main, #333);
  margin-bottom: 2px;
  font-style: italic;
}

.period-times {
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.75); /* 调整较小的时间字号 */
  color: #a0a5b2;
}

.schedule-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(11, 55px);
  gap: 4px;
}

.class-card {
  border-radius: 6px;
  padding: 6px;
  color: #fff;
  font-size: 12px;
  line-height: 1.25;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s, filter 0.3s;
  cursor: pointer;
  word-break: break-all;
}

.class-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  filter: brightness(1.05); /* 提升明亮度增强交互反馈 */
}

/* 专属身份高亮逻辑（我的课） */
.class-card.is-my-class {
  border: 2px solid #ffde00;
  box-shadow: 0 0 12px rgba(255, 235, 59, 0.6);
  animation: glowEffect 2s infinite alternate;
  z-index: 10;
}

@keyframes glowEffect {
  from { box-shadow: 0 0 5px rgba(255, 235, 59, 0.4); }
  to { box-shadow: 0 0 18px rgba(255, 235, 59, 0.9); }
}

html[data-theme='dark'] .class-card.is-my-class {
  border-color: #fadb14; /* 兼容暗夜模式色彩 */
}

.subject {
  font-weight: 600;
  margin-bottom: 2px;
  font-size: 12px;
  font-family: inherit; /* 保留可能存在的衬线/手写体搭配感 */
}

.room {
  font-size: 10px;
  opacity: 0.95;
  margin-bottom: 2px;
}

.teacher {
  font-size: 10px;
  opacity: 0.9;
  margin-top: auto;
}
</style>

