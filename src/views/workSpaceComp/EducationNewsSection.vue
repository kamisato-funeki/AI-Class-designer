<template>
  <div class="news-section">
    <div class="section-header">
      <h3>教育新闻</h3>
    </div>
    
    <div class="news-list-container" v-infinite-scroll="loadMore" :infinite-scroll-disabled="loading || !hasMore" :infinite-scroll-distance="10">
      <a-list item-layout="vertical" :data-source="newsList">
        <template #renderItem="{ item }">
          <!-- 仿照参考图样式: 左右布局 如果有图片在右侧 (参考图是图文分离或三图下置) -->
          <a-list-item class="news-item">
            <div class="news-content-wrapper">
              <div class="news-text-area">
                <a :href="'#'" class="news-title">{{ item.title }}</a>
                <!-- 若图片大于1张，横向展示在标题下方 -->
                <div v-if="item.images && item.images.length >= 3" class="news-images-row">
                  <img v-for="(img, idx) in item.images.slice(0, 3)" :key="idx" :src="img" alt="news cover" class="news-image news-image-multi" />
                </div>
                <div class="news-meta">
                  <span>{{ item.source }}</span>
                  <span style="margin-left: 16px;">{{ item.commentCount }}评论</span>
                  <span style="margin-left: 16px;">{{ item.time }}</span>
                </div>
              </div>
              
              <!-- 1到2张图片，展示在右侧 -->
              <div v-if="item.images && item.images.length > 0 && item.images.length < 3" class="news-images-side">
                <img v-for="(img, idx) in item.images.slice(0, 2)" :key="idx" :src="img" alt="news cover" class="news-image" />
              </div>
            </div>
            <!-- Delete Button (X) from the reference image -->
            <div class="news-close-btn">
              <CloseOutlined />
            </div>
          </a-list-item>
        </template>
        <template #loadMore>
          <div v-if="loading" style="text-align: center; margin-top: 12px; height: 32px; line-height: 32px;">
            <a-spin />
          </div>
          <div v-else-if="!hasMore" style="text-align: center; margin-top: 12px; height: 32px; line-height: 32px; color: var(--app-text-sub);">
            没有更多了
          </div>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';
import { apiGetEducationNews } from '../../api/workspace';
import type { EducationNews } from '../../types/types';

const newsList = ref<EducationNews[]>([]);
const loading = ref(false);
const hasMore = ref(true);
const page = ref(1);
const size = 10;

const loadMore = async () => {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res = await apiGetEducationNews(page.value, size);
    if (res.data.data.list.length > 0) {
      newsList.value.push(...res.data.data.list);
      page.value++;
      if (newsList.value.length >= res.data.data.total) {
        hasMore.value = false;
      }
    } else {
      hasMore.value = false;
    }
  } catch (err) {
    console.error('Failed to load news:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadMore();
});
</script>

<style scoped>
.news-section {
  background: color-mix(in srgb, var(--app-panel) 50%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-top: 24px;
  transition: box-shadow 0.3s ease;
}

.news-section:hover {
  box-shadow: var(--shadow-xl);
}

.section-header {
  margin-bottom: 16px;
}
.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: var(--app-text);
}

.news-list-container {
  max-width: 100%;
}

.news-item {
  position: relative;
  padding: 16px 0 !important;
  border-bottom: 1px solid var(--app-border) !important;
  transition: background-color 0.3s;
}

.news-item:hover {
  background-color: var(--app-bg-hover);
}

.news-content-wrapper {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-right: 24px; /* for close button */
}

.news-text-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.news-title {
  font-size: 18px;
  color: var(--app-text);
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-decoration: none;
}

.news-title:hover {
  color: var(--color-primary);
}

.news-meta {
  font-size: 13px;
  color: var(--app-text-sub);
  margin-top: 8px;
}

.news-images-side {
  display: flex;
  gap: 8px;
  margin-left: 24px;
  flex-shrink: 0;
}

.news-images-row {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.news-image {
  width: 140px;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
}

.news-image-multi {
  width: 32%;
  aspect-ratio: 3 / 2;
  height: auto;
}

.news-close-btn {
  position: absolute;
  right: 0;
  bottom: 16px;
  color: var(--app-border);
  cursor: pointer;
}

.news-close-btn:hover {
  color: var(--app-text);
}
</style>
