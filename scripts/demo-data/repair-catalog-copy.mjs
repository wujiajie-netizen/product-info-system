import fs from 'node:fs';
import path from 'node:path';

const catalogPath = path.resolve('demo-data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const categoryMap = {
  'lcd-display': {
    description: '覆盖工业显示器、便携显示器和工控显示器',
    name: 'LCD 显示器',
  },
  'android-tablet': {
    description: '覆盖行业平板、三防平板和 Windows 终端',
    name: '安卓平板',
  },
  'drone-parts': {
    description: '覆盖云台、电池和图传等无人机配件',
    name: '无人机配件',
  },
  'industrial-components': {
    description: '覆盖主板、传感器和控制模块等工业元件',
    name: '工业元件',
  },
};

const brandMap = {
  advantech: {
    aliases: ['Advantech', '研华'],
    description: '工业计算与嵌入式平台品牌',
    name: '研华 Advantech',
  },
  aoc: {
    aliases: ['AOC'],
    description: '商用显示器品牌',
    name: 'AOC',
  },
  asus: {
    aliases: ['ASUS'],
    description: '消费与行业终端品牌',
    name: 'ASUS',
  },
  'dt-research': {
    aliases: ['DT', 'DT Research'],
    description: '行业平板与移动终端品牌',
    name: 'DT Research',
  },
  haituo: {
    aliases: ['海拓', 'Haituo'],
    description: '工业显示器与触控终端品牌',
    name: '海拓显示',
  },
  tianyue: {
    aliases: ['天域', 'Tianyu'],
    description: '三防平板与行业设备品牌',
    name: '天域电子',
  },
  xinkong: {
    aliases: ['芯控', 'Xinkong'],
    description: '工业控制与传感器品牌',
    name: '芯控科技',
  },
  zhifei: {
    aliases: ['智飞', 'Zhifei'],
    description: '无人机配件与图传设备品牌',
    name: '智飞科技',
  },
};

const companyMap = {
  'beijing-shulian': {
    description: '区域渠道与项目交付服务商',
    name: '北京数联渠道有限公司',
  },
  'guangzhou-xinkong': {
    description: '工业元件与控制模组供应商',
    name: '广州芯控科技有限公司',
  },
  'shanghai-yankong': {
    description: '行业终端与方案整合供应商',
    name: '上海研控电子有限公司',
  },
  'shenzhen-haituo': {
    description: '工业显示器制造与组装工厂',
    name: '深圳海拓显示有限公司',
  },
  'shenzhen-zhifei': {
    description: '无人机配件品牌方与方案商',
    name: '深圳智飞科技有限公司',
  },
  'suzhou-tianyue': {
    description: '三防平板与行业设备制造商',
    name: '苏州天域智能设备有限公司',
  },
};

const seriesMap = {
  AX20: {
    baseDescription: '无人机云台相机模组系列，适合航拍、测绘与巡检。',
    productType: '云台相机',
    seriesName: 'AX20 云台相机模组',
  },
  'BAT-X6': {
    baseDescription: '无人机电池系列，覆盖不同容量与续航需求。',
    productType: '无人机电池',
    seriesName: 'BAT-X6 无人机电池',
  },
  'CTRL-200': {
    baseDescription: '工业控制模块系列，适合设备接入与远程控制。',
    productType: '控制模块',
    seriesName: 'CTRL-200 控制模块',
  },
  DT312: {
    baseDescription: 'Windows 行业终端系列，适合移动作业与巡检。',
    productType: '行业终端',
    seriesName: 'DT312 行业终端',
  },
  'HDM-215': {
    baseDescription: '21.5 寸工业显示器系列，适用于产线与设备配套。',
    productType: '工业显示器',
    seriesName: 'HDM-215 工业显示器',
  },
  'HDM-270': {
    baseDescription: '27 寸工控显示器系列，覆盖标准版与高亮版。',
    productType: '工控显示器',
    seriesName: 'HDM-270 工控显示器',
  },
  'HT-156': {
    baseDescription: '15.6 寸便携显示器系列，适合移动办公与演示。',
    productType: '便携显示器',
    seriesName: 'HT-156 便携显示器',
  },
  'MB-IMX': {
    baseDescription: '基于 i.MX8 的工业主板系列，覆盖基础接口与扩展 IO。',
    productType: '工业主板',
    seriesName: 'MB-IMX 工业主板',
  },
  'SEN-T100': {
    baseDescription: '温湿度传感器系列，覆盖室内与室外工业环境。',
    productType: '温湿度传感器',
    seriesName: 'SEN-T100 温湿度传感器',
  },
  'TAB-M8': {
    baseDescription: '10.1 寸行业平板系列，覆盖 WiFi 与 4G 形态。',
    productType: '行业平板',
    seriesName: 'TAB-M8 行业平板',
  },
  'TAB-R10': {
    baseDescription: '10.1 寸三防平板系列，适合仓储、巡检与车载场景。',
    productType: '三防平板',
    seriesName: 'TAB-R10 三防平板',
  },
  'TX-580': {
    baseDescription: '5.8G 图传模块系列，适合无人机实时回传。',
    productType: '图传模块',
    seriesName: 'TX-580 图传模块',
  },
};

