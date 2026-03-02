import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ClassInfo, ClassTask } from '../types/types'
import { classApi } from '../api/api'

export const useClassesStore = defineStore('classes', () => {
  const classes = ref<ClassInfo[]>([])
  const currentClass = ref<ClassInfo | null>(null)
  const currentTasks = ref<ClassTask[]>([])

  const loadClasses = async () => {
    classes.value = await classApi.getClasses()
    if (classes.value.length > 0 && !currentClass.value) {
      currentClass.value = classes.value[0] || null
    }
  }

  const selectClass = async (classId: string) => {
    const found = classes.value.find((c) => c.id === classId)
    if (found) {
      currentClass.value = found
      await loadTasks(classId)
    }
  }

  const loadTasks = async (classId: string) => {
    currentTasks.value = await classApi.getClassTasks(classId)
  }

  const createClass = async (data: Partial<ClassInfo>) => {
    const newClass = await classApi.createClass(data)
    classes.value.push(newClass)
    return newClass
  }

  const createTask = async (data: Partial<ClassTask>) => {
    const task = await classApi.createTask(data)
    currentTasks.value.push(task)
    return task
  }

  return {
    classes,
    currentClass,
    currentTasks,
    loadClasses,
    selectClass,
    loadTasks,
    createClass,
    createTask,
  }
})
