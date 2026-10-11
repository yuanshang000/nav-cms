/**
 * 全站数据类型定义
 * 该文件为纯类型模块，可被客户端组件安全引用（不包含任何服务端逻辑）。
 */

/** 导航分类 */
export interface Category {
  /** 唯一 ID */
  id: string;
  /** 分类名称 */
  name: string;
  /** URL slug（英文短横线格式） */
  slug: string;
  /** 分类描述 */
  description: string;
  /** 图标（emoji） */
  icon: string;
  /** 主题色（hex 或 tailwind 类名） */
  color: string;
  /** 排序值，越小越靠前 */
  order: number;
  /** 创建时间戳（毫秒） */
  createdAt: number;
}

/** 导航条目（网站链接） */
export interface NavItem {
  /** 唯一 ID */
  id: string;
  /** 站点标题 */
  title: string;
  /** 站点描述 */
  description: string;
  /** 站点链接 */
  url: string;
  /** 图标（emoji） */
  icon: string;
  /** 所属分类 ID */
  categoryId: string;
  /** 标签 */
  tags: string[];
  /** 排序值，越小越靠前 */
  order: number;
  /** 创建时间戳（毫秒） */
  createdAt: number;
}

/** 站点设置 */
export interface SiteSettings {
  /** 站点名称 */
  siteName: string;
  /** 站点副标题 */
  siteSubtitle: string;
  /** 站点描述（SEO） */
  siteDescription: string;
  /** 页脚文案 */
  footerText: string;
  /** ICP 备案号文案 */
  icpText: string;
  /** GitHub 仓库地址 */
  githubUrl: string;
}

/** 完整导航数据 */
export interface NavData {
  settings: SiteSettings;
  categories: Category[];
  items: NavItem[];
}

/** 创建分类时的输入（不含自动生成字段） */
export type CategoryInput = Omit<Category, 'id' | 'order' | 'createdAt'> & {
  order?: number;
};

/** 创建条目时的输入（不含自动生成字段） */
export type NavItemInput = Omit<NavItem, 'id' | 'order' | 'createdAt'> & {
  order?: number;
};

/** 服务端 Action 的统一返回结构 */
export interface ActionResult {
  /** 是否成功 */
  ok: boolean;
  /** 提示信息 */
  message: string;
  /** 操作后的最新数据（可选） */
  data?: NavData;
}

/** 登录表单的 Server Action 返回状态 */
export interface LoginState {
  /** 是否发生错误 */
  error: string | null;
  /** 提交后输入的密码（回显用，保持用户输入体验） */
  password?: string;
}