const variantMap = {
  'AX20-P': {
    displayName: 'AX20-P 1080P 变焦版',
    specs: {
      keyword_hint: '云台相机 变焦',
      zoom: '10x 变焦',
    },
    summaryConfigText: '1080P 云台相机，支持 10x 变焦',
    tags: ['云台相机', '1080P', '变焦版', '测绘'],
  },
  'AX20-S': {
    displayName: 'AX20-S 1080P 轻载版',
    specs: {
      keyword_hint: '云台相机',
      zoom: '定焦',
    },
    summaryConfigText: '1080P 云台相机，适配轻载航拍',
    tags: ['云台相机', '1080P', '轻载版'],
  },
  'BAT-X6-5200': {
    displayName: 'BAT-X6-5200 5200mAh 标准版',
    specs: {
      keyword_hint: '无人机电池',
    },
    summaryConfigText: '5200mAh，无人机标准电池',
    tags: ['无人机电池', '5200mAh', '标准版'],
  },
  'BAT-X6-6800': {
    displayName: 'BAT-X6-6800 6800mAh 长航版',
    specs: {
      keyword_hint: '6800mAh 电池',
    },
    summaryConfigText: '6800mAh，无人机长航时电池',
    tags: ['无人机电池', '6800mAh', '长航时'],
  },
  'CTRL-200A': {
    displayName: 'CTRL-200A 标准控制版',
    specs: {
      keyword_hint: '控制模块',
    },
    summaryConfigText: '标准控制模块，适合设备接入',
    tags: ['控制模块', '标准版', 'Modbus'],
  },
  'CTRL-200B': {
    displayName: 'CTRL-200B 高配通信版',
    specs: {
      keyword_hint: '控制模块 远程',
    },
    summaryConfigText: '高配通信控制模块，支持 CAN',
    tags: ['控制模块', '高配通信版', '远程控制'],
  },
  'DT312-128': {
    displayName: 'DT312-128 Windows 高配版',
    specs: {
      keyword_hint: 'DT312 128GB',
      network: 'WiFi / 蓝牙',
      screen_size: '10.1寸',
    },
    summaryConfigText: 'Windows 11，8GB+128GB，现场运维终端',
    tags: ['DT312', 'Windows', '128GB', '高配版'],
  },
  'DT312-64': {
    displayName: 'DT312-64 Windows 基础版',
    specs: {
      keyword_hint: 'DT312 Windows 平板',
      screen_size: '10.1寸',
    },
    summaryConfigText: 'Windows 11，8GB+64GB，移动作业终端',
    tags: ['DT312', 'Windows', '基础版'],
  },
  'HDM-215A': {
    displayName: 'HDM-215A 21.5 寸标准版',
    specs: {
      keyword_hint: '工业显示 产线',
      screen_size: '21.5寸',
    },
    summaryConfigText: '21.5 寸，1920x1080，250nit，工业标准版',
    tags: ['21.5寸', '1920x1080', '工业显示器', '标准版'],
  },
  'HDM-215B': {
    displayName: 'HDM-215B 21.5 寸触控版',
    specs: {
      keyword_hint: '工业显示 触控',
      screen_size: '21.5寸',
      touch: '10点电容触控',
    },
    summaryConfigText: '21.5 寸，1920x1080，350nit，电容触控',
    tags: ['21.5寸', '1920x1080', '触控', '工业显示器'],
  },
  'HDM-270A': {
    displayName: 'HDM-270A 27 寸标准版',
    specs: {
      screen_size: '27寸',
    },
    summaryConfigText: '27 寸，1920x1080，工控标准版',
    tags: ['27寸', '1920x1080', '工控显示器'],
  },
  'HDM-270B': {
    displayName: 'HDM-270B 27 寸高亮版',
    specs: {
      screen_size: '27寸',
    },
    summaryConfigText: '27 寸，2560x1440，高亮版',
    tags: ['27寸', '2560x1440', '高亮', '工控显示器'],
  },
  'HT-156A': {
    displayName: 'HT-156A 15.6 寸轻薄版',
    specs: {
      keyword_hint: '便携显示器',
      screen_size: '15.6寸',
    },
    summaryConfigText: '15.6 寸便携显示器，Type-C 供电',
    tags: ['15.6寸', '便携显示器', 'Type-C'],
  },
  'HT-156B': {
    displayName: 'HT-156B 15.6 寸触控版',
    specs: {
      screen_size: '15.6寸',
      touch: '10点电容触控',
    },
    summaryConfigText: '15.6 寸触控便携屏',
    tags: ['15.6寸', '触控', '便携显示器'],
  },
  'MB-IMX-A': {
    displayName: 'MB-IMX-A 基础接口版',
    specs: {
      keyword_hint: '工业主板',
    },
    summaryConfigText: '工业主板基础接口配置',
    tags: ['工业主板', 'IMX', '基础接口'],
  },
  'MB-IMX-B': {
    displayName: 'MB-IMX-B 扩展 IO 版',
    specs: {
      keyword_hint: '工业主板 扩展IO',
    },
    summaryConfigText: '扩展 IO 工业主板',
    tags: ['工业主板', 'IMX', '扩展IO'],
  },
  'SEN-T100-I': {
    displayName: 'SEN-T100-I 室内监测版',
    specs: {
      keyword_hint: '温湿度传感器',
    },
    summaryConfigText: '室内环境温湿度监测',
    tags: ['温湿度传感器', '室内版', 'RS485'],
  },
  'SEN-T100-O': {
    displayName: 'SEN-T100-O 室外工业版',
    specs: {
      keyword_hint: '室外工业传感器',
    },
    summaryConfigText: '室外工业温湿度监测',
    tags: ['温湿度传感器', '室外版', '工业环境'],
  },
  'TAB-M8-128': {
    displayName: 'TAB-M8-128 10.1 寸 4G 版',
    specs: {
      keyword_hint: '10.1寸 4G 平板',
      network: '4G 全网通',
      screen_size: '10.1寸',
    },
    summaryConfigText: '10.1 寸，8GB+128GB，4G 全网通',
    tags: ['10.1寸', 'Android 13', '4G', '行业平板'],
  },
  'TAB-M8-64': {
    displayName: 'TAB-M8-64 10.1 寸基础版',
    specs: {
      keyword_hint: '行业平板',
      screen_size: '10.1寸',
    },
    summaryConfigText: '10.1 寸，8GB+64GB，WiFi 版',
    tags: ['10.1寸', 'Android 13', '行业平板', 'WiFi'],
  },
  'TAB-R10-4G': {
    displayName: 'TAB-R10-4G 10.1 寸 4G 版',
    specs: {
      keyword_hint: '4G 三防平板',
      network: '4G 全网通',
      screen_size: '10.1寸',
    },
    summaryConfigText: '10.1 寸，4G，IP65，600nit 高亮',
    tags: ['10.1寸', '三防平板', '4G', 'IP65', '高亮'],
  },
  'TAB-R10-WIFI': {
    displayName: 'TAB-R10-WIFI 10.1 寸 WiFi 版',
    specs: {
      keyword_hint: '三防平板',
      screen_size: '10.1寸',
    },
    summaryConfigText: '10.1 寸，WiFi，IP65 三防平板',
    tags: ['10.1寸', '三防平板', 'WiFi', 'IP65'],
  },
  'TX-580A': {
    displayName: 'TX-580A 基础版',
    specs: {
      keyword_hint: '图传模块',
    },
    summaryConfigText: '无人机基础图传模块',
    tags: ['图传模块', '5.8G', '基础版'],
  },
  'TX-580B': {
    displayName: 'TX-580B 增强版，低延迟',
    specs: {
      keyword_hint: '低延迟 图传',
    },
    summaryConfigText: '低延迟增强型图传模块',
    tags: ['图传模块', '5.8G', '低延迟'],
  },
};

