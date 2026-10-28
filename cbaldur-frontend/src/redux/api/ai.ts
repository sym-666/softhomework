import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { ParameterIssue } from '@/types/Ai';

export interface AiStatus {
  enabled: boolean;
  /** Python 沙箱是否可用 */
  sandbox: boolean;
  /** 论文检索是否使用向量语义匹配（否则为关键词匹配） */
  semanticPaperSearch: boolean;
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
    validateParameters: builder.mutation<
      { success: boolean; issues: ParameterIssue[] },
      { configName: string; formData: unknown }
    >({
      query: (body) => ({ url: 'ValidateParameters', method: 'POST', body }),
    }),
  }),
});

export const { useGetAiStatusQuery, useValidateParametersMutation } = aiApi;
