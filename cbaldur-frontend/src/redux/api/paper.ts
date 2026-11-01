import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreatePaper,
  Paper,
  PaperPagedResult,
  PaperReference,
  PaperSearchResponse,
  ReadingState,
  ReadingStatus,
} from '@/types/paper';

export const paperApi = createApi({
  reducerPath: 'paperApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/Papers', credentials: 'include' }),
  tagTypes: ['Papers', 'ReadingState'],
  endpoints: (builder) => ({
    getPapers: builder.query<
      PaperPagedResult,
      { search?: string; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: '', params }),
      providesTags: ['Papers'],
    }),
    getPaper: builder.query<Paper, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Papers', id }],
    }),
    searchGlobalPapers: builder.query<
      PaperSearchResponse,
      { query: string; limit?: number }
    >({
      query: (params) => ({ url: '/search', params }),
    }),
    createPaper: builder.mutation<Paper, CreatePaper>({
      query: (payload) => {
        const body = new FormData();
        body.append('Title', payload.title);
        body.append('Authors', payload.authors);
        body.append('Year', payload.year.toString());
        body.append('Abstract', payload.abstract ?? '');
        body.append('Tags', payload.tags ?? '');
        if (payload.url) body.append('Url', payload.url);
        if (payload.file) body.append('File', payload.file);
        return { url: '', method: 'POST', body };
      },
      invalidatesTags: ['Papers'],
    }),
    getReferences: builder.query<PaperReference[], number>({
      query: (id) => `/${id}/references`,
    }),
    retryIngestion: builder.mutation<Paper, number>({
      query: (id) => ({ url: `/${id}/ingest`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Papers', id }],
    }),
    getReadingState: builder.query<ReadingState, number>({
      query: (id) => `/${id}/reading-state`,
      providesTags: (_result, _error, id) => [{ type: 'ReadingState', id }],
    }),
    updateReadingState: builder.mutation<
      ReadingState,
      { paperId: number; lastPage?: number; status?: ReadingStatus }
    >({
      query: ({ paperId, ...body }) => ({
        url: `/${paperId}/reading-state`,
        method: 'PUT',
        body,
      }),
      // 让缓存失效，否则一分钟内重新打开论文会恢复到旧页码
      invalidatesTags: (_result, _error, { paperId }) => [
        { type: 'ReadingState', id: paperId },
      ],
    }),
    deletePaper: builder.mutation<void, number>({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Papers'],
    }),
  }),
});

export const {
  useGetPapersQuery,
  useGetPaperQuery,
  useLazySearchGlobalPapersQuery,
  useCreatePaperMutation,
  useDeletePaperMutation,
  useRetryIngestionMutation,
  useGetReferencesQuery,
  useGetReadingStateQuery,
  useUpdateReadingStateMutation,
} = paperApi;
