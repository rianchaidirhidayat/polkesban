import React from 'react';
import {
  Globe,
  SlidersHorizontal,
  QrCode,
  Zap,
  LayoutTemplate,
  ShieldAlert,
  LogOut,
  Send,
  RefreshCw,
  Check
} from 'lucide-react';
import { MicrositeProfile } from '../types';

interface NavbarProps {
  currentView: 'public' | 'admin' | 'split';
  setCurrentView: (view: 'public' | 'admin' | 'split') => void;
  onOpenQR: () => void;
  onResetDemo?: () => void;
  onLogout: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  lastPublishedAt?: string | null;
  profile: MicrositeProfile;
  totalClicks: number;
  onRefreshCloud?: () => Promise<any>;
  isForceSyncing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenQR,
  onLogout,
  onPublish,
  isPublishing = false,
  lastPublishedAt,
  profile,
  totalClicks,
  onRefreshCloud,
  isForceSyncing = false,
}) => {
  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 text-slate-100 z-40 relative shadow-sm">
      {/* Container with mobile-first adaptive layout */}
      <div className="px-3 sm:px-6 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        
        {/* Top / Left: Brand Identity & Realtime Indicator */}
        <div className="flex items-center justify-between md:justify-start gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-900/40 shrink-0">
              <ShieldAlert className="w-4 h-4 text-indigo-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate flex items-center gap-1.5">
                  <span>Panel Admin</span>
                  <span className="text-slate-400 font-normal hidden lg:inline">• {profile.name}</span>
                </h1>
                <span 
                  className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded flex items-center gap-1 shrink-0" 
                  title="Tersinkronisasi ke Cloud Firestore: Setiap klik Posting akan langsung tayang di semua HP/perangkat pegawai secara otomatis"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Cloud Realtime Sync</span>
                  <span className="sm:hidden">Realtime</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick utility icons on mobile header (QR + Logout) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            {onRefreshCloud && (
              <button
                onClick={onRefreshCloud}
                disabled={isForceSyncing}
                title="Sinkronkan data dengan Cloud sekarang"
                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isForceSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
            )}
            <button
              onClick={onOpenQR}
              title="QR Code Portal"
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              onClick={onLogout}
              title="Keluar Admin"
              className="p-1.5 rounded-md bg-red-950/50 hover:bg-red-900/70 text-red-300 border border-red-800/60 text-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Center Main View Switcher & Actions */}
        <div className="flex items-center justify-between md:justify-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Main View Switcher */}
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-950/80 border border-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setCurrentView('admin')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all ${
                currentView === 'admin'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dashboard Pengelola</span>
              <span className="sm:hidden">Dashboard</span>
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
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all ${
                currentView === 'public'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pratinjau Halaman Pegawai</span>
              <span className="sm:hidden">Portal Live</span>
            </button>
          </div>

          {/* Right Controls for Desktop & Mobile Post button */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto md:ml-0 shrink-0">
            {/* Cloud Refresh Button (Desktop) */}
            {onRefreshCloud && (
              <button
                onClick={onRefreshCloud}
                disabled={isForceSyncing}
                title="Sinkronkan data dengan Cloud sekarang"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-300 ${isForceSyncing ? 'animate-spin text-emerald-400' : ''}`} />
                <span className="hidden xl:inline">{isForceSyncing ? 'Menyinkronkan...' : 'Sinkron Cloud'}</span>
              </button>
            )}

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
                    <span className="hidden sm:inline">Memposting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Posting</span>
                    <span className="hidden sm:inline">/ Update</span>
                  </>
                )}
              </button>
            )}

            {/* Desktop only: Click counter, QR code, Logout */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalClicks} Klik</span>
            </div>

            <button
              onClick={onOpenQR}
              title="Tampilkan Barcode QR Code"
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>QR Code</span>
            </button>

            <button
              onClick={onLogout}
              title="Keluar dari Akses Admin (Kunci Portal)"
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-red-950/50 hover:bg-red-900/70 text-red-300 hover:text-white text-xs font-semibold border border-red-800/60 transition-colors ml-1"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

      </div>
    </nav>
  );
};

