import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Note, NotePage } from '@/types/note';

export const noteApi = createApi({
  reducerPath: 'noteApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['Notes'],
  endpoints: (builder) => ({
    getPaperNotes: builder.query<Note[], number>({
      query: (paperId) => `/Papers/${paperId}/notes`,
      providesTags: ['Notes'],
    }),
    getMyNotes: builder.query<
      NotePage,
      { search?: string; page?: number; pageSize?: number }
    >({
      query: (params) => ({ url: '/Notes', params }),
      providesTags: ['Notes'],
    }),
    createNote: builder.mutation<
      Note,
      { paperId: number; content: string; page: number | null }
    >({
      query: ({ paperId, ...body }) => ({
        url: `/Papers/${paperId}/notes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
    updateNote: builder.mutation<
      Note,
      { id: number; content: string; page: number | null }
    >({
      query: ({ id, ...body }) => ({
        url: `/Notes/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Notes'],
    }),
    deleteNote: builder.mutation<void, number>({
      query: (id) => ({ url: `/Notes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notes'],
    }),
  }),
});

export const {
  useGetPaperNotesQuery,
  useGetMyNotesQuery,
  useCreateNoteMutation,
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = noteApi;
