import type { Metadata } from 'next';

import { getNavData } from '@/lib/store';

import SettingsClient from './settings-client';

export const metadata: Metadata = { title: '站点设置' };

export default async function AdminSettingsPage() {
  const { settings, categories, items } = await getNavData();

  return (
    <SettingsClient
      initialSettings={settings}
      summary={{
        categoryCount: categories.length,
        itemCount: items.length,
      }}
    />
  );
}
