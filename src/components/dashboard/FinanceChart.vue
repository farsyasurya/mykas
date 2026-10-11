<template>
  <div class="w-full">
    <!-- Chart Header Controls -->
    <div class="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Visualisasi:</span>
        <div class="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            @click="chartType = 'area'"
            class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
            :class="chartType === 'area'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <span>Spline Area</span>
          </button>
          <button
            type="button"
            @click="chartType = 'bar'"
            class="px-2.5 py-1 rounded-md transition-all flex items-center gap-1"
            :class="chartType === 'bar'
              ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <span>Kolom Bar</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="hidden sm:flex items-center gap-3 text-xs">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></span>
          <span class="text-slate-500 dark:text-slate-400">Total Masuk:</span>
          <strong class="text-emerald-600 dark:text-emerald-400 font-mono">{{ formatRupiah(totalIncomes) }}</strong>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-500/20"></span>
          <span class="text-slate-500 dark:text-slate-400">Total Keluar:</span>
          <strong class="text-rose-600 dark:text-rose-400 font-mono">{{ formatRupiah(totalExpenses) }}</strong>
        </div>
      </div>
    </div>

    <!-- Chart Container -->
    <div class="h-64 sm:h-72 w-full relative">
      <apexchart
        v-if="hasData"
        width="100%"
        height="100%"
        :type="chartType"
        :options="chartOptions"
        :series="chartSeries"
      />
      
      <!-- Modern Empty State -->
      <div
        v-else
        class="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"
      >
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
        </div>
        <p class="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Transaksi</p>
        <p class="text-[11px] text-slate-400 mt-0.5">Grafik arus kas akan muncul otomatis setelah ada pembayaran kas atau pengeluaran yang dicatat di database.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTheme } from '../../composables/useTheme.js';
import { formatRupiah } from '../../utils/currency.js';

const { isDark } = useTheme();

const props = defineProps({
  incomes: {
    type: Array,
    default: () => []
  },
  expenses: {
    type: Array,
    default: () => []
  },
  labels: {
    type: Array,
    default: () => []
  }
});

const chartType = ref('area');

const hasData = computed(() => {
  return props.labels && props.labels.length > 0;
});

const totalIncomes = computed(() => {
  return (props.incomes || []).reduce((acc, v) => acc + (Number(v) || 0), 0);
});

const totalExpenses = computed(() => {
  return (props.expenses || []).reduce((acc, v) => acc + (Number(v) || 0), 0);
});

const chartSeries = computed(() => [
  {
    name: 'Pemasukan Kas',
    data: props.incomes || []
  },
  {
    name: 'Pengeluaran',
    data: props.expenses || []
  }
]);

const chartOptions = computed(() => {
  const darkMode = isDark.value;
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#1e293b' : '#f1f5f9';

  return {
    chart: {
      type: chartType.value,
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 600,
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      background: 'transparent'
    },
    theme: {
      mode: darkMode ? 'dark' : 'light'
    },
    colors: ['#10b981', '#f43f5e'],
    stroke: {
      curve: 'smooth',
      width: chartType.value === 'area' ? 3 : 0
    },
    fill: {
      type: chartType.value === 'area' ? 'gradient' : 'solid',
      gradient: {
        shade: darkMode ? 'dark' : 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['#059669', '#e11d48'],
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 95, 100]
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '45%',
        borderRadiusApplication: 'end'
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      padding: {
        left: 10,
        right: 10,
        top: 0,
        bottom: 0
      }
    },
    xaxis: {
      categories: props.labels,
      labels: {
        style: {
          colors: textColor,
          fontSize: '11px',
          fontWeight: 600
        }
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '11px',
          fontWeight: 500
        },
        formatter: (val) => {
          if (val >= 1000000) return 'Rp ' + (val / 1000000).toFixed(1) + ' jt';
          if (val >= 1000) return 'Rp ' + (val / 1000).toFixed(0) + ' rb';
          return 'Rp ' + val;
        }
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '12px',
      fontWeight: 600,
      labels: {
        colors: textColor
      },
      markers: {
        width: 10,
        height: 10,
        radius: 12
      }
    },
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => formatRupiah(val)
      }
    }
  };
});
</script>
