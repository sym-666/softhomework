import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { useIntl } from 'react-intl';
import { LogoMark } from '@/components/brand/LogoMark';

const FEATURES = ['chat', 'guide', 'highlight', 'review'] as const;

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

/** 示意用的论文页面：原文摘自 Attention Is All You Need 第 3.2.2 节（高亮句在第 5 页） */
function PrintedPage() {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  return (
    <div className="relative mt-8 max-w-[540px]">
      <div className="relative -rotate-1 border border-[var(--rule)] bg-[var(--paper-card)] px-8 pb-8 pt-6 shadow-[0_18px_40px_-22px_rgba(31,42,68,0.55)]">
        <div className="flex items-center justify-between border-b border-[var(--rule)] pb-2 text-[10px] tracking-[0.2em] text-[var(--ink-soft)]">
          <span>ARXIV 1706.03762</span>
          <span className="font-serif tracking-normal">5</span>
        </div>
        <p className="mt-4 font-serif text-[15px] font-bold text-[var(--ink)]">
          3.2.2 Multi-Head Attention
        </p>
        <p className="mt-2 text-justify font-serif text-[13px] leading-[1.9] text-[#2c3445]">
          On each of these projected versions of queries, keys and values we
          then perform the attention function in parallel, yielding d
          <sub>v</sub>-dimensional output values. These are concatenated and
          once again projected, resulting in the final values, as depicted in
          Figure 2.{' '}
          <mark className="bg-[#f3d77a]/80 px-0.5 text-inherit [box-decoration-break:clone]">
            Multi-head attention allows the model to jointly attend to
            information from different representation subspaces at different
            positions.
          </mark>{' '}
          With a single attention head, averaging inhibits this.
        </p>
        <p className="mt-3 text-center font-serif text-[13px] italic text-[var(--ink)]">
          MultiHead(Q, K, V) = Concat(head<sub>1</sub>, …, head<sub>h</sub>)W
          <sup>O</sup>
        </p>
      </div>

      {/* 页边批注：划词提问的回答，带来源页 */}
      <div className="absolute -bottom-24 -right-28 w-64 rotate-[1.5deg] border-l-[3px] border-[var(--vermilion)] bg-[#fbf3df] px-4 py-3 shadow-[0_12px_28px_-16px_rgba(31,42,68,0.6)]">
        <p className="text-[11px] font-semibold text-[var(--vermilion)]">
          {t('auth.hero.preview.question')}
        </p>
        <p className="mt-1 font-serif text-[12.5px] leading-6 text-[var(--ink)]">
          {t('auth.hero.preview.answer')}
        </p>
        <span className="mt-1.5 inline-flex items-center gap-1 border border-[var(--ink)]/30 px-1.5 py-0.5 text-[10px] text-[var(--ink)]">
          <FileText className="h-3 w-3" />
          {t('auth.hero.preview.source')}
        </span>
      </div>
      <svg
        aria-hidden
        className="absolute -right-16 bottom-6 h-16 w-16 text-[var(--vermilion)]"
        viewBox="0 0 64 64"
        fill="none"
      >
        <path
          d="M4 6 C 30 10, 44 26, 46 54"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  );
}

/** 登录、注册页的布局：左侧以论文页面展示产品，右侧表单 */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });

  return (
    <div className="flex min-h-screen bg-[var(--paper)]">
      <aside className="paper-ruled relative hidden w-[56%] flex-col border-r border-[var(--rule)] lg:flex">
        <div className="flex flex-1 flex-col px-14 py-9">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-9 w-9" />
            <span className="font-serif text-xl font-bold text-[var(--ink)]">
              PaperPilot
            </span>
            <span className="ml-2 border-l border-[var(--rule)] pl-3 text-[11px] tracking-[0.25em] text-[var(--ink-soft)]">
              {t('auth.hero.tagline')}
            </span>
          </div>

          <div className="mt-9">
            <h1 className="font-serif text-[46px] font-bold leading-tight text-[var(--ink)]">
              {t('auth.hero.title')}
            </h1>
            <span
              aria-hidden
              className="mt-3 block h-[3px] w-16 bg-[var(--vermilion)]"
            />
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[var(--ink-soft)]">
              {t('auth.hero.subtitle')}
            </p>
          </div>

          <PrintedPage />

          <ol className="mt-28 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-4">
            {FEATURES.map((key, index) => (
              <li
                key={key}
                className="flex gap-3 border-t border-[var(--rule)] pt-3"
              >
                <span className="font-serif text-lg font-semibold leading-none text-[var(--vermilion)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[var(--ink)]">
                    {t(`auth.hero.feature.${key}.title`)}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--ink-soft)]">
                    {t(`auth.hero.feature.${key}.desc`)}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-auto pt-8 text-[11px] tracking-wider text-[var(--ink-soft)]">
            {t('auth.hero.footer')}
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <LogoMark className="h-8 w-8" />
            <span className="font-serif text-lg font-bold text-[var(--ink)]">
              PaperPilot
            </span>
          </div>
          <h2 className="font-serif text-[28px] font-bold text-[var(--ink)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{subtitle}</p>
          <div className="relative mt-8 border border-[var(--rule)] bg-[var(--paper-card)] p-6">
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-[var(--ink)]"
            />
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
