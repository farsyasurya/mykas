import { ref } from 'vue';

const THEME_KEY = 'mykas-theme';
const isDark = ref(false);

// Segera bersihkan class dark jika default mode siang aktif
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark') {
    isDark.value = true;
    document.documentElement.classList.add('dark');
    if (document.body) document.body.classList.add('dark');
  } else {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
    if (document.body) document.body.classList.remove('dark');
    if (!saved) {
      localStorage.setItem(THEME_KEY, 'light');
    }
  }
}

export function useTheme() {
  function initTheme() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      isDark.value = true;
    } else {
      // Default adalah Mode Siang (terang dan bersih)
      isDark.value = false;
      if (!saved) {
        localStorage.setItem(THEME_KEY, 'light');
      }
    }
    applyTheme();
  }

  function applyTheme() {
    if (typeof document === 'undefined') return;
    if (isDark.value) {
      document.documentElement.classList.add('dark');
      if (document.body) document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (document.body) document.body.classList.remove('dark');
    }
  }

  function toggleTheme() {
    isDark.value = !isDark.value;
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light');
    }
    applyTheme();
  }

  return {
    isDark,
    initTheme,
    toggleTheme
  };
}
