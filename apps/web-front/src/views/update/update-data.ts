export type UpdateCategory = 'document' | 'new-product' | 'platform' | 'price';

export type UpdateTone = 'blue' | 'green' | 'orange' | 'teal';

export interface UpdateFilterTab {
  label: string;
  value: UpdateCategory;
}

export interface UpdatePinnedNotice {
  badge: string;
  categoryLabel: string;
  date: string;
  summary: string;
  time: string;
  title: string;
  to: string;
}

export interface UpdateTimelineItem {
  category: UpdateCategory;
  company: string;
  dateLabel: string;
  description: string;
  id: string;
  image: string;
  relatedLabel: string;
  relatedValue: string;
  section: string;
  summary: string;
  tagLabel: string;
  timeLabel: string;
  title: string;
  to: string;
  tone: UpdateTone;
}

export interface HotProductItem {
  image: string;
  name: string;
  to: string;
  updateCount: string;
}

export interface UpdateDigestItem {
  date: string;
  tagLabel: string;
  title: string;
  to: string;
  tone: UpdateTone;
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createGimbalArt() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 152">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2f7ff" />
          <stop offset="100%" stop-color="#dce7fa" />
        </linearGradient>
      </defs>
      <rect width="152" height="152" rx="30" fill="url(#bg)" />
      <g transform="translate(26 24)">
        <circle cx="30" cy="52" r="26" fill="#111b29" />
        <circle cx="30" cy="52" r="11" fill="#435670" />
        <path d="M28 14H61C76 14 88 26 88 41V46H71V40C71 34 66 29 60 29H40Z" fill="#2d3a4d" />
        <path d="M18 79H46L66 105H0Z" fill="#273347" />
        <rect x="68" y="35" width="20" height="44" rx="10" fill="#4f6078" />
      </g>
    </svg>
  `);
}

function createBatteryArt() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 152">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f1f6ff" />
          <stop offset="100%" stop-color="#dce7fa" />
        </linearGradient>
        <linearGradient id="body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#616c7e" />
          <stop offset="100%" stop-color="#1f2937" />
        </linearGradient>
      </defs>
      <rect width="152" height="152" rx="30" fill="url(#bg)" />
      <g transform="translate(26 26)">
        <path d="M12 12L77 0L104 24L92 92L28 104L0 79Z" fill="url(#body)" />
        <path d="M13 13L29 25L16 81L1 70Z" fill="rgba(255,255,255,.08)" />
        <rect x="37" y="33" width="40" height="34" rx="6" fill="#121a24" stroke="#75859c" stroke-width="3" />
        <path d="M55 42H63V50H71V58H63V66H55V58H47V50H55Z" fill="#96ef8d" />
      </g>
    </svg>
  `);
}

function createTabletArt() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 152">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f1f7ff" />
          <stop offset="100%" stop-color="#dce8ff" />
        </linearGradient>
        <linearGradient id="screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#9bd9ff" />
          <stop offset="100%" stop-color="#287ef6" />
        </linearGradient>
      </defs>
      <rect width="152" height="152" rx="30" fill="url(#bg)" />
      <g transform="translate(38 16)">
        <rect x="0" y="0" width="76" height="120" rx="15" fill="#23344d" />
        <rect x="8" y="10" width="60" height="96" rx="10" fill="url(#screen)" />
        <path d="M8 86L28 54L43 64L57 48L68 71V106H8Z" fill="rgba(255,255,255,.35)" />
        <circle cx="38" cy="112" r="4" fill="#5e718d" />
      </g>
    </svg>
  `);
}

function createRadioArt() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 152">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f4f8ff" />
          <stop offset="100%" stop-color="#dde8fb" />
        </linearGradient>
      </defs>
      <rect width="152" height="152" rx="30" fill="url(#bg)" />
      <g transform="translate(24 42)">
        <rect x="0" y="12" width="54" height="36" rx="8" fill="#1f2736" />
        <rect x="8" y="20" width="12" height="20" rx="4" fill="#414e61" />
        <rect x="34" y="18" width="12" height="24" rx="4" fill="#445872" />
        <path d="M20 9V-4" stroke="#263246" stroke-width="6" stroke-linecap="round" />
        <path d="M44 9V-10" stroke="#263246" stroke-width="6" stroke-linecap="round" />
        <path d="M56 18C77 20 92 26 103 38" stroke="#3688ff" stroke-width="6" stroke-linecap="round" />
        <path d="M62 4C85 6 102 18 116 34" stroke="#7ab8ff" stroke-width="5" stroke-linecap="round" />
      </g>
    </svg>
  `);
}

