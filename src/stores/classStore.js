import { defineStore } from 'pinia';
import { ref } from 'vue';
import { classService } from '../services/classService.js';

export const useClassStore = defineStore('class', () => {
  const currentClass = ref(null);
  const classesList = ref([]);
  const isLoading = ref(false);

  async function fetchClasses() {
    isLoading.value = true;
    try {
      classesList.value = await classService.getAllClasses();
      return classesList.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadClassById(classId) {
    if (!classId) return null;
    isLoading.value = true;
    try {
      currentClass.value = await classService.getClassById(classId);
      return currentClass.value;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    currentClass,
    classesList,
    isLoading,
    fetchClasses,
    loadClassById
  };
});
