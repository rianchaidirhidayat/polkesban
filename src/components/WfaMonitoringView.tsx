import React, { useState, useMemo } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { WfaSubmission, WfaValidationStatus } from '../types';

interface WfaMonitoringViewProps {
  submissions: WfaSubmission[];
  onUpdateStatus: (id: string, status: WfaValidationStatus, notes?: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteSubmission?: (id: string) => Promise<{ success: boolean; error?: string }>;
  onRefresh?: () => void;
}

export const WfaMonitoringView: React.FC<WfaMonitoringViewProps> = ({
  submissions,
  onUpdateStatus,
  onDeleteSubmission,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | WfaValidationStatus>('All');
  const [lokasiFilter, setLokasiFilter] = useState<'All' | 'Kota Bandung' | 'Kabupaten Bandung'>('All');
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  
  // Rejection notes modal state
  const [rejectModalItem, setRejectModalItem] = useState<WfaSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

      return matchSearch && matchStatus && matchLokasi;
    });
  }, [submissions, searchQuery, statusFilter, lokasiFilter]);

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
      await onDeleteSubmission(id);
      setDeleteConfirmId(null);
    } finally {
      setIsProcessingId(null);
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
            Monitoring Pengajuan WFA Bimbingan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Verifikasi dan validasi data pengajuan Work From Anywhere dosen dan tenaga pendidik secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Rekap CSV</span>
          </button>
        </div>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari NIP, nama pegawai, atau kegiatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Status Validasi ({submissions.length})</option>
              <option value="Menunggu Validasi">⏳ Menunggu Validasi ({pendingCount})</option>
              <option value="Valid">✓ Valid & Terjadwal ({validCount})</option>
              <option value="Ditolak">✕ Ditolak ({rejectedCount})</option>
            </select>
          </div>

          {/* Lokasi Filter */}
          <div>
            <select
              value={lokasiFilter}
              onChange={(e) => setLokasiFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Lokasi Kegiatan</option>
              <option value="Kota Bandung">Kota Bandung</option>
              <option value="Kabupaten Bandung">Kabupaten Bandung</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>Menampilkan <strong>{filteredSubmissions.length}</strong> dari {submissions.length} pengajuan</span>
          {(searchQuery || statusFilter !== 'All' || lokasiFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setLokasiFilter('All');
              }}
              className="text-indigo-600 hover:text-indigo-800 font-semibold"
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
            {searchQuery || statusFilter !== 'All' || lokasiFilter !== 'All'
              ? 'Silakan sesuaikan kata kunci pencarian atau filter status Anda.'
              : 'Belum ada pegawai yang mengajukan jadwal WFA Bimbingan.'}
          </p>
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
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        {sub.employeeName}
                      </h4>
                      <span className="font-mono text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        NIP: {sub.nip}
                      </span>
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

                    {/* Audit Info if Validated */}
                    {sub.validatedAt && (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        ✓ Disetujui oleh: {sub.validatedBy || 'Pengelola Kepegawaian (OSDM)'} ({new Date(sub.validatedAt).toLocaleString('id-ID')})
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
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
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

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Tandai Ditolak
              </button>
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
    </div>
  );
};
