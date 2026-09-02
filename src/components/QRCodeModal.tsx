import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, QrCode, Copy, Check, Share2, Download, Sparkles, ExternalLink } from 'lucide-react';
import { MicrositeProfile } from '../types';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: MicrositeProfile;
  publicUrl: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  profile,
  publicUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate a high-contrast QR code URL using quickchart.io QR or reliable public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    publicUrl
  )}&bgcolor=ffffff&color=090d16&margin=1`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `QRCode_DirectMenu_${profile.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl text-slate-900 overflow-hidden"
        >
          {/* Top Accent Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-5">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mb-3">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Bagikan Akses Portal Pegawai
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Scan barcode QR untuk langsung membuka portal layanan pegawai tanpa instalasi aplikasi
            </p>
          </div>

          {/* QR Container */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-xl border border-slate-200 mb-5">
            <img
              src={qrCodeUrl}
              alt="Microsite Direct Menu QR Code"
              className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg shadow-xs bg-white p-2 border border-slate-200"
              loading="eager"
            />
            <div className="flex items-center gap-1.5 mt-3 text-slate-700 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{profile.name}</span>
            </div>
          </div>

          {/* Direct Link Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="bg-transparent text-xs text-slate-700 w-full outline-none px-1 select-all font-mono"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shrink-0 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleDownloadQR}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                Unduh QR Code
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: profile.name,
                      text: profile.bio,
                      url: publicUrl,
                    }).catch(() => {});
                  } else {
                    handleCopy();
                  }
                }}
                className="flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition-colors"
              >
                <Share2 className="w-4 h-4 text-indigo-600" />
                Share Link
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
