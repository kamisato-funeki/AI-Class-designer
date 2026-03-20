import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RagFile } from '../types/types'
import {
  apiGetRagFiles,
  apiUploadRagFile,
  apiDeleteRagFile,
  apiUpdateRagFileTags,
} from '../api/rag'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

const now = () => dayjs().format('YYYY-MM-DD HH:mm:ss')

export const useRagStore = defineStore('rag', () => {
  const files = ref<RagFile[]>([
    {
      id: 'f1',
      name: '小学英语词汇表.pdf',
      size: 1024 * 1024 * 2,
      type: 'pdf',
      url: '/data/sample.pdf',
      tags: ['英语', '词汇'],
      uploadTime: now(),
      status: 'success',
    },
    {
      id: 'f2',
      name: '四年级数学教案.docx',
      size: 1024 * 500,
      type: 'docx',
      url: '/data/sample.docx',
      tags: ['数学', '教案'],
      uploadTime: now(),
      status: 'success',
    },
  ])

  const loadFiles = async () => {
    try {
      const res = await apiGetRagFiles()
      files.value = res.data.data
    } catch {
      // Keep mock data on API error
    }
  }

  const uploadFile = async (file: File) => {
    try {
      const res = await apiUploadRagFile(file)
      const data = { ...res.data.data, status: 'success' as const }
      files.value.unshift(data)
      return data
    } catch {
      const newFile: RagFile = {
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop() || 'unknown',
        url: URL.createObjectURL(file),
        tags: [],
        uploadTime: now(),
        status: 'unuploaded',
        rawFile: file,
      }
      files.value.unshift(newFile)
      return newFile
    }
  }

  const deleteFile = async (id: string) => {
    try {
      await apiDeleteRagFile(id)
    } catch {}
    files.value = files.value.filter((f) => f.id !== id)
  }

  const updateTags = async (id: string, tags: string[]) => {
    try {
      await apiUpdateRagFileTags(id, tags)
    } catch {}
    const idx = files.value.findIndex((f) => f.id === id)
    if (idx !== -1 && files.value[idx]) {
      files.value[idx].tags = tags
    }
  }

  const addTag = async (id: string, tag: string) => {
    const file = files.value.find((f) => f.id === id)
    if (file && !file.tags.includes(tag)) {
      const newTags = [...file.tags, tag]
      await updateTags(id, newTags)
    }
  }

  const removeTag = async (id: string, tag: string) => {
    const file = files.value.find((f) => f.id === id)
    if (file) {
      const newTags = file.tags.filter((t) => t !== tag)
      await updateTags(id, newTags)
    }
  }

  const reuploadFile = async (id: string) => {
    const fileIndex = files.value.findIndex((f) => f.id === id)
    if (fileIndex !== -1) {
      const file = files.value[fileIndex]
      if (file && file.status === 'unuploaded' && file.rawFile) {
        try {
          const res = await apiUploadRagFile(file.rawFile)
          // Merge API result and set status to success
          files.value[fileIndex] = {
            ...file,
            ...res.data.data,
            status: 'success',
          }
        } catch {
          // If still fails, keep it as unuploaded.
          // In a real app we might throw to let the UI show an error.
          throw new Error('重新上传失败')
        }
      }
    }
  }

  return { files, loadFiles, uploadFile, deleteFile, updateTags, addTag, removeTag, reuploadFile }
})
