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
    <!-- 动态背景：仿照 01.html 的效果 -->
    <div class="background-animation">
      <ul class="square">
        <li></li><li></li><li></li><li></li><li></li>
      </ul>
      <ul class="circle">
        <li></li><li></li><li></li><li></li><li></li>
      </ul>
    </div>

    <!-- 左上角悬浮操作区（回到主页 & 切换明暗色系） -->
    <div class="floating-actions">
      <!-- 跳转回主页，暂时置空链接 -->
      <a-button shape="circle" size="large" class="float-btn" href="#" title="回到主页">
        <template #icon><HomeOutlined /></template>
      </a-button>
      <!-- 切换明暗配色按钮 -->
      <a-button shape="circle" size="large" class="float-btn" @click="toggleTheme" title="切换明暗配色">
        <template #icon><BulbOutlined /></template>
      </a-button>
    </div>

    <div class="shell">

      <!-- =====================================================
           注册表单侧（a-container）
           默认在右侧，z-index:100（前景）
           ===================================================== -->
      <div class="container a-container" :class="{ 'is-txl': isLogin }" :style="{ opacity: isLogin ? 0 : 1, visibility: isLogin ? 'hidden' : 'visible' }" id="a-container">
        <div class="form">
          <!-- 注册表单标题 -->
          <h2 class="form-title">创建账号</h2>




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
                <!-- 输入框：账号输入 -->
                <a-form-item name="username">
                  <a-input v-model:value="formState.username" placeholder="请输入账号" class="form-input" >
                    <!-- 对应的输入内容说明 -->
                    <template #prefix><span class="input-prefix">账号：</span></template>
                  </a-input>
                </a-form-item>
                <!-- 输入框：密码输入 -->
                <a-form-item name="password">
                  <a-input-password v-model:value="formState.password" placeholder="请输入密码" class="form-input" >
                    <template #prefix><span class="input-prefix">密码：</span></template>
                  </a-input-password>
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
                  <a-input v-model:value="formState.phone" placeholder="请输入手机号" class="form-input">
                    <template #prefix><span class="input-prefix">手机号：</span></template>
                  </a-input>
                </a-form-item>
                <a-form-item name="code">
                  <div class="code-row">
                    <a-input v-model:value="formState.code" placeholder="请输入验证码" class="form-input code-input">
                      <template #prefix><span class="input-prefix">验证码：</span></template>
                    </a-input>
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

          <!-- 副文案 -->
          <span class="form-span">选择注册方式或电子邮箱注册</span>

          <!-- 使用 Ant-Design 风格的图标组件控制登录方式的切换，放置于输入框下方 -->
          <div class="method-switcher">
            <a-tooltip placement="bottom" title="账号密码登录">
              <a-button type="text" :class="{ 'method-active': activeKey === 'account' }" @click="activeKey = 'account'">
                <template #icon><UserOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip placement="bottom" title="手机验证码登录">
              <a-button type="text" :class="{ 'method-active': activeKey === 'phone' }" @click="activeKey = 'phone'">
                <template #icon><MobileOutlined /></template>
              </a-button>
            </a-tooltip>
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
      <div class="container b-container" :class="{ 'is-txl': isLogin, 'is-z': isLogin }" :style="{ opacity: isLogin ? 1 : 0, visibility: isLogin ? 'visible' : 'hidden' }" id="b-container">
        <div class="form">
          <!-- 登录表单标题 -->
          <h2 class="form-title">登入账号</h2>




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
                <!-- 输入框：账号输入 -->
                <a-form-item name="username">
                  <a-input v-model:value="formState.username" placeholder="请输入账号" class="form-input" >
                    <template #prefix><span class="input-prefix">账号：</span></template>
                  </a-input>
                </a-form-item>
                <!-- 输入框：密码输入 -->
                <a-form-item name="password">
                  <a-input-password v-model:value="formState.password" placeholder="请输入密码" class="form-input" >
                    <template #prefix><span class="input-prefix">密码：</span></template>
                  </a-input-password>
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
                  <a-input v-model:value="formState.phone" placeholder="请输入手机号" class="form-input">
                    <template #prefix><span class="input-prefix">手机号：</span></template>
                  </a-input>
                </a-form-item>
                <a-form-item name="code">
                  <div class="code-row">
                    <a-input v-model:value="formState.code" placeholder="请输入验证码" class="form-input code-input">
                      <template #prefix><span class="input-prefix">验证码：</span></template>
                    </a-input>
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

          <!-- 副文案 -->
          <span class="form-span">选择登录方式或电子邮箱登录</span>

          <!-- 将切换图标调整至输入框和忘记密码中间 -->
          <div class="method-switcher">
            <a-button type="text" :class="{ 'method-active': activeKey === 'account' }" @click="activeKey = 'account'" title="账号密码">
              <template #icon><UserOutlined /></template>
            </a-button>
            <a-button type="text" :class="{ 'method-active': activeKey === 'phone' }" @click="activeKey = 'phone'" title="手机验证码">
              <template #icon><MobileOutlined /></template>
            </a-button>
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
// 导入需要的 Ant Design Vue 图标（Home、主题切换、登录方式切换等）
import { HomeOutlined, BulbOutlined, UserOutlined, MobileOutlined } from '@ant-design/icons-vue';
import { useUserStore } from '../stores/userStore';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * 【主题状态管理】
 * 控制系统当前的亮暗色模式
 */
