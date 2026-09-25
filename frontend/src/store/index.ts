import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import orgReducer from './slices/orgSlice';
import projectReducer from './slices/projectSlice';
import issueReducer from './slices/issueSlice';
import notificationReducer from './slices/notificationSlice';
import { workflowsApi } from './api/workflowsApi';
import type { RootState, AppDispatch } from './types';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    org: orgReducer,
    project: projectReducer,
    issue: issueReducer,
    notification: notificationReducer,
    [workflowsApi.reducerPath]: workflowsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(workflowsApi.middleware),
});

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
