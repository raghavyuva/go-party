import { partyApi } from '@/redux/services/apiService';
import { User } from '@/redux/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

const isClient = typeof window !== 'undefined';

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
};

const setTokenToStorage = (token: string) => {
    if (isClient && token) {
        try {
            localStorage.setItem('token', token);
            localStorage.setItem('lastLogin', new Date().toISOString());
        } catch (error) {
            console.error('Failed to save token to localStorage:', error);
        }
    }
};

const removeTokenFromStorage = () => {
    if (isClient) {
        try {
            localStorage.removeItem('token');
            localStorage.removeItem('lastLogin');
        } catch (error) {
            console.error('Failed to remove token from localStorage:', error);
        }
    }
};

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
            const { user, token } = action.payload;
            if (token) {
                state.token = token;
                state.isAuthenticated = true;
                setTokenToStorage(token);
            }
            state.user = user;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            removeTokenFromStorage();
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(partyApi.endpoints.loginUser.matchFulfilled, (state, { payload }) => {
                if (payload?.token) {
                    state.user = {
                        id: payload.id,
                        username: payload.username,
                        email: payload.email,
                    };
                    state.token = payload.token;
                    state.isAuthenticated = true;
                    setTokenToStorage(payload.token);
                }
            })
            .addMatcher(partyApi.endpoints.getUserDetails.matchFulfilled, (state, { payload }) => {
                if (payload) {
                    state.user = payload;
                }
            });
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
