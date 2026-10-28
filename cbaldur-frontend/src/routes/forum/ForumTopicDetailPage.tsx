import { useEffect, useMemo, useRef, useState } from 'react';
import { HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';
import { ArrowLeft, Bookmark, Eye, Heart, Link2, MessageSquare, Quote, Send } from 'lucide-react';
import { Link } from 'wouter';
import { useIntl } from 'react-intl';
import { toast } from 'sonner';
import { ForumContent } from '@/components/forum/ForumContent';
import { RichTextEditor } from '@/components/forum/RichTextEditor';
import { useCreateForumPostMutation, useGetForumTopicQuery, useToggleForumBookmarkMutation, useToggleForumLikeMutation } from '@/redux/api/forum';
import type { ForumPost } from '@/types/forum';

const getError = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data;
    if (data?.message) return data.message;
  }
  return fallback;
};

export default function ForumTopicDetailPage({ id }: { id: string }) {
  const topicId = Number(id);
  const intl = useIntl();
  const query = useGetForumTopicQuery(topicId, { skip: !Number.isInteger(topicId) });
  const [createPost, createState] = useCreateForumPostMutation();
  const [toggleLike] = useToggleForumLikeMutation();
  const [toggleBookmark] = useToggleForumBookmarkMutation();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [content, setContent] = useState('');
  const [quoted, setQuoted] = useState<ForumPost | null>(null);
  const editorAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => setPosts(query.data?.posts ?? []), [query.data?.posts]);
  useEffect(() => {
    if (!Number.isInteger(topicId)) return;
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/forum', { transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connection.on('NewPost', (post: ForumPost) => setPosts((current) => current.some((item) => item.id === post.id) ? current : [...current, post]));
    void connection.start().then(() => connection.invoke('SubscribeTopic', topicId)).catch(() => undefined);
    return () => { void connection.invoke('UnsubscribeTopic', topicId).catch(() => undefined).finally(() => connection.stop()); };
  }, [topicId]);

  const postMap = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  if (query.isLoading) return <div className="p-12 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'common.loading' })}</div>;
  if (query.isError || !query.data) return <div className="p-12 text-center text-sm text-red-500">{intl.formatMessage({ id: 'forum.notFound' })}</div>;
  const topic = query.data;

  const submitReply = async () => {
    if (!content.trim() || content === '<p></p>') return toast.error(intl.formatMessage({ id: 'forum.validation' }));
    try {
      const created = await createPost({ topicId, content, quotePostId: quoted?.id }).unwrap();
      setPosts((current) => current.some((item) => item.id === created.id) ? current : [...current, created]);
      setContent(''); setQuoted(null);
      toast.success(intl.formatMessage({ id: 'forum.replyCreated' }));
    } catch (error) { toast.error(getError(error, intl.formatMessage({ id: 'forum.submitError' }))); }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3">
      <div className="border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2"><Link href="/forum" className="flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--office-blue)]"><ArrowLeft size={14} />{intl.formatMessage({ id: 'forum.backToForum' })}</Link><div className="flex gap-1"><button onClick={() => void toggleLike(topicId)} className={`flex h-7 items-center gap-1 rounded-sm border px-2 text-xs ${topic.isLiked ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}><Heart size={13} className={topic.isLiked ? 'fill-current' : ''} />{topic.likeCount}</button><button onClick={() => void toggleBookmark(topicId)} className={`flex h-7 items-center rounded-sm border px-2 ${topic.isBookmarked ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-gray-200 text-gray-500'}`}><Bookmark size={13} className={topic.isBookmarked ? 'fill-current' : ''} /></button></div></div>
        <article className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2"><span className="rounded-sm px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: topic.categoryColor }}>{topic.categoryName}</span>{topic.tags.map((tag) => <span key={tag} className="rounded-sm bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">#{tag}</span>)}</div>
          <h1 className="text-xl font-semibold text-gray-900">{topic.title}</h1>
          <div className="mt-3 flex items-center gap-3 text-xs text-gray-500"><div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--office-blue)] text-white flex items-center justify-center">{topic.userAvatarUrl ? <img src={topic.userAvatarUrl} alt="" className="h-full w-full object-cover" /> : topic.userName.slice(0, 1).toUpperCase()}</div><span className="font-medium text-gray-700">{topic.userName}</span><span>{new Date(topic.createdAt).toLocaleString(intl.locale)}</span><span className="flex items-center gap-1"><Eye size={12} />{topic.viewCount}</span><span className="flex items-center gap-1"><MessageSquare size={12} />{topic.replyCount}</span></div>
          {topic.linkedCaseId && <div className="mt-4 inline-flex items-center gap-1 rounded-sm border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-[var(--office-blue)]"><Link2 size={12} />{intl.formatMessage({ id: 'forum.linkedCase' })}</div>}
          <ForumContent html={topic.content} className="mt-5 border-t border-gray-100 pt-5" />
        </article>
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700">{intl.formatMessage({ id: 'forum.replies' }, { count: posts.length })}</div>
        {posts.length === 0 && <div className="p-8 text-center text-xs text-gray-400">{intl.formatMessage({ id: 'forum.noReplies' })}</div>}
        {posts.map((post, index) => {
          const quote = post.quotePostId ? postMap.get(post.quotePostId) : undefined;
          return <article key={post.id} className="flex gap-3 border-b border-gray-100 p-4 last:border-b-0"><div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-500 text-white flex items-center justify-center text-xs">{post.userAvatarUrl ? <img src={post.userAvatarUrl} alt="" className="h-full w-full object-cover" /> : post.userName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-xs"><span className="font-semibold text-gray-700">{post.userName}</span><span className="text-gray-400">#{index + 1}</span><span className="text-gray-400">{new Date(post.createdAt).toLocaleString(intl.locale)}</span></div>{quote && <div className="mt-2 border-l-2 border-blue-300 bg-blue-50/60 p-2"><div className="mb-1 text-[11px] font-medium text-[var(--office-blue)]">@{quote.userName}</div><ForumContent html={quote.content} className="line-clamp-2 text-xs" /></div>}<ForumContent html={post.content} className="mt-2" /><button onClick={() => { setQuoted(post); editorAnchor.current?.scrollIntoView({ behavior: 'smooth' }); }} className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 hover:text-[var(--office-blue)]"><Quote size={11} />{intl.formatMessage({ id: 'forum.quote' })}</button></div></article>;
        })}
      </div>

      {!topic.isClosed && <div ref={editorAnchor} className="border border-gray-200 bg-white p-4"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-gray-700">{intl.formatMessage({ id: 'forum.reply' })}</span>{quoted && <button onClick={() => setQuoted(null)} className="text-[11px] text-[var(--office-blue)]">@{quoted.userName} · {intl.formatMessage({ id: 'forum.cancelQuote' })}</button>}</div><RichTextEditor content={content} onChange={setContent} placeholder={intl.formatMessage({ id: 'forum.replyPlaceholder' })} minHeight={130} /><div className="mt-3 flex justify-end"><button disabled={createState.isLoading} onClick={() => void submitReply()} className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[var(--office-blue)] px-4 text-xs font-medium text-white disabled:opacity-50"><Send size={13} />{intl.formatMessage({ id: 'forum.publishReply' })}</button></div></div>}
    </div>
  );
}
