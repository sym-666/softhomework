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
  ready: 'bg-emerald-500/90 text-white',
  pending: 'bg-amber-400/95 text-amber-950',
  processing: 'bg-amber-400/95 text-amber-950',
  no_text: 'bg-white/85 text-gray-700',
  failed: 'bg-rose-500/90 text-white',
  none: 'bg-white/85 text-gray-700',
};

function PaperCard({ paper }: { paper: Paper }) {
  const intl = useIntl();
  const tone = TONES[toneFor(paper.tags[0] ?? paper.title)];
  const status = paper.ingestStatus === 'pending' ? 'processing' : paper.ingestStatus;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link href={`/papers/${paper.id}`} className={`relative block h-24 overflow-hidden bg-linear-to-br ${tone.cover}`}>
        <span aria-hidden className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:14px_14px]" />
        <FileText aria-hidden className="absolute -bottom-4 -right-3 h-24 w-24 rotate-[-12deg] text-white/20 transition-transform duration-300 group-hover:rotate-0 group-hover:scale-110" />
        <span className="absolute left-4 top-3 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur">{paper.year}</span>
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm ${STATUS_STYLES[paper.ingestStatus]}`}>
          {status === 'processing' ? <Loader2 size={11} className="animate-spin" /> : paper.hasLocalFile ? <FileText size={11} /> : <ExternalLink size={11} />}
          {intl.formatMessage({ id: `papers.status.${status}` })}
        </span>
        {paper.tags[0] && <span className="absolute bottom-3 left-4 text-sm font-semibold text-white drop-shadow">{paper.tags[0]}</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900 group-hover:text-blue-600"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h2>
        <div className="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500">
          <User size={12} className="mt-0.5 shrink-0" />
          <span className="line-clamp-1">{paper.authors}</span>
        </div>
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-500">{paper.abstract || intl.formatMessage({ id: 'papers.noAbstract' })}</p>
        {paper.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-3">
            {paper.tags.map((tag) => <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TONES[toneFor(tag)].soft}`}>{tag}</span>)}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-cyan-400 text-[10px] font-semibold uppercase text-white">{paper.createdByUserName.slice(0, 1)}</span>
          {paper.createdByUserName}
        </span>
        <Link href={`/papers/${paper.id}`} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white">
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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start justify-between">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-500 text-white shadow-md"><Globe2 size={18} /></span>
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
        subtitle={<>{intl.formatMessage({ id: 'papers.subtitle' })}{local.data && <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-600">{intl.formatMessage({ id: 'papers.count' }, { count: local.data.total })}</span>}</>}
        className="mb-3"
        actions={<>
          <ExportLink href="/api/Papers/bibtex" label={intl.formatMessage({ id: 'export.bibtex' })} />
          <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700"><Plus />{intl.formatMessage({ id: 'papers.upload' })}</Button>
        </>}
      />

      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-gray-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="inline-flex h-8 shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          <button onClick={() => { setMode('library'); setSearchInput(localSearch); }} className={`inline-flex items-center gap-1.5 rounded-md px-3 text-xs ${mode === 'library' ? 'bg-white font-medium text-blue-600 shadow-sm' : 'text-gray-500'}`}><BookOpen size={13} />{intl.formatMessage({ id: 'papers.library' })}</button>
          <button onClick={() => { setMode('global'); setSearchInput(''); }} className={`inline-flex items-center gap-1.5 rounded-md px-3 text-xs ${mode === 'global' ? 'bg-white font-medium text-indigo-600 shadow-sm' : 'text-gray-500'}`}><Globe2 size={13} />{intl.formatMessage({ id: 'papers.global' })}</button>
        </div>
        <form onSubmit={submitSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1"><Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={intl.formatMessage({ id: mode === 'library' ? 'papers.searchLocal' : 'papers.searchGlobal' })} className="h-8 rounded-sm pl-8 text-xs" /></div>
          <Button type="submit" size="sm" variant="outline" className="h-8 rounded-sm">{intl.formatMessage({ id: 'papers.search' })}</Button>
        </form>
      </div>

      {mode === 'library' ? (
        <>
          {local.isLoading && <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400"><Loader2 className="mx-auto mb-2 animate-spin" />{intl.formatMessage({ id: 'common.loading' })}</div>}
          {local.isError && <div className="border border-red-100 bg-white py-20 text-center text-sm text-red-500">{intl.formatMessage({ id: 'papers.loadError' })}</div>}
          {local.data?.items.length === 0 && <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'papers.empty' })}</div>}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{local.data?.items.map((paper) => <PaperCard key={paper.id} paper={paper} />)}</div>
          {pages > 1 && <div className="mt-3 flex items-center justify-center gap-3 border border-gray-200 bg-white p-2 text-xs"><button disabled={page <= 1} onClick={() => setPage((x) => x - 1)} className="disabled:opacity-30">{intl.formatMessage({ id: 'common.previous' })}</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage((x) => x + 1)} className="disabled:opacity-30">{intl.formatMessage({ id: 'common.next' })}</button></div>}
        </>
      ) : (
        <>
          {global.isFetching && <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400"><Loader2 className="mx-auto mb-2 animate-spin" />{intl.formatMessage({ id: 'papers.searching' })}</div>}
          {!global.isFetching && !global.data && <div className="border border-gray-200 bg-white py-20 text-center"><Globe2 className="mx-auto mb-3 text-gray-300" size={34} /><p className="text-sm text-gray-500">{intl.formatMessage({ id: 'papers.globalHint' })}</p></div>}
          {!global.isFetching && global.data?.papers.length === 0 && <div className="border border-gray-200 bg-white py-20 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'papers.empty' })}</div>}
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
