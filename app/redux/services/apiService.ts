import { API } from '@/redux/api-conf';
import { BASE_URL } from '@/redux/conf';
import { RootState } from '@/redux/store';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { CreateRoomRequest, CreateRoomResponse, LoginUserRequest, LoginUserResponse, User } from '../types';

export const partyApi = createApi({
    reducerPath: 'partyApi',
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['Authentication'],
    endpoints: (builder) => ({
        loginUser: builder.mutation<LoginUserResponse, LoginUserRequest>({
            query(credentials) {
                return {
                    url: API.USER_LOGIN,
                    method: 'POST',
                    body: credentials,
                };
            },
            transformResponse: (response: LoginUserResponse) => {
                return { ...response, token: response.token };
            },
            invalidatesTags: [{ type: 'Authentication', id: 'LIST' }],
        }),
        getUserDetails: builder.query<User, void>({
            query: () => ({
                url: API.USER_DETAILS,
                method: 'GET',
            }),
            providesTags: [{ type: 'Authentication', id: 'LIST' }],
            transformResponse: (response: { data: User }) => {
                return { ...response.data };
            },
        }),
        createRoom: builder.mutation<CreateRoomResponse, CreateRoomRequest>({
            query: (body) => ({
                url: API.CREATE_ROOM,
                method: 'POST',
                body: body,
            }),
            invalidatesTags: [{ type: 'Authentication', id: 'LIST' }],
            transformResponse: (response: CreateRoomResponse) => {
                return response;
            }
        }),
    }),
});

export const {
    useLoginUserMutation,
    useGetUserDetailsQuery,
    useCreateRoomMutation,
} = partyApi;
