import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Check,
  X,
  RotateCcw,
  Trash2,
  Download,
  Calendar,
  User,
  MapPin,
  FileText,
  Building2,
  Briefcase,
  Sparkles,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
  MessageCircle,
  PhoneCall,
  FileDown,
  Users,
} from 'lucide-react';
import { WfaSubmission, WfaValidationStatus } from '../types';
import { EmployeeManagerView } from './EmployeeManagerView';
import { WfaPdfExportModal } from './WfaPdfExportModal';
import { getActiveEmployees, subscribeEmployeeChanges } from '../data/employeeDatabase';

// Date filter utility helpers
const formatDateIndo = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

interface WfaMonitoringViewProps {
  submissions: WfaSubmission[];
  onUpdateStatus: (id: string, status: WfaValidationStatus, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteSubmission?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
  osdmContactWa?: string;
  onUpdateOsdmContactWa?: (newWa: string) => void;
}

export const WfaMonitoringView: React.FC<WfaMonitoringViewProps> = ({
  submissions,
  onUpdateStatus,
  onDeleteSubmission,
  onRefresh,
  osdmContactWa = '08119712525',
  onUpdateOsdmContactWa,
}) => {
  const [monitorTab, setMonitorTab] = useState<'submissions' | 'employees'>('submissions');
  const [employeeCount, setEmployeeCount] = useState(() => getActiveEmployees().length);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeEmployeeChanges(() => {
      setEmployeeCount(getActiveEmployees().length);
    });
    return unsub;
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | WfaValidationStatus>('All');
  const [lokasiFilter, setLokasiFilter] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);

