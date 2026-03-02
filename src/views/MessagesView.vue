<template>
  <a-spin :spinning="loading">
    <div class="messages-container">
      <div class="page-header">
        <h2>消息列表 <a-badge v-if="messageStore.unreadCount > 0" :count="messageStore.unreadCount" /></h2>
        <a-button @click="markAllAsRead">全部标记为已读</a-button>
      </div>

      <a-tabs v-model:activeKey="activeTab" class="bg-white-tabs">
        <a-tab-pane key="all" tab="全部消息">
          <a-list item-layout="horizontal" :data-source="filteredMessagesActive">
            <template #renderItem="{ item }">
              <a-list-item class="message-item" :class="{ read: item.isRead }"
                @click="!item.isRead && markAsRead(item.id)">
                <template #actions>
                  <a-button type="link" danger @click.stop="deleteMsg(item.id)">删除</a-button>
                </template>
                <a-list-item-meta :description="item.content">
                  <template #title>
                    <div class="msg-title">
                      <a-badge v-if="!item.isRead" dot :offset="[-10, 5]" />
                      <span class="title-text">{{ item.senderName }} {{ item.type === 'system' ? '发来一条通知' : '发来一条消息'
                        }}</span>
                      <span class="time-badge">{{ item.createTime }}</span>
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
          <a-list item-layout="horizontal" :data-source="filteredMessagesActive">
            <template #renderItem="{ item }">
              <a-list-item class="message-item" :class="{ read: item.isRead }"
                @click="!item.isRead && markAsRead(item.id)">
                <template #actions>
                  <a-button type="link" danger @click.stop="deleteMsg(item.id)">删除</a-button>
                </template>
                <a-list-item-meta :description="item.content">
                  <template #title>
                    <div class="msg-title">
                      <a-badge v-if="!item.isRead" dot :offset="[-10, 5]" />
                      <span class="title-text">{{ item.senderName }}</span>
                      <span class="time-badge">{{ item.createTime }}</span>
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar style="background-color: #0891B2;">
                      <template #icon>
                        <BellOutlined />
                      </template>
                    </a-avatar>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>
        <a-tab-pane key="user" tab="互动消息">
          <a-list item-layout="horizontal" :data-source="filteredMessagesActive">
            <template #renderItem="{ item }">
              <a-list-item class="message-item" :class="{ read: item.isRead }"
                @click="!item.isRead && markAsRead(item.id)">
                <template #actions>
                  <a-button type="link" danger @click.stop="deleteMsg(item.id)">删除</a-button>
                </template>
                <a-list-item-meta :description="item.content">
                  <template #title>
                    <div class="msg-title">
                      <a-badge v-if="!item.isRead" dot :offset="[-10, 5]" />
                      <span class="title-text">{{ item.senderName }} 发来互动消息</span>
                      <span class="time-badge">{{ item.createTime }}</span>
                    </div>
                  </template>
                  <template #avatar>
                    <a-avatar :src="item.senderAvatar" style="background-color: #22C55E;">
                      <template #icon>
                        <MessageOutlined />
                      </template>
                    </a-avatar>
                  </template>
                </a-list-item-meta>
              </a-list-item>
            </template>
          </a-list>
        </a-tab-pane>
      </a-tabs>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { BellOutlined, MessageOutlined } from '@ant-design/icons-vue';
import { useMessageStore } from '../stores/messageStore';
import { message } from 'ant-design-vue';

const messageStore = useMessageStore();
const activeTab = ref('all');
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  await messageStore.loadMessages();
  loading.value = false;
});

const filteredMessagesActive = computed(() => {
  if (activeTab.value === 'all') return messageStore.messages;
  return messageStore.messages.filter(m => m.type === activeTab.value);
});

const markAllAsRead = async () => {
  loading.value = true;
  const unreads = messageStore.messages.filter(m => !m.isRead);
  for (const m of unreads) {
    await messageStore.markAsRead(m.id);
  }
  loading.value = false;
  message.success('全部标记为已读');
};

const deleteMsg = async (id: string) => {
  loading.value = true;
  await messageStore.deleteMessage(id);
  loading.value = false;
};

const markAsRead = async (id: string) => {
  loading.value = true;
  await messageStore.markAsRead(id);
  loading.value = false;
};
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
