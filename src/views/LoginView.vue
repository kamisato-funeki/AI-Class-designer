<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">
      <div class="login-header">
        <div class="logo">ACD</div>
        <h1 class="welcome-text">欢迎来到 AI Class Designer</h1>
        <p class="sub-text">开启您的智能备课之旅</p>
      </div>

      <div class="auth-mode-toggle">
        <a-radio-group v-model:value="authMode" button-style="solid" size="large">
          <a-radio-button value="login">登录</a-radio-button>
          <a-radio-button value="register">注册</a-radio-button>
        </a-radio-group>
      </div>

      <a-tabs v-model:activeKey="activeKey" centered>
        <a-tab-pane key="account" tab="账号密码">
          <a-form ref="accountFormRef" :model="formState" :rules="rules" class="login-form" layout="vertical">
            <a-form-item name="username">
              <a-input v-model:value="formState.username" placeholder="请输入账号" class="auth-input" />
            </a-form-item>
            <a-form-item name="password">
              <a-input-password v-model:value="formState.password" placeholder="请输入密码" class="auth-input" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" block size="large" :loading="loading" @click="handleSubmit('account')" class="login-btn">
                {{ authMode === 'login' ? '立即登录' : '立即注册' }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="phone" tab="手机验证码">
          <a-form ref="phoneFormRef" :model="formState" :rules="rules" class="login-form" layout="vertical">
            <a-form-item name="phone">
              <a-input v-model:value="formState.phone" placeholder="请输入手机号" class="auth-input" />
            </a-form-item>
            <a-form-item name="code">
              <a-input-search v-model:value="formState.code" placeholder="请输入验证码" enter-button="获取验证码" size="large"
                class="auth-input CodeInput" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" block size="large" :loading="loading" @click="handleSubmit('phone')" class="login-btn">
                {{ authMode === 'login' ? '立即登录' : '立即注册' }}
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { useUserStore } from '../stores/userStore';

const router = useRouter();
const userStore = useUserStore();

const activeKey = ref('account');
const authMode = ref<'login' | 'register'>('login');
const loading = ref(false);

const accountFormRef = ref();
const phoneFormRef = ref();

const formState = reactive({
  username: 'kamisato',
  password: '12345678',
  phone: '',
  code: '',
});

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{8,}$/, message: '密码至少8位数，且只能包含字母或数字', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
};

watch(authMode, () => {
  accountFormRef.value?.clearValidate();
  phoneFormRef.value?.clearValidate();
});

const handleSubmit = async (type: 'account' | 'phone') => {
  try {
    if (type === 'account') {
      await accountFormRef.value?.validate();
    } else {
      await phoneFormRef.value?.validate();
    }

    loading.value = true;

    // Simulate 2s delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (authMode.value === 'login') {
      if (type === 'account') {
        await userStore.login(formState.username, formState.password);
      } else {
        // mock phone login
        await userStore.login(formState.phone, formState.code);
      }
      message.success('登录成功');
    } else {
      const data: Record<string, string> = type === 'account' 
        ? { username: formState.username, password: formState.password }
        : { phone: formState.phone, code: formState.code };
      await userStore.register(data);
      message.success('注册成功');
    }

    router.push('/');
  } catch (error) {
    console.error('Validation failed:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 32px 16px;
  border-radius: 16px;
  box-shadow: var(--shadow-xl);
  background: var(--app-panel);
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: var(--color-primary);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
}

.welcome-text {
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-main);
  margin-bottom: 8px;
}

.sub-text {
  color: var(--app-text-sub);
}

.auth-mode-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.auth-input {
  /* Minimal bottom border style as per design doc */
  border: none;
  border-bottom: 1px solid var(--app-border);
  border-radius: 0;
  padding: 12px 0;
  box-shadow: none !important;
  background: transparent;
  color: var(--app-text-main);
}

.auth-input:focus,
.auth-input:hover {
  border-bottom-color: var(--color-primary);
}

:deep(.CodeInput .ant-input-group-addon button) {
  border-radius: 0 8px 8px 0 !important;
}

.login-btn {
  margin-top: 16px;
  border-radius: 8px;
  background-color: var(--color-cta);
}

.login-btn:hover {
  background-color: #16a34a !important;
  /* Tailwind green-600 eq */
}
</style>
