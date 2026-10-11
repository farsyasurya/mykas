/**
 * Format timestamp or ISO string to Indonesian date string (e.g. 10 September 2026)
 * @param {any} dateInput
 * @returns {string}
 */
export function formatIndonesianDate(dateInput) {
  if (!dateInput) return '-';

  let date;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else {
    return '-';
  }

  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

/**
 * Format timestamp to Indonesian Date and Time
 */
export function formatIndonesianDateTime(dateInput) {
  if (!dateInput) return '-';

  let date;
  if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput.seconds) {
    date = new Date(dateInput.seconds * 1000);
  } else {
    return '-';
  }

  if (isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

/**
 * Parse MM-YYYY (e.g. '09-2026') into start and end of that month in UTC/Local Indonesian Time
 * @param {string} mmYyyy
 * @returns {{ startDate: Date, endDate: Date, startIso: string, endIso: string, monthName: string, year: number }}
 */
export function parseMonthYearRange(mmYyyy) {
  if (!mmYyyy || !mmYyyy.includes('-')) {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    mmYyyy = `${m}-${y}`;
  }

  const [monthStr, yearStr] = mmYyyy.split('-');
  const month = parseInt(monthStr, 10); // 1-indexed (1..12)
  const year = parseInt(yearStr, 10);

  // Start of month: 1st day 00:00:00.000
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);

  // End of month: last day of month 23:59:59.999
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const monthName = monthNames[month - 1] || 'Bulan';

  const startIso = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = endDate.getDate();
  const endIso = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return {
    month,
    year,
    monthName,
    startDate,
    endDate,
    startIso,
    endIso,
    label: `${monthName} ${year}`
  };
}

/**
 * Get current MM-YYYY
 */
export function getCurrentMonthYear() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${m}-${y}`;
}
