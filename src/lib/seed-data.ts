import type { Category, NavItem, SiteSettings } from './types';

/**
 * 种子数据：KV 与本地 data/store.json 均不存在时写入
 * 所有 createdAt 使用固定基准时间，保证种子数据可复现。
 */

const BASE_TIME = 1_700_000_000_000;

/** 默认站点设置 */
export const defaultSettings: SiteSettings = {
  siteName: '云梯导航',
  siteSubtitle: '发现好用的工具与资源',
  siteDescription:
    '一个简洁高效的私人导航站，收录常用工具、设计资源、开发技术与 AI 应用，快速抵达你常用的网站。',
  footerText: '© 2026 云梯导航 · 用心整理每一个链接',
  icpText: '京ICP备2026000000号',
  githubUrl: 'https://github.com/vercel/next.js',
};

/** 种子分类（约 6 个） */
export const seedCategories: Category[] = [
  {
    id: 'cat-tools',
    name: '常用工具',
    slug: 'tools',
    description: '日常高频使用的在线小工具与实用服务',
    icon: '🧰',
    color: '#6366f1',
    order: 1,
    createdAt: BASE_TIME,
  },
  {
    id: 'cat-design',
    name: '设计资源',
    slug: 'design',
    description: 'UI 设计、配色、图标与灵感素材库',
    icon: '🎨',
    color: '#ec4899',
    order: 2,
    createdAt: BASE_TIME + 1,
  },
  {
    id: 'cat-dev',
    name: '开发技术',
    slug: 'dev',
    description: '代码托管、框架文档与部署平台',
    icon: '💻',
    color: '#10b981',
    order: 3,
    createdAt: BASE_TIME + 2,
  },
  {
    id: 'cat-ai',
    name: 'AI 工具',
    slug: 'ai',
    description: '大语言模型、AI 编程与内容创作助手',
    icon: '🤖',
    color: '#f59e0b',
    order: 4,
    createdAt: BASE_TIME + 3,
  },
  {
    id: 'cat-office',
    name: '效率办公',
    slug: 'office',
    description: '笔记、协作、文档与自动化工作流',
    icon: '📋',
    color: '#0ea5e9',
    order: 5,
    createdAt: BASE_TIME + 4,
  },
  {
    id: 'cat-media',
    name: '影音娱乐',
    slug: 'media',
    description: '音乐、影视、播客与图像处理平台',
    icon: '🎧',
    color: '#ef4444',
    order: 6,
    createdAt: BASE_TIME + 5,
  },
];

