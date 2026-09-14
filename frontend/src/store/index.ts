import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import orgReducer from './slices/orgSlice';
import projectReducer from './slices/projectSlice';
import type { RootState, AppDispatch } from './types';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    org: orgReducer,
    project: projectReducer,
  },
});

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
