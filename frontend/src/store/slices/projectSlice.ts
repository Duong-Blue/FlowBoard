import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type Project } from '../types';

interface ProjectState {
  list: Project[];
  activeProjectId: string | null;
  loading: boolean;
}

const initialState: ProjectState = {
  list: [],
  activeProjectId: null,
  loading: false,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.list = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.list.push(action.payload);
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.list.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(p => p.id !== action.payload);
      if (state.activeProjectId === action.payload) {
        state.activeProjectId = null;
      }
    },
    setActiveProject: (state, action: PayloadAction<string>) => {
      state.activeProjectId = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { setProjects, addProject, updateProject, removeProject, setActiveProject, setLoading } = projectSlice.actions;
export default projectSlice.reducer;
