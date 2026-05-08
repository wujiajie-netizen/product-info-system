import type { Component } from 'vue';

import type { DocumentRecord, UpdateRecord } from '#/api/product-info';

import {
  AlarmClock,
  BatteryCharging,
  Bell,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  CircuitBoard,
  ClipboardList,
  CloudUpload,
  Download,
  Factory,
  FileArchive,
  FileCog,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  FolderTree,
  Gamepad2,
  Hand,
  House,
  LayoutGrid,
  LibraryBig,
  LogOut,
  Menu,
  Monitor,
  MonitorSmartphone,
  Newspaper,
  PackageSearch,
  Radio,
  RefreshCw,
  Scale,
  ScanSearch,
  Search,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-vue-next';

export const navIcons: Record<string, Component> = {
  '/': House,
  '/categories': FolderTree,
  '/companies': Building2,
  '/documents': BookOpen,
  '/products': PackageSearch,
  '/quotes': CircleDollarSign,
  '/updates': Newspaper,
};

export const headerActionIcons = {
  logout: LogOut,
  menu: Menu,
  notice: Bell,
} satisfies Record<string, Component>;

export const searchIcon = Search;

export const homeFeatureIcons = [
  { icon: LibraryBig, label: '海量数据' },
  { icon: ScanSearch, label: '精准搜索' },
  { icon: RefreshCw, label: '实时更新' },
  { icon: Users, label: '高效协同' },
] as const;

export const quickEntryIcons = {
  产品: Boxes,
  公司库: Building2,
  分类: FolderTree,
  品牌: LayoutGrid,
  报价: CircleDollarSign,
  资料: BookOpen,
} satisfies Record<string, Component>;

export const sideEntryIcons = {
  公司库: Building2,
  报价中心: FileSpreadsheet,
  资料中心: FolderOpen,
} satisfies Record<string, Component>;

export const detailActionIcons = {
  compare: Scale,
  download: Download,
  favorite: Star,
  share: Share2,
  upload: CloudUpload,
} satisfies Record<string, Component>;

const categoryKeywordIcons = [
  { icon: Monitor, keywords: ['LCD', '显示', '屏', '监视'] },
  { icon: Gamepad2, keywords: ['电竞', '游戏'] },
  { icon: Hand, keywords: ['触控', '触摸'] },
  { icon: MonitorSmartphone, keywords: ['平板', '安卓', '移动'] },
  { icon: ShieldCheck, keywords: ['三防', '防护'] },
  { icon: BatteryCharging, keywords: ['电池', '供电'] },
  { icon: Radio, keywords: ['图传', '通信', '模块', '无线'] },
  { icon: CircuitBoard, keywords: ['元件', '工业', '主板', '芯片', '传感'] },
] as const;

export function getCategoryIcon(name: string) {
  const matched = categoryKeywordIcons.find(({ keywords }) =>
    keywords.some((keyword) => name.includes(keyword)),
  );

  return matched?.icon || Boxes;
}

export function getDocumentTypeIcon(fileType: DocumentRecord['file_type']) {
  switch (fileType) {
    case 'image': {
      return FileImage;
    }
    case 'other': {
      return FileArchive;
    }
    case 'quote': {
      return FileSpreadsheet;
    }
    case 'spec': {
      return FileText;
    }
    case 'technical': {
      return FileCog;
    }
  }
}

export function getCompanyTypeIcon(type: string) {
  switch (type) {
    case 'brand_owner': {
      return LayoutGrid;
    }
    case 'distributor': {
      return BriefcaseBusiness;
    }
    case 'manufacturer': {
      return Factory;
    }
    case 'supplier': {
      return Building2;
    }
    default: {
      return Building2;
    }
  }
}

export function getUpdateTypeIcon(type: UpdateRecord['type']) {
  switch (type) {
    case 'notice': {
      return Bell;
    }
    case 'price_update': {
      return CircleDollarSign;
    }
    case 'product': {
      return RefreshCw;
    }
  }
}

export function getQuoteMetaIcon(kind: 'company' | 'updated' | 'valid') {
  switch (kind) {
    case 'company': {
      return Building2;
    }
    case 'updated': {
      return AlarmClock;
    }
    case 'valid': {
      return ClipboardList;
    }
  }
}
