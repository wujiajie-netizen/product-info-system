export interface ProductDocLink {
  label: string;
  tone: 'blue' | 'red';
}

export interface ProductSpecLine {
  label: string;
  value: string;
}

export interface CatalogProduct {
  companyId?: string;
  id: string;
  name: string;
  model: string;
  summary: string;
  tags: string[];
  categorySlug: string;
  brandSlug: string;
  brandName: string;
  quoteRole: string;
  companyName: string;
  productId?: string;
  statusLabel?: string;
  updatedDate: string;
  updatedAgo: string;
  price: string;
  minimumOrder: string;
  image: string;
  docCount: number;
  docs: ProductDocLink[];
  specs: ProductSpecLine[];
}

export interface CategoryOption {
  count: number;
  label: string;
  slug: string;
}

export interface CategoryGroup {
  count: number;
  label: string;
  options: CategoryOption[];
}

export interface BrandFilter {
  count: number;
  label: string;
  slug: string;
}

export interface ProductNavItem {
  label: string;
  to: string;
}

function toDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createDisplayArt(accent: string, glow: string) {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef7ff" />
          <stop offset="100%" stop-color="#dcebff" />
        </linearGradient>
        <linearGradient id="screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${glow}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" rx="24" fill="url(#bg)" />
      <g transform="translate(36 26)">
        <rect x="0" y="0" width="178" height="112" rx="8" fill="#222f44" />
        <rect x="7" y="7" width="164" height="98" rx="6" fill="url(#screen)" />
        <path d="M8 95L46 58L72 76L102 48L171 94V105H8Z" fill="rgba(255,255,255,.42)" />
        <path d="M8 84L39 62L67 81L97 51L171 87V105H8Z" fill="rgba(8,63,133,.22)" />
        <rect x="68" y="114" width="42" height="12" rx="6" fill="#2b394f" />
        <path d="M80 126H98L112 156H66Z" fill="#39485d" />
        <rect x="54" y="156" width="70" height="8" rx="4" fill="#2a374a" />
      </g>
    </svg>
  `);
}

function createTabletArt(accent: string, glow: string) {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f2f7ff" />
          <stop offset="100%" stop-color="#e3edff" />
        </linearGradient>
        <linearGradient id="screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${glow}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" rx="24" fill="url(#bg)" />
      <g transform="translate(52 28)">
        <rect x="0" y="0" width="128" height="164" rx="18" fill="#243349" />
        <rect x="10" y="12" width="108" height="140" rx="12" fill="url(#screen)" />
        <path d="M10 128L46 82L72 98L96 72L118 110V152H10Z" fill="rgba(255,255,255,.35)" />
        <circle cx="64" cy="158" r="6" fill="#50627f" />
      </g>
    </svg>
  `);
}

function createBatteryArt(accent: string) {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#edf4ff" />
          <stop offset="100%" stop-color="#dbe8ff" />
        </linearGradient>
        <linearGradient id="battery" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${accent}" />
          <stop offset="100%" stop-color="#2c3a4e" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" rx="24" fill="url(#bg)" />
      <g transform="translate(68 34)">
        <path d="M16 18L106 0L146 34L132 132L42 152L0 120Z" fill="url(#battery)" />
        <path d="M18 20L40 36L24 118L2 102Z" fill="rgba(255,255,255,.08)" />
        <path d="M106 0L146 34L126 48L86 14Z" fill="rgba(255,255,255,.12)" />
        <rect x="50" y="44" width="56" height="48" rx="8" fill="#151c28" stroke="#6e7c92" stroke-width="4" />
        <path d="M77 56H88V68H100V79H88V91H77V79H65V68H77Z" fill="#8ce784" />
      </g>
    </svg>
  `);
}

function createPropellerArt() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef5ff" />
          <stop offset="100%" stop-color="#dce9ff" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" rx="24" fill="url(#bg)" />
      <g transform="translate(40 36)" fill="#283548">
        <path d="M0 46C0 26 18 4 58 0C76 0 90 8 90 20C90 30 82 38 68 43L0 58Z" />
        <path d="M109 41C111 25 132 4 174 0C190 0 202 8 202 18C202 34 188 43 164 48L108 58Z" transform="translate(-4 80) rotate(180 100 34)" />
        <circle cx="100" cy="74" r="18" fill="#51647f" />
        <circle cx="100" cy="74" r="8" fill="#d7e3f7" />
      </g>
    </svg>
  `);
}

