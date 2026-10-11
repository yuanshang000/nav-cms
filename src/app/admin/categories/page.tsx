import type { Metadata } from 'next';

import { getNavData } from '@/lib/store';

import CategoriesClient from './categories-client';

export const metadata: Metadata = { title: '分类管理' };

export default async function AdminCategoriesPage() {
  const { categories, items } = await getNavData();

  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
  }

  return (
    <CategoriesClient
      initialCategories={categories.map((category) => ({
        ...category,
        itemCount: counts.get(category.id) ?? 0,
      }))}
    />
  );
}
