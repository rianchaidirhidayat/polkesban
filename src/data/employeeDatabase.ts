import { EmployeeRecord, WfaSubmission } from '../types';

/**
 * Pangkalan Data Pegawai Poltekkes Kemenkes Bandung
 * Digunakan untuk pencocokan NIP otomatis pada Formulir Pengajuan WFA Bimbingan
 */
export const POLTEKKES_EMPLOYEES: EmployeeRecord[] = [
  {
    nip: '197508121998031002',
    name: 'Dr. H. Ahmad Sudrajat, S.Kp., M.Kes.',
    unitKerja: 'Jurusan Keperawatan Bandung',
    jabatan: 'Dosen Lektor Kepala / Pembimbing Klinik',
    email: 'ahmad.sudrajat@poltekkesbandung.ac.id',
  },
  {
    nip: '198204152006042001',
    name: 'Hj. Dewi Sartika, S.ST., M.Keb.',
    unitKerja: 'Jurusan Kebidanan Bandung',
    jabatan: 'Dosen Lektor / Koordinator Praktik Kebidanan',
    email: 'dewi.sartika@poltekkesbandung.ac.id',
  },
  {
    nip: '198006202005011003',
    name: 'Drs. Ridwan Kurniawan, Apt., M.Si.',
    unitKerja: 'Jurusan Farmasi',
    jabatan: 'Dosen Lektor / Pembimbing PKL Farmasi',
    email: 'ridwan.kurniawan@poltekkesbandung.ac.id',
  },
  {
    nip: '198509142008122002',
    name: 'drg. Rina Nurul Fauziah, Sp.KGA.',
    unitKerja: 'Jurusan Kesehatan Gigi',
    jabatan: 'Dosen Asisten Ahli / Pembimbing Klinik Gigi',
    email: 'rina.fauziah@poltekkesbandung.ac.id',
  },
  {
    nip: '197811052003121001',
    name: 'Ir. Budi Santoso, M.Sc., Ph.D.',
    unitKerja: 'Jurusan Sanitasi Lingkungan',
    jabatan: 'Dosen Lektor Kepala / Pembimbing Lapangan',
    email: 'budi.santoso@poltekkesbandung.ac.id',
  },
  {
    nip: '198703252010122004',
    name: 'Siti Aminah, S.Gz., M.Gizi.',
    unitKerja: 'Jurusan Gizi & Dietetika',
    jabatan: 'Dosen Lektor / Pembimbing Asuhan Gizi Klinik',
    email: 'siti.aminah@poltekkesbandung.ac.id',
  },
  {
    nip: '198307182006041002',
    name: 'Asep Saepudin, S.ST., M.Biomed.',
    unitKerja: 'Jurusan Teknologi Laboratorium Medis (TLM)',
    jabatan: 'Dosen Lektor / Pembimbing Riset Laboratorium',
    email: 'asep.saepudin@poltekkesbandung.ac.id',
  },
  {
    nip: '198902102014022003',
    name: 'Nurul Hidayati, S.KM., M.Kes.',
    unitKerja: 'Jurusan Promosi Kesehatan',
    jabatan: 'Dosen Asisten Ahli / Koordinator Bimbingan Lapangan',
    email: 'nurul.hidayati@poltekkesbandung.ac.id',
  },
  {
    nip: '197401011994031001',
    name: 'Dr. Tatang Mulyana, S.Pd., M.Kes.',
    unitKerja: 'Jurusan Keperawatan Bandung',
    jabatan: 'Ketua Jurusan Keperawatan / Pembimbing Skripsi',
    email: 'tatang.mulyana@poltekkesbandung.ac.id',
  },
  {
    nip: '198105022005012002',
    name: 'Eni Nuraeni, S.Kep., Ners., M.Kep.',
    unitKerja: 'Jurusan Keperawatan Bandung',
    jabatan: 'Dosen Lektor / Pembimbing Stase KMB & Maternitas',
    email: 'eni.nuraeni@poltekkesbandung.ac.id',
  },
  {
    nip: '198608302010121001',
    name: 'Hendra Gunawan, S.ST., M.Farm.',
    unitKerja: 'Jurusan Farmasi',
    jabatan: 'Dosen Lektor / Pembimbing Praktik Rumah Sakit',
    email: 'hendra.gunawan@poltekkesbandung.ac.id',
  },
  {
    nip: '199011152019022005',
    name: 'Novianti Kusuma, S.Tr.Keb., M.Tr.Keb.',
    unitKerja: 'Jurusan Kebidanan Bandung',
    jabatan: 'Dosen Asisten Ahli / Pembimbing Bidan Komunitas',
    email: 'novianti.kusuma@poltekkesbandung.ac.id',
  },
  {
    nip: '197609122000031001',
    name: 'Agus Priyanto, S.Sos., M.AP.',
    unitKerja: 'Unit OSDM & Kepegawaian Direktorat',
    jabatan: 'Pranata SDM Aparatur Ahli Muda',
    email: 'agus.priyanto@poltekkesbandung.ac.id',
  },
  {
    nip: '198412032009122003',
    name: 'Dra. Yulianti Wulandari, M.M.',
    unitKerja: 'Bagian Administrasi Umum & Keuangan',
    jabatan: 'Analis Kepegawaian Ahli Pertama',
    email: 'yulianti.w@poltekkesbandung.ac.id',
  }
];

