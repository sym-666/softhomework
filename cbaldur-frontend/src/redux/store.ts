import { configureStore } from '@reduxjs/toolkit';
import { userApi } from './api/user';
import { paperApi } from './api/paper';
import { aiApi } from './api/ai';
import { noteApi } from './api/note';
import { dashboardApi } from './api/dashboard';
import localeReducer from './slices/localeSlice';

export const store = configureStore({
  reducer: {
    locale: localeReducer,
    [userApi.reducerPath]: userApi.reducer,
    [paperApi.reducerPath]: paperApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
    [noteApi.reducerPath]: noteApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userApi.middleware,
      paperApi.middleware,
      aiApi.middleware,
      noteApi.middleware,
      dashboardApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
