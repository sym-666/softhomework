import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Globe2,
  Library,
  Loader2,
  Plus,
  Save,
  Search,
  Upload,
  User,
} from 'lucide-react';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { ExportLink } from '@/components/common/ExportLink';
import { PageHeader } from '@/components/common/PageHeader';
import { useSaveGlobalPaper } from '@/hooks/useSaveGlobalPaper';
import {
  useCreatePaperMutation,
  useGetPapersQuery,
  useLazySearchGlobalPapersQuery,
} from '@/redux/api/paper';
import type { GlobalPaper, Paper } from '@/types/paper';
import { TONES, toneFor } from '@/utils/palette';
import { Button } from '@/shadcn/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shadcn/components/ui/dialog';
import { Input } from '@/shadcn/components/ui/input';
import { Label } from '@/shadcn/components/ui/label';
import { Textarea } from '@/shadcn/components/ui/textarea';

type ViewMode = 'library' | 'global';

const currentYear = new Date().getFullYear();

const STATUS_STYLES: Record<Paper['ingestStatus'], string> = {
  ready: 'border-white/70 text-white',
  pending: 'border-[#f3d27a] text-[#f3d27a]',
  processing: 'border-[#f3d27a] text-[#f3d27a]',
  no_text: 'border-white/50 text-white/80',
  failed: 'border-[#ffb4a6] text-[#ffb4a6]',
  none: 'border-white/50 text-white/80',
};

/** 期刊封面风格的论文卡片 */
function PaperCard({ paper }: { paper: Paper }) {
  const intl = useIntl();
  const tone = TONES[toneFor(paper.tags[0] ?? paper.title)];
  const status = paper.ingestStatus === 'pending' ? 'processing' : paper.ingestStatus;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--ink)] hover:shadow-[0_10px_24px_-14px_rgba(31,42,68,0.6)]">
      <Link href={`/papers/${paper.id}`} className={`cover-hatch relative block h-28 overflow-hidden ${tone.solid}`}>
        {/* 封面内框 */}
        <span aria-hidden className="absolute inset-2.5 border border-white/35" />
        <span className="absolute left-5 top-4 text-[10px] tracking-[0.3em] text-white/80">{paper.tags[0] ?? 'PAPER'}</span>
        <span className="absolute bottom-3 left-5 font-serif text-[34px] font-bold leading-none text-white/95">{paper.year}</span>
        <span className={`absolute right-5 top-3.5 inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] tracking-wider ${STATUS_STYLES[paper.ingestStatus]}`}>
          {status === 'processing' ? <Loader2 size={10} className="animate-spin" /> : paper.hasLocalFile ? <FileText size={10} /> : <ExternalLink size={10} />}
          {intl.formatMessage({ id: `papers.status.${status}` })}
        </span>
        <BookOpen aria-hidden className="absolute bottom-3 right-5 h-7 w-7 text-white/30 transition-transform duration-300 group-hover:scale-110" />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 font-serif text-[15px] font-semibold leading-6 text-[var(--ink)] group-hover:underline group-hover:decoration-[var(--vermilion)] group-hover:underline-offset-4"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h2>
        <p className="mt-1.5 line-clamp-1 text-[11px] italic text-[var(--ink-soft)]">{paper.authors}</p>
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--ink-soft)]">{paper.abstract || intl.formatMessage({ id: 'papers.noAbstract' })}</p>
        {paper.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-3">
            {paper.tags.map((tag) => <span key={tag} className={`rounded-sm px-1.5 py-0.5 text-[10px] ${TONES[toneFor(tag)].soft}`}>{tag}</span>)}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--rule)] px-4 py-2.5 text-[11px] text-[var(--ink-soft)]">
        <span className="inline-flex items-center gap-1.5">
          <User size={12} />
          {paper.createdByUserName}
        </span>
        <Link href={`/papers/${paper.id}`} className="inline-flex items-center gap-1 font-medium text-[var(--vermilion)] hover:underline">
          <BookOpen size={12} />{intl.formatMessage({ id: 'papers.read' })}
        </Link>
      </div>
    </article>
  );
}