/**
 * Mencari data pegawai berdasarkan nomor NIP (tepat atau tanpa spasi)
 */
export function findEmployeeByNip(rawNip: string): EmployeeRecord | undefined {
  if (!rawNip) return undefined;
  const cleanNip = rawNip.replace(/[\s.-]/g, '').trim();
  if (cleanNip.length === 0) return undefined;
  return POLTEKKES_EMPLOYEES.find(emp => emp.nip === cleanNip);
}

/**
 * Mencari pegawai berdasarkan NIP atau Nama (untuk autocomplete/pencarian)
 */
export function searchEmployees(keyword: string): EmployeeRecord[] {
  if (!keyword || keyword.trim().length === 0) return POLTEKKES_EMPLOYEES.slice(0, 8);
  const q = keyword.toLowerCase().trim();
  const cleanQ = q.replace(/[\s.-]/g, '');
  return POLTEKKES_EMPLOYEES.filter(emp => {
    return emp.nip.includes(cleanQ) || emp.name.toLowerCase().includes(q) || emp.unitKerja.toLowerCase().includes(q);
  });
}

/**
 * Initial sample data pengajuan WFA Bimbingan untuk demonstrasi langsung
 */
export const INITIAL_WFA_SUBMISSIONS: WfaSubmission[] = [
  {
    id: 'wfa-sub-001',
    nip: '197508121998031002',
    employeeName: 'Dr. H. Ahmad Sudrajat, S.Kp., M.Kes.',
    unitKerja: 'Jurusan Keperawatan Bandung',
    jabatan: 'Dosen Lektor Kepala / Pembimbing Klinik',
    tanggalWfa: '2026-09-08',
    namaKegiatan: 'Bimbingan Praktik Klinik Keperawatan Medikal Bedah Mahasiswa Tingkat III di RSUP Dr. Hasan Sadikin',
    lokasiKegiatan: 'Kota Bandung',
    lokasiLahanBimbingan: 'RSUP Dr. Hasan Sadikin (RHS)',
    statusWfa: 'WFA Datang',
    linkSuratTugas: 'https://srikandi.arsip.go.id/dokumen/st-2026-09-08-keperawatan',
    status: 'Valid',
    catatanPengelola: 'Surat tugas sah ditandatangani Direktur Poltekkes. Terjadwal sistem presensi WFA.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    validatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    validatedBy: 'Tim OSDM Poltekkes Bandung',
  },
  {
    id: 'wfa-sub-002',
    nip: '198204152006042001',
    employeeName: 'Hj. Dewi Sartika, S.ST., M.Keb.',
    unitKerja: 'Jurusan Kebidanan Bandung',
    jabatan: 'Dosen Lektor / Koordinator Praktik Kebidanan',
    tanggalWfa: '2026-09-10',
    namaKegiatan: 'Supervisi & Ujian Asuhan Persalinan Normal (APN) Mahasiswa D3 Kebidanan di RSUD Al-Ihsan',
    lokasiKegiatan: 'Kabupaten Bandung',
    lokasiLahanBimbingan: 'RSUD Al-Ihsan Baleendah',
    statusWfa: 'WFA Datang & WFA Pulang',
    linkSuratTugas: 'https://drive.google.com/file/d/1A2bC3d4E5f6G7h8_surat_tugas_kebidanan/view',
    status: 'Menunggu Validasi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'wfa-sub-003',
    nip: '198006202005011003',
    employeeName: 'Drs. Ridwan Kurniawan, Apt., M.Si.',
    unitKerja: 'Jurusan Farmasi',
    jabatan: 'Dosen Lektor / Pembimbing PKL Farmasi',
    tanggalWfa: '2026-09-11',
    namaKegiatan: 'Bimbingan dan Evaluasi Mahasiswa PKL Industri Farmasi di Bio Farma',
    lokasiKegiatan: 'Kota Bandung',
    lokasiLahanBimbingan: 'PT Bio Farma (Persero) Pasteur',
    statusWfa: 'WFA Pulang',
    linkSuratTugas: 'https://srikandi.arsip.go.id/dokumen/st-farmasi-biofarma-2026',
    status: 'Menunggu Validasi',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  }
];
