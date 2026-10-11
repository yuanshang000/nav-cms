/**
 * 数据访问层（Data Access Layer）
 *
 * 说明：
 * - 本模块只在服务端运行（Node.js / Server Action / Server Component 中调用），
 *   依赖 `node:fs/promises`、`next/cache`，因此不可在客户端组件中直接 import。
 *   这里用文件顶部注释声明其服务端属性，而不引入 `server-only` 包，避免缺少依赖。
 * - 需要在客户端 / 表单中调用的写操作，统一放在 `src/lib/actions.ts`（标记 "use server"）。
 *
 * 存储策略：
 * 1. 优先使用 Vercel KV / Upstash Redis REST API（KV_REST_API_URL + KV_REST_API_TOKEN）。
 * 2. 未配置 KV 时，降级读写项目根目录 data/store.json（本地开发用）。
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { revalidatePath } from 'next/cache';

import { defaultSettings, getSeedData } from './seed-data';
import type { Category, NavData, NavItem, SiteSettings } from './types';

/* -------------------------------------------------------------------------- */
/*                                   常量配置                                   */
/* -------------------------------------------------------------------------- */

const KV_KEY = 'nav-data:data';

/** 本地文件存储路径：项目根目录 data/store.json */
const LOCAL_STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

/** KV REST 接口返回结构 */
interface KvRestResponse {
  result?: unknown;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/*                              存储层底层读写                                 */
/* -------------------------------------------------------------------------- */

function getKvConfig(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL?.trim();
  const token = process.env.KV_REST_API_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  return { url: url.replace(/\/+$/, ''), token };
}

/** 是否已配置 KV（KV 优先） */
export function isKvEnabled(): boolean {
  return getKvConfig() !== null;
}

/** 从 KV 读取原始字符串，读取失败或无数据时返回 null */
async function kvGetRaw(): Promise<string | null> {
  const config = getKvConfig();
  if (!config) {
    return null;
  }

  try {
    const response = await fetch(`${config.url}/get/${encodeURIComponent(KV_KEY)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[store] KV GET 失败：HTTP ${response.status}`);
      return null;
    }

    const payload = (await response.json()) as KvRestResponse;
    const result = payload?.result;

    if (typeof result === 'string' && result.length > 0) {
      return result;
    }

    return null;
  } catch (error) {
    console.error('[store] KV GET 异常：', error);
    return null;
  }
}

