import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SearchEntityType, SearchFilters } from '../types';

export interface SearchState {
  isModalOpen: boolean;
  recentQueries: string[];
  activeQuery: string;
  selectedType: SearchEntityType;
  filters: SearchFilters;
}

const loadRecentQueries = (): string[] => {
  try {
    const stored = localStorage.getItem('recent_searches');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
      .slice(0, 5);
  } catch {
    return [];
  }
};

const saveRecentQueries = (queries: string[]) => {
  try {
    localStorage.setItem('recent_searches', JSON.stringify(queries));
  } catch {
    // Ignore storage quota or security errors
  }
};

const initialState: SearchState = {
  isModalOpen: false,
  recentQueries: loadRecentQueries(),
  activeQuery: '',
  selectedType: 'ISSUE',
  filters: {},
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isModalOpen = action.payload;
    },
    toggleModal: (state) => {
      state.isModalOpen = !state.isModalOpen;
    },
    addRecentQuery: (state, action: PayloadAction<string>) => {
      const sanitized = action.payload ? action.payload.trim() : '';
      if (!sanitized) return;

      const filtered = state.recentQueries.filter((q) => q !== sanitized);
      const updated = [sanitized, ...filtered].slice(0, 5);
      state.recentQueries = updated;
      saveRecentQueries(updated);
    },
    clearRecentQueries: (state) => {
      state.recentQueries = [];
      try {
        localStorage.removeItem('recent_searches');
      } catch {
        // Ignore storage errors
      }
    },
    setQuery: (state, action: PayloadAction<string>) => {
      state.activeQuery = action.payload;
    },
    setSelectedType: (state, action: PayloadAction<SearchEntityType>) => {
      state.selectedType = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setModalOpen,
  toggleModal,
  addRecentQuery,
  clearRecentQueries,
  setQuery,
  setSelectedType,
  setFilters,
  resetFilters,
} = searchSlice.actions;

export default searchSlice.reducer;
