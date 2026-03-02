import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RagFile } from '../types/types'
import { ragApi } from '../api/api'

export const useRagStore = defineStore('rag', () => {
  const files = ref<RagFile[]>([])

  const loadFiles = async () => {
    files.value = await ragApi.getFiles()
  }

  const uploadFile = async (file: File) => {
    const newFile = await ragApi.uploadFile(file)
    files.value.push(newFile)
    return newFile
  }

  const deleteFile = async (id: string) => {
    await ragApi.deleteFile(id)
    files.value = files.value.filter((f) => f.id !== id)
  }

  const addTag = async (id: string, tag: string) => {
    const file = files.value.find((f) => f.id === id)
    if (file && !file.tags.includes(tag)) {
      const newTags = [...file.tags, tag]
      await ragApi.updateTags(id, newTags)
      file.tags = newTags
    }
  }

  const removeTag = async (id: string, tag: string) => {
    const file = files.value.find((f) => f.id === id)
    if (file) {
      const newTags = file.tags.filter((t) => t !== tag)
      await ragApi.updateTags(id, newTags)
      file.tags = newTags
    }
  }

  return { files, loadFiles, uploadFile, deleteFile, addTag, removeTag }
})