/** 写入 KV，失败时返回 false */
async function kvSetRaw(value: string): Promise<boolean> {
  const config = getKvConfig();
  if (!config) {
    return false;
  }

  try {
    const response = await fetch(
      `${config.url}/set/${encodeURIComponent(KV_KEY)}/${encodeURIComponent(value)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      console.error(`[store] KV SET 失败：HTTP ${response.status}`);
      return false;
    }

    const payload = (await response.json()) as KvRestResponse;
    return payload?.result === 'OK' || payload?.error === undefined;
  } catch (error) {
    console.error('[store] KV SET 异常：', error);
    return false;
  }
}

/** 从本地 data/store.json 读取原始字符串 */
async function fileGetRaw(): Promise<string | null> {
  try {
    const content = await readFile(LOCAL_STORE_PATH, 'utf-8');
    return content.length > 0 ? content : null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') {
      return null;
    }
    console.error('[store] 读取本地存储失败：', error);
    return null;
  }
}

/**
 * 写入本地 data/store.json（自动 mkdir）
 *
 * 注意：Vercel 等 Serverless 环境的文件系统只读，写入会抛错。
 * 此时静默失败即可——读取端仍会回退到种子数据，站点可正常展示，
 * 只是后台的改动无法持久化（未配置 KV 时的预期行为）。
 */
async function fileSetRaw(value: string): Promise<boolean> {
  try {
    await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true });
    await writeFile(LOCAL_STORE_PATH, value, 'utf-8');
    return true;
  } catch (error) {
    console.warn(
      '[store] 本地存储写入失败（Serverless 环境只读属正常现象，若需持久化请配置 KV）：',
      error
    );
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/*                               数据校验与归一化                              */
/* -------------------------------------------------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 校验并归一化反序列化后的数据，非法时回退到种子数据 */
function normalizeNavData(raw: unknown): NavData | null {
  if (!isRecord(raw)) {
    return null;
  }

  const settingsRaw = isRecord(raw.settings) ? raw.settings : {};
  const categoriesRaw = Array.isArray(raw.categories) ? raw.categories : [];
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];

  const settings: SiteSettings = {
    siteName: String(settingsRaw.siteName ?? defaultSettings.siteName),
    siteSubtitle: String(settingsRaw.siteSubtitle ?? defaultSettings.siteSubtitle),
    siteDescription: String(settingsRaw.siteDescription ?? defaultSettings.siteDescription),
    footerText: String(settingsRaw.footerText ?? defaultSettings.footerText),
    icpText: String(settingsRaw.icpText ?? defaultSettings.icpText),
    githubUrl: String(settingsRaw.githubUrl ?? defaultSettings.githubUrl),
  };

  const categories: Category[] = categoriesRaw.filter(isRecord).map((category, index) => ({
    id: String(category.id ?? `cat-${index}`),
    name: String(category.name ?? '未命名分类'),
    slug: String(category.slug ?? `category-${index}`),
    description: String(category.description ?? ''),
    icon: String(category.icon ?? '📁'),
    color: String(category.color ?? '#6366f1'),
    order: Number.isFinite(Number(category.order)) ? Number(category.order) : index + 1,
    createdAt: Number.isFinite(Number(category.createdAt))
      ? Number(category.createdAt)
      : Date.now(),
  }));

  const items: NavItem[] = itemsRaw.filter(isRecord).map((item, index) => ({
    id: String(item.id ?? `item-${index}`),
    title: String(item.title ?? '未命名站点'),
    description: String(item.description ?? ''),
    url: String(item.url ?? 'https://example.com'),
    icon: String(item.icon ?? '🔗'),
    categoryId: String(item.categoryId ?? ''),
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [],
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index + 1,
    createdAt: Number.isFinite(Number(item.createdAt)) ? Number(item.createdAt) : Date.now(),
  }));

  return { settings, categories, items };
}

/** 生成一份全新的种子数据 */
function buildSeedData(): NavData {
  const { categories, items } = getSeedData();
  return { settings: { ...defaultSettings }, categories, items };
}

/** 按 order 升序排序（order 相同时保持原顺序稳定） */
function sortByOrder<T extends { order: number }>(list: T[]): T[] {
  return list
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => a.entry.order - b.entry.order || a.index - b.index)
    .map((wrapped) => wrapped.entry);
}

/* -------------------------------------------------------------------------- */
/*                              缓存刷新与写操作                               */
/* -------------------------------------------------------------------------- */

/** 写操作后刷新前台与后台的整棵路由缓存 */
export function revalidateApp(): void {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/admin', 'layout');
  } catch (error) {
    // 在非请求上下文（如脚本）中调用时忽略
    console.warn('[store] revalidatePath 调用被跳过：', error);
  }
}

/* -------------------------------------------------------------------------- */
/*                                基础读写接口                                 */
/* -------------------------------------------------------------------------- */

/** 读取完整导航数据（KV 优先，其次本地文件，最后种子数据） */
export async function getNavData(): Promise<NavData> {
  const raw = (await kvGetRaw()) ?? (await fileGetRaw());

  if (raw) {
    try {
      const parsed = normalizeNavData(JSON.parse(raw) as unknown);
      if (parsed) {
        parsed.categories = sortByOrder(parsed.categories);
        parsed.items = sortByOrder(parsed.items);
        return parsed;
      }
    } catch (error) {
      console.error('[store] 数据解析失败，回退到种子数据：', error);
    }
  }

  const seed = buildSeedData();
  await saveNavData(seed);
  return seed;
}

/** 保存完整导航数据 */
export async function saveNavData(data: NavData): Promise<NavData> {
  const normalized: NavData = {
    settings: { ...defaultSettings, ...data.settings },
    categories: sortByOrder(data.categories ?? []).map((category) => ({ ...category })),
    items: sortByOrder(data.items ?? []).map((item) => ({
      ...item,
      tags: Array.isArray(item.tags) ? [...item.tags] : [],
    })),
  };

  const payload = JSON.stringify(normalized, null, 2);

  if (isKvEnabled()) {
    const ok = await kvSetRaw(payload);
    if (ok) {
      return normalized;
    }
    console.warn('[store] KV 写入失败，本次降级写入本地文件');
  }

  const saved = await fileSetRaw(payload);
  if (!saved && !isKvEnabled()) {
    console.warn('[store] 当前环境无法持久化，数据仅在本次请求内有效');
  }

  return normalized;
}

/** 内部写操作：读取 -> 修改 -> 保存 -> 刷新缓存 */
async function mutate(
  mutator: (data: NavData) => NavData | Promise<NavData>,
): Promise<NavData> {
  const current = await getNavData();
  const next = await mutator(current);
  const saved = await saveNavData(next);
  revalidateApp();
  return saved;
}

/* -------------------------------------------------------------------------- */
/*                                  分类操作                                   */
/* -------------------------------------------------------------------------- */

/** 新增分类时的输入类型（id / order / createdAt 可省略，将自动生成） */
export type CreateCategoryInput = Omit<Category, 'id' | 'order' | 'createdAt'> &
  Partial<Pick<Category, 'id' | 'order' | 'createdAt'>>;

/** 新增条目时的输入类型（id / order / createdAt 可省略，将自动生成） */
export type CreateItemInput = Omit<NavItem, 'id' | 'order' | 'createdAt'> &
  Partial<Pick<NavItem, 'id' | 'order' | 'createdAt'>>;

/** 新增分类 */
export async function createCategory(input: CreateCategoryInput): Promise<NavData> {
  return mutate((data) => {
    const maxOrder = data.categories.reduce((max, item) => Math.max(max, item.order), 0);
    const category: Category = {
      id: input.id ?? crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      description: input.description,
      icon: input.icon,
      color: input.color,
      order: typeof input.order === 'number' ? input.order : maxOrder + 1,
      createdAt: input.createdAt ?? Date.now(),
    };
    return { ...data, categories: [...data.categories, category] };
  });
}

/** 更新分类 */
export async function updateCategory(
  id: string,
  patch: Partial<Omit<Category, 'id' | 'createdAt'>>,
): Promise<NavData> {
  return mutate((data) => ({
    ...data,
    categories: data.categories.map((category) =>
      category.id === id ? { ...category, ...patch, id: category.id } : category,
    ),
  }));
}

/** 删除分类（同时删除其下所有条目，并重排序号） */
export async function deleteCategory(id: string): Promise<NavData> {
  return mutate((data) => {
    const restCategories = data.categories.filter((category) => category.id !== id);
    const restItems = data.items.filter((item) => item.categoryId !== id);

    return {
      ...data,
      categories: sortByOrder(restCategories).map((category, index) => ({
        ...category,
        order: index + 1,
      })),
      items: sortByOrder(restItems).map((item, index) => ({ ...item, order: index + 1 })),
    };
  });
}

/** 按给定 id 顺序重排分类（order 从 1 递增） */
export async function reorderCategories(ids: string[]): Promise<NavData> {
  return mutate((data) => {
    const orderMap = new Map(ids.map((id, index) => [id, index + 1]));
    const categories = sortByOrder(
      data.categories.map((category) => ({
        ...category,
        order: orderMap.get(category.id) ?? category.order,
      })),
    ).map((category, index) => ({ ...category, order: index + 1 }));

    return { ...data, categories };
  });
}

/* -------------------------------------------------------------------------- */
/*                                  条目操作                                   */
/* -------------------------------------------------------------------------- */

/** 新增条目 */
export async function createItem(input: CreateItemInput): Promise<NavData> {
  return mutate((data) => {
    const sameCategory = data.items.filter((item) => item.categoryId === input.categoryId);
    const maxOrder = sameCategory.reduce((max, item) => Math.max(max, item.order), 0);
    const item: NavItem = {
      id: input.id ?? crypto.randomUUID(),
      title: input.title,
      description: input.description,
      url: input.url,
      icon: input.icon,
      categoryId: input.categoryId,
      tags: Array.isArray(input.tags) ? [...input.tags] : [],
      order: typeof input.order === 'number' ? input.order : maxOrder + 1,
      createdAt: input.createdAt ?? Date.now(),
    };
    return { ...data, items: [...data.items, item] };
  });
}

/** 更新条目 */
export async function updateItem(
  id: string,
  patch: Partial<Omit<NavItem, 'id' | 'createdAt'>>,
): Promise<NavData> {
  return mutate((data) => ({
    ...data,
    items: data.items.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return {
        ...item,
        ...patch,
        id: item.id,
        tags: patch.tags ? [...patch.tags] : item.tags,
      };
    }),
  }));
}

/** 删除条目并重排同分类内的 order */
export async function deleteItem(id: string): Promise<NavData> {
  return mutate((data) => {
    const target = data.items.find((item) => item.id === id);
    const restItems = data.items.filter((item) => item.id !== id);

    if (!target) {
      return { ...data, items: restItems };
    }

    const sameCategory = sortByOrder(restItems.filter((item) => item.categoryId === target.categoryId));
    const orderMap = new Map(sameCategory.map((item, index) => [item.id, index + 1]));

    const items = sortByOrder(
      restItems.map((item) =>
        orderMap.has(item.id) ? { ...item, order: orderMap.get(item.id) as number } : item,
      ),
    );

    return { ...data, items };
  });
}

/** 按给定 id 顺序重排条目 */
export async function reorderItems(ids: string[]): Promise<NavData> {
  return mutate((data) => {
    const orderMap = new Map(ids.map((id, index) => [id, index + 1]));
    const items = sortByOrder(
      data.items.map((item) => ({
        ...item,
        order: orderMap.get(item.id) ?? item.order,
      })),
    ).map((item, index) => ({ ...item, order: index + 1 }));

    return { ...data, items };
  });
}

/* -------------------------------------------------------------------------- */
/*                                  站点设置                                   */
/* -------------------------------------------------------------------------- */

/** 更新站点设置 */
export async function updateSettings(patch: Partial<SiteSettings>): Promise<NavData> {
  return mutate((data) => ({
    ...data,
    settings: { ...defaultSettings, ...data.settings, ...patch },
  }));
}

/** 重置为种子数据（会覆盖全部内容） */
export async function resetToSeedData(): Promise<NavData> {
  const seed = buildSeedData();
  const saved = await saveNavData(seed);
  revalidateApp();
  return saved;
}
