/**
 * 工作台相关 API
 *
 * 业务逻辑说明：
 * 工作台是应用的首页，提供教师工作状态的全局概览。
 * 本文件提供以下接口：
 * 1. 获取工作台统计数据（课件数、班级数、学生数、未读消息数）
 * 2. 上传语音文件进行语音识别
 * 3. 获取教育新闻列表（当前为模拟数据，支持分页）
 */

import { defaultAxios } from './base'
import type { CommonResponseData, CommonResponse } from './base'
import type { WorkspaceStats, EducationNews } from '../types/types'

/**
 * 获取工作台统计数据
 * 在工作台首页加载时调用，展示教师当前的工作概览数据。
 * @returns 包含课件数、班级数、学生数、未读消息数的统计对象
 */
export function apiGetWorkspaceStats(): CommonResponseData<WorkspaceStats> {
  return defaultAxios.get('/workspace/stats')
}

/**
 * 上传语音文件进行语音识别（语音转文字）
 * @param file - 音频文件（WAV / MP3 等格式）
 * @returns 识别出的文字内容
 */
export function apiUploadVoice(file: File): CommonResponseData<{ text: string }> {
  const formData = new FormData()
  formData.append('file', file)

  return defaultAxios.post('/workspace/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 获取教育新闻列表（模拟实现）
 *
 * 注意：当前使用模拟数据，500ms 延迟模拟网络请求。
 * 支持分页加载，新闻内容随机生成（包括标题、来源、配图等）。
 * 生产环境应替换为真实的后端接口。
 *
 * @param page - 当前页码（从 1 开始）
 * @param size - 每页条数
 * @returns 包含总数和当前页新闻列表的分页数据
 */
export function apiGetEducationNews(
  page: number,
  size: number,
): CommonResponseData<{ total: number; list: EducationNews[] }> {
  return new Promise<import('axios').AxiosResponse<CommonResponse<{ total: number; list: EducationNews[] }>>>((resolve) => {
    setTimeout(() => {
      // 根据页码和每页大小计算全局索引，生成模拟新闻数据
      const mockList: EducationNews[] = Array.from({ length: size }).map((_, idx) => {
        const globalIdx = (page - 1) * size + idx

        // 70% 概率包含图片，图片数量 1~3 张
        const hasImages = Math.random() > 0.3
        const imageCount = hasImages ? Math.floor(Math.random() * 3) + 1 : 0
        const images = Array.from({ length: imageCount }).map(
          (_, i) => `https://picsum.photos/seed/${globalIdx * 10 + i}/300/200`,
        )

        return {
          id: `news_${globalIdx}`,
          title: ([
            '浙江女子深夜报警：家中35万黄金全没了！',
            '省委常委兼任市委书记！四地党委主要领导调整',
            '马士基、地中海航运被中方约谈',
            '河南一女子长期吃油炸食品，抽出"牛奶血"',
            '科芒斯曼特湾级航母：火力拉满，34架舰载机全能护航！',
            '教育部门发布最新减负政策',
            'AI赋能教育，新一代智能讲台引发热议',
            '高校科研团队在量子计算领域取得重大突破',
          ])[Math.floor(Math.random() * 8)] as string,
          source: (['中国能源网', '上观新闻', '雾里安静赏景的游人', '世界闻南人', '八百里沙场', '教育在线'])[
            Math.floor(Math.random() * 6)
          ] as string,
          commentCount: Math.floor(Math.random() * 100),
          time: `${Math.floor(Math.random() * 24) + 1}小时前`,
          images: images,
        }
      })

      resolve({
        data: {
          code: 200,
          message: 'success',
          data: {
            total: 100, // 模拟总数据量为 100 条
            list: mockList,
          },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as import('axios').InternalAxiosRequestConfig,
      } as import('axios').AxiosResponse<CommonResponse<{ total: number; list: EducationNews[] }>>)
    }, 500) // 模拟 500ms 网络延迟
  })
}
