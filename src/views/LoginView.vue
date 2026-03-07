<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">
      <div class="login-header">
        <div class="logo">ACD</div>
        <h1 class="welcome-text">欢迎来到 AI Class Designer</h1>
        <p class="sub-text">开启您的智能备课之旅</p>
      </div>

      <a-tabs v-model:activeKey="activeKey" centered>
        <a-tab-pane key="account" tab="账号密码登录">
          <a-form :model="formState" class="login-form" layout="vertical">
            <a-form-item>
              <a-input v-model:value="formState.username" placeholder="请输入账号 / 手机号" class="auth-input" />
            </a-form-item>
            <a-form-item>
              <a-input-password v-model:value="formState.password" placeholder="请输入密码" class="auth-input" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" block size="large" @click="handleLogin" class="login-btn">
                立即登录
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="phone" tab="手机验证码登录">
          <a-form :model="formState" class="login-form" layout="vertical">
            <a-form-item>
              <a-input v-model:value="formState.phone" placeholder="请输入手机号" class="auth-input" />
            </a-form-item>
            <a-form-item>
              <a-input-search v-model:value="formState.code" placeholder="请输入验证码" enter-button="获取验证码" size="large"
                class="auth-input" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" block size="large" @click="handleLogin" class="login-btn">
                立即登录
              </a-button>
            </a-form-item>
          </a-form>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activeKey = ref('account');

const formState = reactive({
  username: '',
  password: '',
  phone: '',
  code: '',
});

const handleLogin = () => {
  // Skeleton logic: simulate login and go to home
  router.push('/');
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
  margin-bottom: 32px;
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
