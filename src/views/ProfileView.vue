<template>
  <div class="profile-container">
    <div class="page-header">
      <h2>个人中心</h2>
    </div>

    <div class="content-split">
      <!-- Left: Profile Summary -->
      <div class="summary-area">
        <a-card class="summary-card">
          <div class="avatar-wrapper">
            <a-avatar :size="80" style="background-color: var(--color-primary)">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
          </div>
          <h3 class="user-name">{{ profileData.name }}</h3>
          <p class="user-role">{{ profileData.role }}</p>
          <a-divider />

          <div class="info-list">
            <div class="info-row">
              <span class="label">姓名</span>
              <span class="value">{{ profileData.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">任教科目</span>
              <span class="value">{{ getSubjectName(profileData.subject) }}</span>
            </div>
            <div class="info-row">
              <span class="label">所属学校</span>
              <span class="value">{{ profileData.school }}</span>
            </div>
            <div class="info-row">
              <span class="label">个人简介</span>
              <span class="value bio-text">{{ profileData.bio }}</span>
            </div>
            <a-divider />
            <div class="info-row">
              <span class="label">加入时间</span>
              <span class="value">{{ profileData.joinTime }}</span>
            </div>
            <div class="info-row">
              <span class="label">累计生成课件</span>
              <span class="value">{{ profileData.generationCount }} 份</span>
            </div>
          </div>

          <div class="action-buttons">
            <a-button type="primary" @click="handleEditProfile">修改资料</a-button>
            <a-button danger @click="handleLogout">退出账号</a-button>
          </div>
        </a-card>
      </div>

      <!-- Right: Detailed Info & Settings -->
      <div class="detail-area">
        <!-- My Classes -->
        <a-card title="我的班级" class="mb-24">
          <template #extra>
            <a-button type="link">添加班级</a-button>
          </template>
          <a-list :grid="{ gutter: 16, column: 2 }" :data-source="classesList">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-card :title="item.name" size="small" hoverable>
                  <p class="class-info">学生人数：{{ item.students }}人</p>
                  <p class="class-info">年级：{{ item.grade }}</p>
                </a-card>
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <!-- Security Settings -->
        <a-card title="安全设置">
          <a-list item-layout="horizontal">
            <a-list-item>
              <a-list-item-meta title="账号密码" description="当前密码强度：强" />
              <template #actions><a-button type="link">修改</a-button></template>
            </a-list-item>
            <a-list-item>
              <a-list-item-meta title="绑定手机" description="已绑定：138****8000" />
              <template #actions><a-button type="link">修改</a-button></template>
            </a-list-item>
            <a-list-item>
              <a-list-item-meta title="绑定邮箱" description="未绑定" />
              <template #actions><a-button type="link">绑定</a-button></template>
            </a-list-item>
          </a-list>
        </a-card>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <a-modal v-model:open="isEditModalVisible" title="修改个人资料" @ok="handleSaveProfile"
      @cancel="isEditModalVisible = false">
      <a-form layout="vertical" :model="editForm">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="姓名">
              <a-input v-model:value="editForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="任教科目">
              <a-select v-model:value="editForm.subject">
                <a-select-option value="math">数学</a-select-option>
                <a-select-option value="chinese">语文</a-select-option>
                <a-select-option value="english">英语</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="所属学校">
          <a-input v-model:value="editForm.school" />
        </a-form-item>
        <a-form-item label="个人简介">
          <a-textarea :rows="4" v-model:value="editForm.bio" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { UserOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';

// Profile Data
const profileData = reactive({
  name: '李雷',
  role: '特级教师',
  subject: 'math',
  school: '第一实验中学',
  bio: '致力于将数学与生活实际相结合，让学生在快乐中学习数学。',
  joinTime: '2023-09-01',
  generationCount: 128
});

const getSubjectName = (val: string) => {
  const map: Record<string, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语'
  };
  return map[val] || val;
};

// Classes List Data
const classesList = ref([
  { id: 1, name: '高一(1)班', students: 45, grade: '高一' },
  { id: 2, name: '高一(2)班', students: 42, grade: '高一' },
  { id: 3, name: '高二(3)班', students: 50, grade: '高二' },
]);

// Edit Profile Modal
const isEditModalVisible = ref(false);
const editForm = reactive({ ...profileData });

const handleEditProfile = () => {
  Object.assign(editForm, profileData);
  isEditModalVisible.value = true;
};

const handleSaveProfile = () => {
  Object.assign(profileData, editForm);
  isEditModalVisible.value = false;
  message.success('个人资料已保存');
};

// Logout handler
const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '您确定要退出当前账号吗？',
    okText: '确认',
    cancelText: '取消',
    onOk() {
      message.success('已退出登录');
      // Here usually we would clear the token and router.push('/login')
    },
    onCancel() { },
  });
};
</script>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.content-split {
  display: flex;
  gap: 24px;
}

.summary-area {
  flex: 0 0 340px;
}

.summary-card {
  border-radius: 12px;
  text-align: center;
}

.avatar-wrapper {
  margin-bottom: 16px;
}

.user-name {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.user-role {
  color: var(--color-text-sub-light, #8c8c8c);
  margin-bottom: 0;
}

.info-list {
  text-align: left;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  align-items: flex-start;
}

.info-row .label {
  color: var(--color-text-sub-light, #8c8c8c);
  flex-shrink: 0;
  margin-right: 16px;
}

.info-row .value {
  font-weight: 500;
  text-align: right;
}

.bio-text {
  max-width: 200px;
  word-break: break-all;
  color: var(--color-text-main, #333);
}

.action-buttons {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.detail-area {
  flex: 1;
}

.mb-24 {
  margin-bottom: 24px;
}

.class-info {
  margin: 0 0 8px 0;
  color: var(--color-text-sub-light, #8c8c8c);
}
</style>
