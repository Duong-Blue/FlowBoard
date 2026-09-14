import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Organization } from '../types';

interface OrgState {
  list: Organization[];
  activeOrgId: string | null;
  loading: boolean;
}

const initialState: OrgState = {
  list: [],
  activeOrgId: null,
  loading: false,
};

const orgSlice = createSlice({
  name: 'org',
  initialState,
  reducers: {
    setOrgs: (state, action: PayloadAction<Organization[]>) => {
      state.list = action.payload;
    },
    updateOrg: (state, action: PayloadAction<Organization>) => {
      const index = state.list.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    removeOrg: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(o => o.id !== action.payload);
      if (state.activeOrgId === action.payload) {
        state.activeOrgId = state.list[0]?.id || null;
      }
    },
    setActiveOrg: (state, action: PayloadAction<string>) => {
      state.activeOrgId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setOrgs, updateOrg, removeOrg, setActiveOrg, setLoading } = orgSlice.actions;
export default orgSlice.reducer;