function createGimbalArt() {
  return toDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 220">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#eef5ff" />
          <stop offset="100%" stop-color="#dbe8ff" />
        </linearGradient>
      </defs>
      <rect width="280" height="220" rx="24" fill="url(#bg)" />
      <g transform="translate(68 28)">
        <circle cx="48" cy="92" r="34" fill="#1d2735" />
        <circle cx="48" cy="92" r="16" fill="#465874" />
        <path d="M46 42H88C108 42 124 58 124 78V84H102V77C102 69 96 63 88 63H60Z" fill="#313f54" />
        <path d="M30 126H66L92 160H10Z" fill="#2a374a" />
        <rect x="96" y="70" width="26" height="56" rx="12" fill="#44566f" />
      </g>
    </svg>
  `);
}

export const productNavItems: ProductNavItem[] = [
  { label: '首页', to: '/' },
  { label: '产品', to: '/products' },
  { label: '分类', to: '/categories' },
  { label: '资料', to: '/documents' },
  { label: '报价', to: '/quotes' },
  { label: '公司库', to: '/companies' },
  { label: '资讯', to: '/updates' },
];

export const productCategoryGroups: CategoryGroup[] = [
  {
    count: 1256,
    label: '电脑显示屏',
    options: [
      { count: 1256, label: 'LCD 显示器', slug: 'lcd-monitor' },
      { count: 832, label: '电脑显示器', slug: 'desktop-display' },
      { count: 428, label: '触控显示器', slug: 'touch-display' },
      { count: 352, label: '便携显示器', slug: 'portable-display' },
      { count: 214, label: '一体机显示屏', slug: 'all-in-one-panel' },
    ],
  },
  {
    count: 1168,
    label: '平板电脑',
    options: [
      { count: 1168, label: '安卓平板', slug: 'android-tablet' },
      { count: 586, label: '三防安卓平板', slug: 'rugged-tablet' },
      { count: 423, label: '消费平板', slug: 'consumer-tablet' },
    ],
  },
  {
    count: 724,
    label: '无人机配件',
    options: [
      { count: 724, label: '电池模组', slug: 'battery-pack' },
      { count: 1152, label: '桨叶', slug: 'propeller' },
      { count: 438, label: '云台相机模组', slug: 'gimbal-camera' },
      { count: 617, label: '图传模块', slug: 'transmission-module' },
      { count: 529, label: '遥控器配件', slug: 'remote-parts' },
      { count: 413, label: '机身与支架', slug: 'airframe-support' },
    ],
  },
];

export const productBrands: BrandFilter[] = [
  { count: 128, label: 'AOC', slug: 'aoc' },
  { count: 112, label: 'ASUS', slug: 'asus' },
  { count: 96, label: 'Dell', slug: 'dell' },
  { count: 86, label: 'Lenovo', slug: 'lenovo' },
  { count: 72, label: 'ViewSonic', slug: 'viewsonic' },
  { count: 156, label: 'DJI', slug: 'dji' },
  { count: 98, label: 'Autel Robotics', slug: 'autel' },
  { count: 67, label: 'HollySys', slug: 'hollysys' },
];

export const productList: CatalogProduct[] = [
  {
    brandName: 'AOC',
    brandSlug: 'aoc',
    categorySlug: 'lcd-monitor',
    companyName: '深圳视界科技有限公司',
    companyRating: 4.8,
    docCount: 8,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '产品手册', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '3D 图纸', tone: 'blue' },
    ],
    id: '27-lcd-monitor',
    image: createDisplayArt('#1798df', '#81ddff'),
    leadTime: '现货',
    minimumOrder: '10 台',
    model: 'AOC 27B2H',
    name: '27寸 LCD 显示器',
    price: '680.00',
    quoteRole: '供应商',
    specs: [
      { label: '屏幕尺寸', value: '27 寸' },
      { label: '分辨率', value: '1920×1080' },
      { label: '面板类型', value: 'IPS' },
      { label: '刷新率', value: '75Hz' },
      { label: '亮度', value: '250cd/m²' },
      { label: '接口', value: 'HDMI ×1，VGA ×1' },
    ],
    summary: '27寸 | 1920×1080 | IPS | 75Hz',
    tags: ['FHD', 'IPS', '低蓝光', '窄边框'],
    updatedAgo: '2 小时前',
    updatedDate: '2024-05-15',
  },
  {
    brandName: 'ASUS',
    brandSlug: 'asus',
    categorySlug: 'desktop-display',
    companyName: '华硕电脑(上海)有限公司',
    companyRating: 4.9,
    docCount: 10,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '产品手册', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '包装报告', tone: 'blue' },
    ],
    id: '32-curved-display',
    image: createDisplayArt('#0d8bd4', '#67ceff'),
    leadTime: '1-2 周',
    minimumOrder: '5 台',
    model: 'ASUS TUF VG32VQ',
    name: '32寸 电竞显示器',
    price: '1,899.00',
    quoteRole: '制造商',
    specs: [
      { label: '屏幕尺寸', value: '32 寸' },
      { label: '分辨率', value: '2560×1440' },
      { label: '面板类型', value: 'VA' },
      { label: '刷新率', value: '165Hz' },
      { label: '亮度', value: '300cd/m²' },
      { label: '接口', value: 'DP ×1，HDMI ×2' },
    ],
    summary: '32寸 | 2560×1440 | 曲面 | 165Hz',
    tags: ['2K', '曲面', '165Hz', 'HDR10'],
    updatedAgo: '3 小时前',
    updatedDate: '2024-05-15',
  },
  {
    brandName: 'Lenovo',
    brandSlug: 'lenovo',
    categorySlug: 'portable-display',
    companyName: '联想(北京)有限公司',
    companyRating: 4.7,
    docCount: 6,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '用户手册', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '驱动程序', tone: 'blue' },
    ],
    id: '15-portable-display',
    image: createDisplayArt('#3790f6', '#79ccff'),
    leadTime: '现货',
    minimumOrder: '20 台',
    model: 'Lenovo L15 Mobile',
    name: '15.6寸 便携显示器',
    price: '799.00',
    quoteRole: '供应商',
    specs: [
      { label: '屏幕尺寸', value: '15.6 寸' },
      { label: '分辨率', value: '1920×1080' },
      { label: '面板类型', value: 'IPS' },
      { label: '刷新率', value: '60Hz' },
      { label: '亮度', value: '300cd/m²' },
      { label: '接口', value: 'Type-C ×2，Mini HDMI ×1' },
    ],
    summary: '15.6寸 | 1920×1080 | IPS | 60Hz',
    tags: ['便携', '轻薄', 'Type-C', '护眼'],
    updatedAgo: '5 小时前',
    updatedDate: '2024-05-14',
  },
  {
    brandName: 'Teclast',
    brandSlug: 'teclast',
    categorySlug: 'android-tablet',
    companyName: '台电科技(广州)有限公司',
    companyRating: 4.6,
    docCount: 7,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '用户手册', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '固件包', tone: 'blue' },
    ],
    id: '10-android-tablet',
    image: createTabletArt('#4a85ff', '#f4a9ff'),
    leadTime: '2-3 天',
    minimumOrder: '50 台',
    model: 'Teclast P25T',
    name: '10.1寸 安卓平板',
    price: '649.00',
    quoteRole: '制造商',
    specs: [
      { label: '屏幕尺寸', value: '10.1 寸' },
      { label: '分辨率', value: '1280×800' },
      { label: '系统', value: 'Android 13' },
      { label: '内存', value: '4GB+64GB' },
      { label: '电池', value: '6000mAh' },
      { label: '接口', value: 'Type-C，TF 卡槽' },
    ],
    summary: '10.1寸 | Android 13 | 4GB+64GB',
    tags: ['安卓 13', 'Wi-Fi', '高清屏'],
    updatedAgo: '1 天前',
    updatedDate: '2024-05-14',
  },
  {
    brandName: 'DT Research',
    brandSlug: 'dt-research',
    categorySlug: 'rugged-tablet',
    companyName: '研虎机械(上海)有限公司',
    companyRating: 4.8,
    docCount: 9,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '用户手册', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '测试报告', tone: 'blue' },
    ],
    id: 'tri-proof-tablet',
    image: createTabletArt('#f7c14b', '#82c8ff'),
    leadTime: '1-2 周',
    minimumOrder: '10 台',
    model: 'DT Research DT312',
    name: '三防安卓平板',
    price: '2,399.00',
    quoteRole: '供应商',
    specs: [
      { label: '屏幕尺寸', value: '10.1 寸' },
      { label: '分辨率', value: '1920×1200' },
      { label: '系统', value: 'Android 12' },
      { label: '内存', value: '6GB+128GB' },
      { label: '电池', value: '10000mAh' },
      { label: '接口', value: 'Type-C，POGO Pin' },
    ],
    summary: '10.1寸 | Android 12 | IP65',
    tags: ['三防', 'IP65', '高续航'],
    updatedAgo: '1 天前',
    updatedDate: '2024-05-13',
  },
  {
    brandName: 'DJI',
    brandSlug: 'dji',
    categorySlug: 'battery-pack',
    companyName: '大疆创新科技有限公司',
    companyRating: 4.9,
    docCount: 5,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '安全指南', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '3D 图纸', tone: 'blue' },
    ],
    id: 'tb60-battery',
    image: createBatteryArt('#566070'),
    leadTime: '现货',
    minimumOrder: '5 块',
    model: 'DJI TB60 智能电池',
    name: '无人机电池模组',
    price: '2,980.00',
    quoteRole: '制造商',
    specs: [
      { label: '电压', value: '22.8V' },
      { label: '容量', value: '5935mAh' },
      { label: '能量', value: '135Wh' },
      { label: '电芯', value: 'LiPo 6S' },
      { label: '重量', value: '0.685kg' },
      { label: '适用机型', value: 'DJI Matrice 300' },
    ],
    summary: '22.8V | 5935mAh | LiPo',
    tags: ['大容量', '智能电芯', '高能量'],
    updatedAgo: '1 天前',
    updatedDate: '2024-05-13',
  },
  {
    brandName: 'DJI',
    brandSlug: 'dji',
    categorySlug: 'propeller',
    companyName: '大疆创新科技有限公司',
    companyRating: 4.9,
    docCount: 4,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '安全指南', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '测试报告', tone: 'blue' },
    ],
    id: 'dji-propeller',
    image: createPropellerArt(),
    leadTime: '现货',
    minimumOrder: '20 对',
    model: 'DJI 9450S 低噪桨',
    name: '无人机桨叶（快拆）',
    price: '168.00',
    quoteRole: '制造商',
    specs: [
      { label: '尺寸', value: '24.0×5.7 英寸' },
      { label: '材质', value: '碳纤维增强尼龙' },
      { label: '重量', value: '约 35g/片' },
      { label: '安装方式', value: '快拆' },
      { label: '适配机型', value: 'Matrice 300/350' },
      { label: '颜色', value: '黑色' },
    ],
    summary: '通用 Matrice 系列',
    tags: ['快拆', '低噪音', '高强度'],
    updatedAgo: '2 天前',
    updatedDate: '2024-05-12',
  },
  {
    brandName: 'DJI',
    brandSlug: 'dji',
    categorySlug: 'gimbal-camera',
    companyName: '大疆创新科技有限公司',
    companyRating: 4.9,
    docCount: 6,
    docs: [
      { label: '规格书', tone: 'red' },
      { label: '用户手册', tone: 'red' },
      { label: '认证资料', tone: 'red' },
      { label: '3D 图纸', tone: 'blue' },
    ],
    id: 'zenmuse-h20t',
    image: createGimbalArt(),
    leadTime: '2-3 周',
    minimumOrder: '1 台',
    model: 'DJI Zenmuse H20T',
    name: '云台相机模组',
    price: '58,800.00',
    quoteRole: '制造商',
    specs: [
      { label: '相机', value: '20MP 变焦' },
      { label: '变焦', value: '23× 混合变焦' },
      { label: '热成像', value: '640×512' },
      { label: '激光测距', value: '1200m' },
      { label: '夜视', value: '支持' },
      { label: '云台稳定', value: '三轴增稳' },
    ],
    summary: '20MP | 变焦 | 热成像',
    tags: ['多传感器', '热成像', '夜视'],
    updatedAgo: '2 天前',
    updatedDate: '2024-05-12',
  },
];