const documentMap = {
  'ax20-p-image': { tags: ['主图', '云台相机'], title: 'AX20-P 主图' },
  'ax20-p-quote': { tags: ['渠道报价'], title: 'AX20-P 渠道报价' },
  'ax20-p-spec': { tags: ['规格书', '变焦版'], title: 'AX20-P 规格书' },
  'ax20-p-tech': { tags: ['接口文档'], title: 'AX20-P 接口说明' },
  'ax20-s-image': { tags: ['主图'], title: 'AX20-S 主图' },
  'bat-x6-6800-image': { tags: ['主图', '6800mAh'], title: 'BAT-X6-6800 主图' },
  'bat-x6-6800-quote': { tags: ['历史报价'], title: 'BAT-X6-6800 历史报价附件' },
  'bat-x6-6800-spec': { tags: ['规格书', '6800mAh'], title: 'BAT-X6-6800 规格书' },
  'bat-x6-6800-tech': { tags: ['测试摘要', '续航说明'], title: 'BAT-X6-6800 测试摘要' },
  'ctrl-200b-image': { tags: ['主图', '控制模块'], title: 'CTRL-200B 主图' },
  'ctrl-200b-spec': { tags: ['规格书', '控制模块'], title: 'CTRL-200B 规格书' },
  'ctrl-200b-tech': { tags: ['接线说明', '通信'], title: 'CTRL-200B 接线说明' },
  'dt312-128-image': { tags: ['主图', '行业终端'], title: 'DT312-128 主图' },
  'dt312-128-quote': { tags: ['项目报价'], title: 'DT312-128 报价单' },
  'dt312-128-spec': { tags: ['规格书', 'Windows 11'], title: 'DT312-128 规格书 V1.3' },
  'dt312-128-tech': { tags: ['集成说明'], title: 'DT312-128 集成说明' },
  'hdm-215a-spec': { tags: ['规格书'], title: 'HDM-215A 规格书' },
  'hdm-215b-image': { tags: ['主图', '工业显示器'], title: 'HDM-215B 主图' },
  'hdm-215b-spec': { tags: ['规格书', '1920x1080'], title: 'HDM-215B 规格书' },
  'hdm-215b-tech': { tags: ['触控说明', '电容'], title: 'HDM-215B 触控说明' },
  'hdm-270b-image': { tags: ['主图', '高亮'], title: 'HDM-270B 主图' },
  'hdm-270b-spec': { tags: ['规格书', '高亮'], title: 'HDM-270B 规格书' },
  'ht-156b-image': { tags: ['主图', '便携显示器'], title: 'HT-156B 主图' },
  'ht-156b-spec': { tags: ['规格书'], title: 'HT-156B 规格书' },
  'mb-imx-b-spec': { tags: ['规格书', '工业主板'], title: 'MB-IMX-B 规格书' },
  'sen-t100-o-spec': { tags: ['规格书', '温湿度传感器'], title: 'SEN-T100-O 规格书' },
  'tab-m8-128-image': { tags: ['主图', '4G 平板'], title: 'TAB-M8-128 主图' },
  'tab-m8-128-spec': { tags: ['规格书', '4G'], title: 'TAB-M8-128 规格书' },
  'tab-r10-4g-image': { tags: ['主图', '三防平板'], title: 'TAB-R10-4G 主图' },
  'tab-r10-4g-quote': { tags: ['报价附件'], title: 'TAB-R10-4G 报价附件' },
  'tab-r10-4g-spec': { tags: ['规格书', '4G', '10.1寸'], title: 'TAB-R10-4G 规格书' },
  'tab-r10-4g-tech': { tags: ['选型说明', '三防'], title: 'TAB-R10-4G 选型说明' },
};

