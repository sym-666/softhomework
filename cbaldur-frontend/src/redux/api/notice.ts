import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  organizationId?: string | null;
}

export const noticeApi = createApi({
  reducerPath: 'noticeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/Notice',
    credentials: 'include',
  }),
  tagTypes: ['Notice'],
  endpoints: (builder) => ({
    getNotices: builder.query<Notice[], void>({
      query: () => 'GetNotices',
      providesTags: ['Notice'],
    }),
    createNotice: builder.mutation<
      any,
      { title: string; content: string; organizationId?: string | null }
    >({
      query: (body) => ({
        url: 'CreateNotice',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Notice'],
    }),
    updateNotice: builder.mutation<
      any,
      { id: string; title: string; content: string }
    >({
      query: (body) => ({
        url: 'UpdateNotice',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notice'],
    }),
    deleteNotice: builder.mutation<any, { id: string }>({
      query: (body) => ({
        url: 'DeleteNotice',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notice'],
    }),
  }),
});

export const {
  useGetNoticesQuery,
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} = noticeApi;
