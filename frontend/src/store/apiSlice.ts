import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Leaderboard', 'Student', 'Stats'],
  endpoints: (builder) => ({
    getLeaderboard: builder.query({
      query: (params) => ({
        url: '/leaderboard',
        params,
      }),
      providesTags: ['Leaderboard'],
    }),
    getStudent: builder.query({
      query: (id) => `/students/${id}`,
      providesTags: ['Student'],
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    triggerFetch: builder.mutation({
      query: (id) => ({
        url: `/students/${id}/fetch`,
        method: 'POST',
      }),
      invalidatesTags: ['Stats', 'Leaderboard'],
    }),
    syncAll: builder.mutation({
      query: () => ({
        url: '/students/sync-all',
        method: 'POST',
      }),
      invalidatesTags: ['Leaderboard', 'Stats'],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useGetStudentQuery,
  useLoginMutation,
  useRegisterMutation,
  useTriggerFetchMutation,
  useSyncAllMutation,
} = apiSlice;