const quoteBatchMap = {
  'ax20-p-channel-2026q2': {
    batchTitle: 'AX20-P 渠道价 2026Q2',
    globalNote: '北京数联渠道供货',
    line: {
      rowNote: '含云台',
      standardConfigText: '变焦版',
    },
  },
  'ax20-p-direct-2026q2': {
    batchTitle: 'AX20-P 直营价 2026Q2',
    globalNote: '深圳智飞品牌直供',
    line: {
      rowNote: '含云台',
      standardConfigText: '变焦版',
    },
  },
  'bat-x6-6800-2026q1': {
    batchTitle: 'BAT-X6-6800 历史价 2026Q1',
    globalNote: '用于对比上一季度价格',
    line: {
      rowNote: '2026Q1 批次',
      standardConfigText: '6800mAh 标准电芯',
    },
  },
  'bat-x6-6800-2026q2': {
    batchTitle: 'BAT-X6-6800 最新价 2026Q2',
    globalNote: '新版电芯已切换',
    line: {
      rowNote: '2026Q2 批次',
      standardConfigText: '6800mAh 新电芯',
    },
  },
  'ctrl-200b-2026q2': {
    batchTitle: 'CTRL-200B 项目价 2026Q2',
    globalNote: '支持远程升级',
    line: {
      option: {
        description: '选配功能',
        optionName: '远程升级固件',
      },
      rowNote: '含网关固件',
      standardConfigText: 'Modbus TCP / CAN',
    },
  },
  'dt312-128-2026q2': {
    batchTitle: 'DT312-128 项目价 2026Q2',
    globalNote: 'Windows 高配版',
    line: {
      rowNote: 'Windows 11 / 128GB',
      standardConfigText: '高配版本',
    },
  },
  'hdm-215a-2026q2': {
    batchTitle: 'HDM-215A 项目价 2026Q2',
    globalNote: '北京数联渠道交付，交期 2 周',
    line: {
      rowNote: '含基础支架',
      standardConfigText: '标准版',
    },
  },
  'hdm-215b-2026q2': {
    batchTitle: 'HDM-215B 工厂价 2026Q2',
    globalNote: '深圳海拓显示直供',
    line: {
      rowNote: '含触控玻璃',
      standardConfigText: '触控版',
    },
  },
  'tab-m8-128-2026q2': {
    batchTitle: 'TAB-M8-128 渠道价 2026Q2',
    globalNote: '4G 全网通，10 台起订',
    line: {
      rowNote: '4G 全网通',
      standardConfigText: '8GB + 128GB',
    },
  },
  'tab-r10-4g-2026q2': {
    batchTitle: 'TAB-R10-4G 渠道价 2026Q2',
    globalNote: '4G 版本支持阶梯报价',
    line: {
      option: {
        description: '选配件',
        optionName: '桌面充电底座',
      },
      rowNote: '4G 全网通',
      standardConfigText: '8GB + 128GB / IP65',
    },
  },
};

