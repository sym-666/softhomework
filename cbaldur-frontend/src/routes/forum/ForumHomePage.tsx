import { useState } from 'react';
import { Link } from 'wouter';
import { Bookmark, Eye, Heart, MessageSquare, Plus, Search, Tag } from 'lucide-react';
import { useIntl } from 'react-intl';
import DOMPurify from 'dompurify';
import {
  useGetForumBookmarksQuery,
  useGetForumCategoriesQuery,
  useGetForumTagsQuery,
  useGetForumTopicsQuery,
} from '@/redux/api/forum';
import type { ForumTopicListItem } from '@/types/forum';

const textSummary = (html: string) => {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  const element = document.createElement('div');
  element.innerHTML = clean;
  return (element.textContent ?? '').trim();
};

const relativeTime = (value: string, locale: string) => {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return locale.startsWith('zh') ? '刚刚' : 'just now';
  if (minutes < 60) return locale.startsWith('zh') ? `${minutes} 分钟前` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale.startsWith('zh') ? `${hours} 小时前` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale.startsWith('zh') ? `${days} 天前` : `${days}d ago`;
};

function TopicRow({ topic }: { topic: ForumTopicListItem }) {
  const intl = useIntl();
  const timestamp = topic.lastReplyAt ?? topic.createdAt;
  return (
    <article className="border-b border-gray-100 px-4 py-4 last:border-b-0 hover:bg-blue-50/30">
      <div className="flex gap-3">
        <div className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--office-blue)] text-white flex items-center justify-center text-sm font-semibold">
          {topic.userAvatarUrl ? <img src={topic.userAvatarUrl} alt="" className="h-full w-full object-cover" /> : topic.userName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {topic.isPinned && <span className="rounded-sm bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">{intl.formatMessage({ id: 'forum.pinned' })}</span>}
            <span className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: topic.categoryColor }}>{topic.categoryName}</span>
            {topic.isClosed && <span className="text-[10px] text-gray-500">{intl.formatMessage({ id: 'forum.closed' })}</span>}
          </div>
          <Link href={`/forum/topics/${topic.id}`} className="block truncate text-sm font-semibold text-gray-900 hover:text-[var(--office-blue)]">{topic.title}</Link>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">{textSummary(topic.content)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {topic.tags.map((item) => <span key={item} className="rounded-sm bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">#{item}</span>)}
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-gray-400">
            <span className="font-medium text-gray-600">{topic.userName}</span>
            <span>{relativeTime(timestamp, intl.locale)}</span>
            <span className="flex items-center gap-1"><Eye size={12} />{topic.viewCount}</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} />{topic.replyCount}</span>
            <span className={`flex items-center gap-1 ${topic.isLiked ? 'text-red-500' : ''}`}><Heart size={12} />{topic.likeCount}</span>
            {topic.isBookmarked && <Bookmark size={12} className="fill-amber-400 text-amber-500" />}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ForumHomePage({ bookmarks = false }: { bookmarks?: boolean }) {
  const intl = useIntl();
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [tag, setTag] = useState<string | undefined>();
  const [sort, setSort] = useState<'latest' | 'hot' | 'top'>('latest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const categories = useGetForumCategoriesQuery();
  const tags = useGetForumTagsQuery(20);
  const topicQuery = useGetForumTopicsQuery({ categoryId, tag, search: search || undefined, sort, page, pageSize: 20 }, { skip: bookmarks });
  const bookmarkQuery = useGetForumBookmarksQuery({ page, pageSize: 20 }, { skip: !bookmarks });
  const result = bookmarks ? bookmarkQuery.data : topicQuery.data;
  const isLoading = bookmarks ? bookmarkQuery.isLoading : topicQuery.isLoading;
  const isError = bookmarks ? bookmarkQuery.isError : topicQuery.isError;
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / 20));

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="mb-3 flex items-center justify-between border border-gray-200 bg-white px-4 py-3">
        <div>
          <h1 className="text-base font-semibold text-gray-900">{intl.formatMessage({ id: bookmarks ? 'forum.bookmarks' : 'forum.title' })}</h1>
          <p className="mt-0.5 text-xs text-gray-500">{intl.formatMessage({ id: 'forum.subtitle' })}</p>
        </div>
        <Link href="/forum/new" className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[var(--office-blue)] px-3 text-xs font-medium text-white hover:brightness-110"><Plus size={14} />{intl.formatMessage({ id: 'forum.newTopic' })}</Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_220px]">
        <aside className="h-fit border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700">{intl.formatMessage({ id: 'forum.categories' })}</div>
          <button className={`w-full px-3 py-2 text-left text-xs ${categoryId == null ? 'bg-blue-50 text-[var(--office-blue)]' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => { setCategoryId(undefined); setPage(1); }}>{intl.formatMessage({ id: 'forum.allCategories' })}</button>
          {categories.data?.map((item) => (
            <button key={item.id} className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs ${categoryId === item.id ? 'bg-blue-50 text-[var(--office-blue)]' : 'text-gray-600 hover:bg-gray-50'}`} onClick={() => { setCategoryId(item.id); setPage(1); }}>
              <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="text-gray-400">{item.topicCount}</span>
            </button>
          ))}
          <div className="border-t border-gray-100 p-2"><Link href={bookmarks ? '/forum' : '/forum/bookmarks'} className="flex items-center gap-2 px-1 py-1 text-xs text-gray-600 hover:text-[var(--office-blue)]"><Bookmark size={13} />{intl.formatMessage({ id: bookmarks ? 'forum.backToForum' : 'forum.bookmarks' })}</Link></div>
        </aside>

        <main className="min-w-0 border border-gray-200 bg-white">
          {!bookmarks && (
            <div className="flex flex-col gap-2 border-b border-gray-200 bg-gray-50 p-2 sm:flex-row sm:items-center">
              <form className="relative flex-1" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}>
                <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder={intl.formatMessage({ id: 'forum.search' })} className="h-8 w-full rounded-sm border border-gray-300 bg-white pl-7 pr-2 text-xs outline-none focus:border-[var(--office-blue)]" />
              </form>
              <select value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className="h-8 rounded-sm border border-gray-300 bg-white px-2 text-xs">
                <option value="latest">{intl.formatMessage({ id: 'forum.sort.latest' })}</option><option value="hot">{intl.formatMessage({ id: 'forum.sort.hot' })}</option><option value="top">{intl.formatMessage({ id: 'forum.sort.top' })}</option>
              </select>
            </div>
          )}
          {isLoading && <div className="p-12 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'common.loading' })}</div>}
          {isError && <div className="p-12 text-center text-sm text-red-500">{intl.formatMessage({ id: 'forum.loadError' })}</div>}
          {!isLoading && !isError && result?.items.length === 0 && <div className="p-12 text-center text-sm text-gray-400">{intl.formatMessage({ id: 'forum.empty' })}</div>}
          {result?.items.map((topic) => <TopicRow key={topic.id} topic={topic} />)}
          {pages > 1 && <div className="flex items-center justify-center gap-3 border-t border-gray-100 p-3 text-xs"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="disabled:opacity-30">{intl.formatMessage({ id: 'forum.previous' })}</button><span>{page} / {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="disabled:opacity-30">{intl.formatMessage({ id: 'forum.next' })}</button></div>}
        </main>

        <aside className="h-fit border border-gray-200 bg-white">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-700"><Tag size={13} />{intl.formatMessage({ id: 'forum.popularTags' })}</div>
          <div className="flex flex-wrap gap-1.5 p-3">{tags.data?.map((item) => <button key={item.id} onClick={() => { setTag(tag === item.name ? undefined : item.name); setPage(1); }} className={`rounded-sm border px-2 py-1 text-[11px] ${tag === item.name ? 'border-blue-300 bg-blue-50 text-[var(--office-blue)]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>#{item.name} <span className="text-gray-400">{item.usageCount}</span></button>)}</div>
        </aside>
      </div>
    </div>
  );
}