function GlobalPaperCard({ paper, onSave, saving }: { paper: GlobalPaper; onSave: () => void; saving: boolean }) {
  const intl = useIntl();
  const source = paper.pdfUrl || paper.url;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--ink)]">
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-[#2f6f73] text-[#2f6f73]"><Globe2 size={18} /></span>
          {paper.year && <span className="rounded-sm bg-gray-100 px-2 py-1 text-[11px] text-gray-600">{paper.year}</span>}
        </div>
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900 group-hover:text-indigo-600">{paper.title}</h2>
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500"><User size={12} className="mt-0.5 shrink-0" /><span className="line-clamp-2">{paper.authors}</span></div>
        <p className="mt-3 line-clamp-5 text-xs leading-5 text-gray-500">{paper.abstract || intl.formatMessage({ id: 'papers.noAbstract' })}</p>
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2">
        <button disabled={!source} onClick={() => source && window.open(source, '_blank', 'noopener,noreferrer')} className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline disabled:text-gray-300">
          <ExternalLink size={12} />{intl.formatMessage({ id: 'papers.source' })}
        </button>
        <Button size="sm" variant="outline" disabled={saving} onClick={onSave} className="h-7 rounded-sm text-[11px]">
          {saving ? <Loader2 className="animate-spin" /> : <Save />}{intl.formatMessage({ id: 'papers.save' })}
        </Button>
      </div>
    </article>
  );
}

