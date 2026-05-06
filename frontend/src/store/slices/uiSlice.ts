import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState, Task } from '../../types';

interface ExtendedUIState extends UIState {
  selectedTask: Task | null;
  searchQuery: string;
  addMemberModalOpen: boolean;
  darkMode: boolean;
}

const initialState: ExtendedUIState = {
  sidebarOpen: true,
  taskModalOpen: false,
  createBoardModalOpen: false,
  createListModalOpen: false,
  addMemberModalOpen: false,
  selectedTask: null,
  searchQuery: '',
  darkMode: localStorage.getItem('theme') === 'dark',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    openTaskModal: (state, action: PayloadAction<Task>) => {
      state.selectedTask = action.payload;
      state.taskModalOpen = true;
    },
    closeTaskModal: (state) => {
      state.taskModalOpen = false;
      state.selectedTask = null;
    },
    setSelectedTask: (state, action: PayloadAction<Task | null>) => {
      state.selectedTask = action.payload;
    },
    openCreateBoardModal: (state) => {
      state.createBoardModalOpen = true;
    },
    closeCreateBoardModal: (state) => {
      state.createBoardModalOpen = false;
    },
    openCreateListModal: (state) => {
      state.createListModalOpen = true;
    },
    closeCreateListModal: (state) => {
      state.createListModalOpen = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    openAddMemberModal: (state) => {
      state.addMemberModalOpen = true;
    },
    closeAddMemberModal: (state) => {
      state.addMemberModalOpen = false;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('theme', state.darkMode ? 'dark' : 'light');
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('theme', action.payload ? 'dark' : 'light');
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  openTaskModal,
  closeTaskModal,
  openAddMemberModal,
  closeAddMemberModal,
  setSelectedTask,
  openCreateBoardModal,
  closeCreateBoardModal,
  openCreateListModal,
  closeCreateListModal,
  setSearchQuery,
  toggleDarkMode,
  setDarkMode,
} = uiSlice.actions;

export default uiSlice.reducer;
