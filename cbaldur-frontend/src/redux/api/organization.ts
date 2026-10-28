import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface Organization {
  id: string;
  name: string;
  description?: string | null;
}

export interface ModifyOrganizationRequest {
  id: string;
  name: string;
  description?: string | null;
}

export interface DeleteOrganizationRequest {
  id: string;
}

export interface ModifyOrganizationUserRequest {
  userId?: string;
  username?: string;
  organizationId?: string;
}

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/Organization',
    credentials: 'include',
  }),
  tagTypes: ['Organization', 'OrganizationUsers'],
  endpoints: (builder) => ({
    getOrganizations: builder.query<Organization[], void>({
      query: () => 'GetOrganizations',
      providesTags: ['Organization'],
    }),
    createOrganization: builder.mutation<
      string,
      { name: string; description?: string | null }
    >({
      query: (body) => ({
        url: 'CreateOrganization',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Organization'],
    }),
    updateOrganization: builder.mutation<string, ModifyOrganizationRequest>({
      query: (body) => ({
        url: 'UpdateOrganization',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Organization'],
    }),
    deleteOrganization: builder.mutation<string, DeleteOrganizationRequest>({
      query: (body) => ({
        url: 'DeleteOrganization',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Organization'],
    }),
    addUserToOrganization: builder.mutation<any, ModifyOrganizationUserRequest>(
      {
        query: (body) => ({
          url: 'AddUserToOrganization',
          method: 'POST',
          body,
        }),
        invalidatesTags: ['OrganizationUsers'],
      },
    ),
    removeUserFromOrganization: builder.mutation<
      any,
      ModifyOrganizationUserRequest
    >({
      query: (body) => ({
        url: 'RemoveUserFromOrganization',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['OrganizationUsers'],
    }),
  }),
});

export const {
  useGetOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useAddUserToOrganizationMutation,
  useRemoveUserFromOrganizationMutation,
} = organizationApi;
