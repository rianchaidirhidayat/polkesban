import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Unlock, X, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuPinModalProps {
  isOpen: boolean;
  menu: MenuItem | null;
  logoUrl?: string;
  onClose: () => void;
  onSuccess: (menu: MenuItem) => void;
}

const DEFAULT_POLTEKKES_LOGO = 'https://poltekkesbandung.ac.id/wp-content/uploads/2026/05/cropped-logo-transparan-2.png';
const FALLBACK_POLTEKKES_EMBLEM = 'https://poltekkesbandung.ac.id/wp-content/uploads/2026/04/cropped-logo-kemkes-192x192.png';

export const MenuPinModal: React.FC<MenuPinModalProps> = ({
  isOpen,
  menu,
  logoUrl,
  onClose,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasImgError, setHasImgError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveLogo = (!hasImgError && logoUrl && !logoUrl.includes('images.unsplash.com'))
    ? logoUrl
    : (hasImgError ? FALLBACK_POLTEKKES_EMBLEM : DEFAULT_POLTEKKES_LOGO);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMessage(null);
      setShowPin(false);
      setIsSuccess(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, menu]);

  if (!isOpen || !menu) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const expectedPin = (menu.pinCode || '').trim();
    const enteredPin = pinInput.trim();

    if (!enteredPin) {
      setErrorMessage('Harap masukkan kode PIN terlebih dahulu.');
      inputRef.current?.focus();
      return;
    }

    if (enteredPin === expectedPin) {
      setIsSuccess(true);
      setErrorMessage(null);
      setTimeout(() => {
        onSuccess(menu);
        onClose();
      }, 400);
    } else {
      setErrorMessage('Kode PIN salah! Pastikan Anda memiliki akses atau hubungi pengelola.');
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-white"
        >
          {/* Top Banner Accent */}
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-emerald-500 to-indigo-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6">
            {/* Poltekkes Kemenkes Bandung Institutional Logo Branding (Centered) */}
            <div className="flex items-center justify-center pb-4 mb-4 border-b border-slate-800/80">
              <div className="inline-flex items-center justify-center bg-white px-4 py-2 rounded-xl border border-white/20 shadow-md">
                <img
                  src={effectiveLogo}
                  alt="Logo Resmi Poltekkes Kemenkes Bandung"
                  className="h-8 sm:h-9 w-auto max-w-[240px] object-contain"
                  referrerPolicy="no-referrer"
                  onError={() => setHasImgError(true)}
                />
              </div>
            </div>

            {/* Header Icon & Title */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                {isSuccess ? (
                  <Unlock className="w-6 h-6 text-emerald-400 animate-bounce" />
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Proteksi PIN Akses
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  Verifikasi PIN Menu
                </h3>
              </div>
            </div>

            {/* Target Menu Info Box */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 mb-5">
              <div className="text-[11px] text-slate-400 font-medium">
                Menu yang dituju:
              </div>
              <div className="text-sm font-semibold text-white mt-0.5 truncate flex items-center gap-1.5">
                <span>{menu.title}</span>
                {menu.category && (
                  <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                    {menu.category}
                  </span>
                )}
              </div>
              {menu.subtitle && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {menu.subtitle}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Menu ini berisi informasi rahasia atau terbatas. Silakan masukkan kode PIN yang telah ditentukan untuk membuka tautan layanan.
            </p>

            {/* Optional Hint from Admin */}
            {menu.pinHint && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 mb-4">
                <Sparkles className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div className="leading-tight">
                  <strong className="font-semibold">Petunjuk:</strong> {menu.pinHint}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Kode PIN
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    type={showPin ? 'text' : 'password'}
                    placeholder="Masukkan PIN..."
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-sm font-mono tracking-widest text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      errorMessage
                        ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : isSuccess
                        ? 'border-emerald-500 focus:ring-1 focus:ring-emerald-500'
                        : 'border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}

              {/* Success Message */}
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium"
                >
                  <Unlock className="w-4 h-4 shrink-0" />
                  <span>PIN Terverifikasi! Mengalihkan ke tautan...</span>
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSuccess}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-75"
                >
                  <span>Buka Akses</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