export default function PapersPage() {
  const intl = useIntl();
  const [mode, setMode] = useState<ViewMode>('library');
  const [searchInput, setSearchInput] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', year: currentYear, abstract: '', tags: '', url: '' });
  const [file, setFile] = useState<File>();
  const local = useGetPapersQuery({ search: localSearch || undefined, page, pageSize: 24 });
  const [searchGlobal, global] = useLazySearchGlobalPapersQuery();
  const [createPaper, createState] = useCreatePaperMutation();
  const { save: saveGlobal, savingId } = useSaveGlobalPaper();
  const pages = Math.max(1, Math.ceil((local.data?.total ?? 0) / 24));

  const submitSearch = async (event: FormEvent) => {
    event.preventDefault();
    const value = searchInput.trim();
    if (mode === 'library') {
      setLocalSearch(value);
      setPage(1);
      return;
    }
    if (!value) return;
    try { await searchGlobal({ query: value, limit: 12 }).unwrap(); }
    catch { toast.error(intl.formatMessage({ id: 'papers.searchError' })); }
  };

  const submitUpload = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.authors.trim() || (!file && !form.url.trim())) {
      return toast.error(intl.formatMessage({ id: 'papers.validation' }));
    }
    if (file && file.size > 20 * 1024 * 1024) return toast.error(intl.formatMessage({ id: 'papers.fileTooLarge' }));
    try {
      await createPaper({ ...form, file }).unwrap();
      toast.success(intl.formatMessage({ id: 'papers.uploaded' }));
      setDialogOpen(false);
      setForm({ title: '', authors: '', year: currentYear, abstract: '', tags: '', url: '' });
      setFile(undefined);
      setMode('library');
    } catch (error) {
      // 文件校验失败等业务错误由后端给出具体原因
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast.error(message ?? intl.formatMessage({ id: 'papers.uploadError' }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <PageHeader
        icon={Library}
        title={intl.formatMessage({ id: 'papers.title' })}
        subtitle={<>{intl.formatMessage({ id: 'papers.subtitle' })}{local.data && <span className="ml-2 font-serif font-semibold text-[var(--vermilion)]">{intl.formatMessage({ id: 'papers.count' }, { count: local.data.total })}</span>}</>}
        className="mb-3"
        actions={<>
          <ExportLink href="/api/Papers/bibtex" label={intl.formatMessage({ id: 'export.bibtex' })} />
          <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-sm bg-[var(--ink)] text-white hover:bg-[#2b3a5e]"><Plus />{intl.formatMessage({ id: 'papers.upload' })}</Button>
        </>}
      />

      <div className="mb-3 flex flex-col gap-2 rounded-sm border border-[var(--rule)] bg-[var(--paper-card)] p-3 sm:flex-row sm:items-center">
        <div className="inline-flex h-8 shrink-0 rounded-sm border border-[var(--rule)] bg-[#f3eddf] p-0.5">
          <button onClick={() => { setMode('library'); setSearchInput(localSearch); }} className={`inline-flex items-center gap-1.5 rounded-sm px-3 text-xs ${mode === 'library' ? 'bg-[var(--paper-card)] font-medium text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]'}`}><BookOpen size={13} />{intl.formatMessage({ id: 'papers.library' })}</button>
          <button onClick={() => { setMode('global'); setSearchInput(''); }} className={`inline-flex items-center gap-1.5 rounded-sm px-3 text-xs ${mode === 'global' ? 'bg-[var(--paper-card)] font-medium text-[#2f6f73] shadow-sm' : 'text-[var(--ink-soft)]'}`}><Globe2 size={13} />{intl.formatMessage({ id: 'papers.global' })}</button>
        </div>
        <form onSubmit={submitSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={intl.formatMessage({ id: mode === 'library' ? 'papers.searchLocal' : 'papers.searchGlobal' })} className="h-8 rounded-sm pl-8 text-xs" /></div>
          <Button type="submit" size="sm" variant="outline" className="h-8 rounded-sm">{intl.formatMessage({ id: 'papers.search' })}</Button>
        </form>
      </div>

      {mode === 'library' ? (
        <>
          {local.isLoading && <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-gray-400"><Loader2 className="mx-auto mb-2 animate-spin" />{intl.formatMessage({ id: 'common.loading' })}</div>}
          {local.isError && <div className="border border-red-100 bg-white py-20 text-center text-sm text-red-500">{intl.formatMessage({ id: 'papers.loadError' })}</div>}
          {local.data?.items.length === 0 && <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'papers.empty' })}</div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{local.data?.items.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div>
          {pages > 1 && <div className="mt-3 flex items-center justify-center gap-3 border border-[var(--rule)] bg-[var(--paper-card)] p-2 text-xs"><button disabled={page <= 1} onClick={() => setPage((x) => x - 1)} className="disabled:opacity-30">{intl.formatMessage({ id: 'common.previous' })}</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage((x) => x + 1)} className="disabled:opacity-30">{intl.formatMessage({ id: 'common.next' })}</button></div>}
        </>
      ) : (
        <>
          {global.isFetching && <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-gray-400"><Loader2 className="mx-auto mb-2 animate-spin" />{intl.formatMessage({ id: 'papers.searching' })}</div>}
          {!global.isFetching && !global.data && <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center"><Globe2 className="mx-auto mb-3 text-gray-300" size={34} /><p className="text-sm text-gray-500">{intl.formatMessage({ id: 'papers.globalHint' })}</p></div>}
          {!global.isFetching && global.data?.papers.length === 0 && <div className="border border-[var(--rule)] bg-[var(--paper-card)] py-20 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'papers.empty' })}</div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{global.data?.papers.map((paper) => <GlobalPaperCard key={paper.id} paper={paper} saving={savingId === paper.id} onSave={() => saveGlobal(paper)} />)}</div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-sm sm:max-w-2xl">
          <DialogHeader><DialogTitle>{intl.formatMessage({ id: 'papers.uploadTitle' })}</DialogTitle><DialogDescription>{intl.formatMessage({ id: 'papers.uploadHelp' })}</DialogDescription></DialogHeader>
          <form onSubmit={submitUpload} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="paper-title">{intl.formatMessage({ id: 'papers.paperTitle' })}</Label><Input id="paper-title" maxLength={500} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div className="space-y-1.5"><Label htmlFor="paper-authors">{intl.formatMessage({ id: 'papers.authors' })}</Label><Input id="paper-authors" maxLength={1000} required value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="paper-year">{intl.formatMessage({ id: 'papers.year' })}</Label><Input id="paper-year" type="number" min={1500} max={currentYear + 1} required value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="paper-tags">{intl.formatMessage({ id: 'papers.tags' })}</Label><Input id="paper-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder={intl.formatMessage({ id: 'papers.tagsHint' })} /></div>
            <div className="space-y-1.5"><Label htmlFor="paper-abstract">{intl.formatMessage({ id: 'papers.abstract' })}</Label><Textarea id="paper-abstract" rows={4} maxLength={20000} value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="paper-url">{intl.formatMessage({ id: 'papers.url' })}</Label><Input id="paper-url" type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://…" /></div>
            <div className="space-y-1.5"><Label htmlFor="paper-file">{intl.formatMessage({ id: 'papers.pdf' })}</Label><label htmlFor="paper-file" className="flex cursor-pointer items-center gap-2 rounded-sm border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-xs text-gray-600 hover:border-[var(--office-blue)]"><Upload size={15} />{file?.name ?? intl.formatMessage({ id: 'papers.choosePdf' })}</label><input id="paper-file" type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} /><p className="text-[11px] text-gray-400">{intl.formatMessage({ id: 'papers.fileHint' })}</p></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{intl.formatMessage({ id: 'common.cancel' })}</Button><Button type="submit" disabled={createState.isLoading} className="bg-[var(--office-blue)]">{createState.isLoading ? <Loader2 className="animate-spin" /> : <Upload />}{intl.formatMessage({ id: 'papers.submit' })}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
