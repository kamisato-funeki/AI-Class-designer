<!--
  我的课件页面 (CoursewareView)
  业务逻辑：
  1. 展示用户创建的所有课件列表，支持网格(Grid)和列表(List)两种查看模式。
  2. 提供课件搜索、按科目过滤以及排序功能。
  3. 支持课件标签管理（添加、删除）。
  4. 集成课件的基本操作：继续编辑、移动到回收站、新建课件。
-->
<template>
  <a-spin :spinning="loading">
    <div class="courseware-container">
      <div class="page-header">
        <h2>我的课件</h2>
        <a-space>
          <!-- 视图模式切换 -->
          <a-radio-group v-model:value="viewMode">
            <a-radio-button value="grid">
              <AppstoreOutlined />
            </a-radio-button>
            <a-radio-button value="list">
              <BarsOutlined />
            </a-radio-button>
          </a-radio-group>
          <a-button type="primary" @click="openNewCourseModal">新建课件</a-button>
        </a-space>
      </div>

      <!-- 筛选与搜索栏 -->
      <div class="filter-bar">
        <a-input-search v-model:value="searchKeyword" placeholder="搜索课件名称..." style="width: 300px" />
        <a-select v-model:value="filterSubject" style="width: 120px; margin-left:16px">
          <a-select-option value="all">全部分类</a-select-option>
          <a-select-option value="数学">数学</a-select-option>
          <a-select-option value="语文">语文</a-select-option>
          <a-select-option value="英语">英语</a-select-option>
        </a-select>
        <a-select v-model:value="sortOrder" style="width: 120px; margin-left:16px">
          <a-select-option value="newest">最新编辑</a-select-option>
          <a-select-option value="name">按名称排列</a-select-option>
        </a-select>
      </div>

      <div v-if="viewMode === 'grid'" class="grid-view">
        <a-card hoverable class="cw-card" v-for="cw in filteredCoursewares" :key="cw.id"
          @click="$router.push('/cocreation?id=' + cw.id)">
          <template #cover>
            <div class="cover-img" :style="{ backgroundImage: `url(${cw.coverImage})`, backgroundSize: 'cover' }">
              <div
                style="background: rgba(255,255,255,0.7); padding: 4px 8px; border-radius: 4px; color: var(--color-primary)">
                {{ cw.subject }}·{{ cw.grade }}
              </div>
            </div>
          </template>
          <a-card-meta :title="cw.title" :description="cw.status === 'draft' ? '草稿' : '已发布'">
          </a-card-meta>
          <div class="tags-area" @click.stop>
            <a-tag v-for="tag in cw.tags" :key="tag" closable @close.prevent="handleRemoveTag(cw.id, tag)"
              color="blue">{{ tag
              }}</a-tag>
            <a-tag
              style="background: transparent; border-color: var(--app-border); border-style: dashed; cursor: pointer; color: var(--app-text-main);"
              @click="openTagModal(cw.id)">
              <PlusOutlined /> 新增标签
            </a-tag>
          </div>
          <div class="card-actions" @click.stop>
            <span>{{ cw.updateTime.split(' ')[0] }}编辑</span>
            <a-dropdown>
              <a class="ant-dropdown-link" @click.prevent>
                <MoreOutlined />
              </a>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="$router.push('/cocreation?id=' + cw.id)">继续编辑</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item danger @click="handleDeleteCourseware(cw.id)">移至回收站</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-card>
        <a-empty v-if="filteredCoursewares.length === 0" description="没有找到课件" style="grid-column: span auto;" />
      </div>

      <!-- List View -->
      <div v-else class="list-view">
        <a-table :dataSource="listDataSource" :columns="columns">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'tags'">
              <a-tag v-for="tag in record.tags" :key="tag" color="blue" closable
                @close.prevent="handleRemoveTag(record.key, tag)">{{ tag }}</a-tag>
              <a-tag
                style="background: transparent; border-color: var(--app-border); border-style: dashed; cursor: pointer; color: var(--app-text-main);"
                @click="openTagModal(record.key)">
                <PlusOutlined /> 新增标签
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button type="link" @click="$router.push('/cocreation?id=' + record.key)">编辑</a-button>
              <a-button type="link" danger @click="handleDeleteCourseware(record.key)">删除</a-button>
            </template>
          </template>
        </a-table>
      </div>

      <!-- Tag Modal -->
      <a-modal v-model:open="tagModalVisible" title="添加标签" :footer="null">
        <a-input-search v-model:value="newTagValue" placeholder="输入新标签" enter-button="添加" @search="handleAddTag" />
      </a-modal>

      <!-- 新建课件弹窗 -->
      <a-modal v-model:open="newCourseModalVisible" title="新建课件" @ok="createNewCourse" @cancel="closeNewCourseModal"
        :confirmLoading="creatingCourse">
        <a-form layout="vertical" :model="formState">
          <a-form-item label="课件名称" required>
            <a-input v-model:value="formState.title" placeholder="请输入课件名称" />
          </a-form-item>
          <a-form-item label="适用科目" required>
            <a-select v-model:value="formState.subject" placeholder="请选择科目">
              <a-select-option value="语文">语文</a-select-option>
              <a-select-option value="数学">数学</a-select-option>
              <a-select-option value="英语">英语</a-select-option>
              <a-select-option value="综合">综合</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="适用年级" required>
            <a-select v-model:value="formState.grade" placeholder="请选择年级">
                            <a-select-option value="一年级">一年级</a-select-option>
              <a-select-option value="二年级">二年级</a-select-option>
              <a-select-option value="三年级">三年级</a-select-option>
              <a-select-option value="四年级">四年级</a-select-option>
              <a-select-option value="五年级">五年级</a-select-option>
              <a-select-option value="六年级">六年级</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>
    </div>
  </a-spin>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, createVNode } from 'vue';
