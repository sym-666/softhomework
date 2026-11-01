import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AiStatus {
  enabled: boolean;
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
  }),
});

export const { useGetAiStatusQuery } = aiApi;
