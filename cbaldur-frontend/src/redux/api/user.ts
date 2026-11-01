import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// 用户类型定义
export interface User {
  username: string;
  /** Same-origin avatar URL (`/api/User/Avatar?v=…`) when set; never Base64. */
  avatar: string | null;
  roleId: number;
  id: string;
  email?: string;
  organizationId?: string | null;
  isActive?: boolean;
}

// 更新用户信息请求类型
export interface UpdateUserRequest {
  id: string;
  username: string;
  email: string;
  roleId: number;
  organizationId?: string | null;
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

export interface AdminCreateUserRequest {
  username: string;
  email: string;
  password: string;
  roleId: number;
  organizationId?: string | null;
}

export interface DeleteUserRequest {
  userId: string;
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
    // 获取用户列表（管理员）
    getUsers: builder.query<User[], { includeInactive?: boolean } | void>({
      query: (params) => ({
        url: '/User/GetUsers',
        params: { includeInactive: params?.includeInactive ?? false },
      }),
      providesTags: ['User'],
    }),

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

    // 更新用户信息
    updateUser: builder.mutation<ApiResponse, UpdateUserRequest>({
      query: (data) => ({
        url: '/User/UpdateUser',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // 创建用户（超级管理员）
    createUser: builder.mutation<ApiResponse, AdminCreateUserRequest>({
      query: (data) => ({
        url: '/User/CreateUser',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // 删除用户（软删除）
    deleteUser: builder.mutation<ApiResponse, DeleteUserRequest>({
      query: (data) => ({
        url: '/User/DeleteUser',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),

    // 自助注销
    deactivateSelf: builder.mutation<ApiResponse, void>({
      query: () => ({
        url: '/User/DeactivateSelf',
        method: 'POST',
      }),
      invalidatesTags: ['User', 'Auth'],
    }),

    // 上传头像
    uploadAvatar: builder.mutation<ApiResponse, FormData>({
      query: (formData) => ({
        url: '/User/UploadAvatar',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

// 导出hooks
export const {
  useGetUsersQuery,
  useGetCurrentUserQuery,
  useValidateAuthQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useUpdateUserMutation,
  useCreateUserMutation,
  useDeleteUserMutation,
  useDeactivateSelfMutation,
  useUploadAvatarMutation,
} = userApi;
