import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  RotateCcw,
  Building2,
  Briefcase,
  Mail,
  MessageCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { EmployeeRecord } from '../types';
import {
  getActiveEmployees,
  addNewEmployee,
  updateExistingEmployee,
  deleteExistingEmployee,
  resetEmployeeToDefault,
  subscribeEmployeeChanges,
  loadEmployeeDelta,
} from '../data/employeeDatabase';

const UNIT_KERJA_PRESETS = [
  'Keperawatan Bandung',
  'Keperawatan Bogor',
  'Kebidanan Bandung',
  'Kebidanan Bogor',
  'Kebidanan Karawang',
  'Gizi',
  'TLM',
  'Farmasi',
  'Kesehatan Gigi',
  'Sanitasi Lingkungan',
  'Promosi Kesehatan',
  'Direktorat / OSDM',
];

export const EmployeeManagerView: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => getActiveEmployees());
  const [searchQuery, setSearchQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRecord | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form states for Add / Edit
  const [formNip, setFormNip] = useState('');
  const [formName, setFormName] = useState('');
  const [formUnit, setFormUnit] = useState('');
  const [formJabatan, setFormJabatan] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNomorWa, setFormNomorWa] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync with storage & delta changes
  const reloadData = () => {
    setEmployees(getActiveEmployees());
  };

  useEffect(() => {
    reloadData();
    const unsubscribe = subscribeEmployeeChanges(() => {
      reloadData();
    });
    return unsubscribe;
  }, []);

  const delta = useMemo(() => loadEmployeeDelta(), [employees]);

  // Unique Unit Kerja list for filter dropdown
  const uniqueUnits = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.unitKerja) set.add(e.unitKerja);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/[\s.-]/g, '');

    return employees.filter((emp) => {
      const matchSearch =
        !q ||
        emp.nip.includes(cleanQ) ||
        emp.name.toLowerCase().includes(q) ||
        (emp.unitKerja && emp.unitKerja.toLowerCase().includes(q)) ||
        (emp.jabatan && emp.jabatan.toLowerCase().includes(q));

      const matchUnit = unitFilter === 'All' || emp.unitKerja === unitFilter;

      return matchSearch && matchUnit;
    });
  }, [employees, searchQuery, unitFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, unitFilter]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormNip('');
    setFormName('');
    setFormUnit('');
    setFormJabatan('');
    setFormEmail('');
    setFormNomorWa('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Submit Add
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanNip = formNip.replace(/[\s.-]/g, '').trim();
    if (!cleanNip || cleanNip.length < 3) {
      setFormError('Nomor NIP / NIK / ID Pegawai Non-ASN wajib diisi minimal 3 karakter!');
      return;
    }
    if (!formName.trim()) {
      setFormError('Nama lengkap pegawai wajib diisi!');
      return;
    }
    if (!formUnit.trim()) {
      setFormError('Unit kerja wajib dipilih atau diisi!');
      return;
    }

    const res = addNewEmployee({
      nip: cleanNip,
      name: formName.trim(),
      unitKerja: formUnit.trim(),
      jabatan: formJabatan.trim() || 'Dosen / Tenaga Kependidikan',
      email: formEmail.trim(),
      nomorWa: formNomorWa.trim(),
    });

    if (res.success) {
      reloadData();
      setIsAddModalOpen(false);
      showToast(`Pegawai ${formName.trim()} (NIP: ${cleanNip}) berhasil ditambahkan!`);
    } else {
      setFormError(res.error || 'Gagal menambahkan pegawai.');
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: EmployeeRecord) => {
    setEditingEmployee(emp);
    setFormNip(emp.nip);
    setFormName(emp.name);
    setFormUnit(emp.unitKerja);
    setFormJabatan(emp.jabatan);
    setFormEmail(emp.email || '');
    setFormNomorWa(emp.nomorWa || '');
    setFormError(null);
  };

  // Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    if (!formName.trim()) {
      setFormError('Nama pegawai tidak boleh kosong!');
      return;
    }
    if (!formUnit.trim()) {
      setFormError('Unit kerja tidak boleh kosong!');
      return;
    }

    const res = updateExistingEmployee(editingEmployee.nip, {
      name: formName.trim(),
      unitKerja: formUnit.trim(),
      jabatan: formJabatan.trim(),
      email: formEmail.trim(),
      nomorWa: formNomorWa.trim(),
    });

    if (res.success) {
      reloadData();
      setEditingEmployee(null);
      showToast(`Data pegawai ${formName.trim()} berhasil diperbarui!`);
    } else {
      setFormError(res.error || 'Gagal memperbarui pegawai.');
    }
  };

  // Submit Delete
  const handleConfirmDelete = () => {
    if (!deletingEmployee) return;
    const res = deleteExistingEmployee(deletingEmployee.nip);
    if (res.success) {
      reloadData();
      showToast(`Pegawai ${deletingEmployee.name} (${deletingEmployee.nip}) berhasil dihapus.`);
      setDeletingEmployee(null);
    } else {
      showToast(res.error || 'Gagal menghapus pegawai', 'error');
    }
  };

  // Reset to Factory Default
  const handleConfirmReset = () => {
    resetEmployeeToDefault();
    reloadData();
    setIsResetConfirmOpen(false);
    showToast('Database pegawai berhasil dikembalikan ke standar awal Poltekkes Bandung.');
  };

  // Export CSV Pegawai
  const handleExportEmployeeCSV = () => {
    if (employees.length === 0) return;
    const headers = ['No', 'NIP', 'Nama Pegawai', 'Unit Kerja', 'Jabatan', 'Email'];
    const rows = employees.map((emp, idx) => [
      idx + 1,
      `"${emp.nip}"`,
      `"${emp.name.replace(/"/g, '""')}"`,
      `"${(emp.unitKerja || '').replace(/"/g, '""')}"`,
      `"${(emp.jabatan || '').replace(/"/g, '""')}"`,
      `"${(emp.email || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `database_pegawai_poltekkes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Pegawai Aktif</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{employees.length}</span>
            <span className="text-[11px] font-semibold text-emerald-600">Terdaftar</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Unit Kerja</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{uniqueUnits.length}</span>
            <span className="text-[11px] font-semibold text-indigo-600">Jurusan/Prodi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Penambahan Kustom</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{delta.added.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">Pegawai Baru</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Dihapus / Disesuaikan</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-600">{delta.deleted.length}</span>
            <span className="text-[11px] font-semibold text-slate-400">
              {Object.keys(delta.updated).length} Diedit
            </span>
          </div>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari NIP, nama dosen, jabatan, atau unit kerja..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="relative w-48 sm:w-56">
              <select
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="All">Semua Unit Kerja ({uniqueUnits.length})</option>
                {uniqueUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pegawai</span>
            </button>

            <button
              onClick={handleExportEmployeeCSV}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200"
              title="Ekspor CSV Data Pegawai"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden md:inline">CSV Pegawai</span>
            </button>

            {(delta.added.length > 0 || delta.deleted.length > 0 || Object.keys(delta.updated).length > 0) && (
              <button
                onClick={() => setIsResetConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all border border-rose-200"
                title="Kembalikan database pegawai ke standar awal"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Reset Default</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
          <span>
            Menampilkan <strong>{filteredEmployees.length}</strong> dari total {employees.length} pegawai
            {unitFilter !== 'All' ? ` (Filter: ${unitFilter})` : ''}
          </span>
          <span className="text-slate-400">
            Halaman {currentPage} dari {totalPages}
          </span>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-900 text-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">NIP</th>
                <th className="py-3.5 px-4">Nama Lengkap & Gelar</th>
                <th className="py-3.5 px-4">Unit Kerja</th>
                <th className="py-3.5 px-4">Jabatan</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">Tidak ada data pegawai yang sesuai pencarian.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Coba ubah kata kunci pencarian atau tambah pegawai baru.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, index) => {
                  const itemNumber = (currentPage - 1) * itemsPerPage + index + 1;
                  const isCustomAdded = delta.added.some((a) => a.nip === emp.nip);
                  const isCustomUpdated = Boolean(delta.updated[emp.nip]);
                  const isBogor = emp.unitKerja?.toLowerCase().includes('bogor');
                  const isKarawang = emp.unitKerja?.toLowerCase().includes('karawang');

                  return (
                    <tr key={emp.nip} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center font-semibold text-slate-400 text-[11px]">
                        {itemNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {emp.nip}
                        </span>
                        {isCustomAdded && (
                          <span className="ml-2 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Baru
                          </span>
                        )}
                        {isCustomUpdated && !isCustomAdded && (
                          <span className="ml-2 inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                            Diedit
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{emp.name}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {emp.nomorWa && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>{emp.nomorWa}</span>
                            </span>
                          )}
                          {emp.email && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{emp.email}</span>
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isBogor
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : isKarawang
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>{emp.unitKerja || '-'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="text-[11px]">{emp.jabatan || '-'}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all border border-indigo-200 hover:border-indigo-400"
                            title="Edit Data Pegawai"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all border border-rose-200 hover:border-rose-400"
                            title="Hapus Pegawai"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredEmployees.length} pegawai)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: TAMBAH PEGAWAI BARU */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-sm sm:text-base">Tambah Pegawai Baru</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitAdd} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor NIP / NIK / ID Non-ASN <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 19850101... atau 3204... (NIK/ID)"
                    value={formNip}
                    onChange={(e) => setFormNip(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Untuk ASN gunakan 18 digit NIP resmi. Untuk Non-ASN dapat diisi 16 digit NIK (KTP) atau Nomor Kontrak / ID Pegawai.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Ns. Hj. Siti Aminah, S.Kep., M.Kep."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unit Kerja / Jurusan <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={UNIT_KERJA_PRESETS.includes(formUnit) ? formUnit : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value !== 'OTHER') {
                          setFormUnit(e.target.value);
                        } else {
                          setFormUnit('');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Pilih Rekomendasi Unit Kerja --</option>
                      {UNIT_KERJA_PRESETS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="OTHER">Ketik Unit Kerja Lainnya...</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Atau ketik nama unit kerja secara spesifik..."
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    💡 Catatan: Pegawai dari <strong>Keperawatan Bogor</strong> & <strong>Kebidanan Bogor</strong> otomatis dapat opsi Kota/Kab Bogor. Pegawai dari <strong>Kebidanan Karawang</strong> otomatis dapat opsi Kota/Kab Karawang.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jabatan Kedinasan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Dosen Lektor / Pembimbing Klinik"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email Pegawai (Opsional)
                  </label>
                  <input
                    type="email"
                    placeholder="nama.pegawai@poltekkesbandung.ac.id"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp Pegawai (Opsional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-600 pointer-events-none">
                      WA
                    </div>
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={formNomorWa}
                      onChange={(e) => setFormNomorWa(e.target.value)}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digunakan untuk auto-fill saat pengajuan dan komunikasi WhatsApp dari pengelola.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    Simpan Pegawai Baru
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT PEGAWAI */}
      <AnimatePresence>
        {editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
            >
              <div className="px-6 py-4 bg-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm sm:text-base">Edit Data Pegawai</h3>
                </div>
                <button
                  onClick={() => setEditingEmployee(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">
                    Nomor NIP / NIK / ID Pegawai (Tidak Dapat Diubah)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formNip}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs sm:text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Unit Kerja / Jurusan <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={UNIT_KERJA_PRESETS.includes(formUnit) ? formUnit : 'OTHER'}
                      onChange={(e) => {
                        if (e.target.value !== 'OTHER') {
                          setFormUnit(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {UNIT_KERJA_PRESETS.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                      <option value="OTHER">Lainnya...</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Nama unit kerja..."
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jabatan Kedinasan
                  </label>
                  <input
                    type="text"
                    value={formJabatan}
                    onChange={(e) => setFormJabatan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Email Pegawai
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor WhatsApp Pegawai (Aktif)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-emerald-600 pointer-events-none">
                      WA
                    </div>
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={formNomorWa}
                      onChange={(e) => setFormNomorWa(e.target.value)}
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nomor ini akan otomatis terisi saat pegawai mengajukan WFA Bimbingan.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                  >
                    Perbarui Data Pegawai
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KONFIRMASI HAPUS PEGAWAI */}
      <AnimatePresence>
        {deletingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4"
            >
              <div className="p-3 w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">Hapus Data Pegawai?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data pegawai berikut dari sistem?
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <p className="font-bold text-slate-900">{deletingEmployee.name}</p>
                <p className="text-slate-500 font-mono">NIP: {deletingEmployee.nip}</p>
                <p className="text-slate-500">Unit: {deletingEmployee.unitKerja}</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                ⚠️ Pegawai yang dihapus tidak akan dapat ditemukan saat mengisi form pengajuan WFA bimbingan. Anda dapat menambahkannya kembali kapan saja.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingEmployee(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                >
                  Ya, Hapus Pegawai
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: KONFIRMASI RESET DATABASE */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4"
            >
              <div className="p-3 w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">Kembalikan ke Data Standar Awal?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Tindakan ini akan menghapus seluruh penambahan atau pengubahan data pegawai kustom, dan mengembalikan master data ke daftar pegawai awal Poltekkes Kemenkes Bandung.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReset}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                >
                  Reset ke Data Awal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
