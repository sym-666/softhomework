import { useState } from 'react';
import { ArrowLeft, Send, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/forum/RichTextEditor';
import { useCreateForumTopicMutation, useGetForumCategoriesQuery } from '@/redux/api/forum';
import { useGetCasesQuery } from '@/redux/api/case';

const getError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return fallback;
};

export default function ForumNewTopicPage() {
  const intl = useIntl();
  const [, navigate] = useLocation();
  const categories = useGetForumCategoriesQuery();
  const cases = useGetCasesQuery({});
  const [createTopic, { isLoading }] = useCreateForumTopicMutation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number>();
  const [linkedCaseId, setLinkedCaseId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const selectedCategory = categoryId ?? categories.data?.[0]?.id;
  const addTag = () => {
    const next = tagInput.trim().slice(0, 32);
    if (next && tags.length < 5 && !tags.some((item) => item.toLowerCase() === next.toLowerCase())) setTags((value) => [...value, next]);
    setTagInput('');
  };
  const submit = async () => {
    if (!title.trim() || title.trim().length > 200 || !selectedCategory || !content.trim() || content === '<p></p>') {
      toast.error(intl.formatMessage({ id: 'forum.validation' }));
      return;
    }
    try {
      const topic = await createTopic({
        title: title.trim(), content, categoryId: selectedCategory, tags,
        linkedCaseId: linkedCaseId || undefined,
      }).unwrap();
      toast.success(intl.formatMessage({ id: 'forum.created' }));
      navigate(`/forum/topics/${topic.id}`);
    } catch (error) {
      toast.error(getError(error, intl.formatMessage({ id: 'forum.submitError' })));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl border border-gray-200 bg-white">
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <Link href="/forum" className="text-gray-500 hover:text-[var(--office-blue)]"><ArrowLeft size={16} /></Link>
        <div><h1 className="text-sm font-semibold text-gray-900">{intl.formatMessage({ id: 'forum.newTopic' })}</h1><p className="text-xs text-gray-500">{intl.formatMessage({ id: 'forum.newTopicHelp' })}</p></div>
      </div>
      <div className="space-y-4 p-5">
        <label className="block"><span className="mb-1 block text-xs font-medium text-gray-700">{intl.formatMessage({ id: 'forum.topicTitle' })}</span><input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} className="h-9 w-full rounded-sm border border-gray-300 px-3 text-sm outline-none focus:border-[var(--office-blue)]" /><span className="mt-1 block text-right text-[10px] text-gray-400">{title.length}/200</span></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label><span className="mb-1 block text-xs font-medium text-gray-700">{intl.formatMessage({ id: 'forum.category' })}</span><select value={selectedCategory ?? ''} onChange={(event) => setCategoryId(Number(event.target.value))} className="h-9 w-full rounded-sm border border-gray-300 bg-white px-2 text-sm">{categories.data?.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label><span className="mb-1 block text-xs font-medium text-gray-700">{intl.formatMessage({ id: 'forum.linkedCase' })}</span><select value={linkedCaseId} onChange={(event) => setLinkedCaseId(event.target.value)} className="h-9 w-full rounded-sm border border-gray-300 bg-white px-2 text-sm"><option value="">{intl.formatMessage({ id: 'forum.noLinkedCase' })}</option>{cases.data?.map((item) => <option key={item.id} value={item.id}>#{item.caseId} · {item.comment || item.status}</option>)}</select></label>
        </div>
        <div><span className="mb-1 block text-xs font-medium text-gray-700">{intl.formatMessage({ id: 'forum.tags' })}</span><div className="flex h-9 items-center gap-1 rounded-sm border border-gray-300 px-2">{tags.map((tag) => <span key={tag} className="flex items-center gap-1 rounded-sm bg-gray-100 px-1.5 py-0.5 text-[11px]">#{tag}<button onClick={() => setTags((value) => value.filter((item) => item !== tag))}><X size={11} /></button></span>)}<input value={tagInput} disabled={tags.length >= 5} onChange={(event) => setTagInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addTag(); } }} onBlur={addTag} className="min-w-20 flex-1 text-xs outline-none" placeholder={intl.formatMessage({ id: 'forum.tagsPlaceholder' })} /></div></div>
        <div><span className="mb-1 block text-xs font-medium text-gray-700">{intl.formatMessage({ id: 'forum.content' })}</span><RichTextEditor content={content} onChange={setContent} placeholder={intl.formatMessage({ id: 'forum.contentPlaceholder' })} minHeight={260} /></div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4"><Link href="/forum" className="inline-flex h-8 items-center rounded-sm border border-gray-300 px-4 text-xs text-gray-600">{intl.formatMessage({ id: 'forum.cancel' })}</Link><button disabled={isLoading} onClick={() => void submit()} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[var(--office-blue)] px-4 text-xs font-medium text-white disabled:opacity-50"><Send size={13} />{isLoading ? intl.formatMessage({ id: 'forum.submitting' }) : intl.formatMessage({ id: 'forum.publish' })}</button></div>
      </div>
    </div>
  );
}
