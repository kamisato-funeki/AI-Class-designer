<template>
  <div class="profile-container">
    <div class="page-header">
      <h2>个人中心</h2>
    </div>

    <div class="content-split">
      <!-- Left: Profile Summary -->
      <div class="summary-area">
        <a-card class="summary-card shadow-card">
          <div class="avatar-wrapper">
            <a-avatar :size="80" :src="profileData.avatar" style="background-color: var(--color-primary)">
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
        <!-- My Classes -->
        <a-card title="我的班级" class="mb-24 shadow-card">
          <a-list :grid="{ gutter: 16, column: 2 }" :data-source="classesStore.classes">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-card :title="item.name" size="small" hoverable class="shadow-card">
                  <p class="class-info">学生人数：{{ item.studentCount || 0 }}人</p>
                  <p class="class-info">年级：{{ item.grade }}</p>
                </a-card>
              </a-list-item>
            </template>
          </a-list>
        </a-card>

        <!-- Security Settings -->
        <!-- Security Settings -->
        <a-card title="安全设置" class="shadow-card">
          <a-list item-layout="horizontal">
            <a-list-item>
              <a-list-item-meta title="账号密码" description="当前密码强度：强" />
              <template #actions><a-button type="primary" ghost class="action-btn" @click="isPasswordModalVisible = true">修改</a-button></template>
            </a-list-item>
            <a-list-item v-if="!profileData.email">
              <a-list-item-meta title="绑定邮箱" description="未绑定" />
              <template #actions><a-button type="primary" ghost class="action-btn">绑定</a-button></template>
            </a-list-item>
            <a-list-item v-else>
              <a-list-item-meta title="绑定邮箱" :description="`已绑定：${profileData.email}`" />
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
          <a-col :span="24">
            <a-form-item label="头像">
              <div style="display: flex; align-items: center; gap: 16px;">
                <a-avatar :size="64" :src="editForm.avatar" style="background-color: var(--color-primary)">
                  <template #icon><UserOutlined /></template>
                </a-avatar>
                <a-button type="primary" ghost class="action-btn" @click="triggerAvatarUpload">更换头像</a-button>
                <input type="file" ref="avatarInputRef" accept="image/*" style="display: none" @change="handleAvatarChange" />
              </div>
            </a-form-item>
          </a-col>
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


    <!-- Modify Password Modal -->
    <a-modal v-model:open="isPasswordModalVisible" title="修改账号密码" @ok="handleSavePassword" @cancel="isPasswordModalVisible = false">
      <a-form layout="vertical">
        <a-form-item label="原密码">
          <a-input-password v-model:value="passwordForm.old" />
        </a-form-item>
        <a-form-item label="新密码">
          <a-input-password v-model:value="passwordForm.new" />
        </a-form-item>
        <a-form-item label="确认新密码">
          <a-input-password v-model:value="passwordForm.confirm" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Avatar Cropper Modal -->
    <a-modal v-model:open="isAvatarModalVisible" title="裁剪头像" @ok="handleUploadAvatar" @cancel="isAvatarModalVisible = false" width="600px">
      <div class="cropper-wrapper" style="height: 400px;">
        <vueCropper
          ref="cropperRef"
          :img="cropperImg"
          :outputSize="1"
          outputType="png"
          :info="true"
          :canScale="true"
          :autoCrop="true"
          :autoCropWidth="200"
          :autoCropHeight="200"
          :fixed="true"
          :fixedNumber="[1, 1]"
          :centerBox="true"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { UserOutlined } from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/userStore';
import { useClassesStore } from '../stores/classesStore';
import { VueCropper } from 'vue-cropper';
import 'vue-cropper/dist/index.css';

const router = useRouter();
const userStore = useUserStore();
const classesStore = useClassesStore();

// Profile Data
const profileData = computed(() => userStore.user || {} as Record<string, unknown>);

onMounted(() => {
  if (classesStore.classes.length === 0) {
    classesStore.loadClasses();
  }
});

const getSubjectName = (val: unknown) => {
  if (typeof val !== 'string') return '';
  const map: Record<string, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语'
  };
  return map[val] || val;
};

// Edit Profile Modal
const isEditModalVisible = ref(false);
const editForm = reactive({ name: '', subject: '', school: '', bio: '', avatar: '' });

const handleEditProfile = () => {
  Object.assign(editForm, {
    name: profileData.value.name,
    subject: profileData.value.subject,
    school: profileData.value.school,
    bio: profileData.value.bio,
    avatar: profileData.value.avatar
  });
  isEditModalVisible.value = true;
};

const handleSaveProfile = async () => {
  try {
    await userStore.updateProfile(editForm);
    isEditModalVisible.value = false;
    message.success('个人资料已保存');
  } catch {
    message.error('保存失败');
  }
};



// Password Modal
const isPasswordModalVisible = ref(false);
const passwordForm = reactive({ old: '', new: '', confirm: '' });

const handleSavePassword = async () => {
  if (passwordForm.new !== passwordForm.confirm) {
    message.error('两次输入的新密码不一致');
    return;
  }
  try {
    await userStore.updatePassword(passwordForm.new);
    isPasswordModalVisible.value = false;
    message.success('密码修改成功');
    passwordForm.old = '';
    passwordForm.new = '';
    passwordForm.confirm = '';
  } catch {
    message.error('修改密码失败');
  }
};

// Logout handler
const handleLogout = () => {
  Modal.confirm({
    title: '确认退出',
    content: '您确定要退出当前账号吗？',
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      await userStore.logout();
      message.success('已退出登录');
      router.push('/login');
    },
    onCancel() { },
  });
};

// Avatar Upload & Crop
const avatarInputRef = ref<HTMLInputElement | null>(null);
const isAvatarModalVisible = ref(false);
const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null);
const cropperImg = ref('');

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click();
};

const handleAvatarChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (evt) => {
    cropperImg.value = evt.target?.result as string;
    isAvatarModalVisible.value = true;
  };
  reader.readAsDataURL(file);
  target.value = ''; // Reset
};

const handleUploadAvatar = () => {
  if (!cropperRef.value) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (cropperRef.value as any).getCropData(async (dataUrl: string) => {
    try {
      await userStore.updateAvatar(dataUrl);
      editForm.avatar = dataUrl;
      isAvatarModalVisible.value = false;
      message.success('头像上传成功');
    } catch {
      message.error('头像上传失败');
    }
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
  color: var(--app-text-sub);
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
  color: var(--app-text-sub);
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
  color: var(--app-text-main);
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
  color: var(--app-text-sub);
}

.shadow-card {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
  transition: all 0.3s;
}

.shadow-card:hover {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.08), 0 6px 16px 0 rgba(0, 0, 0, 0.05);
}

html[data-theme='dark'] .shadow-card {
  box-shadow: 0 1px 2px -2px rgba(0, 0, 0, 0.32), 0 3px 6px 0 rgba(0, 0, 0, 0.24), 0 5px 12px 4px rgba(0, 0, 0, 0.18);
}

html[data-theme='dark'] .shadow-card:hover {
  box-shadow: 0 4px 8px -4px rgba(0, 0, 0, 0.38), 0 6px 16px 0 rgba(0, 0, 0, 0.28), 0 8px 24px 8px rgba(0, 0, 0, 0.22);
}

.action-btn {
  border-radius: 6px;
}

.cropper-wrapper {
  background-color: var(--app-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}
</style>
