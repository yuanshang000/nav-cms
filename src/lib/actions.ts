'use server';

/**
 * 服务端 Action 包装层
 *
 * - 客户端组件 / 表单通过这些 action 触发写操作；
 * - 真正的数据读写逻辑在 `src/lib/store.ts`（服务端模块）；
 * - "use server" 文件只能导出 async 函数，因此这里不导出任何类型。
 */

import {
  createCategory as storeCreateCategory,
  createItem as storeCreateItem,
  deleteCategory as storeDeleteCategory,
  deleteItem as storeDeleteItem,
  getNavData,
  reorderCategories as storeReorderCategories,
  reorderItems as storeReorderItems,
  resetToSeedData as storeResetToSeedData,
  updateCategory as storeUpdateCategory,
  updateItem as storeUpdateItem,
  updateSettings as storeUpdateSettings,
} from './store';
import type { ActionResult, Category, NavData, NavItem, SiteSettings } from './types';

function ok(data: NavData, message: string): ActionResult {
  return { ok: true, message, data };
}

function fail(message: string): ActionResult {
  return { ok: false, message };
}

async function run(
  message: string,
  action: () => Promise<NavData>,
): Promise<ActionResult> {
  try {
    return ok(await action(), message);
  } catch (error) {
    console.error('[actions]', message, '失败：', error);
    return fail(error instanceof Error ? error.message : '操作失败，请稍后重试');
  }
}

/* ------------------------------ 读取（Server Action） ------------------------------ */

/** 服务端读取完整数据（供 Server Component 或需要 refresh 的场景使用） */
export async function fetchNavDataAction(): Promise<ActionResult> {
  return run('数据获取成功', () => getNavData());
}

/* ------------------------------------ 分类 ------------------------------------ */

/** 新增分类 */
export async function createCategoryAction(
  input: Omit<Category, 'id' | 'createdAt' | 'order'> & { order?: number },
): Promise<ActionResult> {
  return run(`分类「${input.name}」已创建`, () => storeCreateCategory(input));
}

/** 更新分类 */
export async function updateCategoryAction(
  id: string,
  patch: Partial<Omit<Category, 'id' | 'createdAt'>>,
): Promise<ActionResult> {
  return run('分类已更新', () => storeUpdateCategory(id, patch));
}

/** 删除分类（同时删除其下条目） */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  return run('分类及其下条目已删除', () => storeDeleteCategory(id));
}

/** 重排分类 */
export async function reorderCategoriesAction(ids: string[]): Promise<ActionResult> {
  return run('分类顺序已更新', () => storeReorderCategories(ids));
}

/* ------------------------------------ 条目 ------------------------------------ */

/** 新增条目 */
export async function createItemAction(
  input: Omit<NavItem, 'id' | 'createdAt' | 'order'> & { order?: number },
): Promise<ActionResult> {
  return run(`站点「${input.title}」已创建`, () => storeCreateItem(input));
}

/** 更新条目 */
export async function updateItemAction(
  id: string,
  patch: Partial<Omit<NavItem, 'id' | 'createdAt'>>,
): Promise<ActionResult> {
  return run('站点已更新', () => storeUpdateItem(id, patch));
}

/** 删除条目 */
export async function deleteItemAction(id: string): Promise<ActionResult> {
  return run('站点已删除', () => storeDeleteItem(id));
}

/** 重排条目 */
export async function reorderItemsAction(ids: string[]): Promise<ActionResult> {
  return run('站点顺序已更新', () => storeReorderItems(ids));
}

/* ----------------------------------- 站点设置 ----------------------------------- */

/** 更新站点设置 */
export async function updateSettingsAction(
  patch: Partial<SiteSettings>,
): Promise<ActionResult> {
  return run('站点设置已保存', () => storeUpdateSettings(patch));
}

/** 重置为种子数据 */
export async function resetSeedDataAction(): Promise<ActionResult> {
  return run('已恢复为种子数据', () => storeResetToSeedData());
}
