<template>
  <div class="messages-container">
    <div class="page-header">
      <h2>消息列表</h2>
      <a-button>全部标记为已读</a-button>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="bg-white-tabs">
      <a-tab-pane key="all" tab="全部消息">
        <a-list item-layout="horizontal" :data-source="messages">
          <template #renderItem="{ item }">
            <a-list-item class="message-item" :class="{ read: item.isRead }">
              <template #actions>
                <a-button type="link" danger>删除</a-button>
              </template>
              <a-list-item-meta :description="item.summary">
                <template #title>
                  <div class="msg-title">
                    <a-badge v-if="!item.isRead" dot :offset="[-10, 5]" />
                    <span class="title-text">{{ item.title }}</span>
                    <span class="time-badge">{{ item.time }}</span>
                  </div>
                </template>
                <template #avatar>
                  <a-avatar :style="{ backgroundColor: item.type === 'system' ? '#0891B2' : '#22C55E' }">
                    <template #icon>
                      <BellOutlined v-if="item.type === 'system'" />
                      <MessageOutlined v-else />
                    </template>
                  </a-avatar>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </a-tab-pane>
      <a-tab-pane key="system" tab="系统通知">
        <a-empty description="暂无系统通知" />
      </a-tab-pane>
      <a-tab-pane key="interaction" tab="互动消息">
        <a-empty description="暂无互动消息" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BellOutlined, MessageOutlined } from '@ant-design/icons-vue';

const activeTab = ref('all');

const messages = ref([
  {
    id: 1,
    type: 'system',
    title: '版本更新通知',
    summary: 'AI Class Designer v2.0 已发布，新增模板库功能，快来体验吧！',
    time: '刚刚',
    isRead: false
  },
  {
    id: 2,
    type: 'interaction',
    title: '作业提交提醒',
    summary: '初二三班 张强 提交了《勾股定理课后练习》',
    time: '2小时前',
    isRead: false
  },
  {
    id: 3,
    type: 'system',
    title: '文档解析完成',
    summary: '您上传的《初二数学历年真题.pdf》已成功解析并加入知识库。',
    time: '昨天 15:30',
    isRead: true
  }
]);
</script>

<style scoped>
.messages-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.bg-white-tabs {
  background: white;
  padding: 0 24px 24px 24px;
  border-radius: 12px;
  min-height: 500px;
}

.message-item {
  padding: 16px;
  transition: background-color 0.3s;
  border-radius: 8px;
  margin-bottom: 8px;
}

.message-item:hover {
  background-color: var(--color-hover-light);
}

.message-item.read {
  opacity: 0.6;
}

.msg-title {
  display: flex;
  align-items: center;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  margin-right: 12px;
}

.time-badge {
  font-size: 12px;
  color: var(--color-text-sub-light);
  font-weight: normal;
}
</style>
