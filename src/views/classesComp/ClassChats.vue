<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <template v-if="!classesStore.activeGroupChat">
      <a-list item-layout="horizontal" :data-source="classesStore.groupChats" class="group-chat-list">
        <template #renderItem="{ item }">
          <a-list-item class="group-chat-item" @click="handleOpenGroupChat(item)">
            <a-list-item-meta>
              <template #avatar>
                <a-avatar :src="item.avatar" :size="48" style="border-radius: 50%;" />
              </template>
              <template #title>
                <div class="group-chat-title-row">
                  <span class="chat-name">{{ item.name }}</span>
                  <span class="chat-time">{{ item.lastMessageTime }}</span>
                </div>
              </template>
              <template #description>
                <div class="group-chat-desc-row">
                  <span class="chat-last-msg">
                    <span v-if="item.lastSender" class="chat-sender">{{ item.lastSender }}: </span>
                    {{ item.lastMessage }}
                  </span>
                  <a-badge v-if="item.unreadCount > 0" :count="item.unreadCount > 99 ? '99+' : item.unreadCount" class="chat-badge" />
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>

      <a-button type="primary" shape="circle" size="large"
        style="position: absolute; bottom: 32px; right: 32px; width: 48px; height: 48px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; justify-content: center; align-items: center;"
        @click="createGroupChatVisible = true">
        <span style="font-size: 24px; font-weight: 300; line-height: 1; margin-bottom: 2px;">+</span>
      </a-button>

      <a-modal v-model:open="createGroupChatVisible" title="发起群聊" @ok="handleCreateGroupChat" :confirmLoading="loading">
        <a-form layout="vertical">
          <a-form-item label="群聊名称" required>
            <a-input v-model:value="newGroupName" placeholder="请输入群聊名称" />
          </a-form-item>
          <a-form-item label="选择成员" required>
            <a-select v-model:value="selectedStudents" mode="multiple" placeholder="请选择群聊成员" style="width: 100%">
              <a-select-option v-for="stu in classesStore.students" :key="stu.id" :value="stu.id">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <a-avatar :src="stu.avatar" :size="20" />
                  {{ stu.name }}
                </div>
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>
    </template>

    <template v-else>
      <div class="chat-board-container">
        <ClassChatBoard @back="classesStore.activeGroupChat = null" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { message } from 'ant-design-vue';
import { useClassesStore } from '../../stores/classesStore';
import ClassChatBoard from './ClassChatBoard.vue';
import type { GroupChat } from '../../types/types';

const classesStore = useClassesStore();

const createGroupChatVisible = ref(false);
const newGroupName = ref('');
const selectedStudents = ref<string[]>([]);
const loading = ref(false);

const handleOpenGroupChat = async (chat: GroupChat) => {
  await classesStore.selectGroupChat(chat);
};

const handleCreateGroupChat = async () => {
  if (!newGroupName.value) return message.warning('请输入群聊名称');
  if (selectedStudents.value.length === 0) return message.warning('请至少选择一位成员');

  loading.value = true;
  const classId = classesStore.currentClass?.id;
  if (!classId) {
    loading.value = false;
    return;
  }

  const newChat: GroupChat = {
    id: `g_${Date.now()}`,
    name: newGroupName.value,
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + encodeURIComponent(newGroupName.value),
    lastMessage: '群聊已创建',
    lastSender: '系统',
    lastMessageTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    unreadCount: 0,
    memberCount: selectedStudents.value.length + 1
  };

  if (!classesStore.classGroupChats[classId]) {
    classesStore.classGroupChats[classId] = [];
  }
  classesStore.classGroupChats[classId].unshift(newChat);

  createGroupChatVisible.value = false;
  newGroupName.value = '';
  selectedStudents.value = [];
  loading.value = false;
  message.success('群聊创建成功');
};
</script>

<style scoped>
.group-chat-list {
  background-color: var(--app-bg);
  border-radius: 8px;
  padding: 8px;
}

.group-chat-item {
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--app-border) !important;
}

.group-chat-item:hover {
  background-color: var(--app-hover);
}

.group-chat-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--app-text-main);
}

.chat-time {
  font-size: 12px;
  color: var(--app-text-sub);
}

.group-chat-desc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.chat-last-msg {
  font-size: 13px;
  color: var(--app-text-sub);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 85%;
}

.chat-sender {
  color: var(--app-text-sub);
}

.chat-badge {
  transform: scale(0.9);
}

.chat-board-container {
  flex: 1;
  height: 100%;
}
</style>
