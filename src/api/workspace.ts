import { defaultAxios } from './base'
import type { CommonResponseData, CommonResponse } from './base'
import type { WorkspaceStats, EducationNews } from '../types/types'

export function apiGetWorkspaceStats(): CommonResponseData<WorkspaceStats> {
  return defaultAxios.get('/workspace/stats')
}

export function apiUploadVoice(file: File): CommonResponseData<{ text: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return defaultAxios.post('/workspace/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// 模拟获取教育新闻数据
export function apiGetEducationNews(page: number, size: number): CommonResponseData<{ total: number, list: EducationNews[] }> {
  return new Promise<import('axios').AxiosResponse<CommonResponse<{ total: number, list: EducationNews[] }>>>((resolve) => {
    setTimeout(() => {
      const mockList: EducationNews[] = Array.from({ length: size }).map((_, idx) => {
        const globalIdx = (page - 1) * size + idx;
        const hasImages = Math.random() > 0.3; // 70% chance to have images
        const imageCount = hasImages ? Math.floor(Math.random() * 3) + 1 : 0;
        const images = Array.from({ length: imageCount }).map((_, i) => `https://picsum.photos/seed/${globalIdx * 10 + i}/300/200`);

        return {
          id: `news_${globalIdx}`,
          title: ([
            '浙江女子深夜报警：家中35万黄金全没了！',
            '省委常委兼任市委书记！四地党委主要领导调整',
            '马士基、地中海航运被中方约谈',
            '河南一女子长期吃油炸食品，抽出“牛奶血”',
            '科芒斯曼特湾级航母：火力拉满，34架舰载机全能护航！',
            '教育部门发布最新减负政策',
            'AI赋能教育，新一代智能讲台引发热议',
            '高校科研团队在量子计算领域取得重大突破'
          ])[Math.floor(Math.random() * 8)] as string,
          source: (['中国能源网', '上观新闻', '雾里安静赏景的游人', '世界闻南人', '八百里沙场', '教育在线'])[Math.floor(Math.random() * 6)] as string,
          commentCount: Math.floor(Math.random() * 100),
          time: `${Math.floor(Math.random() * 24) + 1}小时前`,
          images: images
        }
      });
      resolve({
        data: {
          code: 200,
          message: 'success',
          data: {
            total: 100,
            list: mockList
          }
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as import('axios').InternalAxiosRequestConfig
      } as import('axios').AxiosResponse<CommonResponse<{ total: number, list: EducationNews[] }>>);
    }, 500); // simulate network delay
  });
}
