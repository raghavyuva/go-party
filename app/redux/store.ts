import { combineReducers, configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { partyApi } from '@/redux/services/apiService';
import authReducer from '@/redux/features/users/authSlice';

const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['auth'],
};

const rootReducer = combineReducers({
    [partyApi.reducerPath]: partyApi.reducer,
    auth: authReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const storeOptions: ConfigureStoreOptions = {
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }).concat(
            partyApi.middleware,
        ),
};

export const store = configureStore(storeOptions);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