const settingsStore = useSettingsStore();

const toggleTheme = () => {
  const newTheme = settingsStore.theme === 'light' ? 'dark' : 'light';
  settingsStore.toggleTheme(newTheme);
};

// 【初始化主题状态】
onMounted(() => {
  // 设置已由 settingsStore 全局管理
});

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
/* =====================================================
   动态背景动画与毛玻璃效果
   ===================================================== */
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}
.background-animation ul li {
  position: absolute;
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  width: 30px;
  height: 30px;
  list-style: none;
  opacity: 0;
}
.background-animation ul li {
  opacity: 0; /* 默认不显示，通过动画显示 */
}
/* 通过调整 opacity 让主色调在背景中表现更轻盈 */
.square li, .circle li {
  opacity: 0.15 !important;
}
body[data-theme='dark'] .background-animation ul li {
  border: 1px solid var(--color-primary);
  background-color: var(--color-primary);
  opacity: 0.1 !important;
}
.square li { top: 40vh; left: 60vw; animation: square 10s linear infinite; }
.square li:nth-child(2) { top: 80vh; left: 10vw; animation-delay: 2s; }
.square li:nth-child(3) { top: 80vh; left: 85vw; animation-delay: 4s; }
.square li:nth-child(4) { top: 10vh; left: 70vw; animation-delay: 6s; }
.square li:nth-child(5) { top: 10vh; left: 10vw; animation-delay: 8s; }

.circle li { bottom: 0; left: 15vw; animation: circle 10s linear infinite; }
.circle li:nth-child(2) { left: 35vw; animation-delay: 2s; }
.circle li:nth-child(3) { left: 55vw; animation-delay: 6s; }
.circle li:nth-child(4) { left: 75vw; animation-delay: 4s; }
.circle li:nth-child(5) { left: 90vw; animation-delay: 8s; }

@keyframes square {
  0% { transform: scale(0) rotateY(0deg); opacity: 0.8; }
  100% { transform: scale(5) rotateY(1000deg); opacity: 0; }
}
@keyframes circle {
  0% { transform: scale(0) rotateY(0deg); opacity: 0.8; bottom: 0; border-radius: 0; }
  100% { transform: scale(5) rotateY(1000deg); opacity: 0; bottom: 90vh; border-radius: 50%; }
}

/* =====================================================
   左上角悬浮动作区
   ===================================================== */
.floating-actions {
  position: absolute;
  top: 25px;
  left: 25px;
  display: flex;
  gap: 15px;
  z-index: 1000;
}

