import React from 'react';
import {
  MessageCircle,
  Instagram,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sparkles,
  FileText,
  Star,
  Tag,
  Link as LinkIcon,
  Coffee,
  Utensils,
  Music,
  Video,
  Download,
  CalendarCheck,
  Headphones,
  BookOpen,
  Share2,
  Heart,
  Flame,
  Award,
  CreditCard,
  Gift,
  Zap,
  CheckCircle2,
  Camera,
  Layers,
  HelpCircle,
  Info,
  Clock,
  Send,
  Navigation,
  ExternalLink,
  Compass,
  Smile,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Building2,
  Building,
  Users,
  FileSpreadsheet,
  HeartPulse,
  Laptop,
  KeyRound,
  Folder,
  Bell,
  QrCode,
  Search,
  FileCheck,
  LucideIcon
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  CalendarCheck,
  FileSpreadsheet,
  BookOpen,
  Briefcase,
  GraduationCap,
  Building2,
  Building,
  Users,
  HeartPulse,
  Laptop,
  KeyRound,
  Folder,
  FileCheck,
  Bell,
  MessageCircle,
  Instagram,
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Globe,
  Sparkles,
  FileText,
  Star,
  Tag,
  Link: LinkIcon,
  Coffee,
  Utensils,
  Music,
  Video,
  Download,
  Headphones,
  Share2,
  Heart,
  Flame,
  Award,
  CreditCard,
  Gift,
  Zap,
  CheckCircle2,
  Camera,
  Layers,
  HelpCircle,
  Info,
  Clock,
  Send,
  Navigation,
  ExternalLink,
  Compass,
  Smile,
  ShieldCheck,
  QrCode,
  Search
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const getIconComponent = (iconName: string, className = 'w-5 h-5'): React.ReactNode => {
  if (!iconName) {
    const FallbackIcon = LinkIcon;
    return <FallbackIcon className={className} />;
  }

  // 1. If it's an uploaded image file (Data URL, Blob, or HTTP/S URL)
  if (
    iconName.startsWith('data:image/') ||
    iconName.startsWith('blob:') ||
    iconName.startsWith('http://') ||
    iconName.startsWith('https://') ||
    iconName.startsWith('/')
  ) {
    return (
      <img
        src={iconName}
        alt="Simbol Menu"
        className={`${className} object-contain rounded-xs select-none pointer-events-none`}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // 2. Preset Lucide Icon mapping
  const IconComponent = ICON_MAP[iconName];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // 3. Emoji symbol (e.g. 🕒, 📄, 🌴, 🏥, 🏢, ⚡)
  if (iconName.length <= 4) {
    return (
      <span className="leading-none text-center select-none inline-flex items-center justify-center text-lg">
        {iconName}
      </span>
    );
  }

  const FallbackIcon = LinkIcon;
  return <FallbackIcon className={className} />;
};

