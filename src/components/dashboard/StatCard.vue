<template>
  <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all relative overflow-hidden flex flex-col justify-between">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-[11px] font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400">{{ title }}</p>
        <h3 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 tracking-tight font-mono">{{ value }}</h3>
      </div>
      <div
        class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 ml-2"
        :class="iconBgClass"
      >
        <slot name="icon">
          <el-icon :size="20"><Wallet /></el-icon>
        </slot>
      </div>
    </div>

    <div v-if="subtitle || $slots.footer" class="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
      <span>{{ subtitle }}</span>
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  iconBgClass: {
    type: String,
    default: 'bg-emerald-600 shadow-emerald-500/20'
  }
});
</script>
