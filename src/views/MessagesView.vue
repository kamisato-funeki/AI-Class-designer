<!--
  消息列表页面 (MessagesView)
  业务逻辑：
  1. 展示用户收到的各类消息，包括系统通知和用户间的互动消息。
  2. 提供按类型切换（全部/系统/互动）的过滤功能。
  3. 支持消息的已读管理（单条标记已读、全部已读）和删除操作。
  4. 实时显示未读消息总数。
-->
<template>
  <a-spin :spinning="loading">
    <div class="messages-container">
      <div class="page-header">
        <h2>消息列表 <a-badge v-if="messageStore.unreadCount > 0" :count="messageStore.unreadCount" /></h2>
        <a-button @click="markAllAsRead">全部标记为已读</a-button>
      </div>

      <!-- 消息分类页签 -->
      <a-tabs v-model:activeKey="activeTab" class="bg-white-tabs">
        <!-- 全部消息列表 -->
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

/**
 * 状态仓库与核心变量初始化
 */
const messageStore = useMessageStore(); // 消息中心仓库：管理系统通知、互动消息的加载、已读同步及物理删除
const activeTab = ref('all');            // 当前激活的过滤页签：'all'(全部汇聚), 'system'(仅限系统通知), 'user'(仅限互动消息)
const loading = ref(true);               // 全局加载锁，用于控制 a-spin 遮罩显示

/**
 * 【生命周期钩子】onMounted
 * 作用：页面入场时拉取最新的全量消息列表
 */
onMounted(() => {
  loading.value = true;
  messageStore.loadMessages().finally(() => {
    loading.value = false;
  });
});

/**
 * 【计算属性】filteredMessagesActive
 * 作用：基于 activeTab 的实时视图数据切片
 * 业务逻辑：根据消息对象的 type 属性进行内存级过滤
 */
const filteredMessagesActive = computed(() => {
  if (activeTab.value === 'all') return messageStore.messages;
  return messageStore.messages.filter(m => m.type === activeTab.value);
});

/**
 * 【异步函数】markAllAsRead
 * 作用：一键已读功能
 * 业务逻辑：遍历当前内存中的未读消息集合，并发/串行触发后端已读状态同步。
 */
const markAllAsRead = async () => {
  loading.value = true;
  const unreads = messageStore.messages.filter(m => !m.isRead);
  for (const m of unreads) {
    await messageStore.markAsRead(m.id);
  }
  loading.value = false;
  message.success('已成功忽略所有未读通知');
};

/**
 * 【异步函数】deleteMsg
 * 作用：物理移除消息记录
 * @param id 消息 ID
 */
const deleteMsg = async (id: string) => {
  loading.value = true;
  await messageStore.deleteMessage(id);
  loading.value = false;
  message.success('消息已删除');
};

/**
 * 【异步函数】markAsRead
 * 作用：单条点击标记已读
 * @param id 消息 ID
 */
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
  background: var(--app-panel);
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
  background-color: var(--app-hover);
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
  color: var(--app-text-sub);
  font-weight: normal;
}
</style>
