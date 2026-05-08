import type { Component } from 'vue';

import {
  BatteryCharging,
  BookOpen,
  Boxes,
  Building2,
  Camera,
  CircuitBoard,
  Gamepad2,
  GitBranch,
  Hand,
  Monitor,
  MonitorSmartphone,
  Radio,
  Scale,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-vue-next';

function toDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createScreenThumb(accent: string, glow: string) {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 92">
      <defs>
        <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff6ff" />
          <stop offset="100%" stop-color="#d8e8ff" />
        </linearGradient>
        <linearGradient id="screenFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${glow}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="160" height="92" rx="14" fill="url(#screenBg)" />
      <g transform="translate(22 14)">
        <rect x="0" y="0" width="86" height="48" rx="5" fill="#24344f" />
        <rect x="4" y="4" width="78" height="40" rx="3" fill="url(#screenFill)" />
        <path d="M6 36L23 23L37 28L53 18L82 36V42H6Z" fill="rgba(255,255,255,.46)" />
        <rect x="30" y="50" width="22" height="6" rx="3" fill="#32455f" />
        <path d="M36 56H46L54 68H28Z" fill="#44566f" />
        <rect x="24" y="68" width="34" height="4" rx="2" fill="#263957" />
      </g>
    </svg>
  `);
}

function createBatteryThumb() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 92">
      <defs>
        <linearGradient id="batteryBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef4ff" />
          <stop offset="100%" stop-color="#dce8ff" />
        </linearGradient>
        <linearGradient id="batteryFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#515c6c" />
          <stop offset="100%" stop-color="#232d3e" />
        </linearGradient>
      </defs>
      <rect width="160" height="92" rx="14" fill="url(#batteryBg)" />
      <g transform="translate(28 12)">
        <path d="M12 14L84 0L106 18L96 58L24 72L0 50Z" fill="url(#batteryFill)" />
        <path d="M84 0L106 18L90 26L70 8Z" fill="rgba(255,255,255,.16)" />
        <rect x="38" y="24" width="28" height="22" rx="4" fill="#0f1623" stroke="#74839a" stroke-width="2.6" />
        <path d="M50 29H54V35H60V39H54V45H50V39H44V35H50Z" fill="#8af08d" />
      </g>
    </svg>
  `);
}

function createTabletThumb(accent: string, glow: string) {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 92">
      <defs>
        <linearGradient id="tabletBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f1f6ff" />
          <stop offset="100%" stop-color="#dce8ff" />
        </linearGradient>
        <linearGradient id="tabletFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${glow}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="160" height="92" rx="14" fill="url(#tabletBg)" />
      <g transform="translate(47 8)">
        <rect x="0" y="0" width="46" height="72" rx="9" fill="#24344f" />
        <rect x="4" y="6" width="38" height="58" rx="6" fill="url(#tabletFill)" />
        <path d="M4 50L18 34L27 40L36 28L42 46V64H4Z" fill="rgba(255,255,255,.34)" />
        <circle cx="23" cy="68" r="2.8" fill="#73839a" />
      </g>
    </svg>
  `);
}

function createDocThumb() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 92">
      <defs>
        <linearGradient id="docBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eff5ff" />
          <stop offset="100%" stop-color="#dce8ff" />
        </linearGradient>
      </defs>
      <rect width="160" height="92" rx="14" fill="url(#docBg)" />
      <g transform="translate(44 10)">
        <path d="M10 0H46L62 16V72H10Z" fill="#fefefe" stroke="#adc7f0" stroke-width="2" />
        <path d="M46 0V16H62" fill="#e7f0ff" />
        <path d="M22 26H50M22 36H50M22 46H42" stroke="#5288df" stroke-width="4" stroke-linecap="round" />
        <rect x="20" y="54" width="24" height="8" rx="4" fill="#ff8d61" />
      </g>
    </svg>
  `);
}

export interface CategoryNavItem {
  count: string;
  icon: Component;
  label: string;
  slug: string;
}

export interface RecentUpdateItem {
  image: string;
  meta: string;
  time: string;
  title: string;
  to: string;
}

export interface BrandLogoItem {
  accent: string;
  label: string;
  slug: string;
  wordmark: string;
}

export interface BrandIndexGroup {
  items: BrandIndexItem[];
  letter: string;
}

export interface BrandIndexItem {
  label: string;
  slug: string;
}

export interface QuickEntryItem {
  icon: Component;
  label: string;
  to: string;
}

export interface PlatformStat {
  label: string;
  value: string;
}

export interface CategoryKeywordItem {
  count: string;
  label: string;
}

export const categoryNavigationItems: CategoryNavItem[] = [
  { count: '12,842', icon: Monitor, label: 'LCD 显示器', slug: 'lcd-monitor' },
  { count: '8,621', icon: Gamepad2, label: '电竞显示器', slug: 'gaming-monitor' },
  { count: '6,231', icon: Hand, label: '触控显示器', slug: 'touch-monitor' },
  { count: '5,482', icon: Monitor, label: '便携显示器', slug: 'portable-display' },
  { count: '3,987', icon: Monitor, label: '一体机显示屏', slug: 'aio-display' },
  { count: '4,356', icon: Boxes, label: '商显设备', slug: 'commercial-display' },
  { count: '2,831', icon: MonitorSmartphone, label: 'POS 显示终端', slug: 'pos-terminal' },
  { count: '7,512', icon: MonitorSmartphone, label: '安卓平板', slug: 'android-tablet' },
  { count: '2,948', icon: ShieldCheck, label: '三防平板', slug: 'rugged-tablet' },
  { count: '9,631', icon: MonitorSmartphone, label: '消费平板', slug: 'consumer-tablet' },
  { count: '6,784', icon: BatteryCharging, label: '无人机电池', slug: 'drone-battery' },
  { count: '4,572', icon: GitBranch, label: '无人机桨叶', slug: 'drone-propeller' },
  { count: '3,268', icon: Camera, label: '云台相机', slug: 'gimbal-camera' },
  { count: '3,105', icon: Radio, label: '图传模块', slug: 'video-transmission' },
  { count: '5,221', icon: CircuitBoard, label: '机架与配件', slug: 'drone-accessories' },
];

export const recentUpdateItems: RecentUpdateItem[] = [
  {
    image: createScreenThumb('#0f75e7', '#7bc7ff'),
    meta: '规格书 | AOC U27U2S',
    time: '2 小时前',
    title: '新品规格书：27 英寸 4K UHD 显示器',
    to: '/updates',
  },
  {
    image: createBatteryThumb(),
    meta: '报价 | 旭航科技',
    time: '4 小时前',
    title: '报价更新：无人机电池 4S 5200mAh',
    to: '/quotes',
  },
  {
    image: createTabletThumb('#3d7bff', '#67c7ff'),
    meta: '产品 | 华平科技',
    time: '1 天前',
    title: '新增产品：安卓三防平板 T8 Pro',
    to: '/products',
  },
  {
    image: createScreenThumb('#1f6ce2', '#9ad5ff'),
    meta: '规格书 | 触沃电子',
    time: '1 天前',
    title: '资料更新：触摸显示器系列规格书',
    to: '/documents',
  },
  {
    image: createDocThumb(),
    meta: '产品 | 极速飞扬',
    time: '2 天前',
    title: '新增配件：图传模块 5.8G 1.6W',
    to: '/products',
  },
];

export const hotBrandItems: BrandLogoItem[] = [
  { accent: '#0353af', label: 'AOC', slug: 'aoc', wordmark: 'AOC' },
  { accent: '#f32888', label: 'HKC', slug: 'hkc', wordmark: 'HKC' },
  { accent: '#cf1f24', label: '优派', slug: 'viewsonic', wordmark: 'ViewSonic' },
  { accent: '#c50118', label: 'LG', slug: 'lg', wordmark: 'LG' },
  { accent: '#0d51bd', label: '华硕', slug: 'asus', wordmark: 'ASUS' },
  { accent: '#f18822', label: '驰为', slug: 'chuwi', wordmark: 'CHUWI' },
  { accent: '#ec2327', label: '联想', slug: 'lenovo', wordmark: 'Lenovo' },
  { accent: '#28364f', label: '大疆创新', slug: 'dji', wordmark: 'DJI' },
  { accent: '#1f3055', label: 'BETAFPV', slug: 'betafpv', wordmark: 'BETAFPV' },
  { accent: '#20232f', label: 'Tattu', slug: 'tattu', wordmark: 'Tattu' },
];

export const allBrandItems: BrandLogoItem[] = [
  ...hotBrandItems,
  { accent: '#1d4ed8', label: 'Autel', slug: 'autel', wordmark: 'Autel' },
  { accent: '#1e293b', label: 'MAXHUB', slug: 'maxhub', wordmark: 'MAXHUB' },
  { accent: '#1f6fe5', label: 'Dell', slug: 'dell', wordmark: 'Dell' },
  { accent: '#0d9488', label: 'Elo', slug: 'elo', wordmark: 'Elo' },
  { accent: '#334155', label: 'Fimi', slug: 'fimi', wordmark: 'FIMI' },
];

export const brandLetters = [
  '全部',
  '0-9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
];

export const brandIndexGroups: BrandIndexGroup[] = [
  {
    items: [
      { label: 'AOC（冠捷）', slug: 'aoc' },
      { label: 'ASUS（华硕）', slug: 'asus' },
      { label: 'Autel（道通智能）', slug: 'autel' },
    ],
    letter: 'A',
  },
  {
    items: [{ label: 'CHUWI（驰为）', slug: 'chuwi' }],
    letter: 'C',
  },
  {
    items: [
      { label: 'Lenovo（联想）', slug: 'lenovo' },
      { label: 'LG（乐金）', slug: 'lg' },
    ],
    letter: 'L',
  },
  {
    items: [{ label: 'MAXHUB（迈聆）', slug: 'maxhub' }],
    letter: 'M',
  },
  {
    items: [{ label: 'ViewSonic（优派）', slug: 'viewsonic' }],
    letter: 'V',
  },
  {
    items: [{ label: 'HKC（惠科）', slug: 'hkc' }],
    letter: 'H',
  },
];

export const quickEntryItems: QuickEntryItem[] = [
  { icon: Search, label: '产品搜索', to: '/products' },
  { icon: BookOpen, label: '资料中心', to: '/documents' },
  { icon: Building2, label: '供应商库', to: '/companies' },
  { icon: CircuitBoard, label: '规格参数库', to: '/products' },
  { icon: Scale, label: '对比工具', to: '/products' },
  { icon: Star, label: '收藏夹', to: '/products' },
];

export const platformStats: PlatformStat[] = [
  { label: '商品数', value: '58,421' },
  { label: '品牌数', value: '362' },
  { label: '供应商数', value: '1,856' },
  { label: '资料数', value: '34,672' },
];

export const categoryKeywordColumns: CategoryKeywordItem[][] = [
  [
    { count: '2,154', label: '27 英寸显示器' },
    { count: '1,872', label: '24 英寸显示器' },
    { count: '1,028', label: '15.6 英寸便携屏' },
  ],
  [
    { count: '3,421', label: 'IPS 显示面板' },
    { count: '2,365', label: '触摸屏模组' },
    { count: '1,256', label: 'Android 13 平板' },
  ],
  [
    { count: '3,214', label: '无人机电池' },
    { count: '2,318', label: '碳纤维桨叶' },
    { count: '1,427', label: '云台相机模组' },
  ],
];

export const industryTopics = [
  '高刷新率显示器',
  'Mini LED 显示器',
  '高亮工业屏',
  '安卓工业平板',
  '三防平板解决方案',
  '无人机测绘套件',
  '长续航电池',
  '高清图传方案',
];
