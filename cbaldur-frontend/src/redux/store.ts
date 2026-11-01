import { configureStore } from '@reduxjs/toolkit';
import { caseApi } from './api/case';
import { userApi } from './api/user';
import { plotApi } from './api/plot';
import { noticeApi } from './api/notice';
import { organizationApi } from './api/organization';
import { paperApi } from './api/paper';
import { aiApi } from './api/ai';
import inputReducer from './slices/inputSlice';
import inputsReducer from './slices/inputsSlice';
import navigationReducer from './slices/navigationSlice';
import dynamicFormReducer from './slices/dynamicFormSlice';
import localeReducer from './slices/localeSlice';

export const store = configureStore({
  reducer: {
    input: inputReducer,
    inputs: inputsReducer,
    navigation: navigationReducer,
    dynamicForm: dynamicFormReducer,
    locale: localeReducer,
    [caseApi.reducerPath]: caseApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [plotApi.reducerPath]: plotApi.reducer,
    [noticeApi.reducerPath]: noticeApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
    [paperApi.reducerPath]: paperApi.reducer,
    [aiApi.reducerPath]: aiApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      caseApi.middleware,
      userApi.middleware,
      plotApi.middleware,
      noticeApi.middleware,
      organizationApi.middleware,
      paperApi.middleware,
      aiApi.middleware,
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