import { message, Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import {
  AppstoreOutlined,
  ExclamationCircleOutlined,
  BarsOutlined,
  MoreOutlined,
  PlusOutlined
} from '@ant-design/icons-vue';
import { useCoursewareStore } from '../stores/coursewareStore';

/**
 * 核心状态与路由初始化
 */
const router = useRouter(); // 路由控制器：实现页面间的逻辑跳转
const coursewareStore = useCoursewareStore(); // 课件数据仓库：封装了课件的增删改查及标签管理逻辑

/**
 * 【响应式变量】UI 布局与显示状态
 */
const viewMode = ref('grid'); // 视图展示模式：'grid'(网格卡片预览) / 'list'(传统表格列表)
const loading = ref(true);    // 全局数据加载状态遮罩控制

/**
 * 【响应式变量】搜索、过滤与排序条件
 */
const searchKeyword = ref('');    // 课件搜索关键词（双向绑定）
const filterSubject = ref('all'); // 当前选中的科目分类过滤项（如：数学、语文）
const sortOrder = ref('newest');  // 列表排序规则：'newest'(按更新时间降序) / 'name'(按标题升序)

/**
 * 【生命周期钩子】onMounted
 * 作用：页面入场初始化
 * 业务逻辑：同步驱动 store 从持久层（模拟数据）加载全量课件列表
 */
onMounted(() => {
  loading.value = true;
  coursewareStore.loadCoursewares().finally(() => {
    loading.value = false;
  });
});

/**
 * 【计算属性】filteredCoursewares
 * 作用：实时响应式的多维数据筛选与排序
 * 算法逻辑：
 * 1. 过滤：先匹配科目类型，再进行标题字符串的模糊命配（不区分大小写）。
 * 2. 排序：根据 sortOrder 的值，执行字符串比较或时间戳数值比对。
 * @returns 经过处理后的课件数组供视图渲染使用
 */
const filteredCoursewares = computed(() => {
  let list = coursewareStore.coursewares;

  // 1. 科目路由过滤
  if (filterSubject.value !== 'all') {
    list = list.filter(c => c.subject === filterSubject.value);
  }

  // 2. 标题模糊搜索匹配
  if (searchKeyword.value) {
    list = list.filter(c => c.title.toLowerCase().includes(searchKeyword.value.toLowerCase()));
  }

  const result = [...list];

  // 3. 多维排序执行
  if (sortOrder.value === 'name') {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // 默认按更新时间戳降序排列
    result.sort((a, b) => new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime());
  }
  return result;
});

/**
 * 【表格配置】columns
 * 作用：Ant Design Vue 表格的列元数据定义
 */
const columns = [
  { title: '课件标题', dataIndex: 'title', key: 'title' },
  { title: '科目与年级', dataIndex: 'subject', key: 'subject' },
  { title: '业务标签', dataIndex: 'tags', key: 'tags' },
  { title: '最后修改时间', dataIndex: 'time', key: 'time' },
  { title: '操作选项', key: 'action' },
];

/**
 * 【计算属性】listDataSource
 * 作用：为 Table 组件提供高度兼容的数据源格式映射
 */
const listDataSource = computed(() => {
  return filteredCoursewares.value.map(c => ({
    key: c.id,
    title: c.title,
    subject: c.subject + '·' + c.grade,
    tags: c.tags,
    time: c.updateTime
  }));
});

/**
 * 【标签管理相关变量与控制】
 */
const tagModalVisible = ref(false); // “添加标签”浮层显示状态
const newTagValue = ref('');       // 暂存用户输入的新标签文本
const currentCwId = ref('');       // 后端/Store 调用时的上下文对象 ID

/**
 * 【函数】openTagModal
 * 作用：记录上下文 ID 开启标签注入弹窗
 * @param id 目标课件 ID
 */
const openTagModal = (id: string) => {
  currentCwId.value = id;
  newTagValue.value = '';
  tagModalVisible.value = true;
};

/**
 * 【函数】handleAddTag
 * 作用：驱动业务逻辑进行标签持久化存储
 */
const handleAddTag = async () => {
  if (newTagValue.value && currentCwId.value) {
    await coursewareStore.addTag(currentCwId.value, newTagValue.value.trim());
    message.success('已添加新标签');
    newTagValue.value = '';
  }
};

/**
 * 【函数】handleRemoveTag
 * 作用：移除指定的业务标签
 * @param id 课件 ID
 * @param tag 被移除的标签名
 */
const handleRemoveTag = async (id: string, tag: string) => {
  await coursewareStore.removeTag(id, tag);
};

/**
 * 【函数】handleDeleteCourseware
 * 作用：执行课件的软删除（移入回收站）
 * @param id 课件 ID
 * 业务逻辑：通过 Modal 拦截高危操作，确保用户拥有二次确认路径
 */
const handleDeleteCourseware = (id: string) => {
  Modal.confirm({
    title: '确认要删除此课件吗？',
    icon: createVNode(ExclamationCircleOutlined),
    content: '该操作会将课件移至回收站，请确认是否继续。',
    okText: '确认删除',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      await coursewareStore.deleteCourseware(id);
      message.success('已成功移至回收站');
    },
  });
};

