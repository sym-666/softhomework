import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { FileText, GitCompareArrows, Info, Search, X } from 'lucide-react';
import { useIntl } from 'react-intl';
import { PageHeader } from '@/components/common/PageHeader';
import AiChatPanel from '@/components/ai/AiChatPanel';
import { useAiChatStream } from '@/hooks/useAiChatStream';
import { useGetAiStatusQuery } from '@/redux/api/ai';
import { useGetPapersQuery } from '@/redux/api/paper';
import { Input } from '@/shadcn/components/ui/input';
import type { AiChatItem, AiChatMessage } from '@/types/Ai';
import type { Paper } from '@/types/paper';
import { selectComparedSources } from '@/utils/citations';

const MIN_PAPERS = 2;
const MAX_PAPERS = 4;
const PAGE_SIZE = 50;
const SHORTCUTS = ['method', 'result', 'difference'];

const isIngesting = (paper: Paper) =>
  paper.ingestStatus === 'pending' || paper.ingestStatus === 'processing';

export default function ComparePage() {
  const intl = useIntl();
  const { data: status } = useGetAiStatusQuery();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Paper[]>([]);
  const { data: papers } = useGetPapersQuery({
    search: search || undefined,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const paperIds = selected.map((paper) => paper.id);
  const ready = paperIds.length >= MIN_PAPERS;

  const buildBody = useCallback(
    (message: string, history: AiChatMessage[]) => ({
      message,
      history,
      paperIds,
    }),
    [paperIds],
  );

  const chat = useAiChatStream({
    // 换论文后旧回答和编号都不再适用；URL 变化时 hook 会开启新会话
    url: `/api/Ai/Compare?papers=${paperIds.join(',')}`,
    buildBody,
    errorText: intl.formatMessage({ id: 'ai.error' }),
  });

  const shortcuts = useMemo(
    () =>
      SHORTCUTS.map((key) =>
        intl.formatMessage({ id: `compare.shortcut.${key}` }),
      ),
    [intl],
  );

  const toggle = (paper: Paper) => {
    setSelected((current) =>
      current.some((item) => item.id === paper.id)
        ? current.filter((item) => item.id !== paper.id)
        : [...current, paper],
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSearch(input.trim());
  };

  const renderExtras = (item: AiChatItem) => {
    // 流式过程中编号可能只输出了一半，结束后再显示
    if (item.streaming) return null;
    const sources = selectComparedSources(item.citations, item.content);
    if (sources.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
        <span>{intl.formatMessage({ id: 'ai.paper.sources' })}</span>
        {sources.map((source) => (
          <Link
            key={`${source.label}-${source.page}`}
            href={`/papers/${source.paperId}?page=${source.page}`}
            title={`${source.title}: ${source.snippet}`}
            className="inline-flex items-center gap-1 rounded-sm border border-gray-200 px-1.5 py-0.5 text-[var(--office-blue)] hover:border-[var(--office-blue)]"
          >
            <FileText className="h-3 w-3" />
            {source.label} ·{' '}
            {intl.formatMessage({ id: 'ai.paper.page' }, { page: source.page })}
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 lg:h-[calc(100vh-122px)]">
      <PageHeader
        icon={GitCompareArrows}
        tone="cyan"
        className="shrink-0"
        title={intl.formatMessage({ id: 'compare.title' })}
        subtitle={intl.formatMessage(
          { id: 'compare.subtitle' },
          { min: MIN_PAPERS, max: MAX_PAPERS },
        )}
      />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[360px_1fr]">
        <section className="flex min-h-[320px] flex-col border border-[var(--rule)] bg-[var(--paper-card)]">
          <form onSubmit={submit} className="relative shrink-0 p-2">
            <Search
              size={14}
              className="absolute left-4.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={intl.formatMessage({ id: 'papers.searchLocal' })}
              aria-label={intl.formatMessage({ id: 'papers.search' })}
              className="h-8 rounded-sm pl-8 text-xs"
            />
          </form>

          {selected.length > 0 && (
            <ul className="shrink-0 space-y-1 border-y border-gray-100 bg-blue-50/40 p-2">
              {selected.map((paper, index) => (
                <li
                  key={paper.id}
                  className="flex items-center gap-2 text-xs text-gray-700"
                >
                  <span className="shrink-0 font-semibold text-[var(--office-blue)]">
                    P{index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{paper.title}</span>
                  <button
                    type="button"
                    aria-label={intl.formatMessage({ id: 'compare.remove' })}
                    title={intl.formatMessage({ id: 'compare.remove' })}
                    onClick={() => toggle(paper)}
                    className="shrink-0 rounded-sm p-0.5 text-gray-400 hover:bg-white hover:text-gray-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <ul className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto">
            {papers?.items.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-400">
                {intl.formatMessage({ id: 'papers.empty' })}
              </li>
            )}
            {papers?.items.map((paper) => {
              const checked = paperIds.includes(paper.id);
              const disabled =
                isIngesting(paper) ||
                (!checked && paperIds.length >= MAX_PAPERS);
              return (
                <li key={paper.id}>
                  <label
                    className={`flex items-start gap-2 px-3 py-2 ${
                      disabled
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(paper)}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="line-clamp-2 text-xs font-medium text-gray-800">
                        {paper.title}
                      </span>
                      <span className="block truncate text-[11px] text-gray-500">
                        {paper.authors} · {paper.year}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="min-h-[420px] min-w-0">
          {status?.enabled === false ? (
            <p className="flex items-start gap-1.5 rounded-sm bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {intl.formatMessage({ id: 'ai.notConfigured' })}
            </p>
          ) : ready ? (
            <AiChatPanel
              title={intl.formatMessage({ id: 'compare.panelTitle' })}
              subtitle={intl.formatMessage(
                { id: 'compare.panelSubtitle' },
                { count: selected.length },
              )}
              emptyText={intl.formatMessage({ id: 'compare.empty' })}
              items={chat.items}
              isStreaming={chat.isStreaming}
              shortcuts={shortcuts}
              onSend={chat.send}
              onStop={chat.stop}
              onReset={chat.reset}
              renderExtras={renderExtras}
            />
          ) : (
            <div className="flex h-full items-center justify-center border border-[var(--rule)] bg-[var(--paper-card)] p-8 text-center text-sm text-gray-500">
              {intl.formatMessage(
                { id: 'compare.selectHint' },
                { min: MIN_PAPERS },
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
