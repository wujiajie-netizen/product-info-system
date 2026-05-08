import type { Component } from 'vue';

import {
  BatteryCharging,
  BookOpen,
  Building2,
  CircleDollarSign,
  FolderOpen,
  Gamepad2,
  Hand,
  LayoutGrid,
  Monitor,
  Radio,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  TabletSmartphone,
  Users,
} from 'lucide-vue-next';

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function makeMonitorArt(top: string, bottom: string, accent: string) {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
      <defs>
        <linearGradient id="screen" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${top}" />
          <stop offset="100%" stop-color="${bottom}" />
        </linearGradient>
        <linearGradient id="glow" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.88" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.12" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="160" rx="54" ry="9" fill="#dce6f6" />
      <rect x="36" y="22" width="168" height="102" rx="12" fill="#17202f" />
      <rect x="44" y="30" width="152" height="86" rx="8" fill="url(#screen)" />
      <path d="M50 42C82 27 127 29 190 53V108H44V58C47 51 48 46 50 42Z" fill="url(#glow)" opacity="0.76" />
      <path d="M104 126H136L145 149H95Z" fill="#2b3342" />
      <rect x="78" y="149" width="84" height="8" rx="4" fill="#394458" />
    </svg>
  `);
}

function makeTabletArt(body: string, screen: string, accent: string, rugged = false) {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
      <defs>
        <linearGradient id="tabScreen" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${screen}" />
          <stop offset="100%" stop-color="#d9ecff" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="162" rx="48" ry="8" fill="#dce6f6" />
      <rect x="74" y="18" width="92" height="144" rx="${rugged ? 18 : 14}" fill="${body}" />
      <rect x="${rugged ? 84 : 82}" y="${rugged ? 30 : 26}" width="${rugged ? 72 : 76}" height="${rugged ? 118 : 126}" rx="10" fill="url(#tabScreen)" />
      <circle cx="120" cy="23" r="3.4" fill="#8091ae" />
      <path d="M90 52C110 40 132 42 150 60V120H90Z" fill="${accent}" opacity="0.46" />
      <path d="M98 138H142" stroke="#8aa3c8" stroke-width="4" stroke-linecap="round" opacity="0.7" />
      ${rugged ? '<rect x="66" y="54" width="8" height="34" rx="4" fill="#323d51" /><rect x="166" y="74" width="8" height="26" rx="4" fill="#323d51" />' : ''}
    </svg>
  `);
}

function makeBatteryArt() {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
      <defs>
        <linearGradient id="batteryBody" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="#45484f" />
          <stop offset="100%" stop-color="#1f2228" />
        </linearGradient>
      </defs>
      <ellipse cx="126" cy="156" rx="54" ry="10" fill="#dce6f6" />
      <path d="M82 42H164L182 61V126L156 138H74V56Z" fill="url(#batteryBody)" />
      <path d="M92 52H154L168 65V114L148 124H92Z" fill="#2e3238" />
      <rect x="108" y="66" width="34" height="8" rx="4" fill="#5b5f66" />
      <path d="M122 79L107 106H120L116 122L136 94H124L129 79Z" fill="#f3c64f" />
      <text x="102" y="135" fill="#f1f5fb" font-size="15" font-family="Segoe UI,Arial" font-weight="700">6S</text>
    </svg>
  `);
}

function makeRadioArt() {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
      <ellipse cx="126" cy="160" rx="56" ry="9" fill="#dce6f6" />
      <rect x="84" y="86" width="56" height="52" rx="9" fill="#2f3238" />
      <rect x="90" y="92" width="44" height="40" rx="6" fill="#1e2126" />
      <rect x="96" y="100" width="18" height="10" rx="3" fill="#f0c041" />
      <circle cx="122" cy="116" r="7" fill="#5d6571" />
      <rect x="147" y="92" width="22" height="46" rx="7" fill="#21242a" />
      <rect x="92" y="52" width="6" height="42" rx="3" fill="#1d2025" />
      <rect x="154" y="40" width="6" height="54" rx="3" fill="#1d2025" />
      <circle cx="95" cy="49" r="4" fill="#2e3238" />
      <circle cx="157" cy="37" r="4" fill="#2e3238" />
    </svg>
  `);
}

