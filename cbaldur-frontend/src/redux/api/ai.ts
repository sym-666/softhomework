import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AiStatus {
  enabled: boolean;
}

export interface PaperGuide {
  content: string;
  model: string;
  createdAt: string;
}

// 对话接口为 SSE 流式输出，见 src/hooks/useAiChatStream.ts；这里只放普通请求
export const aiApi = createApi({
  reducerPath: 'aiApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/Ai',
    credentials: 'include',
  }),
  endpoints: (builder) => ({
    getAiStatus: builder.query<AiStatus, void>({
      query: () => 'Status',
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

export const { useGetAiStatusQuery, useGetPaperGuideQuery } = aiApi;
