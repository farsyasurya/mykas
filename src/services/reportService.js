import { parseMonthYearRange } from '../utils/date.js';
import { paymentService } from './paymentService.js';
import { expenseService } from './expenseService.js';
import { incomeService } from './incomeService.js';
import { savingsService } from './savingsService.js';
import { meetingService } from './meetingService.js';
import { userService } from './userService.js';
import { classService } from './classService.js';

export const reportService = {
  /**
   * Generate comprehensive monthly financial report for a class
   * @param {string} classId
   * @param {string} mmYyyy e.g. "09-2026"
   */
  async getMonthlyReport(classId, mmYyyy) {
    const range = parseMonthYearRange(mmYyyy);
    const startTimestampMs = range.startDate.getTime();
    const endTimestampMs = range.endDate.getTime();

    // Fetch class info
    const classData = await classService.getClassById(classId);

    // Fetch all records for this class
    const [allPayments, allExpenses, allOtherIncomes, allSavingsTxns, allMeetings, rawUsers] = await Promise.all([
      paymentService.getPaymentsByClass(classId),
      expenseService.getExpensesByClass(classId),
      incomeService.getOtherIncomesByClass(classId),
      savingsService.getTransactionsByClass(classId),
      meetingService.getMeetingsByClass(classId),
      userService.getUsersByClass(classId)
    ]);

    // Hanya role USER (mahasiswa) yang memiliki kewajiban kas dan dicantumkan di rekap
    const allStudents = rawUsers.filter(u => u.role === 'USER');

    // Helper: convert any date format / timestamp to ms
    const extractItemTime = (item, dateField) => {
      if (!item) return 0;
      if (dateField && item[dateField]) {
        const val = item[dateField];
        if (typeof val === 'number') return val;
        if (val.seconds) return val.seconds * 1000;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') {
          const parsed = new Date(val.includes('T') ? val : val + 'T00:00:00').getTime();
          if (!isNaN(parsed)) return parsed;
          const parsedFallback = new Date(val).getTime();
          if (!isNaN(parsedFallback)) return parsedFallback;
        }
      }
      for (const f of ['createdAt', 'updatedAt', 'tanggal', 'timestamp']) {
        const val = item[f];
        if (!val) continue;
        if (typeof val === 'number') return val;
        if (val.seconds) return val.seconds * 1000;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') {
          const parsed = new Date(val).getTime();
          if (!isNaN(parsed)) return parsed;
        }
      }
      return 0;
    };

    const getPaymentKasAmount = (p) => {
      return Number(p.totalMasukKas ?? p.masukKas ?? p.nominalKas ?? p.nominalPembayaran ?? p.nominal) || 0;
    };

    // 1. Calculate historical prior movements (prior to start of month)
    let priorKasIn = 0;
    allPayments.forEach(p => {
      const ms = extractItemTime(p, 'createdAt');
      if (ms > 0 && ms < startTimestampMs) {
        priorKasIn += getPaymentKasAmount(p);
      }
    });

    let priorOtherIn = 0;
    allOtherIncomes.forEach(inc => {
      const ms = extractItemTime(inc, 'tanggalPemasukan');
      if (ms > 0 && ms < startTimestampMs) {
        priorOtherIn += Number(inc.nominal) || 0;
      }
    });

    let priorExpenseOut = 0;
    allExpenses.forEach(exp => {
      const ms = extractItemTime(exp, 'tanggalPengeluaran');
      if (ms > 0 && ms < startTimestampMs) {
        priorExpenseOut += Number(exp.nominal) || 0;
      }
    });

    let priorSavingsRefund = 0;
    allSavingsTxns.forEach(s => {
      const ms = extractItemTime(s, 'createdAt');
      if (ms > 0 && ms < startTimestampMs && s.type === 'WITHDRAWAL') {
        priorSavingsRefund += Number(s.nominal) || 0;
      }
    });

    // 2. Filter transactions occurring DURING the month
    const monthPayments = allPayments.filter(p => {
      const ms = extractItemTime(p, 'createdAt');
      return ms >= startTimestampMs && ms <= endTimestampMs;
    });

    const monthExpenses = allExpenses.filter(exp => {
      const ms = extractItemTime(exp, 'tanggalPengeluaran');
      return ms >= startTimestampMs && ms <= endTimestampMs;
    });

    const monthOtherIncomes = allOtherIncomes.filter(inc => {
      const ms = extractItemTime(inc, 'tanggalPemasukan');
      return ms >= startTimestampMs && ms <= endTimestampMs;
    });

    const monthSavingsRefunds = allSavingsTxns.filter(s => {
      const ms = extractItemTime(s, 'createdAt');
      return ms >= startTimestampMs && ms <= endTimestampMs && s.type === 'WITHDRAWAL';
    });

    // 3. Totals during the month
    const totalPemasukanKasRutin = monthPayments.reduce((acc, p) => acc + getPaymentKasAmount(p), 0);
    const totalPemasukanLain = monthOtherIncomes.reduce((acc, inc) => acc + (Number(inc.nominal) || 0), 0);
    const totalPengeluaranOperasional = monthExpenses.reduce((acc, exp) => acc + (Number(exp.nominal) || 0), 0);
    const totalPengembalianTabungan = monthSavingsRefunds.reduce((acc, s) => acc + (Number(s.nominal) || 0), 0);
    const netMonthMovement = totalPemasukanKasRutin + totalPemasukanLain - totalPengeluaranOperasional - totalPengembalianTabungan;

    // 4. Master Balance Reconciliation: Synchronize with Canonical Class Saldo
    const actualClassSaldo = Number(classData?.saldo) || 0;
    const now = new Date();
    const isCurrentOrFutureMonth = !range.year || range.year > now.getFullYear() || (range.year === now.getFullYear() && range.month >= (now.getMonth() + 1));

    let saldoAkhir = 0;
    let saldoAwal = 0;

    if (isCurrentOrFutureMonth) {
      // Saldo akhir kas periode berjalan selaras 100% dengan saldo kas kelas di database (contoh: Rp 46.000)
      saldoAkhir = actualClassSaldo;
      saldoAwal = Math.max(0, saldoAkhir - netMonthMovement);
    } else {
      // Periode historis di masa lalu
      const calculatedSaldoAwal = priorKasIn + priorOtherIn - priorExpenseOut - priorSavingsRefund;
      // Reconcile initial baseline saldo if class had starting capital
      const totalAllIn = allPayments.reduce((acc, p) => acc + getPaymentKasAmount(p), 0) + allOtherIncomes.reduce((acc, i) => acc + (Number(i.nominal) || 0), 0);
      const totalAllOut = allExpenses.reduce((acc, e) => acc + (Number(e.nominal) || 0), 0) + allSavingsTxns.filter(s => s.type === 'WITHDRAWAL').reduce((acc, s) => acc + (Number(s.nominal) || 0), 0);
      const baselineSaldo = Math.max(0, actualClassSaldo - (totalAllIn - totalAllOut));

      saldoAwal = calculatedSaldoAwal + baselineSaldo;
      saldoAkhir = saldoAwal + netMonthMovement;
    }

    // Total tabungan mahasiswa (class liability info)
    const totalTabunganMahasiswa = allStudents.reduce((acc, s) => acc + (Number(s.tabungan) || 0), 0);

    // 5. Student payment recap for active meetings (HANYA SEMESTER YANG SEDANG BERJALAN)
    const runningSemester = classData?.semesterAktif;
    const activeMeetings = allMeetings.filter(m =>
      m.status !== 'CANCELLED' && (!runningSemester || m.semester === runningSemester)
    );
    const totalPertemuan = activeMeetings.length;
    const tarifKas = classData?.tarifKas || 7000;

    // Tentukan pertemuan yang sudah jatuh tempo / saat ini & sebelumnya
    // Gunakan tanggal lokal klien YYYY-MM-DD
    // const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dueMeetings = activeMeetings.filter(m =>
      m.status === 'COMPLETED' || (m.tanggalPertemuan && m.tanggalPertemuan <= today)
    );
    const totalPertemuanWajib = dueMeetings.length;

    // Map each student's paid meetings strictly within activeMeetings
    const rekapMahasiswa = allStudents.map(student => {
      const studentPayments = allPayments.filter(p => p.userId === student.id);
      const paidMeetingIds = new Set();

      studentPayments.forEach(p => {
        if (Array.isArray(p.meetingIds)) {
          p.meetingIds.forEach(id => {
            // Hanya perhitungkan pembayaran untuk pertemuan di semester yang sedang berjalan
            if (activeMeetings.some(m => m.id === id)) {
              paidMeetingIds.add(id);
            }
          });
        }
      });

      // Total pertemuan yang sudah dibayar mahasiswa di semester ini
      const pertemuanLunas = activeMeetings.filter(m => paidMeetingIds.has(m.id)).length;

      // Pertemuan jatuh tempo (sekarang dan sebelumnya) yang sudah dibayar vs belum dibayar
      // Mahasiswa dianggap telah melunasi kewajiban jika sudah membayar pertemuan yang jatuh tempo,
      // atau total pertemuan yang dibayarnya telah mencukupi jumlah pertemuan wajib saat ini.
      const duePaidCount = dueMeetings.filter(m => paidMeetingIds.has(m.id)).length;
      const effectivePaidCount = Math.max(duePaidCount, Math.min(pertemuanLunas, totalPertemuanWajib));
      const dueUnpaidCount = Math.max(0, totalPertemuanWajib - effectivePaidCount);

      // Kewajiban saat ini hanya dari pertemuan yang sudah tiba waktunya (sekarang & sebelumnya)
      const totalKewajiban = dueMeetings.reduce((s, m) => s + (Number(m.tarifKas) || tarifKas), 0);
      const totalKasPaid = activeMeetings.filter(m => paidMeetingIds.has(m.id)).reduce((s, m) => s + (Number(m.tarifKas) || tarifKas), 0);
      const tunggakan = dueMeetings.filter(m => !paidMeetingIds.has(m.id)).reduce((s, m) => s + (Number(m.tarifKas) || tarifKas), 0);

      // Status: jika sudah membayar pertemuan sekarang dan sebelumnya, statusnya LUNAS
      // Walaupun ada pertemuan lain setelahnya, tidak wajib membayar selagi waktunya belum datang
      let status = 'BELUM ADA PEMBAYARAN';
      if (totalPertemuanWajib === 0 || dueUnpaidCount === 0) {
        status = 'LUNAS';
      } else if (pertemuanLunas > 0) {
        status = 'BELUM LUNAS';
      } else {
        status = 'BELUM ADA PEMBAYARAN';
      }

      return {
        userId: student.id,
        namaLengkap: student.namaLengkap,
        namaPanggilan: student.namaPanggilan,
        nim: student.nim,
        semester: runningSemester,
        totalPertemuan,
        totalPertemuanWajib,
        pertemuanLunas,
        pertemuanBelumLunas: dueUnpaidCount,
        totalKewajiban,
        totalKasPaid,
        saldoTabungan: student.tabungan || 0,
        tunggakan,
        status
      };
    });

    const mahasiswaLunasCount = rekapMahasiswa.filter(s => s.status === 'LUNAS').length;
    const mahasiswaBelumLunasCount = rekapMahasiswa.filter(s => s.status !== 'LUNAS').length;
    const tunggakanList = rekapMahasiswa.filter(s => s.tunggakan > 0);

    return {
      period: range,
      classData,
      saldoAwal,
      totalPemasukanKasRutin,
      totalPemasukanLain,
      totalPengeluaranOperasional,
      totalPengembalianTabungan,
      saldoAkhir,
      totalTabunganMahasiswa,
      monthPayments,
      monthExpenses,
      monthOtherIncomes,
      monthSavingsRefunds,
      rekapMahasiswa,
      tunggakanList,
      mahasiswaLunasCount,
      mahasiswaBelumLunasCount,
      totalMahasiswa: allStudents.length
    };
  },

  /**
   * Get 6-month historical cashflow trend strictly calculated from database
   * @param {string} classId
   * @returns {Promise<{ labels: string[], incomes: number[], expenses: number[], monthsData: Array }>}
   */
  async getSixMonthsTrend(classId) {
    if (!classId) return { labels: [], incomes: [], expenses: [], monthsData: [] };

    const [allPayments, allExpenses, allOtherIncomes] = await Promise.all([
      paymentService.getPaymentsByClass(classId),
      expenseService.getExpensesByClass(classId),
      incomeService.getOtherIncomesByClass(classId)
    ]);

    const monthShortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const extractItemTime = (item, dateField) => {
      if (!item) return 0;
      if (dateField && item[dateField]) {
        const val = item[dateField];
        if (typeof val === 'number') return val;
        if (val.seconds) return val.seconds * 1000;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') {
          const parsed = new Date(val.includes('T') ? val : val + 'T00:00:00').getTime();
          if (!isNaN(parsed)) return parsed;
          const parsedFallback = new Date(val).getTime();
          if (!isNaN(parsedFallback)) return parsedFallback;
        }
      }
      for (const f of ['createdAt', 'updatedAt', 'tanggal', 'timestamp']) {
        const val = item[f];
        if (!val) continue;
        if (typeof val === 'number') return val;
        if (val.seconds) return val.seconds * 1000;
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') {
          const parsed = new Date(val).getTime();
          if (!isNaN(parsed)) return parsed;
        }
      }
      return 0;
    };

    const getPaymentKasAmount = (p) => {
      return Number(p.totalMasukKas ?? p.masukKas ?? p.nominalKas ?? p.nominalPembayaran ?? p.nominal) || 0;
    };

    const now = new Date();
    const months = [];

    // Past 5 months up to current month (total 6 months)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth(); // 0..11
      const startMs = new Date(year, month, 1, 0, 0, 0, 0).getTime();
      const endMs = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      const label = `${monthShortNames[month]}${year !== now.getFullYear() ? " '" + String(year).slice(-2) : ''}`;

      // Incomes during this month (Kas rutin + Other incomes)
      const kasIn = allPayments
        .filter(p => {
          const ms = extractItemTime(p, 'createdAt');
          return ms >= startMs && ms <= endMs;
        })
        .reduce((sum, p) => sum + getPaymentKasAmount(p), 0);

      const otherIn = allOtherIncomes
        .filter(inc => {
          const ms = extractItemTime(inc, 'tanggalPemasukan');
          return ms >= startMs && ms <= endMs;
        })
        .reduce((sum, inc) => sum + (Number(inc.nominal) || 0), 0);

      const totalIn = kasIn + otherIn;

      // Operational expenses during this month
      const totalExp = allExpenses
        .filter(exp => {
          const ms = extractItemTime(exp, 'tanggalPengeluaran');
          return ms >= startMs && ms <= endMs;
        })
        .reduce((sum, exp) => sum + (Number(exp.nominal) || 0), 0);

      months.push({
        label,
        year,
        month: month + 1,
        kasRutin: kasIn,
        pemasukanLain: otherIn,
        income: totalIn,
        expense: totalExp,
        net: totalIn - totalExp
      });
    }

    return {
      labels: months.map(m => m.label),
      incomes: months.map(m => m.income),
      expenses: months.map(m => m.expense),
      monthsData: months
    };
  }
};
