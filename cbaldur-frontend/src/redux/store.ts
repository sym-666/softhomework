import { configureStore } from '@reduxjs/toolkit';
import { userApi } from './api/user';
import { paperApi } from './api/paper';
import { aiApi } from './api/ai';
import localeReducer from './slices/localeSlice';

export const store = configureStore({
  reducer: {
    locale: localeReducer,
    [userApi.reducerPath]: userApi.reducer,
    [paperApi.reducerPath]: paperApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userApi.middleware,
      paperApi.middleware,
      aiApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