const updateMap = {
  'upd-ax20-doc': {
    content: 'AX20-P 已新增 UART、PWM、Ethernet 接口说明',
    title: 'AX20-P 接口文档已补齐',
  },
  'upd-ax20-price': {
    content: 'AX20-P 直营价已更新，可对比品牌直供与渠道报价',
    title: 'AX20-P 报价批次 2026Q2 已更新',
  },
  'upd-bat-doc': {
    content: '已上传 BAT-X6-6800 测试摘要与续航说明',
    title: 'BAT-X6-6800 测试资料已补齐',
  },
  'upd-bat-price': {
    content: '已切换 BAT-X6-6800 新批次报价与电芯说明',
    title: 'BAT-X6-6800 最新批次报价生效',
  },
  'upd-ctrl-doc': {
    content: '已补充 CTRL-200B 接线说明与通信参数',
    title: 'CTRL-200B 接线资料已发布',
  },
  'upd-ctrl-price': {
    content: 'CTRL-200B 项目报价已同步远程升级固件选配',
    title: 'CTRL-200B 项目报价已更新',
  },
  'upd-dt312-doc': {
    content: '已上传 DT312-128 最新规格书与集成说明',
    title: 'DT312-128 规格书更新至 V1.3',
  },
  'upd-hdm215b-launch': {
    content: 'HDM-215B 已补齐触控版主图、规格书与参数说明',
    title: 'HDM-215B 工业显示器触控版上架',
  },
  'upd-mb-launch': {
    content: 'MB-IMX-B 已补齐 CAN、RS485 与 GPIO 扩展 IO 参数',
    title: 'MB-IMX 新增扩展 IO 版本',
  },
  'upd-notice-may': {
    content: '五一假期后已同步恢复报价与交期，演示数据按 2026Q2 批次展示',
    title: '五一后交期与报价同步通知',
  },
  'upd-tab-r10-launch': {
    content: 'TAB-R10-4G 已补齐主图、4G、IP65 与 600nit 参数',
    title: 'TAB-R10 系列新增 4G 版本',
  },
  'upd-tab-r10-price': {
    content: '10 / 50 / 100 台梯度价格已同步，可用于演示批量采购场景',
    title: 'TAB-R10-4G 阶梯报价已更新',
  },
};

