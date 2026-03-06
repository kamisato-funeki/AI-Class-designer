import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { message } from 'ant-design-vue'

export enum CommonCode {
  SUCCESS = 200,
}

export interface CommonResponse<T> {
  code: number
  message: string
  data: T
}

export type CommonResponseData<T> = Promise<AxiosResponse<CommonResponse<T>>>

export const defaultAxios: AxiosInstance = axios.create({
  baseURL:'https://xxx.xxx',
  timeout: 100,
})

defaultAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    const commonResponse = response.data as CommonResponse<unknown>
    if (commonResponse && commonResponse.code !== CommonCode.SUCCESS) {
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
  (error: AxiosError) => {
    const errData = error.response?.data as { message?: string } | undefined
    const errorMessage = errData?.message || error.response?.statusText || error.message
    console.warn('API Request Failed:', errorMessage)
    return Promise.reject(error)
  },
)
