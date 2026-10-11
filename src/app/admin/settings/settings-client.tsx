'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { resetSeedDataAction, updateSettingsAction } from '@/lib/actions';
import type { SiteSettings } from '@/lib/types';
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  SectionTitle,
  Textarea,
  ToastProvider,
  useToast,
} from '@/components/admin/ui';

const URL_PATTERN = /^https?:\/\/.+/i;

function SettingsInner({
  initialSettings,
  summary,
}: {
  initialSettings: SiteSettings;
  summary: { categoryCount: number; itemCount: number };
}) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState<SiteSettings>(initialSettings);
  const [errors, setErrors] = useState<{ siteName?: string; githubUrl?: string }>({});
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const dirty =
    form.siteName !== initialSettings.siteName ||
    form.siteSubtitle !== initialSettings.siteSubtitle ||
    form.siteDescription !== initialSettings.siteDescription ||
    form.footerText !== initialSettings.footerText ||
    form.icpText !== initialSettings.icpText ||
    form.githubUrl !== initialSettings.githubUrl;

  const handleSave = async () => {
    const nextErrors: { siteName?: string; githubUrl?: string } = {};

    if (!form.siteName.trim()) {
      nextErrors.siteName = '站点名称不能为空';
    }
    if (form.githubUrl.trim() && !URL_PATTERN.test(form.githubUrl.trim())) {
      nextErrors.githubUrl = 'GitHub 地址必须以 http:// 或 https:// 开头';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    const result = await updateSettingsAction({
      siteName: form.siteName.trim(),
      siteSubtitle: form.siteSubtitle.trim(),
      siteDescription: form.siteDescription.trim(),
      footerText: form.footerText.trim(),
      icpText: form.icpText.trim(),
      githubUrl: form.githubUrl.trim(),
    });
    setSaving(false);

    if (result.ok) {
      toast.push(result.message || '站点设置已保存', 'success');
      router.refresh();
    } else {
      toast.push(result.message || '保存失败，请重试', 'error');
    }
  };

  const handleReset = async () => {
    setResetting(true);
    const result = await resetSeedDataAction();
    setResetting(false);

    if (result.ok) {
      toast.push(result.message || '已恢复为种子数据', 'success');
      setResetOpen(false);
      router.refresh();
    } else {
      toast.push(result.message || '恢复失败，请重试', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <SectionTitle
          title="基础信息"
          description="站点名称与描述会用于页面标题、SEO 与页脚展示"
        />

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="站点名称" htmlFor="set-name" required error={errors.siteName}>
              <Input
                id="set-name"
                value={form.siteName}
                placeholder="例如：云梯导航"
                invalid={Boolean(errors.siteName)}
                onChange={(event) => update('siteName', event.target.value)}
              />
            </Field>

            <Field label="站点副标题" htmlFor="set-subtitle" hint="显示在站点名称下方">
              <Input
                id="set-subtitle"
                value={form.siteSubtitle}
                placeholder="优质资源一站直达"
                onChange={(event) => update('siteSubtitle', event.target.value)}
              />
            </Field>
          </div>

          <Field label="站点描述" htmlFor="set-desc" hint="用于 SEO description，建议 60–160 字">
            <Textarea
              id="set-desc"
              value={form.siteDescription}
              placeholder="一个美观、快速、可自定义的导航站点。"
              onChange={(event) => update('siteDescription', event.target.value)}
            />
          </Field>

          <Field label="GitHub 仓库地址" htmlFor="set-github" error={errors.githubUrl} hint="留空则不显示">
            <Input
              id="set-github"
              value={form.githubUrl}
              placeholder="https://github.com/your/repo"
              inputMode="url"
              invalid={Boolean(errors.githubUrl)}
              onChange={(event) => update('githubUrl', event.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionTitle title="页脚与备案" description="展示在前台页面底部" />

        <div className="space-y-4">
          <Field label="页脚文案" htmlFor="set-footer">
            <Textarea
              id="set-footer"
              value={form.footerText}
              placeholder="© 2025 云梯导航 · 优质资源一站直达"
              onChange={(event) => update('footerText', event.target.value)}
            />
          </Field>

          <Field label="ICP 备案号" htmlFor="set-icp" hint="如京ICP备12345678号-1，留空则不显示">
            <Input
              id="set-icp"
              value={form.icpText}
              placeholder="京ICP备12345678号-1"
              onChange={(event) => update('icpText', event.target.value)}
            />
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
          <p className="text-xs text-muted">
            {dirty ? '有未保存的修改' : '所有修改已保存'}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setForm(initialSettings);
                setErrors({});
              }}
              disabled={!dirty || saving}
            >
              撤销修改
            </Button>
            <Button onClick={() => void handleSave()} loading={saving} disabled={!dirty}>
              {saving ? '保存中…' : '保存设置'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-rose-500/25 p-5 sm:p-6">
        <SectionTitle
          title="危险操作"
          description="恢复种子数据会覆盖当前全部分类与链接，且不可撤销"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            当前共有 <strong className="text-[color:var(--fg)]">{summary.categoryCount}</strong> 个分类、
            <strong className="text-[color:var(--fg)]">{summary.itemCount}</strong> 条链接将被重置。
          </p>
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            恢复种子数据
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={resetOpen}
        title="确认恢复种子数据？"
        description={
          <>
            <p>
              当前的 <strong className="text-rose-500">{summary.categoryCount}</strong> 个分类与{' '}
              <strong className="text-rose-500">{summary.itemCount}</strong> 条链接将被示例数据覆盖。
            </p>
            <p className="mt-1.5">此操作无法撤销，请确认后再继续。</p>
          </>
        }
        confirmText="确认恢复"
        loading={resetting}
        onCancel={() => setResetOpen(false)}
        onConfirm={() => void handleReset()}
      />
    </div>
  );
}

export default function SettingsClient(props: {
  initialSettings: SiteSettings;
  summary: { categoryCount: number; itemCount: number };
}) {
  return (
    <ToastProvider>
      <SettingsInner {...props} />
    </ToastProvider>
  );
}