.float-btn {
  background-color: rgba(246, 247, 249, 0.7) !important;
  border: none !important;
  box-shadow: 4px 4px 10px rgba(184, 194, 204, 0.5), -4px -4px 10px rgba(255, 255, 255, 0.8) !important;
  color: #6b7280 !important;
  backdrop-filter: blur(4px);
  transition: all 0.3s ease !important;
}
.float-btn:hover {
  background-color: rgba(246, 247, 249, 0.9) !important;
  color: var(--color-primary) !important;
  transform: translateY(-2px);
  box-shadow: 6px 6px 12px rgba(184, 194, 204, 0.6), -6px -6px 12px rgba(255, 255, 255, 0.9) !important;
}
body[data-theme='dark'] .float-btn {
  background-color: rgba(31, 41, 55, 0.7) !important;
  box-shadow: 2px 2px 6px rgba(10, 15, 25, 0.6), -2px -2px 6px rgba(45, 55, 75, 0.6) !important;
  color: #9ca3af !important;
}
body[data-theme='dark'] .float-btn:hover {
  background-color: rgba(31, 41, 55, 0.9) !important;
  color: var(--color-primary) !important;
  box-shadow: 4px 4px 8px rgba(10, 15, 25, 0.8), -4px -4px 8px rgba(45, 55, 75, 0.8) !important;
}

/* 前缀提示文字 */
.input-prefix {
  font-size: 13px;
  color: #4d4f50;
  margin-right: -25px;
  margin-left: 15px;
}

/* 切换方式按钮样式 */
.method-switcher {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 5px;
  margin-bottom: 0px;
}
.method-switcher .ant-btn {
  color: #a0a5a8;
}
.method-switcher .ant-btn:hover {
  color: var(--color-primary);
}
body[data-theme='dark'] .method-switcher .ant-btn {
  color: #6b7280;
}
body[data-theme='dark'] .method-switcher .ant-btn:hover {
  color: var(--color-primary);
}
.method-active {
  color: var(--color-primary) !important;
  font-weight: bold;
}

/* 登录容器：全屏居中，使用项目全局背景变量 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  position: relative;
}

/* .shell：外层凸起卡片 */
.shell {
  position: relative;
  width: 1000px;
  min-width: 1000px;
  height: 600px;
  min-height: 600px;
  padding: 25px;
  background-color: rgba(246, 247, 249, 0.85);
  backdrop-filter: blur(10px);
  box-shadow: 10px 10px 10px rgba(184, 194, 204, 0.3), -10px -10px 10px rgba(255, 255, 255, 0.5);
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
  background-color: transparent;
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
  line-height: 2.5;
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
  margin-top: 15px;
  margin-bottom: 5px;
  font-size: 12px;
  color: #a0a5a8;
}

.form-link {
  color: #181818;
  font-size: 13px;
  margin-top: 5px;
  border-bottom: 1px solid #a0a5a8;
  line-height: 2;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.35s ease;
}

