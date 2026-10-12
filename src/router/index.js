import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: () => {
      const authStore = useAuthStore();
      if (!authStore.isAuthenticated) return '/login';
      if (authStore.isAdmin) return '/admin/dashboard';
      return '/user/dashboard';
    }
  },
  // Auth routes
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/auth/RegisterView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/auth/ForgotPasswordView.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/bootstrap-super-admin',
    name: 'BootstrapSuperAdmin',
    component: () => import('../views/auth/BootstrapSuperAdminView.vue')
  },
  // Admin & Super Admin routes
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/admin/AdminDashboardView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/classes',
    name: 'ClassManagement',
    component: () => import('../views/admin/ClassManagementView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'UserManagement',
    component: () => import('../views/admin/UserManagementView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin/audit-logs',
    name: 'AuditLogs',
    component: () => import('../views/admin/AuditLogsView.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/admin/meetings',
    name: 'Meetings',
    component: () => import('../views/meetings/MeetingsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/payments',
    name: 'Payments',
    component: () => import('../views/payments/PaymentsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/payments/create',
    name: 'PaymentCreate',
    component: () => import('../views/payments/PaymentCreateView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/payments/status',
    name: 'StudentPaymentStatus',
    component: () => import('../views/payments/StudentPaymentStatusView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/finances',
    name: 'Finances',
    component: () => import('../views/finances/FinancesView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // Backward compatibility redirects for unified pages
  {
    path: '/admin/savings',
    redirect: '/admin/finances'
  },
  {
    path: '/admin/expenses',
    redirect: '/admin/finances'
  },
  {
    path: '/admin/incomes',
    redirect: '/admin/finances'
  },
  {
    path: '/admin/reports',
    name: 'Reports',
    component: () => import('../views/reports/ReportsView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/reports/meeting',
    name: 'MeetingReport',
    component: () => import('../views/reports/MeetingReportView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // Student / User routes
  {
    path: '/user/dashboard',
    name: 'UserDashboard',
    component: () => import('../views/user/UserDashboardView.vue'),
    meta: { requiresAuth: true, requiresUser: true }
  },
  {
    path: '/user/reports',
    name: 'UserReports',
    component: () => import('../views/reports/ReportsView.vue'),
    meta: { requiresAuth: true, requiresUser: true }
  },
  {
    path: '/user/savings',
    name: 'UserSavings',
    component: () => import('../views/user/UserSavingsView.vue'),
    meta: { requiresAuth: true, requiresUser: true }
  },
  {
    path: '/user/meetings',
    name: 'UserMeetings',
    component: () => import('../views/user/UserMeetingsView.vue'),
    meta: { requiresAuth: true, requiresUser: true }
  },
  {
    path: '/user/profile',
    name: 'UserProfile',
    component: () => import('../views/user/UserProfileView.vue'),
    meta: { requiresAuth: true, requiresUser: true }
  },
  {
    path: '/user/telegram',
    name: 'UserTelegram',
    component: () => import('../views/user/UserTelegramView.vue'),
    meta: { requiresAuth: true, requiresUser: true }
  },

  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.isInitialized) {
    await authStore.initAuth();
  }

  // Akun berstatus tidak aktif tidak boleh mengakses rute terproteksi
  if (authStore.isAuthenticated && authStore.userProfile?.isActive === false) {
    await authStore.logout();
    return next({ path: '/login', query: { error: 'inactive' } });
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    if (authStore.isAdmin) return next('/admin/dashboard');
    return next('/user/dashboard');
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  // Admin dan Super Admin tidak boleh mengakses rute Portal Mahasiswa
  if (to.meta.requiresUser && !authStore.isUser) {
    return next('/admin/dashboard');
  }

  // Mahasiswa (USER) tidak boleh mengakses rute Admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/user/dashboard');
  }

  // Hanya SUPER_ADMIN yang boleh mengakses rute Super Admin
  if (to.meta.requiresSuperAdmin && !authStore.isSuperAdmin) {
    return next('/admin/dashboard');
  }

  next();
});

export default router;
