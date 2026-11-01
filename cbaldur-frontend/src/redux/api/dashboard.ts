import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface DailyActivity {
  date: string;
  papers: number;
  notes: number;
}

export interface ContinueReadingItem {
  paperId: number;
  title: string;
  authors: string;
  lastPage: number;
}

export interface Dashboard {
  totalPapers: number;
  reading: number;
  done: number;
  notes: number;
  dueCards: number;
  activity: DailyActivity[];
  continueReading: ContinueReadingItem[];
}

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  endpoints: (builder) => ({
    getDashboard: builder.query<Dashboard, void>({
      // 服务端按用户时区分天
      query: () => ({
        url: '/Dashboard',
        params: { tzOffset: new Date().getTimezoneOffset() },
      }),
    }),
  }),
});

export const { useGetDashboardQuery } = dashboardApi;
