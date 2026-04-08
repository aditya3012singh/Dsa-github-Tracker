import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: (import.meta as any).env.VITE_API_BASE_URL || '/api',
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
    updateProfile: builder.mutation({
      query: (userData) => ({
        url: '/students/profile',
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['Student', 'Leaderboard'],
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
    getRankHistory: builder.query({
      query: (studentId) => `/leaderboard/rank-history/${studentId}`,
      providesTags: (result, error, id) => [{ type: 'Student', id: `${id}-history` }],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useGetStudentQuery,
  useLoginMutation,
  useRegisterMutation,
  useUpdateProfileMutation,
  useTriggerFetchMutation,
  useSyncAllMutation,
  useGetRankHistoryQuery,
} = apiSlice;
