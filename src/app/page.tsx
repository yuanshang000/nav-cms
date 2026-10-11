/**
 * 前台首页（Server Component）
 *
 * - 每次请求都从数据层读取最新数据（KV / 本地文件），保证后台改动即时生效；
 * - 仅负责取数与组装，交互全部下沉到客户端组件中。
 */

import Background from '@/components/background';
import NavApp from '@/components/nav-app';
import { getNavData } from '@/lib/store';

/** 强制动态渲染：数据每次请求都重新读取 */
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const data = await getNavData();

  return (
    <>
      <Background />
      <NavApp data={data} />
    </>
  );
}