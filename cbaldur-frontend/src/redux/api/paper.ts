import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  CreatePaper,
  Paper,
  PaperPagedResult,
  PaperSearchResponse,
} from '@/types/paper';

export const paperApi = createApi({
  reducerPath: 'paperApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/Papers', credentials: 'include' }),
  tagTypes: ['Papers'],
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
} = paperApi;