/**
 * 【课件创建流程变量】
 */
const newCourseModalVisible = ref(false); // “创建新课件”向导弹窗显隐
const creatingCourse = ref(false);        // 提交接口的加载态锁定（防止重发）
const formState = ref({                   // 创建表单的响应式状态集
  title: '',     // 标题
  subject: undefined, // 映射科目
  grade: undefined    // 映射年级
});

/**
 * 【函数】openNewCourseModal
 * 作用：唤起创建流程
 */
const openNewCourseModal = () => {
  formState.value = { title: '', subject: undefined, grade: undefined };
  newCourseModalVisible.value = true;
};

/**
 * 【函数】closeNewCourseModal
 * 作用：关闭创建流程
 */
const closeNewCourseModal = () => {
  newCourseModalVisible.value = false;
};

/**
 * 【异步函数】createNewCourse
 * 作用：正式执行新课件的创建逻辑
 * 业务逻辑：
 * 1. 本地校验必填项完整性。
 * 2. 交互 Store 发起异步创建请求。
 * 3. 成功后全屏重定向到共创编辑工作区。
 */
const createNewCourse = async () => {
  if (!formState.value.title || !formState.value.subject || !formState.value.grade) {
    return message.warning('请填写完整的课件信息（名称、科目、年级）');
  }
  creatingCourse.value = true;
  try {
    const newCw = await coursewareStore.createCourseware(formState.value);
    newCourseModalVisible.value = false;
    // 重定向至 AI 共创空间进行详细设计
    router.push(`/cocreation?id=${newCw.id}`);
  } finally {
    creatingCourse.value = false;
  }
};
</script>

<style scoped>
.courseware-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.filter-bar {
  display: flex;
  align-items: center;
  background: var(--app-panel);
  padding: 16px;
  border-radius: 12px;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.cw-card {
  border-radius: 12px;
  overflow: hidden;
  background: var(--app-panel);
  border: 1px solid var(--app-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s, transform 0.3s;
}

.cw-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.cover-img {
  height: 130px;
  background: #E0F2FE;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--color-primary);
  font-weight: 500;
}

.tags-area {
  margin-top: 8px;
}

.card-actions {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--app-text-sub);
  font-size: 12px;
  border-top: 1px solid var(--app-border);
  padding-top: 8px;
}

:deep(.ant-card-body) {
  padding: 12px;
}

:deep(.ant-card-meta-title) {
  font-size: 15px !important;
  margin-bottom: 4px !important;
}

:deep(.ant-card-meta-description) {
  font-size: 12px !important;
}

.list-view {
  background: var(--app-panel);
  padding: 24px;
  border-radius: 12px;
}
</style>