/** 种子条目（约 18 条） */
export const seedItems: NavItem[] = [
  // 常用工具
  {
    id: 'item-google',
    title: 'Google',
    description: '全球最主流的搜索引擎，资料检索的起点',
    url: 'https://www.google.com',
    icon: '🔍',
    categoryId: 'cat-tools',
    tags: ['搜索', '引擎'],
    order: 1,
    createdAt: BASE_TIME,
  },
  {
    id: 'item-baidu',
    title: '百度',
    description: '中文内容覆盖广泛的搜索引擎',
    url: 'https://www.baidu.com',
    icon: '🐻',
    categoryId: 'cat-tools',
    tags: ['搜索', '中文'],
    order: 2,
    createdAt: BASE_TIME + 1,
  },
  {
    id: 'item-translate',
    title: 'DeepL 翻译',
    description: '高质量的多语言翻译与文档翻译服务',
    url: 'https://www.deepl.com',
    icon: '🌐',
    categoryId: 'cat-tools',
    tags: ['翻译', '语言'],
    order: 3,
    createdAt: BASE_TIME + 2,
  },

  // 设计资源
  {
    id: 'item-figma',
    title: 'Figma',
    description: '浏览器端协作式界面设计工具',
    url: 'https://www.figma.com',
    icon: '🎯',
    categoryId: 'cat-design',
    tags: ['UI', '原型'],
    order: 1,
    createdAt: BASE_TIME + 10,
  },
  {
    id: 'item-coolors',
    title: 'Coolors',
    description: '快速生成配色方案的在线调色板工具',
    url: 'https://coolors.co',
    icon: '🌈',
    categoryId: 'cat-design',
    tags: ['配色', '灵感'],
    order: 3,
    createdAt: BASE_TIME + 12,
  },
  {
    id: 'item-iconify',
    title: 'Iconify',
    description: '上百套开源图标库的统一搜索与 API',
    url: 'https://icon-sets.iconify.design',
    icon: '🔣',
    categoryId: 'cat-design',
    tags: ['图标', '开源'],
    order: 4,
    createdAt: BASE_TIME + 13,
  },

  // 开发技术
  {
    id: 'item-github',
    title: 'GitHub',
    description: '全球最大的代码托管与开源协作平台',
    url: 'https://github.com',
    icon: '🐙',
    categoryId: 'cat-dev',
    tags: ['Git', '开源'],
    order: 1,
    createdAt: BASE_TIME + 20,
  },
  {
    id: 'item-vercel',
    title: 'Vercel',
    description: '面向前端框架的快速部署与边缘托管平台',
    url: 'https://vercel.com',
    icon: '▲',
    categoryId: 'cat-dev',
    tags: ['部署', 'Serverless'],
    order: 2,
    createdAt: BASE_TIME + 21,
  },
  {
    id: 'item-mdn',
    title: 'MDN Web Docs',
    description: 'Web 平台权威文档与兼容性查询手册',
    url: 'https://developer.mozilla.org',
    icon: '📚',
    categoryId: 'cat-dev',
    tags: ['文档', 'Web'],
    order: 3,
    createdAt: BASE_TIME + 22,
  },
  {
    id: 'item-stackoverflow',
    title: 'Stack Overflow',
    description: '程序员问答与问题排查的最佳去处',
    url: 'https://stackoverflow.com',
    icon: '🥅',
    categoryId: 'cat-dev',
    tags: ['问答', '社区'],
    order: 4,
    createdAt: BASE_TIME + 23,
  },

  // AI 工具
  {
    id: 'item-chatgpt',
    title: 'ChatGPT',
    description: 'OpenAI 推出的通用对话式 AI 助手',
    url: 'https://chat.openai.com',
    icon: '🗣️',
    categoryId: 'cat-ai',
    tags: ['对话', '大模型'],
    order: 1,
    createdAt: BASE_TIME + 30,
  },
  {
    id: 'item-claude',
    title: 'Claude',
    description: 'Anthropic 的大模型对话与文档分析助手',
    url: 'https://claude.ai',
    icon: '🧠',
    categoryId: 'cat-ai',
    tags: ['对话', '长文本'],
    order: 2,
    createdAt: BASE_TIME + 31,
  },
  {
    id: 'item-huggingface',
    title: 'Hugging Face',
    description: '开源模型、数据集与机器学习社区',
    url: 'https://huggingface.co',
    icon: '🤗',
    categoryId: 'cat-ai',
    tags: ['开源模型', '数据集'],
    order: 3,
    createdAt: BASE_TIME + 32,
  },

  // 效率办公
  {
    id: 'item-notion',
    title: 'Notion',
    description: '集笔记、文档、知识库与项目管理于一体',
    url: 'https://www.notion.so',
    icon: '📓',
    categoryId: 'cat-office',
    tags: ['笔记', '协作'],
    order: 1,
    createdAt: BASE_TIME + 40,
  },
  {
    id: 'item-trello',
    title: 'Trello',
    description: '看板式项目管理，清晰追踪任务进展',
    url: 'https://trello.com',
    icon: '🗂️',
    categoryId: 'cat-office',
    tags: ['看板', '协作'],
    order: 2,
    createdAt: BASE_TIME + 41,
  },

  // 影音娱乐
  {
    id: 'item-youtube',
    title: 'YouTube',
    description: '全球最大的视频分享与学习平台',
    url: 'https://www.youtube.com',
    icon: '▶️',
    categoryId: 'cat-media',
    tags: ['视频', '学习'],
    order: 1,
    createdAt: BASE_TIME + 50,
  },
  {
    id: 'item-spotify',
    title: 'Spotify',
    description: '个性化音乐推荐与在线音乐播放',
    url: 'https://www.spotify.com',
    icon: '🎵',
    categoryId: 'cat-media',
    tags: ['音乐', '播客'],
    order: 2,
    createdAt: BASE_TIME + 51,
  },
  {
    id: 'item-bilibili',
    title: '哔哩哔哩',
    description: '综合视频社区，番剧、知识与生活内容丰富',
    url: 'https://www.bilibili.com',
    icon: '📺',
    categoryId: 'cat-media',
    tags: ['视频', '社区'],
    order: 3,
    createdAt: BASE_TIME + 52,
  },
];

/** 深拷贝种子数据，避免直接修改常量导致内存污染 */
export function getSeedData(): { categories: Category[]; items: NavItem[] } {
  return {
    categories: seedCategories.map((category) => ({ ...category })),
    items: seedItems.map((item) => ({ ...item, tags: [...item.tags] })),
  };
}
