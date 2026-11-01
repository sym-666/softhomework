import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Citation } from '@/types/Ai';

export interface AiStatus {
  enabled: boolean;
}

export interface PaperGuide {
  content: string;
  model: string;
  createdAt: string;
}

export interface ChatHistoryItem {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  createdAt: string;
}

// 对话接口为 SSE 流式输出，见 src/hooks/useAiChatStream.ts；这里只放普通请求
export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/Ai',
    credentials: 'include',
  }),
  tagTypes: ['ChatHistory'],
  endpoints: (builder) => ({
    getAiStatus: builder.query<AiStatus, void>({
      query: () => 'Status',
    }),
    getChatHistory: builder.query<ChatHistoryItem[], number>({
      query: (id) => ({ url: 'PaperChat/history', params: { id } }),
      providesTags: (_result, _error, id) => [{ type: 'ChatHistory', id }],
    }),
    clearChatHistory: builder.mutation<void, number>({
      query: (id) => ({
        url: 'PaperChat/history',
        method: 'DELETE',
        params: { id },
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'ChatHistory', id }],
    }),
    // 生成走 SSE，见 src/hooks/useGuideStream.ts
    getPaperGuide: builder.query<
      PaperGuide | null,
      { id: number; lang: string }
    >({
      query: (params) => ({ url: 'PaperGuide', params }),
    }),
  }),
});

export const {
  useGetAiStatusQuery,
  useGetChatHistoryQuery,
  useClearChatHistoryMutation,
  useGetPaperGuideQuery,
} = aiApi;
