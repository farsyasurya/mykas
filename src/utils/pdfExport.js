import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from './currency.js';
import { formatIndonesianDate, formatIndonesianDateTime } from './date.js';

/**
 * Generate professional PDF report for class kas finances
 * @param {Object} reportData Data from reportService.getMonthlyReport
 * @param {string} action 'download' | 'print'
 */
export function exportMonthlyReportPdf(reportData, action = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [5, 150, 105]; // #059669 Emerald
  const darkSlate = [15, 23, 42]; // #0f172a
  const grayColor = [100, 116, 139]; // #64748b

  const className = reportData.classData?.namaKelas || 'Kelas Mahasiswa';
  const semester = reportData.classData?.semesterAktif || '-';
  const periodLabel = reportData.period?.label || 'Periode Laporan';
  const todayFormatted = formatIndonesianDateTime(new Date());

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MyKas - Laporan Keuangan Kas Kelas', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem Manajemen Kas & Pertemuan Mahasiswa', 196, 15, { align: 'right' });

  // 2. Metadata Section
  let currentY = 32;
  doc.setTextColor(...darkSlate);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Kelas: ${className}`, 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Semester: ${semester}`, 14, currentY + 6);

  doc.text(`Periode: ${periodLabel}`, 196, currentY, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`Dibuat pada: ${todayFormatted}`, 196, currentY + 6, { align: 'right' });

  currentY += 14;

  // 3. Ringkasan Saldo Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('1. Ringkasan Saldo Kas', 14, currentY);
  currentY += 3;

  const summaryBody = [
    ['Saldo Awal Periode', formatRupiah(reportData.saldoAwal)],
    ['Total Pemasukan Kas Rutin (Pertemuan)', `+ ${formatRupiah(reportData.totalPemasukanKasRutin)}`],
    ['Total Pemasukan Lain (Sumbangan/Kegiatan)', `+ ${formatRupiah(reportData.totalPemasukanLain)}`],
    ['Total Pengeluaran Operasional', `- ${formatRupiah(reportData.totalPengeluaranOperasional)}`],
    ['Total Pengembalian Tabungan Mahasiswa', `- ${formatRupiah(reportData.totalPengembalianTabungan)}`],
    ['SALDO AKHIR KAS KELAS', formatRupiah(reportData.saldoAkhir)],
    ['[Informasi Terpisah] Total Saldo Tabungan Mahasiswa', formatRupiah(reportData.totalTabunganMahasiswa)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Komponen Keuangan', 'Nominal (Rp)']],
    body: summaryBody,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: darkSlate
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 62, halign: 'right', fontStyle: 'bold' }
    },
    styles: {
      cellPadding: 2.5
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 4. Detail Pengeluaran Bulan Ini
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('2. Rincian Pengeluaran Operasional', 14, currentY);
  currentY += 3;

  const expenseRows = (reportData.monthExpenses || []).map((exp, idx) => [
    idx + 1,
    exp.tanggalPengeluaran || '-',
    exp.kategori || '-',
    exp.judul || '-',
    formatRupiah(exp.nominal)
  ]);

  if (expenseRows.length === 0) {
    expenseRows.push(['-', '-', '-', 'Tidak ada pengeluaran pada periode ini', 'Rp 0']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Tanggal', 'Kategori', 'Keperluan / Keterangan', 'Nominal']],
    body: expenseRows,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkSlate
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 80 },
      4: { cellWidth: 34, halign: 'right' }
    },
    styles: { cellPadding: 2 }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 5. Rekap Pembayaran Mahasiswa
  // Check if page has enough room
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('3. Rekapitulasi Kas Mahasiswa', 14, currentY);
  currentY += 3;

  const studentRows = (reportData.rekapMahasiswa || []).map((st, idx) => [
    idx + 1,
    st.namaLengkap || '-',
    st.nim || '-',
    `${st.pertemuanLunas} / ${st.totalPertemuanWajib || st.totalPertemuan} Wajib`,
    formatRupiah(st.totalKasPaid),
    st.tunggakan > 0 ? formatRupiah(st.tunggakan) : 'Rp 0',
    formatRupiah(st.saldoTabungan),
    st.status
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'Nama Mahasiswa', 'NIM', 'Lunas', 'Kas Masuk', 'Tunggakan', 'Tabungan', 'Status']],
    body: studentRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: darkSlate
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42 },
      2: { cellWidth: 25 },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 19, halign: 'center', fontStyle: 'bold' }
    },
    styles: { cellPadding: 1.8 }
  });

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...grayColor);
    doc.text(
      `Dokumen Resmi MyKas — Dicetak pada ${todayFormatted} — Halaman ${i} dari ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Format file name
  const cleanClassName = className.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Laporan_Kas_${cleanClassName}_${reportData.period?.monthStr || ''}${periodLabel.replace(/\s+/g, '_')}.pdf`;

  if (action === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}

/**
 * Generate professional PDF report for a single meeting kas status
 * @param {Object} params
 * @param {Object} params.meeting Selected meeting object
 * @param {Array} params.students Array of student processed row objects
 * @param {string} params.className Class name string
 * @param {string} params.generatedBy Name of admin generating the report
 * @param {string} action 'download' | 'print'
 */
export function exportMeetingReportPdf({ meeting, students = [], className = '', generatedBy = '' }, action = 'download') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [5, 150, 105]; // #059669 Emerald
  const darkSlate = [15, 23, 42]; // #0f172a
  const grayColor = [100, 116, 139]; // #64748b

  const meetingNumber = meeting?.nomorPertemuan || '-';
  const meetingDate = meeting?.tanggalPertemuan ? formatIndonesianDate(meeting.tanggalPertemuan) : '-';
  const semester = meeting?.semester || '-';
  const tarifKas = Number(meeting?.tarifKas) || 7000;
  const todayFormatted = formatIndonesianDateTime(new Date());

  const allRows = students || [];
  const lunasList = allRows.filter(s => s.status === 'LUNAS');
  const unpaidList = allRows.filter(s => s.status !== 'LUNAS');
  const totalStudents = allRows.length;
  const lunasCount = lunasList.length;
  const unpaidCount = unpaidList.length;
  const lunasPct = totalStudents > 0 ? Math.round((lunasCount / totalStudents) * 100) : 0;
  const unpaidPct = 100 - lunasPct;

  const totalKasMasuk = lunasCount * tarifKas;
  const totalTunggakan = unpaidCount * tarifKas;

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`MyKas — Laporan Kas Pertemuan Ke-${meetingNumber}`, 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistem Pengelolaan Kas Mahasiswa', 196, 15, { align: 'right' });

  // 2. Metadata Section
  let currentY = 32;
  doc.setTextColor(...darkSlate);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`Kelas: ${className || 'Kelas Mahasiswa'}`, 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Semester: ${semester}`, 14, currentY + 5.5);
  doc.text(`Tarif Kas: ${formatRupiah(tarifKas)} / Mahasiswa`, 14, currentY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text(`Jadwal: Pertemuan Ke-${meetingNumber}`, 196, currentY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Pertemuan: ${meetingDate}`, 196, currentY + 5.5, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`Dicetak: ${todayFormatted}${generatedBy ? ' (' + generatedBy + ')' : ''}`, 196, currentY + 11, { align: 'right' });

  currentY += 18;

  // 3. Ringkasan Statistik Pertemuan
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('1. Ringkasan Kehadiran Kas Pertemuan', 14, currentY);
  currentY += 3;

  const summaryData = [
    [
      { content: 'Total Mahasiswa', styles: { fontStyle: 'bold' } },
      `${totalStudents} Orang`,
      { content: 'Kas Terkumpul (Lunas)', styles: { fontStyle: 'bold', textColor: [4, 120, 87] } },
      formatRupiah(totalKasMasuk)
    ],
    [
      { content: 'Sudah Lunas', styles: { fontStyle: 'bold' } },
      `${lunasCount} Orang (${lunasPct}%)`,
      { content: 'Tunggakan Belum Bayar', styles: { fontStyle: 'bold', textColor: [190, 18, 60] } },
      formatRupiah(totalTunggakan)
    ],
    [
      { content: 'Belum Membayar', styles: { fontStyle: 'bold' } },
      `${unpaidCount} Orang (${unpaidPct}%)`,
      { content: 'Keterangan Pertemuan', styles: { fontStyle: 'bold' } },
      meeting?.materi || meeting?.keterangan || 'Pertemuan Perkuliahan Reguler'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    body: summaryData,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: darkSlate
    },
    columnStyles: {
      0: { cellWidth: 48, fillColor: [248, 250, 252] },
      1: { cellWidth: 45 },
      2: { cellWidth: 48, fillColor: [248, 250, 252] },
      3: { cellWidth: 47 }
    }
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // 4. Tabel Rincian Status Pembayaran Mahasiswa
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('2. Rincian Status Pembayaran Mahasiswa', 14, currentY);
  currentY += 3;

  const tableBody = allRows.map((st, idx) => {
    const isPaid = st.status === 'LUNAS';
    const tglBayar = isPaid && st.tanggalMembayar ? formatIndonesianDateTime(st.tanggalMembayar) : '-';
    const metode = isPaid ? (st.metodePembayaran || 'CASH') : '-';

    return [
      idx + 1,
      st.nim || '-',
      st.namaLengkap || '-',
      formatRupiah(st.nominal || tarifKas),
      {
        content: isPaid ? 'LUNAS' : 'BELUM BAYAR',
        styles: {
          fontStyle: 'bold',
          textColor: isPaid ? [4, 120, 87] : [225, 29, 72],
          halign: 'center'
        }
      },
      tglBayar,
      metode
    ];
  });

  if (tableBody.length === 0) {
    tableBody.push(['-', '-', 'Tidak ada data mahasiswa', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'NIM', 'Nama Mahasiswa', 'Nominal', 'Status', 'Waktu Pembayaran', 'Metode']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkSlate
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 54 },
      3: { cellWidth: 23, halign: 'right' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 32, fontSize: 7.5 },
      6: { cellWidth: 15, halign: 'center' }
    },
    styles: { cellPadding: 2 }
  });

  // Footer page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(...grayColor);
    doc.text(
      `Dokumen Resmi MyKas — Laporan Kas Pertemuan Ke-${meetingNumber} (${className}) — Halaman ${i} dari ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const cleanClassName = (className || 'Kelas').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Laporan_Kas_Pertemuan_${meetingNumber}_${cleanClassName}.pdf`;

  if (action === 'print') {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}

export default {
  exportMonthlyReportPdf,
  exportMeetingReportPdf
};
