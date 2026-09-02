import React from 'react';
import {
  Globe,
  SlidersHorizontal,
  QrCode,
  RotateCcw,
  Zap,
  LayoutTemplate,
  ShieldAlert,
  LogOut,
  Send,
  Check
} from 'lucide-react';
import { MicrositeProfile } from '../types';

interface NavbarProps {
  currentView: 'public' | 'admin' | 'split';
  setCurrentView: (view: 'public' | 'admin' | 'split') => void;
  onOpenQR: () => void;
  onResetDemo: () => void;
  onLogout: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  lastPublishedAt?: string | null;
  profile: MicrositeProfile;
  totalClicks: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenQR,
  onResetDemo,
  onLogout,
  onPublish,
  isPublishing = false,
  lastPublishedAt,
  profile,
  totalClicks,
}) => {
  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100 z-40 relative shadow-sm">
      {/* Brand Identity & Admin Status */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-900/40 shrink-0">
          <ShieldAlert className="w-4 h-4 text-indigo-200" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Panel Admin</span>
              <span className="text-slate-400 font-normal hidden md:inline">• {profile.name}</span>
            </h1>
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded flex items-center gap-1" title="Tersinkronisasi ke Cloud Firestore: Setiap klik Posting akan langsung tayang di semua HP/perangkat karyawan secara otomatis">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cloud Realtime Sync</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center Main View Switcher */}
      <div className="flex items-center p-1 bg-slate-950/80 border border-slate-800 rounded-lg">
        <button
          onClick={() => setCurrentView('admin')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentView === 'admin'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Dashboard Pengelola</span>
        </button>

        <button
          onClick={() => setCurrentView('split')}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentView === 'split'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Split Preview</span>
        </button>

        <button
          onClick={() => setCurrentView('public')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            currentView === 'public'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Pratinjau Halaman Pegawai</span>
          <span className="sm:hidden">Portal</span>
        </button>
      </div>

      {/* Right Controls & Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Tombol Posting / Update Halaman Pegawai */}
        {onPublish && (
          <button
            onClick={onPublish}
            disabled={isPublishing}
            title="Posting dan publikasikan perubahan agar langsung tayang di portal pegawai"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-75"
          >
            {isPublishing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Memposting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-100" />
                <span>Posting / Update Portal</span>
              </>
            )}
          </button>
        )}

        {/* Real-time Click counter */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{totalClicks} Klik</span>
        </div>

        {/* QR Code Action */}
        <button
          onClick={onOpenQR}
          title="Tampilkan Barcode QR Code"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">QR Code</span>
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset data ke pengaturan dan contoh menu default?')) {
              onResetDemo();
            }
          }}
          title="Reset ke data awal"
          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Logout from Admin */}
        <button
          onClick={onLogout}
          title="Keluar dari Akses Admin (Kunci Portal)"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-red-950/50 hover:bg-red-900/70 text-red-300 hover:text-white text-xs font-semibold border border-red-800/60 transition-colors ml-1"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span className="hidden sm:inline">Keluar Admin</span>
        </button>
      </div>
    </nav>
  );
};

