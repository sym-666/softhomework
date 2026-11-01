import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { DueCards, StudyCard, StudySummary } from '@/types/study';

export const studyApi = createApi({
  reducerPath: 'studyApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  tagTypes: ['StudyCards'],
  endpoints: (builder) => ({
    getPaperCards: builder.query<StudyCard[], number>({
      query: (paperId) => `/Papers/${paperId}/study-cards`,
      providesTags: ['StudyCards'],
    }),
    getDueCards: builder.query<DueCards, { paperId?: number }>({
      query: (params) => ({ url: '/Study-Cards/due', params }),
      providesTags: ['StudyCards'],
    }),
    getStudySummary: builder.query<StudySummary, void>({
      // 服务端按用户时区分天
      query: () => ({
        url: '/Study-Cards/summary',
        params: { tzOffset: new Date().getTimezoneOffset() },
      }),
      providesTags: ['StudyCards'],
    }),
    generateCards: builder.mutation<
      StudyCard[],
      { paperId: number; lang: string }
    >({
      query: ({ paperId, lang }) => ({
        url: '/Ai/StudyCards',
        method: 'POST',
        params: { id: paperId, lang },
      }),
      invalidatesTags: ['StudyCards'],
    }),
    reviewCard: builder.mutation<StudyCard, { id: number; correct: boolean }>({
      query: ({ id, correct }) => ({
        url: `/Study-Cards/${id}/review`,
        method: 'POST',
        body: { correct },
      }),
      invalidatesTags: ['StudyCards'],
    }),
    deleteCard: builder.mutation<void, number>({
      query: (id) => ({ url: `/Study-Cards/${id}`, method: 'DELETE' }),
      invalidatesTags: ['StudyCards'],
    }),
  }),
});

export const {
  useGetPaperCardsQuery,
  useGetDueCardsQuery,
  useLazyGetDueCardsQuery,
  useGetStudySummaryQuery,
  useGenerateCardsMutation,
  useReviewCardMutation,
  useDeleteCardMutation,
} = studyApi;
