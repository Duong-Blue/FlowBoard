// @ts-nocheck
import React from 'react';
import type { PropsWithChildren } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import authReducer from '../store/slices/authSlice';
import orgReducer from '../store/slices/orgSlice';
import projectReducer from '../store/slices/projectSlice';
import issueReducer from '../store/slices/issueSlice';
import notificationReducer from '../store/slices/notificationSlice';
import { workflowsApi } from '../store/api/workflowsApi';
import type { RootState } from '../store/types';
import { Toaster } from 'sonner';
import '../i18n/config';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof configureStore>;
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    // @ts-ignore
    store = configureStore({
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
      preloadedState: preloadedState as any,
    }),
    route = '/',
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<{}>): React.ReactNode {
    return (
      <Provider store={store as any}>
        <MemoryRouter initialEntries={[route]}>
          {children}
          <Toaster />
        </MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper as any, ...renderOptions }) };
}
