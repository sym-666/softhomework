import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface CasesPlot {
  /** Case UUID */
  caseId: string;
  times: string[];
}

export interface GetPlotParams {
  /** Case UUID */
  caseId: string;
  type: string;
  time: string;
  x: string;
  y: string;
}

export interface PlotPoint {
  x: number;
  y: number;
  type?: string;
  time?: string;
  variables?: Record<string, number>;
}

export interface GetPlotWithVariablesBody extends GetPlotParams {
  variables?: string[];
}

export interface GetPlotAcrossTimesBody {
  caseId: string;
  type: string;
  times: string[];
  x: string;
  y: string;
  variables?: string[];
}

export interface GetPlotAcrossCasesBody {
  type: string;
  cases: CasesPlot[];
  x: string;
  y: string;
  variables?: string[];
}

export const plotApi = createApi({
  reducerPath: 'plotApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/Plot' }),
  endpoints: (builder) => ({
    getTimes: builder.query<string[], { caseId: string; type: string }>({
      query: (params) => ({
        url: 'GetTimes',
        params,
      }),
    }),
    getHeaders: builder.query<string[], { caseId: string; type: string }>({
      query: (params) => ({
        url: 'GetHeaders',
        params,
      }),
    }),
    getPlot: builder.query<PlotPoint[], GetPlotParams>({
      query: (params) => ({
        url: 'GetPlot',
        params,
      }),
    }),
    getPlotWithVariables: builder.mutation<
      PlotPoint[],
      GetPlotWithVariablesBody
    >({
      query: (body) => ({
        url: 'GetPlotWithVariables',
        method: 'POST',
        body,
      }),
    }),
    getPlotAcrossTimes: builder.mutation<any[], GetPlotAcrossTimesBody>({
      query: (body) => ({
        url: 'GetPlotAcrossTimes',
        method: 'POST',
        body,
      }),
    }),
    getPlotAcrossCases: builder.mutation<any[], GetPlotAcrossCasesBody>({
      query: (body) => ({
        url: 'GetPlotAcrossCases',
        method: 'POST',
        body,
      }),
    }),
    downloadPlotCsv: builder.mutation<Blob, GetPlotParams>({
      query: (params) => ({
        url: 'DownloadPlotCsv',
        params,
        responseHandler: (response) => response.blob(),
      }),
    }),
    downloadPlotCsvAcrossTimes: builder.mutation<Blob, GetPlotAcrossTimesBody>({
      query: (body) => ({
        url: 'DownloadPlotCsvAcrossTimes',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),
    downloadPlotCsvAcrossCases: builder.mutation<Blob, GetPlotAcrossCasesBody>({
      query: (body) => ({
        url: 'DownloadPlotCsvAcrossCases',
        method: 'POST',
        body,
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetTimesQuery,
  useLazyGetTimesQuery,
  useGetHeadersQuery,
  useGetPlotQuery,
  useGetPlotWithVariablesMutation,
  useLazyGetPlotQuery,
  useGetPlotAcrossTimesMutation,
  useGetPlotAcrossCasesMutation,
  useDownloadPlotCsvMutation,
  useDownloadPlotCsvAcrossTimesMutation,
  useDownloadPlotCsvAcrossCasesMutation,
} = plotApi;
