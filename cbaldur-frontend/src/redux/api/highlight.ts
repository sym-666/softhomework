import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Highlight,
  HighlightColor,
  NewHighlight,
} from '@/types/highlight';

export const highlightApi = createApi({
  reducerPath: 'highlightApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Highlights'],
  endpoints: (builder) => ({
    getHighlights: builder.query<Highlight[], number>({
      query: (paperId) => `/Papers/${paperId}/highlights`,
      providesTags: ['Highlights'],
    }),
    createHighlight: builder.mutation<
      Highlight,
      NewHighlight & { paperId: number }
    >({
      query: ({ paperId, ...body }) => ({
        url: `/Papers/${paperId}/highlights`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Highlights'],
    }),
    updateHighlight: builder.mutation<
      Highlight,
      { id: number; color?: HighlightColor; noteId?: number | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/Highlights/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Highlights'],
    }),
    deleteHighlight: builder.mutation<void, number>({
      query: (id) => ({ url: `/Highlights/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Highlights'],
    }),
  }),
});

export const {
  useGetHighlightsQuery,
  useCreateHighlightMutation,
  useUpdateHighlightMutation,
  useDeleteHighlightMutation,
} = highlightApi;
