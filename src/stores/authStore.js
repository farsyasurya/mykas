import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/authService.js';
import { userService } from '../services/userService.js';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const userProfile = ref(null);
  const isLoading = ref(true);
  const isInitialized = ref(false);

  const isAuthenticated = computed(() => !!user.value && !!userProfile.value);
  const isSuperAdmin = computed(() => userProfile.value?.role === 'SUPER_ADMIN');
  const isAdmin = computed(() => userProfile.value?.role === 'ADMIN' || userProfile.value?.role === 'SUPER_ADMIN');
  const isClassAdminOnly = computed(() => userProfile.value?.role === 'ADMIN');
  const isUser = computed(() => userProfile.value?.role === 'USER');
  const userClassId = computed(() => userProfile.value?.kelasId || '');
  const userClassName = computed(() => userProfile.value?.kelasNama || '');

  /**
   * Listen and initialize auth state
   */
  function initAuth() {
    return new Promise((resolve) => {
      authService.onAuthStateChanged(async (firebaseUser) => {
        isLoading.value = true;
        if (firebaseUser) {
          user.value = firebaseUser;
          try {
            const profile = await authService.getUserProfile(firebaseUser.uid);
            userProfile.value = profile;
          } catch (err) {
            console.error('Failed to load user profile:', err);
            userProfile.value = null;
          }
        } else {
          user.value = null;
          userProfile.value = null;
        }
        isLoading.value = false;
        isInitialized.value = true;
        resolve(userProfile.value);
      });
    });
  }

  async function login(email, password) {
    isLoading.value = true;
    try {
      const res = await authService.login(email, password);
      user.value = res.user;
      userProfile.value = res.profile;
      return res;
    } finally {
      isLoading.value = false;
    }
  }

  async function register(data) {
    isLoading.value = true;
    try {
      const res = await authService.register(data);
      user.value = res.user;
      userProfile.value = res.profile;
      return res;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    await authService.logout();
    user.value = null;
    userProfile.value = null;
  }

  async function refreshProfile() {
    if (user.value) {
      userProfile.value = await authService.getUserProfile(user.value.uid);
    }
  }

  return {
    user,
    userProfile,
    isLoading,
    isInitialized,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isClassAdminOnly,
    isUser,
    userClassId,
    userClassName,
    initAuth,
    login,
    register,
    logout,
    refreshProfile
  };
});
