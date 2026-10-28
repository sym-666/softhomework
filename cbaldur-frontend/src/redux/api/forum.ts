import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreateForumTopic,
  ForumCategory,
  ForumPagedResult,
  ForumPost,
  ForumTag,
  ForumTopicDetail,
  ForumTopicListItem,
} from '@/types/forum';

export interface ForumTopicQuery {
  categoryId?: number;
  tag?: string;
  search?: string;
  sort?: 'latest' | 'hot' | 'top';
  page?: number;
  pageSize?: number;
}

export const forumApi = createApi({
  reducerPath: 'forumApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/Forum', credentials: 'include' }),
  tagTypes: ['ForumTopic', 'ForumList', 'ForumCategories', 'ForumTags', 'ForumBookmarks'],
  endpoints: (builder) => ({
    getForumCategories: builder.query<ForumCategory[], void>({
      query: () => '/categories',
      providesTags: ['ForumCategories'],
    }),
    getForumTopics: builder.query<ForumPagedResult<ForumTopicListItem>, ForumTopicQuery>({
      query: (params) => ({ url: '/topics', params }),
      providesTags: (result) => [
        'ForumList',
        ...(result?.items.map((topic) => ({ type: 'ForumTopic' as const, id: topic.id })) ?? []),
      ],
    }),
    getForumTopic: builder.query<ForumTopicDetail, number>({
      query: (id) => `/topics/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'ForumTopic', id }],
    }),
    createForumTopic: builder.mutation<ForumTopicListItem, CreateForumTopic>({
      query: (body) => ({ url: '/topics', method: 'POST', body }),
      invalidatesTags: ['ForumList', 'ForumCategories', 'ForumTags'],
    }),
    createForumPost: builder.mutation<ForumPost, { topicId: number; content: string; quotePostId?: number }>({
      query: ({ topicId, ...body }) => ({ url: `/topics/${topicId}/posts`, method: 'POST', body }),
      invalidatesTags: (_result, _error, args) => [
        { type: 'ForumTopic', id: args.topicId },
        'ForumList',
      ],
    }),
    toggleForumLike: builder.mutation<{ likeCount: number; isLiked: boolean }, number>({
      query: (id) => ({ url: `/topics/${id}/like`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'ForumTopic', id }, 'ForumList'],
    }),
    toggleForumBookmark: builder.mutation<{ isBookmarked: boolean }, number>({
      query: (id) => ({ url: `/topics/${id}/bookmark`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'ForumTopic', id },
        'ForumList',
        'ForumBookmarks',
      ],
    }),
    getForumBookmarks: builder.query<ForumPagedResult<ForumTopicListItem>, { page?: number; pageSize?: number }>({
      query: (params) => ({ url: '/bookmarked', params }),
      providesTags: ['ForumBookmarks'],
    }),
    getForumTags: builder.query<ForumTag[], number | void>({
      query: (count = 20) => ({ url: '/tags', params: { count } }),
      providesTags: ['ForumTags'],
    }),
    uploadForumImage: builder.mutation<{ url: string }, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/upload-image', method: 'POST', body };
      },
    }),
  }),
});

export const {
  useGetForumCategoriesQuery,
  useGetForumTopicsQuery,
  useGetForumTopicQuery,
  useCreateForumTopicMutation,
  useCreateForumPostMutation,
  useToggleForumLikeMutation,
  useToggleForumBookmarkMutation,
  useGetForumBookmarksQuery,
  useGetForumTagsQuery,
  useUploadForumImageMutation,
} = forumApi;
