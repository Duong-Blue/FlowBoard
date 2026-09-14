import { store } from './index';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  key?: string;
  status?: string;
  description?: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  orgId: string;
}
