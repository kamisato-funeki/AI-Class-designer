/**
 * vue-cropper 模块类型声明
 *
 * vue-cropper 是一个基于 Vue 的图片裁剪组件库。
 * 由于该库未提供官方类型声明文件，此处进行手动声明，
 * 以避免 TypeScript 在导入时报错。
 */
declare module 'vue-cropper' {
  import { defineComponent } from 'vue'
  // 导出图片裁剪组件
  export const VueCropper: ReturnType<typeof defineComponent>
}
