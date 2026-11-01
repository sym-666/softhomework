import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// 用户类型定义
export interface User {
  username: string;
  avatar: string | null;
  roleId: number;
  id: string;
  email?: string;
}

// 登录请求类型
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

// 注册请求类型
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// 验证响应类型
export interface ValidateResponse {
  valid: boolean;
}

// 用户API切片
export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include', // 包含cookie用于身份验证
  }),
  tagTypes: ['User', 'Auth'],
  endpoints: (builder) => ({
    // 获取当前用户信息
    getCurrentUser: builder.query<User, void>({
      query: () => '/User/GetUser',
      providesTags: ['User'],
    }),

    // 验证用户登录状态
    validateAuth: builder.query<ValidateResponse, void>({
      query: () => '/auth/validate',
      providesTags: ['Auth'],
    }),

    // 用户登录
    login: builder.mutation<ApiResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/Auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User', 'Auth'],
    }),

    // 用户注册
    register: builder.mutation<ApiResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/Auth/register',
        method: 'POST',
        body: userData,
      }),
    }),

    // 用户登出
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/Auth/Logout',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Auth'],
    }),
  }),
});

// 导出hooks
export const {
  useGetCurrentUserQuery,
  useValidateAuthQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} = userApi;
