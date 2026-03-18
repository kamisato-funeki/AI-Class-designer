<template>
  <div class="section-card">
    <div class="section-header">
      <h3>班级动态</h3>
    </div>
    <a-list item-layout="horizontal" :data-source="dynamics">
      <template #renderItem="{ item }">
        <a-list-item>
          <a-list-item-meta :description="item.time">
            <template #title>
              <a-popover :title="item.title" trigger="hover" placement="left">
                <template #content>
                  <p>{{ item.description }}</p>
                </template>
                <a style="cursor: pointer; color: var(--app-text);">{{ item.title }}</a>
              </a-popover>
            </template>
            <template #avatar>
              <a-avatar style="background-color: var(--color-primary)">
                <UserOutlined />
              </a-avatar>
            </template>
          </a-list-item-meta>
          <template #extra>
            <a-button type="link" size="small" @click="router.push('/classes')">查看</a-button>
          </template>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { UserOutlined } from '@ant-design/icons-vue';

const router = useRouter();

const dynamics = [
  { title: '初二三班 提交了 5 份作业', time: '10分钟前', description: '关于勾股定理的课后练习已经全部收齐' },
  { title: '李小明 同学提问了关于勾股定理的问题', time: '1小时前', description: '他在讨论区发起了一个新帖' },
  { title: '初二一班 单元测试平均分已出', time: '昨天', description: '本次测试平均分 85，最高分 100' },
  { title: '初三四班 语文阅读理解打卡完成', time: '昨天', description: '全班完成打卡' },
];
</script>

<style scoped>
.section-card {
  background: color-mix(in srgb, var(--app-panel) 50%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: box-shadow 0.3s ease;
  height: 100%;
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

/* 适配暗色的 list-item 文字 */
:deep(.ant-list-item-meta-title > a) {
  color: var(--app-text) !important;
}
:deep(.ant-list-item-meta-description) {
  color: var(--app-text-sub) !important;
}
</style>
