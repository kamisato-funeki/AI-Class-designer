<!--
  班级群聊列表组件 (ClassChats)
  业务逻辑：
  1. 展示当前班级所属的所有群聊集合。
  2. 支持发起新群聊，通过弹窗选择班级成员。
  3. 点击群聊项可进入对话看板展示模式。
  4. 实时显示每条群聊的最后消息预览及未读数。
-->
<template>
  <div style="height: 100%; display: flex; flex-direction: column;">
    <!-- 模式一：群聊列表视图 -->
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
                  <!-- 未读消息角标 -->
                  <a-badge v-if="item.unreadCount > 0" :count="item.unreadCount > 99 ? '99+' : item.unreadCount" class="chat-badge" />
                </div>
              </template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>

      <!-- 悬浮按钮：发起新群聊 -->
      <a-button type="primary" shape="circle" size="large"
        style="position: absolute; bottom: 32px; right: 32px; width: 48px; height: 48px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; justify-content: center; align-items: center;"
        @click="createGroupChatVisible = true">
        <span style="font-size: 24px; font-weight: 300; line-height: 1; margin-bottom: 2px;">+</span>
      </a-button>

      <!-- 发起群聊对话框 -->
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

    <!-- 模式二：单一群聊详情看板 -->
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

/**
 * 状态仓库
 */
const classesStore = useClassesStore(); // 班级数据仓库，管理群聊列表、成员信息及当前激活会话

/**
 * 【响应式变量】“发起新群聊”弹窗相关
 */
const createGroupChatVisible = ref(false);   // 控制发起群聊对话框的显隐
const newGroupName = ref('');               // 绑定的新群聊名称输入值
const selectedStudents = ref<string[]>([]);   // 存储在成员选择器中勾选的学生 ID 数组
const loading = ref(false);                    // 创建过程中的提交按钮加载状态

/**
 * 【异步函数】handleOpenGroupChat
 * 作用：点击列表项，进入特定群聊的对话模式
 * @param chat 选中的群聊对象
 */
const handleOpenGroupChat = async (chat: GroupChat) => {
  await classesStore.selectGroupChat(chat);
};

/**
 * 【异步函数】handleCreateGroupChat
 * 作用：执行“发起新群聊”的最终提交逻辑
 * 业务逻辑：
 * 1. 验证群名不为空，且至少选择了一名成员。
 * 2. 模拟生成唯一的群聊 ID 和默认头像。
 * 3. 构造群聊元数据（最后消息、时间、成员数等）。
 * 4. 更新 store 中的群聊集合，实现界面感知。
 * 5. 重置表单并关闭弹窗。
 */
const handleCreateGroupChat = async () => {
  // 1. 基础前置校验
  if (!newGroupName.value) return message.warning('请输入群聊名称');
  if (selectedStudents.value.length === 0) return message.warning('请至少选择一位成员');

  loading.value = true;
  const classId = classesStore.currentClass?.id;
  if (!classId) {
    loading.value = false;
    return;
  }

  // 2. 模拟后端生成新群聊记录
  const newChat: GroupChat = {
    id: `g_${Date.now()}`,
    name: newGroupName.value,
    // 使用随机 Shapes 头像服务
    avatar: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + encodeURIComponent(newGroupName.value),
    lastMessage: '群聊已创建',
    lastSender: '系统',
    lastMessageTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    unreadCount: 0,
    memberCount: selectedStudents.value.length + 1 // 学生数 + 教师本人
  };

  // 3. 将新群聊压入当前班级的群历史顶部
  if (!classesStore.classGroupChats[classId]) {
    classesStore.classGroupChats[classId] = [];
  }
  classesStore.classGroupChats[classId].unshift(newChat);

  // 4. 重置 UI 状态
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
