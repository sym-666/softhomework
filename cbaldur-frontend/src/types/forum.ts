export interface ForumCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  slug: string;
  topicCount: number;
}

export interface ForumTag {
  id: number;
  name: string;
  usageCount: number;
}

export interface ForumPost {
  id: number;
  topicId: number;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  content: string;
  likeCount: number;
  quotePostId: number | null;
  createdAt: string;
}

export interface ForumTopicListItem {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  viewCount: number;
  replyCount: number;
  likeCount: number;
  isPinned: boolean;
  isClosed: boolean;
  tags: string[];
  createdAt: string;
  lastReplyAt: string | null;
  lastReplyUserName: string | null;
  recentPosts: ForumPost[];
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface ForumTopicDetail extends Omit<ForumTopicListItem, 'recentPosts'> {
  linkedCaseId: string | null;
  updatedAt: string;
  posts: ForumPost[];
}

export interface ForumPagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateForumTopic {
  title: string;
  content: string;
  categoryId: number;
  tags?: string[];
  linkedCaseId?: string;
}
