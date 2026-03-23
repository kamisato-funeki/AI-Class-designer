<!--
  登录/注册页面 (LoginView)
  业务逻辑：
  1. 提供统一的身份验证入口，支持登录和注册两种模式。
  2. 登录方式包含：账号密码登录、手机验证码登录。
  3. 包含完整的表单校验逻辑（如密码复杂度要求、手机号必填等）。
  4. 与 userStore 联动，处理登录态持久化和路由跳转。
-->
<template>
  <div class="login-container">
    <a-card class="login-card" :bordered="false">
      <div class="login-header">
        <div class="logo">ACD</div>
        <h1 class="welcome-text">欢迎来到 AI Class Designer</h1>
        <p class="sub-text">开启您的智能备课之旅</p>
      </div>

      <div class="auth-mode-toggle">
        <!-- 切换 登录 / 注册 模式 -->
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

/**
 * 路由与全局状态库初始化
 */
const router = useRouter();       // 路由实例：负责认证成功后的系统重定向
const userStore = useUserStore(); // 用户仓库：封装了 Token 存储、个人信息拉取、登录及注册的 Mock/真实后端接口

/**
 * 【响应式变量】UI 交互状态集
 */
const activeKey = ref('account');                     // 当前认证页签：'account'(传统账号) / 'phone'(快捷手机号)
const authMode = ref<'login' | 'register'>('login');  // 当前认证行为：'login'(登录态获取) / 'register'(新用户入库)
const loading = ref(false);                           // 全局请求加载锁：用于控制按钮状态并防止网络竞态叠加

/**
 * 【表单逻辑引用】
 */
const accountFormRef = ref(); // 指向账号表单实例，用于触发 Ant Design 内置校验逻辑
const phoneFormRef = ref();   // 指向手机表单实例，用于触发 Ant Design 内置校验逻辑

/**
 * 【表单暂存数据】formState
 * 作用：作为整个登录页的数据中心，实时映射用户的键盘输入
 */
const formState = reactive({
  username: 'kamisato', // 预设账号（仅为 Mock 测试方便）
  password: '12345678', // 预设密码（仅为 Mock 测试方便）
  phone: '',            // 手机号字段
  code: '',             // 动态验证码字段
});

/**
 * 【数据模型校验规则】rules
 * 作用：声明前端业务约束逻辑
 * 策略：
 * 1. 必填项约束：所有输入字段均不能为空。
 * 2. 密码强度策略：声明 8 位及以上、且仅包含数字或字母的正则表达式约束。
 */
const rules = {
  username: [{ required: true, message: '请填写账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请填写密码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{8,}$/, message: '安全风险：密码长度需至少8位并仅包含字母数字', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请填写手机号码', trigger: 'blur' }],
  code: [{ required: true, message: '请填写动态验证码', trigger: 'blur' }],
};

/**
 * 【侦听器】authMode
 * 作用：模式感知与上下文清理
 * 业务逻辑：当用户在登录与注册视图间反复横跳时，自动静默清除已出现的表单红色报警提示，保证用户体验的纯净。
 */
watch(authMode, () => {
  accountFormRef.value?.clearValidate();
  phoneFormRef.value?.clearValidate();
});

/**
 * 【异步业务函数】handleSubmit
 * 作用：最终的身份验证网关入口
 * @param type 当前操作的表单类型枚举 ('account' | 'phone')
 * 业务逻辑：
 * 1. 同步校验：调用 Ant Design 的 Form Validate 接口扫描前端层违规项。
 * 2. 入锁：激活 loading 态，防止用户在慢网络下疯狂点击按钮。
 * 3. 异步认证流：根据 authMode 分发至 userStore 对应的 login/register 逻辑。
 * 4. 反馈：操作成功后弹出全局提示，并根据业务需求重定向至系统的核心控制台 Dashboard。
 */
const handleSubmit = async (type: 'account' | 'phone') => {
  try {
    // A. 触发所属表单的严格校验逻辑
    if (type === 'account') {
      await accountFormRef.value?.validate();
    } else {
      await phoneFormRef.value?.validate();
    }

    loading.value = true;

    // B. 人机交互延迟模拟 (增强流程感知)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // C. 分发具体业务逻辑指令
    if (authMode.value === 'login') {
      // 执行登录鉴权
      if (type === 'account') {
        await userStore.login(formState.username, formState.password);
      } else {
        await userStore.login(formState.phone, formState.code);
      }
      message.success('身份验证通过，正在登陆控制台...');
    } else {
      // 执行用户注册
      const data: Record<string, string> = type === 'account' 
        ? { username: formState.username, password: formState.password }
        : { phone: formState.phone, code: formState.code };
      await userStore.register(data);
      message.success('账号创建成功，请开始使用！');
    }

    // D. 跳转至核心主路由
    router.push('/');
  } catch (error) {
    console.error('认证链路异常:', error);
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
