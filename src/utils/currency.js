/**
 * Format number to Indonesian Rupiah currency string
 * @param {number|string} amount
 * @returns {string}
 */
export function formatRupiah(amount) {
  const num = typeof amount === 'number' ? amount : parseInt(amount, 10);
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Parse string or formatted input to clean positive integer Rupiah
 * @param {any} val
 * @returns {number}
 */
export function parseIntegerRupiah(val) {
  if (typeof val === 'number') {
    return Math.max(0, Math.floor(val));
  }
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Formatter for Element Plus el-input-number or text inputs
 * Formats 10000 -> "Rp 10.000"
 * @param {any} value
 * @returns {string}
 */
export function rupiahInputFormatter(value) {
  if (value === null || value === undefined || value === '') return '';
  const numStr = String(value).replace(/\D/g, '');
  if (!numStr) return '';
  return `Rp ${numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/**
 * Parser for Element Plus el-input-number
 * Parses "Rp 10.000" -> "10000"
 * @param {any} value
 * @returns {string}
 */
export function rupiahInputParser(value) {
  return String(value || '').replace(/\D/g, '');
}