.auth-form { width: 300px;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
:deep(.auth-form .ant-form-item) { margin-bottom: 0; }
:deep(.auth-form .ant-form-item-explain-error) { font-size: 11px; }

/* forms-wrapper：固定高度容器，两个表单绝对叠放，防止 v-show 切换引起高度变化 */
.forms-wrapper {
  position: relative;
  width: 300px;
  height: 96px; /* 两个 form-item（各约 48px）的总高度 */
}

.forms-wrapper .auth-form {
  position: absolute;
  top: 0;
  left: 0;
  width: 300px;
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
  width: 300px;
  height: 40px;
  margin: 4px 0;
  padding-left: 25px;
  font-size: 14px;
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
  width: 300px;
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
:deep(.form-input.ant-input-affix-wrapper .ant-input),
:deep(.form-input.ant-input-affix-wrapper input) {
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
  width: 300px !important;
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
  font-size: 14px;
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
  background-color: var(--color-primary);
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
  background-color: rgba(246, 247, 249, 0.4);
  backdrop-filter: blur(10px);
  overflow: hidden;
  box-shadow: 4px 4px 10px rgba(200, 208, 218, 0.5), -4px -4px 10px rgba(200, 208, 218, 0.5);
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
  background-color: var(--color-primary);
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
  width: 300px; /* 显式设置总宽度为 300px，与上方手机号输入框完全对齐 */
}

.code-input {
  flex: 1; /* 让输入框占据剩余的所有空间，确保 (输入框 + gap + 按钮) = 300px */
}

:deep(.code-input.ant-input-affix-wrapper) {
  width: 100% !important; /* 使其填满 flex: 1 后的可用空间 */
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
  background-color: var(--color-primary);
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

/* =====================================================
   暗色主题适配（body[data-theme='dark']）
   panel 背景：#1f2937，暗阴影：#161c27，亮阴影：#262f3d
   ===================================================== */
body[data-theme='dark'] .login-container {
  background: var(--app-bg);
}

body[data-theme='dark'] .shell {
  background-color: #1f2937;
  box-shadow: 10px 10px 10px #161c27, -10px -10px 10px #262f3d;
}

body[data-theme='dark'] .container {
  background-color: #1f2937;
}

body[data-theme='dark'] .switch {
  background-color: #1f2937;
  box-shadow: 4px 4px 10px #161c27, -4px -4px 10px #161c27;
}

body[data-theme='dark'] .switch-circle {
  background-color: #1f2937;
  box-shadow: inset 8px 8px 12px #111827, inset -8px -8px 12px #28334a;
}

body[data-theme='dark'] .form-title,
body[data-theme='dark'] .switch-title {
  color: var(--app-text-main);
}

body[data-theme='dark'] .switch-description,
body[data-theme='dark'] .form-span {
  color: var(--app-text-sub);
}

body[data-theme='dark'] .form-link {
  color: var(--app-text-main);
  border-bottom-color: var(--app-border);
}

body[data-theme='dark'] .icon-btn {
  border-color: #4b5563;
  color: #9ca3af;
}
body[data-theme='dark'] .icon-btn:hover {
  border-color: var(--app-text-main);
  color: var(--app-text-main);
}
body[data-theme='dark'] .icon-btn.active {
  border-color: #7b95f0;
  color: #7b95f0;
}

/* 暗色输入框 */
body[data-theme='dark'] :deep(.form-input.ant-input) {
  background-color: #1f2937 !important;
  color: var(--app-text-main) !important;
  box-shadow: inset 2px 2px 4px #161c27, inset -2px -2px 4px #262f3d !important;
}
body[data-theme='dark'] :deep(.form-input.ant-input:focus) {
  box-shadow: inset 4px 4px 4px #161c27, inset -4px -4px 4px #262f3d !important;
}
body[data-theme='dark'] :deep(.form-input.ant-input-affix-wrapper) {
  background-color: #1f2937 !important;
  box-shadow: inset 2px 2px 4px #161c27, inset -2px -2px 4px #262f3d !important;
}
body[data-theme='dark'] :deep(.form-input.ant-input-affix-wrapper-focused) {
  box-shadow: inset 4px 4px 4px #161c27, inset -4px -4px 4px #262f3d !important;
}
body[data-theme='dark'] :deep(.form-input.ant-input-affix-wrapper .ant-input),
body[data-theme='dark'] :deep(.form-input.ant-input-affix-wrapper input) {
  color: var(--app-text-main) !important;
  background: transparent !important;
}
body[data-theme='dark'] :deep(.form-input .ant-input::placeholder),
body[data-theme='dark'] :deep(.form-input.ant-input::placeholder),
body[data-theme='dark'] :deep(.form-input input::placeholder) {
  color: #8892a0 !important;
}

/* 暗色验证码行 */
body[data-theme='dark'] .code-btn {
  background-color: var(--color-primary);
  color: #fff;
  box-shadow: 3px 3px 6px #161c27, -3px -3px 6px #262f3d;
}
body[data-theme='dark'] .code-btn:hover {
  box-shadow: 4px 4px 8px #161c27, -4px -4px 8px #262f3d;
}
body[data-theme='dark'] .code-btn--disabled {
  background-color: #374151 !important;
  color: #6b7280 !important;
  box-shadow: inset 2px 2px 4px #161c27, inset -2px -2px 4px #262f3d !important;
}

/* 暗色提交/切换按钮 */
body[data-theme='dark'] .form-button,
body[data-theme='dark'] .switch-btn {
  background-color: var(--color-primary);
  box-shadow: 8px 8px 16px #161c27, -8px -8px 16px #262f3d;
}
body[data-theme='dark'] .form-button:hover,
body[data-theme='dark'] .switch-btn:hover {
  box-shadow: 6px 6px 10px #161c27, -6px -6px 10px #262f3d;
}
body[data-theme='dark'] .form-button:active,
body[data-theme='dark'] .switch-btn:active {
  box-shadow: 2px 2px 6px #161c27, -2px -2px 6px #262f3d;
}
</style>
