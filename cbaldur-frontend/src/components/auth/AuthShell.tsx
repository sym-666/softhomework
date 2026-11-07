import type { ReactNode } from 'react';
import {
  BookOpen,
  Brain,
  FileText,
  Highlighter,
  MessageSquareQuote,
  Repeat,
  Sparkles,
} from 'lucide-react';
import { useIntl } from 'react-intl';

const FEATURES = [
  { key: 'chat', icon: MessageSquareQuote },
  { key: 'guide', icon: Brain },
  { key: 'highlight', icon: Highlighter },
  { key: 'review', icon: Repeat },
] as const;

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** 登录、注册页的布局：左侧品牌介绍，右侧表单 */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="relative hidden w-[52%] overflow-hidden bg-linear-to-br from-[#0b1f4d] via-[#1d4ed8] to-[#0ea5e9] text-white lg:flex lg:flex-col">
        {/* 装饰：光斑和网格 */}
        <span
          aria-hidden
          className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-500/40 blur-3xl"
        />
        <span
          aria-hidden
          className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:44px_44px]"
        />

        <div className="relative flex flex-1 flex-col justify-between px-14 py-12">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-wide">
              PaperPilot
            </span>
            <span className="ml-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] text-white/90 ring-1 ring-white/25">
              {t('auth.hero.tagline')}
            </span>
          </div>

          <div className="max-w-xl">
            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              {t('auth.hero.title')}
            </h1>
            <p className="mt-4 text-[15px] leading-7 text-blue-50/90">
              {t('auth.hero.subtitle')}
            </p>

            <ul className="mt-8 grid grid-cols-2 gap-3">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="rounded-xl bg-white/10 p-3.5 ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15"
                >
                  <Icon className="mb-2 h-5 w-5 text-cyan-200" />
                  <p className="text-sm font-semibold">
                    {t(`auth.hero.feature.${key}.title`)}
                  </p>
                  <p className="mt-0.5 text-xs text-blue-100/80">
                    {t(`auth.hero.feature.${key}.desc`)}
                  </p>
                </li>
              ))}
            </ul>

            {/* 问答示例卡片 */}
            <div className="mt-8 rounded-2xl bg-white p-4 text-gray-800 shadow-2xl shadow-blue-950/40 ring-1 ring-white/40">
              <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                <span className="truncate">{t('auth.hero.preview.paper')}</span>
              </div>
              <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-linear-to-r from-blue-600 to-indigo-600 px-3.5 py-2 text-sm text-white">
                {t('auth.hero.preview.question')}
              </div>
              <div className="mt-2 flex gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-blue-600 text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3.5 py-2 text-sm leading-6">
                  {t('auth.hero.preview.answer')}
                  <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-blue-100 px-1.5 py-0.5 align-middle text-[11px] font-medium text-blue-700">
                    <FileText className="h-3 w-3" />
                    {t('auth.hero.preview.source')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-blue-100/70">{t('auth.hero.footer')}</p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-cyan-500 text-white">
              <BookOpen className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-gray-900">
              PaperPilot
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-8 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-slate-200/60">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
