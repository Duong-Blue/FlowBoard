import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const getStoredUser = (): User | null => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      localStorage.removeItem('user');
      return null;
    }
    const item = localStorage.getItem('user');
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

const initialState: AuthState = {
  user: initialUser,
  accessToken: null,
  isAuthenticated: !!initialUser,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; accessToken: string }>) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
    },
    updateUserLocally: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
});

export const { setCredentials, logout, updateUserLocally } = authSlice.actions;
export default authSlice.reducer;