function createFileArt(accent: string, label: string) {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 152 152">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f3f7ff" />
          <stop offset="100%" stop-color="#e3ebfb" />
        </linearGradient>
        <linearGradient id="paper" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="152" height="152" rx="30" fill="url(#bg)" />
      <g transform="translate(40 26)">
        <path d="M10 0H52L72 20V88C72 95 67 100 60 100H10C3 100 -2 95 -2 88V12C-2 5 3 0 10 0Z" fill="url(#paper)" />
        <path d="M52 0V20H72" fill="rgba(255,255,255,.32)" />
        <path d="M52 0V20H72" stroke="rgba(255,255,255,.25)" stroke-width="2" />
        <text x="35" y="65" fill="#ffffff" font-size="22" font-family="Segoe UI, Arial" font-weight="700" text-anchor="middle">${label}</text>
      </g>
    </svg>
  `);
}

export const updateFilterTabs: UpdateFilterTab[] = [
  { label: '新品发布', value: 'new-product' },
  { label: '报价更新', value: 'price' },
  { label: '资料更新', value: 'document' },
  { label: '平台通知', value: 'platform' },
];

export const pinnedNotice: UpdatePinnedNotice = {
  badge: '置顶',
  categoryLabel: '平台通知',
  date: '05-15',
  summary:
    '为提升系统稳定性与性能，平台将于 2024 年 5 月 18 日 22:00 至 5 月 19 日 02:00 进行系统维护，期间部分功能可能受影响。',
  time: '10:30',
  title: '系统维护公告（2024-05-18 22:00–05-19 02:00）',
  to: '/updates',
};

export const timelineItems: UpdateTimelineItem[] = [
  {
    category: 'new-product',
    company: '发布公司：深圳智飞科技有限公司',
    dateLabel: '今日',
    description: '三轴增稳 | 2D 倍光学变焦 | 1080P 60fps，适用于无人机航拍与测绘。',
    id: 'ax20-launch',
    image: createGimbalArt(),
    relatedLabel: '云台相机模组',
    relatedValue: 'AX20',
    section: '今日',
    summary: '发布公司：深圳智飞科技有限公司',
    tagLabel: '新品发布',
    timeLabel: '10:32',
    title: '云台相机模组 AX20 正式发布',
    to: '/products/zenmuse-h20t',
    tone: 'green',
  },
  {
    category: 'document',
    company: '关联产品：云台相机模组 AX20',
    dateLabel: '今日',
    description: '更新内容：新增环境适应性参数、接口定义说明、功能指标优化。',
    id: 'ax20-spec',
    image: createFileArt('#ef4b2e', 'PDF'),
    relatedLabel: '规格书',
    relatedValue: 'V1.3',
    section: '今日',
    summary: '关联产品：云台相机模组 AX20',
    tagLabel: '资料更新',
    timeLabel: '09:15',
    title: 'AX20 产品规格书 V1.3 发布',
    to: '/documents',
    tone: 'blue',
  },
  {
    category: 'price',
    company: '关联产品：云台相机模组 AX20',
    dateLabel: '今日',
    description: '价格下调：标准版下调 $20，Pro 版下调 $30，详情请查看最新报价表。',
    id: 'ax20-price',
    image: createFileArt('#ff8c1a', '¥'),
    relatedLabel: '更新 3 条报价',
    relatedValue: '',
    section: '今日',
    summary: '关联产品：云台相机模组 AX20',
    tagLabel: '报价更新',
    timeLabel: '08:40',
    title: 'AX20 价格调整通知',
    to: '/quotes',
    tone: 'orange',
  },
  {
    category: 'document',
    company: '关联产品：云台相机模组 AX20',
    dateLabel: '本周',
    description: '更新内容：优化安装孔位模型，新增装配示意图文件。',
    id: 'ax20-cad',
    image: createFileArt('#1664d9', 'CAD'),
    relatedLabel: '图纸/CAD',
    relatedValue: '',
    section: '本周',
    summary: '关联产品：云台相机模组 AX20',
    tagLabel: '资料更新',
    timeLabel: '05-14\n16:20',
    title: 'AX20 3D 模型（STEP）V1.1 更新',
    to: '/documents',
    tone: 'blue',
  },
  {
    category: 'new-product',
    company: '发布公司：深圳智飞科技有限公司',
    dateLabel: '本周',
    description: '22.2V | 8000mAh | LiPo | XT60 接口，适配多款无人机平台。',
    id: 'battery-launch',
    image: createBatteryArt(),
    relatedLabel: '无人机电池',
    relatedValue: '6S',
    section: '本周',
    summary: '发布公司：深圳智飞科技有限公司',
    tagLabel: '新品发布',
    timeLabel: '05-13\n11:08',
    title: '无人机电池 6S 新品上线',
    to: '/products/tb60-battery',
    tone: 'green',
  },
];

export const hotProducts: HotProductItem[] = [
  {
    image: createGimbalArt(),
    name: '云台相机模组 AX20',
    to: '/products/zenmuse-h20t',
    updateCount: '862 条动态',
  },
  {
    image: createTabletArt(),
    name: '三防平板 T8',
    to: '/products/tri-proof-tablet',
    updateCount: '524 条动态',
  },
  {
    image: createBatteryArt(),
    name: '无人机电池 6S',
    to: '/products/tb60-battery',
    updateCount: '413 条动态',
  },
  {
    image: createRadioArt(),
    name: '图传模块 5.8G',
    to: '/products',
    updateCount: '398 条动态',
  },
  {
    image: createGimbalArt(),
    name: '云台相机模组 P12',
    to: '/products',
    updateCount: '276 条动态',
  },
];

export const latestDigest: UpdateDigestItem[] = [
  {
    date: '05-15',
    tagLabel: '资料',
    title: '27 寸办公显示器产品手册更新',
    to: '/documents',
    tone: 'blue',
  },
  {
    date: '05-15',
    tagLabel: '报价',
    title: '安卓平板 P30 Pro 最新报价发布',
    to: '/quotes',
    tone: 'orange',
  },
  {
    date: '05-14',
    tagLabel: '产品',
    title: '三防平板 T8 新品上市',
    to: '/products',
    tone: 'green',
  },
  {
    date: '05-13',
    tagLabel: '公司',
    title: '新增供应商：深圳智飞科技有限公司',
    to: '/companies',
    tone: 'teal',
  },
  {
    date: '05-12',
    tagLabel: '资料',
    title: '无人机电池 6S 数据手册（最新版）',
    to: '/documents',
    tone: 'blue',
  },
  {
    date: '05-10',
    tagLabel: '平台',
    title: '系统维护公告',
    to: '/updates',
    tone: 'orange',
  },
];
