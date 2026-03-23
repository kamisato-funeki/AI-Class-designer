<!--
  个人中心页面 (ProfileView)
  业务逻辑：
  1. 展示教师的个人基本信息、任教背景及平台使用统计。
  2. 提供个人资料修改入口，包括头像裁剪上传功能。
  3. 集成安全设置管理（密码修改、邮箱绑定）。
  4. 展示教师管理的班级概览。
  5. 提供账号退出登录功能。
-->
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

      <!-- 右侧：详细信息与设置区域 -->
      <div class="detail-area">
        <!-- 我的班级列表 -->
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

        <!-- 安全设置模块 (密码、邮箱) -->
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

    <!-- 弹窗集锦：修改资料、修改密码、头像裁剪 -->
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
        <vue-cropper
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

/**
 * 核心状态与路由管理
 */
const router = useRouter();             // 路由实例：主要负责登出后的系统重定向
const userStore = useUserStore();       // 用户中心仓库：管理当前登陆者的全量画像数据及认证安全
const classesStore = useClassesStore(); // 班级数据仓库：用于辅助展示教师名下的关联班级

/**
 * 【计算属性】profileData
 * 作用：作为全局用户对象的 UI 层只读映射
 * 业务逻辑：双向绑定 userStore.user，确保任何资料修改都能第一时间在界面所有位置生效
 */
const profileData = computed(() => userStore.user || {} as Record<string, unknown>);

/**
 * 【生命周期钩子】onMounted
 * 作用：初始化辅助展示数据
 */
onMounted(() => {
  // 确保班级列表已就绪，以便在“我的班级”板块展示
  if (classesStore.classes.length === 0) {
    classesStore.loadClasses();
  }
});

/**
 * 【辅助格式化函数】getSubjectName
 * 作用：将科目枚举 Key 值转化为友好的中文展示
 * @param val 科目标识符
 */
const getSubjectName = (val: unknown) => {
  if (typeof val !== 'string') return '';
  const map: Record<string, string> = {
    math: '数学',
    chinese: '语文',
    english: '英语'
  };
  return map[val] || val;
};

/**
 * 【个人资料编辑相关状态集】
 */
const isEditModalVisible = ref(false); // 控制“资料修改”模态框显隐
const editForm = reactive({            // 暂存编辑中的中间态表单数据
  name: '', 
  subject: '', 
  school: '', 
  bio: '', 
  avatar: '' 
});

/**
 * 【函数】handleEditProfile
 * 作用：唤起编辑界面并预填数据
 */
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

/**
 * 【异步函数】handleSaveProfile
 * 作用：持久化执行个人资料更新
 * 业务逻辑：将 editForm 载体提交给 userStore 完成 Mock/后端同步
 */
const handleSaveProfile = async () => {
  try {
    await userStore.updateProfile(editForm);
    isEditModalVisible.value = false;
    message.success('您的个人名片已更新');
  } catch {
    message.error('资料保存服务暂时不可用，请稍后再试');
  }
};

/**
 * 【账户安全/密码修改相关状态】
 */
const isPasswordModalVisible = ref(false); // 控制“密码修改”模态框显隐
const passwordForm = reactive({            // 密码校验表单数据容器
  old: '',      // 旧密码占位
  new: '',      // 新密码
  confirm: ''   // 重复校对项
});

/**
 * 【异步函数】handleSavePassword
 * 作用：执行核心安全凭证更新
 * 业务逻辑：执行两次新密码的一致性校验，成功后重置本地表单并同步至 store
 */
const handleSavePassword = async () => {
  if (passwordForm.new !== passwordForm.confirm) {
    return message.error('两次输入的新密码不匹配，请重新输入');
  }
  try {
    await userStore.updatePassword(passwordForm.new);
    isPasswordModalVisible.value = false;
    message.success('登录密码已成功修改');
    // 强制重置敏感信息容器
    passwordForm.old = '';
    passwordForm.new = '';
    passwordForm.confirm = '';
  } catch {
    message.error('密码修改失败，请检查网络连接');
  }
};

/**
 * 【函数】handleLogout
 * 作用：安全退出登录流程
 * 业务逻辑：利用 Modal.confirm 提供阻断式确认，防止误触导致的工作进度损失
 */
const handleLogout = () => {
  Modal.confirm({
    title: '退出登录',
    content: '确认要退出当前账号并返回登录页面吗？',
    okText: '确认退出',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await userStore.logout();
      message.success('已安全退出账号');
      router.push('/login');
    }
  });
};

/**
 * 【头像高级控制：上传与裁剪】
 */
const avatarInputRef = ref<HTMLInputElement | null>(null); // 指向隐藏的 file 类型 input，用于触发系统文件选择器
const isAvatarModalVisible = ref(false);                    // 是否展示 VueCropper 裁剪弹窗
const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null); // 裁剪组件 DOM 实例引用
const cropperImg = ref('');                               // 待处理的原始图片数据 (Base64)

/**
 * 【函数】triggerAvatarUpload
 * 作用：通过代码指令触发原生文件上传窗口
 */
const triggerAvatarUpload = () => {
  avatarInputRef.value?.click();
};

/**
 * 【函数】handleAvatarChange
 * 作用：监听文件选择并初始化裁剪器
 * 业务逻辑：
 * 1. 捕获 input change 事件中的 File 对象。
 * 2. 利用 FileReader 将图片读入内存。
 * 3. 阻塞开启裁剪弹窗进行二次处理。
 */
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
  target.value = ''; // 保证下次选择同一文件时依然触发 change
};

/**
 * 【异步函数】handleUploadAvatar
 * 作用：完成裁剪并最终提交图像资源
 * 业务逻辑：
 * 1. 调用 VueCropper 生命周期方法获取裁剪后的 Base64 产物。
 * 2. 同步更新 userStore 与本地预览状态。
 */
const handleUploadAvatar = () => {
  if (!cropperRef.value) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (cropperRef.value as any).getCropData(async (dataUrl: string) => {
    try {
      await userStore.updateAvatar(dataUrl); 
      editForm.avatar = dataUrl;            // 确保编辑表单内的头像也实时更新
      isAvatarModalVisible.value = false;
      message.success('个人头像更新成功');
    } catch {
      message.error('头像上传异常');
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