function makeCameraArt() {
  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180">
      <ellipse cx="124" cy="160" rx="56" ry="10" fill="#dce6f6" />
      <rect x="92" y="44" width="54" height="36" rx="11" fill="#1f2329" />
      <circle cx="119" cy="62" r="16" fill="#333842" />
      <circle cx="119" cy="62" r="11" fill="#0e1116" />
      <circle cx="119" cy="62" r="5" fill="#4a90e2" />
      <rect x="72" y="84" width="106" height="18" rx="9" fill="#272c33" />
      <circle cx="96" cy="119" r="25" fill="#23272f" />
      <circle cx="96" cy="119" r="15" fill="#0d1116" />
      <circle cx="152" cy="121" r="30" fill="#2c3138" />
      <circle cx="152" cy="121" r="18" fill="#0d1116" />
      <circle cx="152" cy="121" r="8" fill="#4a90e2" />
    </svg>
  `);
}

export type HomeCategory = {
  count: string;
  icon: Component;
  label: string;
  to: string;
};

export type HomeFeature = {
  description: string;
  icon: Component;
  title: string;
};

export type HomeProduct = {
  image: string;
  name: string;
  price: string;
  priceSuffix: string;
  specs: string[];
  to: string;
};

export type HomeSideLink = {
  accent: 'blue' | 'orange' | 'teal';
  count: string;
  description: string;
  icon: Component;
  title: string;
  to: string;
  unit: string;
};

export type HomeUpdate = {
  date: string;
  title: string;
  tone: 'blue' | 'cyan' | 'orange' | 'teal';
  type: string;
};

export const searchScopes = ['全部', '产品', '资料', '报价', '公司'];

export const hotKeywords = [
  '显示器',
  '安卓平板',
  '电竞显示器',
  '无人机电池',
  '固传模块',
  '云台相机',
  '三防平板',
];

export const categories: HomeCategory[] = [
  { count: '2,345', icon: Monitor, label: 'LCD 显示器', to: '/categories/lcd-monitor' },
  { count: '1,286', icon: Gamepad2, label: '电竞显示器', to: '/categories/gaming-monitor' },
  { count: '986', icon: Hand, label: '触控显示器', to: '/categories/touch-display' },
  { count: '1,352', icon: TabletSmartphone, label: '安卓平板', to: '/categories/android-tablet' },
  { count: '712', icon: ShieldCheck, label: '三防平板', to: '/categories/rugged-tablet' },
  { count: '1,125', icon: BatteryCharging, label: '无人机电池', to: '/categories/drone-battery' },
  { count: '894', icon: Radio, label: '固传模块', to: '/categories/data-link-module' },
  { count: '627', icon: LayoutGrid, label: '云台配件', to: '/categories/gimbal-accessories' },
  { count: '全部分类', icon: LayoutGrid, label: '更多分类', to: '/categories' },
];

export const products: HomeProduct[] = [
  {
    image: makeMonitorArt('#77a9ef', '#2b5fa7', '#f5f9ff'),
    name: '27 寸办公显示器',
    price: '￥699',
    priceSuffix: '起',
    specs: ['1920×1080 | 75Hz', 'IPS | 100% sRGB'],
    to: '/products/lcd-monitor-27',
  },
  {
    image: makeMonitorArt('#231a43', '#e54b9a', '#66d7ff'),
    name: '32 寸电竞显示器',
    price: '￥1,699',
    priceSuffix: '起',
    specs: ['2560×1440 | 165Hz', 'VA | 1ms | FreeSync'],
    to: '/products/gaming-monitor-32',
  },
  {
    image: makeTabletArt('#262d3b', '#8ab8ff', '#e8f4ff'),
    name: '15.6 寸便携显示器',
    price: '￥899',
    priceSuffix: '起',
    specs: ['1920×1080 | IPS', 'Type-C | 触调'],
    to: '/products/portable-touch-display',
  },
  {
    image: makeTabletArt('#2f3542', '#9ed1ff', '#2d9cff'),
    name: '安卓平板 P30 Pro',
    price: '￥1,299',
    priceSuffix: '起',
    specs: ['Android 13 | 8GB+256GB', '11.0" 2K | 8000mAh'],
    to: '/products/p30-pro',
  },
  {
    image: makeTabletArt('#2a313d', '#7db7ff', '#58d0ff', true),
    name: '三防平板 T8',
    price: '￥1,899',
    priceSuffix: '起',
    specs: ['IP68 | 8GB+128GB', '8.0" | 10000mAh'],
    to: '/products/t8-rugged',
  },
  {
    image: makeBatteryArt(),
    name: '无人机电池 6S',
    price: '￥469',
    priceSuffix: '起',
    specs: ['22.2V | 8000mAh', 'LiPo | XT60'],
    to: '/products/drone-battery-6s',
  },
  {
    image: makeRadioArt(),
    name: '固传模块 5.8G',
    price: '￥329',
    priceSuffix: '起',
    specs: ['5.8GHz | 48CH', '250mW | HDMI 输入'],
    to: '/products/data-link-58g',
  },
  {
    image: makeCameraArt(),
    name: '云台相机模组',
    price: '￥1,599',
    priceSuffix: '起',
    specs: ['4K | 3轴云台', '1/2.7" CMOS'],
    to: '/products/gimbal-camera-module',
  },
];

export const sideLinks: HomeSideLink[] = [
  {
    accent: 'blue',
    count: '12,842',
    description: '产品样本、图纸、手册等',
    icon: FolderOpen,
    title: '资料中心',
    to: '/documents',
    unit: '份资料',
  },
  {
    accent: 'orange',
    count: '5,327',
    description: '最新报价、历史报价查询',
    icon: CircleDollarSign,
    title: '报价中心',
    to: '/quotes',
    unit: '条报价',
  },
  {
    accent: 'teal',
    count: '2,143',
    description: '供应商、制造商、代理商',
    icon: Building2,
    title: '公司库',
    to: '/companies',
    unit: '家公司',
  },
];

export const updates: HomeUpdate[] = [
  { date: '05-15', title: '27 寸办公显示器产品手册更新', tone: 'blue', type: '资料' },
  { date: '05-15', title: '安卓平板 P30 Pro 最新报价发布', tone: 'orange', type: '报价' },
  { date: '05-14', title: '三防平板 T8 新品上市', tone: 'cyan', type: '产品' },
  { date: '05-13', title: '新增供应商：深圳昌飞科技有限公司', tone: 'teal', type: '公司' },
  { date: '05-12', title: '无人机电池 6S 数据手册（最新版）', tone: 'blue', type: '资料' },
];

export const features: HomeFeature[] = [
  {
    description: '覆盖百万级产品与资料',
    icon: BookOpen,
    title: '海量数据',
  },
  {
    description: '多维度筛选，快速定位',
    icon: ScanSearch,
    title: '精准搜索',
  },
  {
    description: '数据每日更新，准确可靠',
    icon: RefreshCw,
    title: '实时更新',
  },
  {
    description: '支持团队共享与项目管理',
    icon: Users,
    title: '高效协同',
  },
];
