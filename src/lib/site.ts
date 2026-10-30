/**
 * 站点级静态配置。
 * 这里只放可公开的展示信息，不包含任何密钥或运行时服务配置。
 */

export const SITE = {
  name: '衡远研究',
  shortName: '衡远',
  english: 'HENGYUAN RESEARCH',
  tagline: '在噪声之外，建立自己的资产坐标。',
  description:
    '衡远研究是一份关注资产配置、行业研究与组合纪律的独立研究笔记。用可验证的框架，把宏观判断翻译成可执行的投资决策。',
  locale: 'zh-CN',
  // 仅用于页面展示的演示联系地址，不接收真实邮件。
  demoEmail: 'hello@hengyuan-research.example.com',
} as const;

export const AUTHOR = {
  name: '林知远',
  latin: 'LIN ZHIYUAN',
  role: '创始人 · 主笔',
  credential: 'CFA',
  experience: '12 年买方研究经验',
  shortBio:
    '长期跟踪多资产配置、科技与高端制造产业。相信研究的意义，不是预测每一次波动，而是为不确定性准备可执行的坐标。',
  longBio:
    '曾任职于公募基金与家族办公室，负责多资产配置与科技行业研究。研究覆盖宏观周期、行业比较、公司质量与组合风险预算，持续为个人投资者提供去营销化的研究框架。',
} as const;

export const NAV_ITEMS = [
  { label: '首页', href: '/' },
  { label: '研究', href: '/research/' },
  { label: '工具', href: '/tools/' },
  { label: '关于', href: '/about/' },
  { label: '收藏', href: '/favorites/' },
] as const;

export const CATEGORY_NAMES = [
  '资产配置',
  '行业研究',
  '大类资产',
  '组合管理',
  '研究方法',
  '宏观策略',
] as const;

export type CategoryName = (typeof CATEGORY_NAMES)[number];

export const CATEGORIES: ReadonlyArray<{
  name: CategoryName;
  en: string;
  description: string;
}> = [
  {
    name: '资产配置',
    en: 'Asset Allocation',
    description: '把宏观判断翻译成比例、节奏与再平衡纪律。',
  },
  {
    name: '行业研究',
    en: 'Industry Research',
    description: '从产业链位置、竞争格局走向现金流验证。',
  },
  {
    name: '大类资产',
    en: 'Multi-Asset',
    description: '股票、债券、黄金与现金的相对定价。',
  },
  {
    name: '组合管理',
    en: 'Portfolio',
    description: '风险预算、回撤控制与行为偏差管理。',
  },
  {
    name: '研究方法',
    en: 'Methodology',
    description: '可复用的分析框架，以及诚实的证伪清单。',
  },
  {
    name: '宏观策略',
    en: 'Macro Strategy',
    description: '利率、美元、流动性与政策周期的坐标系。',
  },
];

export function getCategoryMeta(name: CategoryName) {
  return CATEGORIES.find((category) => category.name === name) ?? CATEGORIES[0];
}

export const INTEREST_OPTIONS = [
  { value: '资产配置', label: '资产配置', hint: '长期组合与再平衡' },
  { value: '行业研究', label: '行业研究', hint: '产业链与公司基本面' },
  { value: '宏观策略', label: '宏观策略', hint: '利率、美元与周期' },
  { value: '组合管理', label: '组合管理', hint: '风险预算与回撤' },
  { value: '研究方法', label: '研究方法', hint: '分析框架与工具' },
] as const;

export const HOME_FRAMEWORKS = [
  {
    index: '01',
    title: '先看约束，再看观点',
    en: 'Constraints first',
    description:
      '期限、现金流与最大可承受回撤，决定了一个组合能承担什么。先定义不能输的部分，再讨论值得争取的收益。',
  },
  {
    index: '02',
    title: '用赔率校准胜率',
    en: 'Odds over forecasts',
    description:
      '宏观预测经常正确但不可交易。把判断拆成估值、基本面与情绪三个维度，用赔率而不是确信度决定仓位。',
  },
  {
    index: '03',
    title: '让产业数据说话',
    en: 'Evidence chain',
    description:
      '从订单、库存、价格到资本开支，建立可以被跟踪的证据链。叙事可以解释价格，只有现金流能够验证叙事。',
  },
  {
    index: '04',
    title: '把纪律写进组合',
    en: 'Rules in action',
    description:
      '再平衡阈值、单一资产上限与复盘频率，应该在情绪之外被提前写定。纪律不是限制，而是对判断失误的保险。',
  },
] as const;