  // OSDM WA contact management state
  const [localWa, setLocalWa] = useState(osdmContactWa);
  const [waSaveStatus, setWaSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    setLocalWa(osdmContactWa);
  }, [osdmContactWa]);

  const handleSaveWa = () => {
    if (onUpdateOsdmContactWa) {
      onUpdateOsdmContactWa(localWa.trim());
      setWaSaveStatus('Nomor WhatsApp Tim Kerja OSDM berhasil diperbarui!');
      setTimeout(() => setWaSaveStatus(null), 3000);
    }
  };
  
  // Rejection notes modal state
  const [rejectModalItem, setRejectModalItem] = useState<WfaSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // WhatsApp modal state for sending messages to employee
  const [waModalItem, setWaModalItem] = useState<WfaSubmission | null>(null);
  const [waTargetPhone, setWaTargetPhone] = useState('');
  const [waCustomMessage, setWaCustomMessage] = useState('');
  const [waPresetType, setWaPresetType] = useState<'kekurangan' | 'kesalahan' | 'konfirmasi' | 'validasi' | 'custom'>('kekurangan');
  const [waPhoneError, setWaPhoneError] = useState<string | null>(null);

  // Format WhatsApp phone number (08... -> 628...)
  const formatWaPhone = (phone: string): string => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.substring(1);
    } else if (clean.startsWith('8')) {
      clean = '62' + clean;
    }
    return clean;
  };

  // Generate template message for admin
  const getWaTemplate = (
    type: 'kekurangan' | 'kesalahan' | 'konfirmasi' | 'validasi' | 'custom',
    sub: WfaSubmission,
    extraNotes?: string
  ): string => {
    const nama = sub.employeeName || 'Bapak/Ibu';
    const tanggal = sub.tanggalWfa;
    const kegiatan = sub.namaKegiatan;
    const lokasi = `${sub.lokasiKegiatan}${sub.lokasiLahanBimbingan ? ' (' + sub.lokasiLahanBimbingan + ')' : ''}`;

    switch (type) {
      case 'kekurangan':
        return `Yth. ${nama},\n\nSehubungan dengan pengajuan WFA Bimbingan Anda untuk tanggal ${tanggal} di ${lokasi} (Kegiatan: ${kegiatan}), Tim Kerja OSDM Poltekkes Kemenkes Bandung mendapati adanya kekurangan berkas / persyaratan:\n\n- ${extraNotes || '[Tuliskan rincian berkas atau kekurangan persyaratan di sini, misal: lembar pengesahan surat tugas belum bertanda tangan / tautan belum bisa dibuka]'}\n\nMohon segera melengkapi kekurangan persyaratan tersebut agar pengajuan jadwal WFA Anda dapat kami validasi.\n\nTerima kasih.\nTim Kerja OSDM Poltekkes Kemenkes Bandung`;

      case 'kesalahan':
        return `Yth. ${nama},\n\nMohon maaf, pengajuan WFA Bimbingan Anda untuk tanggal ${tanggal} di ${lokasi} belum dapat disetujui karena terdapat kesalahan data / tidak sesuai ketentuan:\n\n- ${extraNotes || sub.catatanPengelola || '[Tuliskan kesalahan atau alasan revisi di sini]'}\n\nSilakan lakukan perbaikan atau pengajuan ulang melalui aplikasi WFA Bimbingan. Terima kasih.\nTim Kerja OSDM Poltekkes Kemenkes Bandung`;

      case 'konfirmasi':
        return `Yth. ${nama},\n\nTim Kerja OSDM Poltekkes Kemenkes Bandung ingin mengonfirmasi terkait pengajuan WFA Bimbingan Anda untuk tanggal ${tanggal} di ${lokasi} (Kegiatan: ${kegiatan}).\n\nMohon konfirmasinya terkait kesesuaian berkas surat tugas dan jadwal kehadiran bimbingan Anda.\n\nTerima kasih.\nTim Kerja OSDM Poltekkes Kemenkes Bandung`;

      case 'validasi':
        return `Yth. ${nama},\n\nPengajuan WFA Bimbingan Anda untuk tanggal ${tanggal} di ${lokasi} (Kegiatan: ${kegiatan}, Status: ${sub.statusWfa}) telah divalidasi dan DINYATAKAN VALID / DISETUJUI oleh Tim Kerja OSDM Poltekkes Kemenkes Bandung.\n\nData telah tercatat di sistem jadwal WFA. Selamat bertugas.\n\nTerima kasih.\nTim Kerja OSDM Poltekkes Kemenkes Bandung`;

      default:
        return extraNotes || '';
    }
  };

  // Open WhatsApp Messenger Modal
  const handleOpenWaModal = (
    sub: WfaSubmission,
    defaultPreset?: 'kekurangan' | 'kesalahan' | 'konfirmasi' | 'validasi',
    extraNotes?: string
  ) => {
    let preset = defaultPreset;
    if (!preset) {
      if (sub.status === 'Ditolak') preset = 'kesalahan';
      else if (sub.status === 'Valid') preset = 'validasi';
      else preset = 'kekurangan';
    }

    setWaModalItem(sub);
    setWaTargetPhone(sub.nomorWa || '');
    setWaPresetType(preset);
    setWaPhoneError(null);
    setWaCustomMessage(getWaTemplate(preset, sub, extraNotes));
  };

  // Change active preset inside WA modal
  const handleChangeWaPreset = (preset: 'kekurangan' | 'kesalahan' | 'konfirmasi' | 'validasi') => {
    if (!waModalItem) return;
    setWaPresetType(preset);
    setWaCustomMessage(getWaTemplate(preset, waModalItem));
  };

  // Open WhatsApp Web/App
  const handleSendWa = () => {
    if (!waModalItem) return;
    const cleanPhone = formatWaPhone(waTargetPhone);
    if (cleanPhone.length < 9) {
      setWaPhoneError('Nomor WhatsApp tidak valid. Masukkan minimal 9-14 digit angka.');
      return;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waCustomMessage)}`;
    window.open(url, '_blank');
    setActionFeedback({
      id: waModalItem.id,
      message: `Tautan WhatsApp ke ${waModalItem.employeeName} (${cleanPhone}) berhasil dibuka!`,
      type: 'success',
    });
    setWaModalItem(null);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Search matches
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        sub.nip.toLowerCase().includes(query) ||
        sub.employeeName.toLowerCase().includes(query) ||
        sub.namaKegiatan.toLowerCase().includes(query) ||
        (sub.unitKerja && sub.unitKerja.toLowerCase().includes(query));

      // Status matches
      const matchStatus = statusFilter === 'All' || sub.status === statusFilter;

      // Lokasi matches
      const matchLokasi = lokasiFilter === 'All' || sub.lokasiKegiatan === lokasiFilter;

      // Date matches (per hari berdasarkan tanggal pelaksanaan WFA)
      let matchDate = true;
      if (filterDate) {
        matchDate = sub.tanggalWfa === filterDate;
      }

      return matchSearch && matchStatus && matchLokasi && matchDate;
    });
  }, [submissions, searchQuery, statusFilter, lokasiFilter, filterDate]);

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setLokasiFilter('All');
    setFilterDate('');
  };

  const isAnyFilterActive = Boolean(
    searchQuery ||
    statusFilter !== 'All' ||
    lokasiFilter !== 'All' ||
    filterDate
  );

  // KPI Counts
  const totalCount = submissions.length;
  const pendingCount = submissions.filter((s) => s.status === 'Menunggu Validasi').length;
  const validCount = submissions.filter((s) => s.status === 'Valid').length;
  const rejectedCount = submissions.filter((s) => s.status === 'Ditolak').length;

  // Handle Quick Validate
  const handleValidate = async (id: string) => {
    setIsProcessingId(id);
    setActionFeedback(null);
    try {
      const res = await onUpdateStatus(id, 'Valid');
      if (res.success) {
        setActionFeedback({
          id,
          message: 'Status berhasil divalidasi menjadi "Valid dan Sudah terjadwal WFA"!',
          type: 'success',
        });
      } else {
        setActionFeedback({
          id,
          message: res.error || 'Gagal memvalidasi pengajuan.',
          type: 'error',
        });
      }
    } finally {
      setIsProcessingId(null);
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  // Handle Reset to Pending
  const handleResetToPending = async (id: string) => {
    setIsProcessingId(id);
    setActionFeedback(null);
    try {
      const res = await onUpdateStatus(id, 'Menunggu Validasi');
      if (res.success) {
        setActionFeedback({
          id,
          message: 'Status berhasil dikembalikan ke "Menunggu Validasi".',
          type: 'success',
        });
      }
    } finally {
      setIsProcessingId(null);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Handle Rejection Submit
  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    setIsProcessingId(rejectModalItem.id);
    try {
      const res = await onUpdateStatus(rejectModalItem.id, 'Ditolak', rejectReason);
      if (res.success) {
        setActionFeedback({
          id: rejectModalItem.id,
          message: 'Status pengajuan telah ditandai Ditolak/Revisi.',
          type: 'success',
        });
        setRejectModalItem(null);
        setRejectReason('');
      }
    } finally {
      setIsProcessingId(null);
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!onDeleteSubmission) return;
    setIsProcessingId(id);
    try {
      const res = await onDeleteSubmission(id);
      setDeleteConfirmId(null);
      if (res?.success) {
        setActionFeedback({
          id,
          message: 'Data pengajuan berhasil dihapus permanen dari server & sinkron ke tampilan pegawai.',
          type: 'success',
        });
      }
    } finally {
      setIsProcessingId(null);
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('Tidak ada data pengajuan untuk diekspor.');
      return;
    }

    const headers = [
      'ID Pengajuan',
      'NIP',
      'Nama Pegawai',
      'Nomor WhatsApp Pegawai',
      'Unit Kerja',
      'Jabatan',
      'Tanggal WFA',
      'Nama Kegiatan',
      'Lokasi Kegiatan',
      'Lokasi Lahan Bimbingan',
      'Status WFA',
      'Link Surat Tugas',
      'Status Validasi',
      'Waktu Validasi',
      'Petugas Validasi',
      'Catatan Pengelola',
      'Waktu Pengajuan'
    ];

    const rows = filteredSubmissions.map((sub) => [
      `"${sub.id}"`,
      `"${sub.nip}"`,
      `"${sub.employeeName.replace(/"/g, '""')}"`,
      `"${(sub.nomorWa || '-').replace(/"/g, '""')}"`,
      `"${(sub.unitKerja || '').replace(/"/g, '""')}"`,
      `"${(sub.jabatan || '').replace(/"/g, '""')}"`,
      `"${sub.tanggalWfa}"`,
      `"${sub.namaKegiatan.replace(/"/g, '""')}"`,
      `"${sub.lokasiKegiatan}"`,
      `"${(sub.lokasiLahanBimbingan || '').replace(/"/g, '""')}"`,
      `"${sub.statusWfa}"`,
      `"${sub.linkSuratTugas}"`,
      `"${sub.status}"`,
      `"${sub.validatedAt || '-'}"`,
      `"${sub.validatedBy || '-'}"`,
      `"${(sub.catatanPengelola || '').replace(/"/g, '""')}"`,
      `"${sub.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_wfa_bimbingan_poltekkes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Manajemen OSDM Terpadu • Poltekkes Kemenkes Bandung</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Monitoring & Administrasi WFA Bimbingan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi pengajuan WFA, unduh laporan PDF resmi, dan kelola database master pegawai.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs"
              title="Muat Ulang Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Muat Ulang</span>
            </button>
          )}

          <button
            onClick={() => setIsPdfExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
            title="Download Laporan Resmi Dashboard WFA Bimbingan format PDF (Harian, Mingguan, Bulanan, Tahunan)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download Laporan PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs"
            title="Unduh Rekap CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rekap CSV</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setMonitorTab('submissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            monitorTab === 'submissions'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Monitoring Pengajuan WFA</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              monitorTab === 'submissions' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setMonitorTab('employees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            monitorTab === 'employees'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Kelola Master Pegawai</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              monitorTab === 'employees' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {employeeCount}
          </span>
        </button>
      </div>

      {monitorTab === 'employees' ? (
        <EmployeeManagerView />
      ) : (
        <div className="space-y-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Pengajuan</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{totalCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">Berkas WFA</span>
          </div>
        </div>

        {/* Menunggu Validasi (Highlighted) */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-800">Menunggu Validasi</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-900">{pendingCount}</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-full">
              Perlu Tindakan
            </span>
          </div>
        </div>

        {/* Valid (Disetujui) */}
        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-800">Sudah Valid</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-900">{validCount}</span>
            <span className="text-[11px] font-semibold text-emerald-700">Terjadwal WFA</span>
          </div>
        </div>

        {/* Ditolak */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-800">Ditolak / Revisi</p>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-900">{rejectedCount}</span>
            <span className="text-[11px] font-semibold text-rose-600">Dikembalikan</span>
          </div>
        </div>
      </div>

      {/* Pengaturan Kontak WhatsApp Tim Kerja OSDM (Layanan Bimbingan WFA) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                <MessageCircle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Pengaturan WhatsApp Tim Kerja OSDM (Layanan WFA Bimbingan)
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Nomor ini digunakan untuk tombol <strong>&quot;Hubungi Tim Kerja OSDM&quot;</strong> yang muncul di layar pengecekan status pegawai saat pengajuan WFA berstatus <em>&quot;masih dalam proses&quot;</em>. Anda dapat mengganti nomor WhatsApp kapan saja.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="w-full sm:w-56">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nomor WhatsApp OSDM:
              </label>
              <input
                type="text"
                value={localWa}
                onChange={(e) => setLocalWa(e.target.value)}
                placeholder="Contoh: 08119712525"
                className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-white border border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-slate-800 shadow-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleSaveWa}
                className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Nomor WA</span>
              </button>

              <a
                href={`https://wa.me/${
                  localWa.replace(/[^0-9]/g, '').startsWith('0')
                    ? '62' + localWa.replace(/[^0-9]/g, '').slice(1)
                    : localWa.replace(/[^0-9]/g, '').startsWith('62')
                    ? localWa.replace(/[^0-9]/g, '')
                    : '62' + localWa.replace(/[^0-9]/g, '')
                }?text=${encodeURIComponent('Tes integrasi kontak OSDM Poltekkes Kemenkes Bandung')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
                title="Uji coba buka chat WhatsApp"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tes Tautan WA</span>
              </a>
            </div>
          </div>
        </div>

        {waSaveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{waSaveStatus}</span>
          </motion.div>
        )}
      </div>

      {/* Action Notification Alert */}
      {actionFeedback && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionFeedback.message}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari NIP, nama pegawai, atau kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tanggal Pelaksanaan WFA (Per Hari) */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Tgl WFA:</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer py-0 min-w-0"
                title="Filter pengajuan berdasarkan tanggal pelaksanaan WFA per hari"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200/70 transition-colors shrink-0"
                  title="Hapus filter tanggal WFA"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:bg-white transition-all">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer py-0"
              >
                <option value="All">Semua Status Validasi ({submissions.length})</option>
                <option value="Menunggu Validasi">⏳ Menunggu Validasi ({pendingCount})</option>
                <option value="Valid">✓ Valid & Terjadwal ({validCount})</option>
                <option value="Ditolak">✕ Ditolak ({rejectedCount})</option>
              </select>
            </div>
          </div>

          {/* Lokasi Filter */}
          <div className="lg:col-span-2">
            <select
              value={lokasiFilter}
              onChange={(e) => setLokasiFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Lokasi</option>
              <option value="Kota Bandung">Kota Bandung</option>
              <option value="Kabupaten Bandung">Kabupaten Bandung</option>
              <option value="Kota Bogor">Kota Bogor</option>
              <option value="Kabupaten Bogor">Kabupaten Bogor</option>
              <option value="Kota Karawang">Kota Karawang</option>
              <option value="Kabupaten Karawang">Kabupaten Karawang</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Menampilkan <strong>{filteredSubmissions.length}</strong> dari {submissions.length} pengajuan
            </span>
            {filterDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
                <Calendar className="w-3 h-3" />
                <span>Tgl WFA: {formatDateIndo(filterDate)}</span>
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="hover:text-indigo-900 p-0.5 rounded-full"
                  title="Hapus filter tanggal WFA"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada data pengajuan yang cocok</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAnyFilterActive
              ? 'Silakan sesuaikan kata kunci pencarian, filter status, atau filter tanggal WFA Anda.'
              : 'Belum ada pegawai yang mengajukan jadwal WFA Bimbingan.'}
          </p>
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200 mt-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const isProcessing = isProcessingId === sub.id;

            return (
              <motion.div
                key={sub.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-xs ${
                  sub.status === 'Valid'
                    ? 'bg-white border-emerald-300 ring-1 ring-emerald-200'
                    : sub.status === 'Menunggu Validasi'
                    ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                    : 'bg-slate-50 border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left Block: Pegawai & Detail */}
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Status Badge & Dates */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sub.status === 'Valid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black text-[11px] uppercase tracking-wider shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>VALID & TERJADWAL WFA</span>
                        </span>
                      )}
                      {sub.status === 'Menunggu Validasi' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white font-black text-[11px] uppercase tracking-wider shadow-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>MENUNGGU VALIDASI</span>
                        </span>
                      )}
                      {sub.status === 'Ditolak' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[11px] uppercase tracking-wider shadow-xs">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>DITOLAK / REVISI</span>
                        </span>
                      )}

                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Tanggal WFA: <strong>{sub.tanggalWfa}</strong></span>
                      </span>

                      <span className="text-[11px] text-slate-400">
                        Diajukan: {new Date(sub.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Employee Profile */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        {sub.employeeName}
                      </h4>
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        NIP: {sub.nip}
                      </span>
                      {sub.nomorWa ? (
                        <button
                          type="button"
                          onClick={() => handleOpenWaModal(sub)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200 transition-colors shadow-2xs"
                          title="Klik untuk mengirim pesan WhatsApp ke nomor ini"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WA: {sub.nomorWa}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 font-medium text-[11px] border border-slate-200">
                          <span>WA: Belum dicantumkan</span>
                        </span>
                      )}
                    </div>

                    {/* Unit & Jabatan */}
                    {(sub.unitKerja || sub.jabatan) && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                        {sub.unitKerja && (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {sub.unitKerja}
                          </span>
                        )}
                        {sub.jabatan && (
                          <span className="text-slate-400">
                            • {sub.jabatan}
                          </span>
                        )}
                      </p>
                    )}

                    {/* Kegiatan & Lokasi */}
                    <div className="pt-1 space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                        <span className="text-slate-500 font-normal">Kegiatan: </span>
                        {sub.namaKegiatan}
                      </p>

                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                          <MapPin className="w-3 h-3 text-rose-500" />
                          {sub.lokasiKegiatan}
                        </span>
                        {sub.lokasiLahanBimbingan && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                            <Building2 className="w-3 h-3 text-emerald-600" />
                            <span>Lahan: {sub.lokasiLahanBimbingan}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold border border-teal-200">
                          Pilihan: {sub.statusWfa}
                        </span>
                        {sub.linkSuratTugas && (
                          <a
                            href={sub.linkSuratTugas}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 hover:text-sky-900 font-semibold border border-sky-200 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Buka Surat Tugas</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Audit Info if Validated or Rejected */}
                    {sub.validatedAt && sub.status === 'Valid' && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ Disetujui oleh: {sub.validatedBy || 'Tim OSDM Poltekkes'} ({new Date(sub.validatedAt).toLocaleString('id-ID')})
                      </p>
                    )}
                    {sub.validatedAt && sub.status === 'Ditolak' && (
                      <p className="text-[11px] text-rose-700 font-medium">
                        ✗ Ditolak oleh: {sub.validatedBy || 'Tim OSDM Poltekkes'} ({new Date(sub.validatedAt).toLocaleString('id-ID')})
                      </p>
                    )}

                    {/* Rejection Notes */}
                    {sub.status === 'Ditolak' && sub.catatanPengelola && (
                      <div className="p-2.5 rounded-xl bg-rose-100/60 border border-rose-200 text-rose-900 text-xs">
                        <p className="font-bold">Catatan Pengelola:</p>
                        <p className="mt-0.5">{sub.catatanPengelola}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Block: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center flex-wrap justify-end">
                    {/* BUTTON WA: KIRIM WHATSAPP KE PEGAWAI */}
                    <button
                      onClick={() => handleOpenWaModal(sub)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                      title="Kirim pesan WhatsApp ke pegawai untuk menyampaikan informasi, kesalahan atau kekurangan persyaratan"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim WA</span>
                    </button>

                    {/* BUTTON 1: TOMBOL VALIDASI (Utama) */}
                    {sub.status !== 'Valid' ? (
                      <button
                        onClick={() => handleValidate(sub.id)}
                        disabled={isProcessing}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                          isProcessing
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95'
                        }`}
                        title="Validasi pengajuan ini menjadi status Valid"
                      >
                        <Check className="w-4 h-4" />
                        <span>Validasi Sekarang</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResetToPending(sub.id)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
                        title="Batalkan validasi dan kembalikan ke antrean"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Batalkan Validasi</span>
                      </button>
                    )}

                    {/* BUTTON 2: TOLAK / REVISI */}
                    {sub.status !== 'Ditolak' && (
                      <button
                        onClick={() => {
                          setRejectModalItem(sub);
                          setRejectReason(sub.catatanPengelola || '');
                        }}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors"
                        title="Tolak pengajuan atau minta revisi berkas"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* BUTTON 3: HAPUS */}
                    {onDeleteSubmission && (
                      <button
                        onClick={() => setDeleteConfirmId(sub.id)}
                        disabled={isProcessing}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-rose-600 border border-slate-200 transition-colors"
                        title="Hapus data pengajuan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Tolak / Minta Revisi Pengajuan WFA
              </h3>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p>Pegawai: <strong>{rejectModalItem.employeeName}</strong></p>
              <p>Tanggal WFA: <strong>{rejectModalItem.tanggalWfa}</strong></p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Alasan Penolakan / Catatan untuk Pegawai:
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Surat tugas belum ditandatangani atau jadwal bentrok..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 flex-wrap">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs"
              >
                Tandai Ditolak Saja
              </button>
              <button
                onClick={async () => {
                  const targetItem = rejectModalItem;
                  const reason = rejectReason;
                  await handleConfirmReject();
                  handleOpenWaModal(targetItem, 'kesalahan', reason);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Tolak &amp; Kirim WA Pegawai</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KIRIM PESAN WHATSAPP KE PEGAWAI */}
      {waModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden my-6">
            {/* Modal Header with WhatsApp theme */}
            <div className="bg-emerald-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Kirim Pesan WhatsApp ke Pegawai
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Sampaikan informasi, kesalahan data, atau kekurangan persyaratan pengajuan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWaModalItem(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Pegawai Info Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <span className="text-slate-500 font-medium">Nama Pegawai:</span>
                  <span className="font-bold text-slate-900 text-sm">{waModalItem.employeeName}</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <span className="text-slate-500 font-medium">NIP Pegawai:</span>
                  <span className="font-mono text-slate-800 font-semibold">{waModalItem.nip}</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <span className="text-slate-500 font-medium">Tanggal Pelaksanaan WFA:</span>
                  <span className="font-semibold text-slate-800">{waModalItem.tanggalWfa}</span>
                </div>
                <div className="flex justify-between items-baseline flex-wrap gap-1">
                  <span className="text-slate-500 font-medium">Lokasi / Lahan:</span>
                  <span className="text-slate-700 font-medium">{waModalItem.lokasiKegiatan} ({waModalItem.lokasiLahanBimbingan || '-'})</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Status Pengajuan Saat Ini:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                    waModalItem.status === 'Valid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : waModalItem.status === 'Menunggu Validasi'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {waModalItem.status}
                  </span>
                </div>
              </div>

              {/* Nomor WhatsApp Input Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Nomor WhatsApp Tujuan Pegawai</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  {waTargetPhone && (
                    <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                      Tujuan: +{formatWaPhone(waTargetPhone)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-mono font-bold text-slate-400 pointer-events-none">
                    <span className="text-emerald-600">WA</span>
                    <span className="text-slate-300">|</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890 atau 6281234567890"
                    value={waTargetPhone}
                    onChange={(e) => {
                      setWaTargetPhone(e.target.value);
                      setWaPhoneError(null);
                    }}
                    className={`w-full pl-14 pr-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-emerald-500 ${
                      waPhoneError ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 bg-white'
                    }`}
                  />
                </div>
                {waPhoneError ? (
                  <p className="text-[11px] text-rose-600 font-medium">{waPhoneError}</p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Nomor WhatsApp diambil otomatis dari formulir pengajuan pegawai atau dapat Anda sesuaikan.
                  </p>
                )}
              </div>

              {/* Quick Template Selector Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  Pilih Format Pesan Cepat:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleChangeWaPreset('kekurangan')}
                    className={`p-2 rounded-xl text-left text-xs font-bold transition-all border ${
                      waPresetType === 'kekurangan'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ⚠️ Kekurangan Berkas
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeWaPreset('kesalahan')}
                    className={`p-2 rounded-xl text-left text-xs font-bold transition-all border ${
                      waPresetType === 'kesalahan'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ❌ Kesalahan / Revisi
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeWaPreset('konfirmasi')}
                    className={`p-2 rounded-xl text-left text-xs font-bold transition-all border ${
                      waPresetType === 'konfirmasi'
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ℹ️ Konfirmasi Jadwal
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeWaPreset('validasi')}
                    className={`p-2 rounded-xl text-left text-xs font-bold transition-all border ${
                      waPresetType === 'validasi'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    ✅ WFA Disetujui
                  </button>
                </div>
              </div>

              {/* Textarea for WhatsApp message content */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Isi Pesan WhatsApp (Dapat Diedit Bebas):
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {waCustomMessage.length} karakter
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={waCustomMessage}
                  onChange={(e) => {
                    setWaCustomMessage(e.target.value);
                    setWaPresetType('custom');
                  }}
                  placeholder="Ketik isi pesan WhatsApp untuk pegawai..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 leading-relaxed focus:outline-none focus:border-emerald-500 font-sans"
                />
                <p className="text-[11px] text-slate-500 italic">
                  💡 Tips: Anda dapat mengubah atau menambahkan rincian berkas yang kurang langsung pada kotak pesan di atas sebelum menekan tombol kirim.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWaModalItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendWa}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-emerald-600/30 transition-all active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Buka WhatsApp &amp; Kirim Pesan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Data Pengajuan?</h3>
              <p className="text-xs text-slate-500">
                Data pengajuan ini akan dihapus permanen dari sistem monitoring.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Time Filter Modal */}
      <WfaPdfExportModal
        isOpen={isPdfExportModalOpen}
        onClose={() => setIsPdfExportModalOpen(false)}
        submissions={submissions}
        initialStatusFilter={statusFilter}
        initialLokasiFilter={lokasiFilter}
      />
    </div>
  );
};