catalog.metadata.testUsers = [
  {
    description: '管理员演示账号',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    description: '普通用户只读账号',
    email: 'user@example.com',
    role: 'user',
  },
];
catalog.metadata.searchKeywords = {
  brands: ['AOC', 'ASUS', 'DT'],
  business: ['三防平板', '云台相机', '工业主板'],
  models: ['DT312', 'TAB-R10', 'AX20'],
  params: ['10.1寸', '1920x1080', '4G', '6800mAh'],
};

for (const category of catalog.categories) {
  Object.assign(category, categoryMap[category.slug] || {});
}

for (const brand of catalog.brands) {
  Object.assign(brand, brandMap[brand.slug] || {});
}

for (const company of catalog.companies) {
  Object.assign(company, companyMap[company.slug] || {});
}

for (const series of catalog.series) {
  Object.assign(series, seriesMap[series.seriesCode] || {});

  for (const variant of series.variants) {
    const next = variantMap[variant.modelCode];
    if (!next) {
      continue;
    }

    variant.displayName = next.displayName;
    variant.summaryConfigText = next.summaryConfigText;
    variant.tags = next.tags;
    variant.specs = {
      ...variant.specs,
      ...next.specs,
    };
  }
}

for (const document of catalog.documents) {
  const next = documentMap[document.key];
  if (!next) {
    continue;
  }

  document.category =
    document.fileType === 'image'
      ? '产品图片'
      : document.fileType === 'spec'
        ? '规格书'
        : document.fileType === 'technical'
          ? '技术资料'
          : '报价附件';
  document.title = next.title;
  document.tags = next.tags;
}

for (const batch of catalog.quoteBatches) {
  const next = quoteBatchMap[batch.key];
  if (!next) {
    continue;
  }

  batch.batchTitle = next.batchTitle;
  batch.globalNote = next.globalNote;

  for (const line of batch.lines) {
    line.rowNote = next.line.rowNote;
    line.standardConfigText = next.line.standardConfigText;

    if (next.line.option && Array.isArray(line.options)) {
      for (const option of line.options) {
        option.optionName = next.line.option.optionName;
        option.description = next.line.option.description;
      }
    }
  }
}

for (const update of catalog.updates) {
  Object.assign(update, updateMap[update.key] || {});
}

fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Repaired ${catalogPath}`);
