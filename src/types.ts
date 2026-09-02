export type ButtonSize = 'compact' | 'medium' | 'large' | 'featured' | 'bento-square' | 'bento-wide';

export type ButtonActionType = 
  | 'whatsapp' 
  | 'instagram' 
  | 'link' 
  | 'phone' 
  | 'email' 
  | 'catalog' 
  | 'location' 
  | 'youtube' 
  | 'tiktok' 
  | 'custom';

export type AnimationEffect = 'none' | 'pulse' | 'bounce' | 'glow' | 'shimmer';

export type BackgroundType = 'gradient' | 'mesh' | 'solid' | 'glass' | 'dark-neon' | 'warm-paper' | 'custom-image';

export interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  type: ButtonActionType;
  size: ButtonSize;
  bgColor: string;
  textColor: string;
  borderColor?: string;
  isGradient: boolean;
  gradientTo?: string;
  gradientAngle?: number;
  iconName: string;
  badgeText?: string;
  badgeBgColor?: string;
  badgeTextColor?: string;
  isActive: boolean;
  order: number;
  animation: AnimationEffect;
  clickCount: number;
  category?: string;
  openInNewTab: boolean;
  priceTag?: string;
  customCss?: string;
}

export interface SocialLink {
  id: string;
  platform: 'whatsapp' | 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'twitter' | 'maps' | 'email' | 'phone' | 'website';
  url: string;
  label: string;
  isActive: boolean;
}

export interface ThemeConfig {
  id: string;
  name: string;
  bgType: BackgroundType;
  primaryBg: string;
  secondaryBg: string;
  accentColor: string;
  textColor: string;
  subtextColor: string;
  cardRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl' | 'rounded-full';
  cardGlassEffect: boolean;
  fontFamily: 'sans' | 'outfit' | 'mono';
  layoutStyle: 'stacked' | 'bento';
  customBgImage?: string;
  bgOverlayColor?: string;
  bgOverlayOpacity?: number; // 0 to 100 (%)
  bgBlur?: number; // 0 to 20 (px)
  bgFit?: 'cover' | 'contain' | 'tile';
}

export type LogoShape = 'landscape' | 'circle' | 'rounded-square' | 'banner' | 'auto';

export interface MicrositeProfile {
  name: string;
  tagline: string;
  bio: string;
  avatarUrl: string;
  logoShape?: LogoShape;
  logoHeight?: number;
  logoBackground?: 'transparent' | 'white' | 'dark' | 'glass';
  coverUrl?: string;
  isVerified: boolean;
  location: string;
  openingHours?: string;
  socialLinks: SocialLink[];
  footerText?: string;
  footerBadgeText?: string;
  footerCopyright?: string;
  theme: ThemeConfig;
}

export interface ClickLog {
  id: string;
  menuId: string;
  menuTitle: string;
  category?: string;
  timestamp: string; // ISO string
  device: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  referrer: string;
}

export interface AnalyticsSummary {
  totalClicks: number;
  totalViews: number;
  ctr: number; // percentage
  topButton: {
    id: string;
    title: string;
    clicks: number;
  } | null;
  todayClicks: number;
}
