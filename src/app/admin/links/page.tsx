import type { Metadata } from 'next';

import { getNavData } from '@/lib/store';

import LinksClient from './links-client';

export const metadata: Metadata = { title: '链接管理' };

export default async function AdminLinksPage() {
  const { categories, items } = await getNavData();

  return (
    <LinksClient
      categories={categories.map((category) => ({
        id: category.id,
        name: category.name,
        color: category.color,
        icon: category.icon,
      }))}
      initialItems={items.map((item) => ({ ...item }))}
    />
  );
}
