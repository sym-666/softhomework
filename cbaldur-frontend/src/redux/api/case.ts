import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface CreateCaseByNamelistRequest {
  Namelist: string;
  SuperComputer: string;
}

interface CreateCaseResponse {
  success: boolean;
  message?: string;
  /** UUID primary key */
  id?: string;
  /** Per-user display sequence */
  caseId?: number;
}

interface CreateCaseRequest {
  CaseJson: string;
  CaseJsonPrototype: string;
  Comment: string;
  SuperComputer: string;
}

interface GetCaseResponse {
  id: string;
  caseId: number;
  caseNamelist: string;
  caseJsonPrototype?: string | null;
  [key: string]: any;
}

export interface CaseListItem {
  /** UUID primary key — use for navigation / detail fetch */
  id: string;
  /** Per-user display sequence */
  caseId: number;
  userId: string | null;
  status: string;
  comment: string;
  tags?: string | null;
  jsonOrNamelist?: boolean | null;
  hasCaseJsonPrototype: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetCaseLogsResponse {
  success: boolean;
  isRunning: boolean;
  status: string;
  logs: string;
  files?: string[];
  logsByFile?: Record<string, string>;
  message?: string;
}

export const caseApi = createApi({
  reducerPath: 'caseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/Case',
    credentials: 'include',
  }),
  tagTypes: ['Case', 'Initial'],
  endpoints: (builder) => ({
    getInitial: builder.query<string[], void>({
      query: () => 'Initial',
      providesTags: ['Initial'],
    }),
    getCases: builder.query<CaseListItem[], Record<string, never>>({
      query: () => 'GetCases',
      providesTags: ['Case'],
    }),
    getCase: builder.query<GetCaseResponse, string>({
      query: (id) => ({
        url: 'GetCase',
        params: { id },
      }),
      providesTags: (_result, _error, id) => [{ type: 'Case', id }],
    }),
    getCaseForAdmin: builder.query<
      GetCaseResponse,
      { userId: string; id: string }
    >({
      query: ({ userId, id }) => ({
        url: 'GetCaseForAdmin',
        params: { userId, id },
      }),
      providesTags: (_result, _error, params) => [
        { type: 'Case', id: params.id },
      ],
    }),
    getAdminCases: builder.query<
      CaseListItem[],
      { organizationId?: string; userId?: string } | void
    >({
      query: (params) => ({
        url: 'GetCasesForAdmin',
        params: params ?? {},
      }),
      providesTags: ['Case'],
    }),
    getCaseLogs: builder.query<
      GetCaseLogsResponse,
      { id: string; userId?: string }
    >({
      query: ({ id, userId }) => ({
        url: 'Logs',
        params: userId ? { id, userId } : { id },
      }),
    }),
    createCase: builder.mutation<CreateCaseResponse, CreateCaseRequest>({
      query: (body) => ({
        url: 'CreateCase',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Case'],
    }),
    createCaseByNamelist: builder.mutation<
      CreateCaseResponse,
      CreateCaseByNamelistRequest
    >({
      query: (body) => ({
        url: 'CreateCaseByNamelist',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Case'],
    }),
    terminateCase: builder.mutation<
      { success: boolean; message?: string },
      { id: string }
    >({
      query: (body) => ({
        url: 'TerminateCase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Case'],
    }),
  }),
});

export const {
  useGetCasesQuery,
  useGetCaseQuery,
  useLazyGetCaseQuery,
  useGetCaseForAdminQuery,
  useGetAdminCasesQuery,
  useLazyGetAdminCasesQuery,
  useGetCaseLogsQuery,
  useLazyGetCaseLogsQuery,
  useCreateCaseMutation,
  useCreateCaseByNamelistMutation,
  useTerminateCaseMutation,
  useGetInitialQuery,
} = caseApi;
