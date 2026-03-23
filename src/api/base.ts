/**
 * API 基础配置文件
 *
 * 业务逻辑说明：
 * 该文件是整个应用 HTTP 请求层的基础模块，负责：
 * 1. 定义统一的响应数据结构（CommonResponse、CommonCode）
 * 2. 创建全局 Axios 实例（defaultAxios），配置基础 URL 和超时时间
 * 3. 注册响应拦截器：
 *    - 成功响应：检查业务状态码，非 200 时统一弹出错误提示并抛出异常
 *    - 网络/服务器错误：提取错误信息后抛出，保持统一的错误处理链路
 */

import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'

// ==================== 公共枚举与类型 ====================

/**
 * 业务状态码枚举
 * SUCCESS = 200 表示请求成功
 */
export enum CommonCode {
  SUCCESS = 200,
}

/**
 * 统一 API 响应体结构
 * @template T - 响应数据的具体类型
 * @property code    - 业务状态码
 * @property message - 响应描述信息
 * @property data    - 实际业务数据
 */
export interface CommonResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * 带有 Axios 响应包装的 Promise 类型别名
 * 用于统一函数返回值类型声明
 * @template T - 业务数据类型
 */
export type CommonResponseData<T> = Promise<AxiosResponse<CommonResponse<T>>>

// ==================== Axios 实例配置 ====================

/**
 * 全局 Axios 实例
 * - baseURL：接口服务器地址（生产环境应通过环境变量注入）
 * - timeout：请求超时时间（单位：毫秒）
 */
export const defaultAxios: AxiosInstance = axios.create({
  baseURL: 'https://xxx.xxx',
  timeout: 100,
})

// ==================== 响应拦截器 ====================

defaultAxios.interceptors.response.use(
  /**
   * 成功响应处理器
   * @param response - Axios 原始响应对象
   * @returns 原始响应对象（业务码为 200 时放行；否则弹出错误并 reject）
   */
  (response: AxiosResponse) => {
    const commonResponse = response.data as CommonResponse<unknown>

    if (commonResponse && commonResponse.code !== CommonCode.SUCCESS) {
      // 业务码非成功：弹出错误提示
      message.error(commonResponse.message)
      return Promise.reject(
        new AxiosError(
          commonResponse.message,
          commonResponse.code + '',
          response.config,
          response.request,
          response,
        ),
      )
    }

    return response
  },

  /**
   * 网络 / 服务器错误处理器
   * @param error - Axios 错误对象
   * @returns 永远 reject，便于业务层统一捕获
   */
  (error: AxiosError) => {
    const errData = error.response?.data as { message?: string } | undefined
    // 优先取响应体的 message，其次取 HTTP 状态文本，最后取 Axios 错误信息
    const errorMessage = errData?.message || error.response?.statusText || error.message
    console.warn('API 请求失败：', errorMessage)
    return Promise.reject(error)
  },
)
