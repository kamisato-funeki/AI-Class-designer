<!--
  登录/注册页面 (LoginView)
  设计参考：neumorphic 风格，整体使用统一背景色 #f6f7f9
  业务逻辑：
  1. 提供统一的身份验证入口，支持登录和注册两种模式。
  2. 登录方式包含：账号密码登录、手机验证码登录。
  3. 包含完整的表单校验逻辑（如密码复杂度要求、手机号必填等）。
  4. 与 userStore 联动，处理登录态持久化和路由跳转。

  布局结构：
  - .shell：最外层凸起卡片，neumorphic 外阴影，overflow:hidden 统一裁剪
  - .switch：欢迎侧面板，绝对定位在左侧，含两个装饰圆圈
  - .container.a-container：注册表单侧（右侧，z-index 较高）
  - .container.b-container：登录表单侧（右侧，z-index 较低）
  - 切换时通过 is-txr / is-txl class 控制滑动动画
-->
<template>
  <div class="login-container">
    <div class="shell">

      <!-- =====================================================
           注册表单侧（a-container）
           默认在右侧，z-index:100（前景）
           ===================================================== -->
      <div class="container a-container" :class="{ 'is-txl': isLogin }" id="a-container">
        <div class="form">
          <!-- 注册表单标题 -->
          <h2 class="form-title">创建账号</h2>

          <!-- 快捷登录图标区 -->
          <div class="form-icons">
            <!-- 电话图标：切换至手机验证码注册 -->
            <button
              class="icon-btn"
              :class="{ active: activeKey === 'phone' }"
              title="手机验证码注册"
              @click="activeKey = activeKey === 'phone' ? 'account' : 'phone'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.28-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
          </div>

          <!-- 副文案 -->
          <span class="form-span">选择注册方式或电子邮箱注册</span>

          <!-- 账号密码/手机验证码注册表单 -->
          <div class="forms-wrapper">
            <Transition name="form-fade">
              <a-form
                v-if="activeKey === 'account'"
                key="account"
                ref="registerAccountFormRef"
                :model="formState"
                :rules="rules"
                class="auth-form"
                layout="vertical"
              >
                <a-form-item name="username">
                  <a-input v-model:value="formState.username" placeholder="账号" class="form-input" />
                </a-form-item>
                <a-form-item name="password">
                  <a-input-password v-model:value="formState.password" placeholder="密码" class="form-input" />
                </a-form-item>
              </a-form>
              <a-form
                v-else
                key="phone"
                ref="registerPhoneFormRef"
                :model="formState"
                :rules="rules"
                class="auth-form"
                layout="vertical"
              >
                <a-form-item name="phone">
                  <a-input v-model:value="formState.phone" placeholder="手机号" class="form-input" />
                </a-form-item>
                <a-form-item name="code">
                  <div class="code-row">
                    <a-input v-model:value="formState.code" placeholder="验证码" class="form-input code-input" />
                    <button
                      class="code-btn"
                      :class="{ 'code-btn--disabled': countdown > 0 }"
                      :disabled="countdown > 0"
                      type="button"
                      @click="startCountdown"
                    >
                      {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                    </button>
                  </div>
                </a-form-item>
              </a-form>
            </Transition>
          </div>

          <!-- 注册提交按钮 -->
          <button
            class="form-button submit"
            :disabled="loading"
            @click="handleSubmit(activeKey)"
          >
            {{ loading ? '处理中...' : 'SIGN UP' }}
          </button>
        </div>
      </div>

      <!-- =====================================================
           登录表单侧（b-container）
           默认在右侧，z-index:0（背景）
           ===================================================== -->
      <div class="container b-container" :class="{ 'is-txl': isLogin, 'is-z': isLogin }" id="b-container">
        <div class="form">
          <!-- 登录表单标题 -->
          <h2 class="form-title">登入账号</h2>

          <!-- 快捷登录图标区 -->
          <div class="form-icons">
            <!-- 电话图标：切换至手机验证码登录 -->
            <button
              class="icon-btn"
              :class="{ active: activeKey === 'phone' }"
              title="手机验证码登录"
              @click="activeKey = activeKey === 'phone' ? 'account' : 'phone'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.28-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </button>
          </div>

          <!-- 副文案 -->
          <span class="form-span">选择登录方式或电子邮箱登录</span>

          <!-- 账号密码登录表单 -->
          <div class="forms-wrapper">
            <Transition name="form-fade">
              <a-form
                v-if="activeKey === 'account'"
                key="account"
                ref="accountFormRef"
                :model="formState"
                :rules="rules"
                class="auth-form"
                layout="vertical"
              >
                <a-form-item name="username">
                  <a-input v-model:value="formState.username" placeholder="账号" class="form-input" />
                </a-form-item>
                <a-form-item name="password">
                  <a-input-password v-model:value="formState.password" placeholder="密码" class="form-input" />
                </a-form-item>
              </a-form>
              <a-form
                v-else
                key="phone"
                ref="phoneFormRef"
                :model="formState"
                :rules="rules"
                class="auth-form"
                layout="vertical"
              >
                <a-form-item name="phone">
                  <a-input v-model:value="formState.phone" placeholder="手机号" class="form-input" />
                </a-form-item>
                <a-form-item name="code">
                  <div class="code-row">
                    <a-input v-model:value="formState.code" placeholder="验证码" class="form-input code-input" />
                    <button
                      class="code-btn"
                      :class="{ 'code-btn--disabled': countdown > 0 }"
                      :disabled="countdown > 0"
                      type="button"
                      @click="startCountdown"
                    >
                      {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                    </button>
                  </div>
                </a-form-item>
              </a-form>
            </Transition>
          </div>

          <!-- 找回密码链接：始终占位，防止切换时错位 -->
          <a
            class="form-link"
            :style="{ opacity: activeKey === 'account' ? 1 : 0, pointerEvents: activeKey === 'account' ? 'auto' : 'none' }"
          >忘记密码？</a>

          <!-- 登录提交按钮 -->
          <button
            class="form-button submit"
            :disabled="loading"
            @click="handleSubmit(activeKey)"
          >
            {{ loading ? '处理中...' : 'SIGN IN' }}
          </button>
        </div>
      </div>

      <!-- =====================================================
           欢迎侧面板（.switch）
           绝对定位在左侧，z-index:200（最前层）
           含两个 neumorphic 装饰圆圈
           is-txr：切换至注册时滑至右侧
           ===================================================== -->
      <div class="switch" :class="{ 'is-txr': isLogin, 'is-gx': isAnimating }" id="switch-cnt">
        <!-- 装饰圆圈：底部大圆（inset 凹陷） -->
        <div class="switch-circle" :class="{ 'is-txr': isLogin }"></div>
        <!-- 装饰圆圈：顶部小圆（inset 凹陷） -->
        <div class="switch-circle switch-circle-t" :class="{ 'is-txr': isLogin }"></div>

        <!-- 欢迎侧内容 A：注册态（初始显示） -->
        <div class="switch-container" :class="{ 'is-hidden': isLogin }" id="switch-c1">
          <h2 class="switch-title">Welcome Back！</h2>
          <p class="switch-description">已经有账号了？登入账号，开始您的智能备课之旅！</p>
          <!-- 切换至登录态 -->
          <button class="switch-btn" @click="changeForm">SIGN IN</button>
        </div>

        <!-- 欢迎侧内容 B：登录态（初始隐藏） -->
        <div class="switch-container" :class="{ 'is-hidden': !isLogin }" id="switch-c2">
          <h2 class="switch-title">Hello Friend！</h2>
          <p class="switch-description">注册一个账号，开启您的 AI 智能备课之旅！</p>
          <!-- 切换至注册态 -->
          <button class="switch-btn" @click="changeForm">SIGN UP</button>
        </div>
      </div>

    </div>
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
const userStore = useUserStore(); // 用户仓库：封装了 Token 存储、个人信息拉取、登录及注册接口

/**
 * 【响应式变量】UI 交互状态集
 */
const isLogin = ref(true);                            // 当前是否处于登录态（true=登录，false=注册）
const isAnimating = ref(false);                       // 切换动画锁，控制 is-gx 动画 class
const activeKey = ref<'account' | 'phone'>('account'); // 当前表单类型：账号密码 / 手机验证码
const loading = ref(false);                           // 全局请求加载锁

// 验证码倒计时
const countdown = ref(0);
let countdownTimer: ReturnType<typeof setInterval> | null = null;
const startCountdown = async () => {
  if (countdown.value > 0) return;
  // 校验手机号
  try {
    const formRef = !isLogin.value ? registerPhoneFormRef.value : phoneFormRef.value;
    await formRef?.validateFields(['phone']);
  } catch {
    return;
  }
  countdown.value = 60;
  countdownTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);
};

/**
 * 【表单逻辑引用】
 */
const accountFormRef = ref();         // 登录-账号表单实例
const phoneFormRef = ref();           // 登录-手机表单实例
const registerAccountFormRef = ref(); // 注册-账号表单实例
const registerPhoneFormRef = ref();   // 注册-手机表单实例

/**
 * 【表单暂存数据】formState
 */
const formState = reactive({
  username: 'kamisato', // 预设账号（仅为 Mock 测试方便）
  password: '12345678', // 预设密码（仅为 Mock 测试方便）
  phone: '',
  code: '',
});

/**
 * 【数据模型校验规则】rules
 */
const rules = {
  username: [{ required: true, message: '请填写账号', trigger: 'blur' }],
  password: [
    { required: true, message: '请填写密码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{8}$/, message: '密码长度需至少8位并仅包含字母数字', trigger: 'blur' }
  ],
  phone: [{ required: true, message: '请填写手机号码', trigger: 'blur' }],
  code: [{ required: true, message: '请填写动态验证码', trigger: 'blur' }],
};

/**
 * 【切换动画函数】changeForm
 * 切换登录/注册态，触发 is-gx 宽度弹性动画（1.25s）
 */
const changeForm = () => {
  isAnimating.value = true;
  setTimeout(() => { isAnimating.value = false; }, 1500);
  isLogin.value = !isLogin.value;
  // 切换时清除表单校验提示
  accountFormRef.value?.clearValidate();
  phoneFormRef.value?.clearValidate();
  registerAccountFormRef.value?.clearValidate();
  registerPhoneFormRef.value?.clearValidate();
};

/**
 * 【异步业务函数】handleSubmit
 * @param type 当前操作的表单类型（'account' | 'phone'）
 */
const handleSubmit = async (type: 'account' | 'phone') => {
  try {
    // A. 触发校验
    if (isLogin.value) {
      if (type === 'account') await accountFormRef.value?.validate();
      else await phoneFormRef.value?.validate();
    } else {
      if (type === 'account') await registerAccountFormRef.value?.validate();
      else await registerPhoneFormRef.value?.validate();
    }

    loading.value = true;
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isLogin.value) {
      // 登录逻辑
      if (type === 'account') await userStore.login(formState.username, formState.password);
      else await userStore.login(formState.phone, formState.code);
      message.success('身份验证通过，正在登陆控制台...');
    } else {
      // 注册逻辑
      const data: Record<string, string> = type === 'account'
        ? { username: formState.username, password: formState.password }
        : { phone: formState.phone, code: formState.code };
      await userStore.register(data);
      message.success('账号创建成功，请开始使用！');
    }
    router.push('/');
  } catch (error) {
    console.error('认证链路异常:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 登录容器：全屏居中，使用项目全局背景变量 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
}

/* .shell：外层凸起卡片 */
.shell {
  position: relative;
  width: 1000px;
  min-width: 1000px;
  height: 600px;
  min-height: 600px;
  padding: 25px;
  background-color: #f6f7f9;
  box-shadow: 10px 10px 10px #b8c2cc, -10px -10px 10px #ffffff;
  border-radius: 12px;
  overflow: hidden;
}

@media (max-width: 1200px) { .shell { transform: scale(0.85); } }
@media (max-width: 1000px) { .shell { transform: scale(0.7); } }
@media (max-width: 800px)  { .shell { transform: scale(0.55); } }

/* .container：表单侧面板，绝对定位 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  width: 600px;
  height: 100%;
  padding: 25px;
  background-color: #f6f7f9;
  transition: 1.25s;
}

.a-container { z-index: 100; left: calc(100% - 600px); }
.b-container { left: calc(100% - 600px); z-index: 0; }
.is-txl { left: 0; transition: 1.25s; transform-origin: right; }
.is-z   { z-index: 200; transition: 1.25s; }

/* .form：表单内部布局 */
.form {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.form-title {
  font-size: 34px;
  font-weight: 700;
  line-height: 3;
  color: #181818;
  letter-spacing: 6px;
  text-align: center;
}

.form-icons {
  display: flex;
  gap: 10px;
  margin-bottom: 4px;
}

/* icon-btn：参考样例 iconfont 风格，描边圆形 + opacity 渐变 */
.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #a0a5a8;
  background: transparent;
  color: #a0a5a8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.6;
  box-shadow: none;
  transition: opacity 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.icon-btn:hover { opacity: 1; color: #6b7280; border-color: #6b7280; }
.icon-btn.active { opacity: 1; color: #4B70E2; border-color: #4B70E2; box-shadow: none; }

.form-span {
  margin-top: 30px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #a0a5a8;
}

.form-link {
  color: #181818;
  font-size: 13px;
  margin-top: 16px;
  border-bottom: 1px solid #a0a5a8;
  line-height: 2;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.35s ease;
}

.auth-form { width: 350px; margin-bottom: 0; }
:deep(.auth-form .ant-form-item) { margin-bottom: 0; }
:deep(.auth-form .ant-form-item-explain-error) { font-size: 11px; }

/* forms-wrapper：固定高度容器，两个表单绝对叠放，防止 v-show 切换引起高度变化 */
.forms-wrapper {
  position: relative;
  width: 350px;
  height: 96px; /* 两个 form-item（各约 48px）的总高度 */
}

.forms-wrapper .auth-form {
  position: absolute;
  top: 0;
  left: 0;
  width: 350px;
}

/* form-fade：表单切换 opacity 渐变动画 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: opacity 0.35s ease;
}
.form-fade-enter-from,
.form-fade-leave-to {
  opacity: 0;
}
.form-fade-enter-to,
.form-fade-leave-from {
  opacity: 1;
}

/* form-input：neumorphic inset 输入框，背景与整体一致 #f6f7f9 */
:deep(.form-input.ant-input) {
  width: 350px;
  height: 40px;
  margin: 4px 0;
  padding-left: 25px;
  font-size: 13px;
  border: none !important;
  outline: none !important;
  background-color: #f6f7f9 !important;
  border-radius: 8px !important;
  box-shadow: inset 2px 2px 4px #c8d0da, inset -2px -2px 4px #f9f9f9 !important;
  color: #181818 !important;
  transition: box-shadow 0.25s ease !important;
}
:deep(.form-input.ant-input:focus) {
  box-shadow: inset 4px 4px 4px #c8d0da, inset -4px -4px 4px #f9f9f9 !important;
}

:deep(.form-input.ant-input-affix-wrapper) {
  width: 350px;
  margin: 4px 0;
  padding: 0 11px 0 0;
  border: none !important;
  background-color: #f6f7f9 !important;
  border-radius: 8px !important;
  box-shadow: inset 2px 2px 4px #c8d0da, inset -2px -2px 4px #f9f9f9 !important;
  transition: box-shadow 0.25s ease !important;
}
:deep(.form-input.ant-input-affix-wrapper-focused) {
  box-shadow: inset 4px 4px 4px #c8d0da, inset -4px -4px 4px #f9f9f9 !important;
}
:deep(.form-input.ant-input-affix-wrapper .ant-input) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  height: 38px;
  padding-left: 25px;
  color: #181818 !important;
}

/* CodeInput：验证码输入框（table 布局） */
:deep(.CodeInput.ant-input-search .ant-input-wrapper.ant-input-group) {
  display: table !important;
  width: 350px !important;
  margin: 4px 0;
  border: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 2px 2px 4px #c8d0da, inset -2px -2px 4px #f9f9f9;
  background: #f6f7f9;
  transition: box-shadow 0.25s ease;
}
:deep(.CodeInput.ant-input-search .ant-input-wrapper.ant-input-group:focus-within) {
  box-shadow: inset 4px 4px 4px #c8d0da, inset -4px -4px 4px #f9f9f9;
}
:deep(.CodeInput.ant-input-search .ant-input-wrapper.ant-input-group > .ant-input) {
  display: table-cell !important;
  width: 100% !important;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  padding: 8px 12px 8px 25px;
  border-radius: 0 !important;
  color: #181818;
  font-size: 13px;
}
:deep(.CodeInput.ant-input-search .ant-input-group-addon) {
  display: table-cell !important;
  width: 80px !important;
  white-space: nowrap;
  vertical-align: middle;
  border: none !important;
  border-left: 1px solid #c8d0da !important;
  background: transparent;
  padding: 0;
  flex-shrink: 0 !important;
}
:deep(.CodeInput .ant-input-group-addon .ant-btn) {
  width: 80px !important;
  height: 100% !important;
  min-height: 38px;
  border: none !important;
  border-radius: 0 !important;
  background: #f6f7f9 !important;
  color: #0891b2 !important;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: none !important;
}

/* .form-button：提交按钮，neumorphic 凸起 */
.form-button {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 40px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: #4B70E2;
  color: #f9f9f9;
  box-shadow: 8px 8px 16px #c8d0da, -8px -8px 16px #f9f9f9;
  border: none;
  outline: none;
  cursor: pointer;
  transition: box-shadow 0.25s ease, transform 0.25s;
}
.form-button:hover  { box-shadow: 6px 6px 10px #c8d0da, -6px -6px 10px #f9f9f9; transform: scale(0.985); }
.form-button:active { box-shadow: 2px 2px 6px #c8d0da, -2px -2px 6px #f9f9f9; transform: scale(0.97); }

/* .switch：欢迎侧面板，绝对定位左侧 */
.switch {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 400px;
  padding: 50px;
  z-index: 200;
  transition: 1.25s;
  background-color: #f6f7f9;
  overflow: hidden;
  box-shadow: 4px 4px 10px #c8d0da, -4px -4px 10px #c8d0da;
}

/* is-txr：切换至登录态，欢迎侧滑至右侧 */
.is-txr { left: calc(100% - 400px); transition: 1.25s; transform-origin: left; }

/* is-gx：切换时宽度弹性动画 */
.is-gx { animation: is-gx 1.25s; }
@keyframes is-gx {
  0%, 10%, 100% { width: 400px; }
  30%, 50%      { width: 500px; }
}

/* 装饰圆圈：inset 凹陷 */
.switch-circle {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background-color: #f6f7f9;
  box-shadow: inset 8px 8px 12px #b8bec7, inset -8px -8px 12px #fff;
  bottom: -60%;
  left: -60%;
  transition: 1.25s;
}
.switch-circle-t {
  top: -30%;
  left: 60%;
  bottom: auto;
  width: 300px;
  height: 300px;
}

/* 欢迎侧内容区 */
.switch-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  position: absolute;
  width: 400px;
  padding: 50px 55px;
  transition: 1.25s;
  text-align: center;
  /* 防止文字换行导致切换时出现错位 */
  white-space: nowrap;
}

.switch-title {
  font-size: 30px;
  font-weight: 700;
  line-height: 2;
  color: #181818;
}

.switch-description {
  font-size: 13px;
  letter-spacing: 0.25px;
  text-align: center;
  line-height: 1.6;
  color: #a0a5a8;
}

/* .switch-btn：欢迎侧切换按钮，neumorphic 凸起 */
.switch-btn {
  width: 180px;
  height: 50px;
  border-radius: 25px;
  margin-top: 40px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 1.15px;
  background-color: #4B70E2;
  color: #f9f9f9;
  box-shadow: 8px 8px 16px #c8d0da, -8px -8px 16px #f9f9f9;
  border: none;
  outline: none;
  cursor: pointer;
  transition: box-shadow 0.25s ease, transform 0.25s;
}
.switch-btn:hover  { box-shadow: 6px 6px 10px #c8d0da, -6px -6px 10px #f9f9f9; transform: scale(0.985); }
.switch-btn:active { box-shadow: 2px 2px 6px #c8d0da, -2px -2px 6px #f9f9f9; transform: scale(0.97); }

/* is-hidden：内容区淡出隐藏 */
.is-hidden {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  transition: 1.25s;
}

/* =====================================================
   验证码行：输入框与获取按钮分离
   ===================================================== */
.code-row {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 350px;
}

.code-input {
  flex: 1;
}

:deep(.code-input.ant-input) {
  width: 100% !important;
}

.code-btn {
  flex-shrink: 0;
  width: 100px;
  height: 40px;
  border-radius: 8px;
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background-color: #4B70E2;
  color: #f9f9f9;
  box-shadow: 3px 3px 6px #c8d0da, -3px -3px 6px #f9f9f9;
  transition: box-shadow 0.25s ease, transform 0.25s, background-color 0.25s;
  white-space: nowrap;
}

.code-btn:hover {
  box-shadow: 4px 4px 8px #c8d0da, -4px -4px 8px #f9f9f9;
  transform: scale(0.97);
}

.code-btn:active {
  box-shadow: inset 1px 1px 3px rgba(0,0,0,0.12), inset -1px -1px 3px rgba(255,255,255,0.8);
  transform: scale(0.95);
}

.code-btn--disabled {
  background-color: #c8cdd6 !important;
  color: #f5f5f5 !important;
  cursor: not-allowed !important;
  box-shadow: inset 2px 2px 4px #c8d0da, inset -2px -2px 4px #f9f9f9 !important;
  transform: none !important;
}
</style>