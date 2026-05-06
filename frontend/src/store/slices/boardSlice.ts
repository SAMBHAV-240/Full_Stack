import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Board, BoardState, CreateBoardData, List, Task } from '../../types';
import { api } from '../../services/api';
import { socketService } from '../../services/socket';

const initialState: BoardState = {
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchBoards = createAsyncThunk(
  'boards/fetchBoards',
  async (params?: { query?: string }, { rejectWithValue }) => {
    try {
      const result = await api.getBoards(params);
      return result.boards;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch boards');
    }
  }
);

export const fetchBoard = createAsyncThunk(
  'boards/fetchBoard',
  async (id: string, { rejectWithValue }) => {
    try {
      const board = await api.getBoard(id);
      socketService.joinBoard(id);
      return board;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch board');
    }
  }
);

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (data: CreateBoardData, { rejectWithValue }) => {
    try {
      return await api.createBoard(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create board');
    }
  }
);

export const updateBoard = createAsyncThunk(
  'boards/updateBoard',
  async ({ id, data }: { id: string; data: Partial<CreateBoardData> }, { rejectWithValue }) => {
    try {
      return await api.updateBoard(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update board');
    }
  }
);

export const deleteBoard = createAsyncThunk(
  'boards/deleteBoard',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteBoard(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete board');
    }
  }
);

export const addBoardMember = createAsyncThunk<
  string,
  { boardId: string; email: string; role?: string }
>(
  'boards/addBoardMember',
  async ({ boardId, email, role = 'member' }, { rejectWithValue }) => {
    try {
      await api.addBoardMember(boardId, email, role);
      // Return the board ID to trigger a refresh
      return boardId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add member');
    }
  }
);

// List thunks
export const createList = createAsyncThunk(
  'boards/createList',
  async (data: { name: string; boardId: string }, { rejectWithValue }) => {
    try {
      return await api.createList(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create list');
    }
  }
);

export const updateList = createAsyncThunk(
  'boards/updateList',
  async ({ id, data }: { id: string; data: { name: string } }, { rejectWithValue }) => {
    try {
      return await api.updateList(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update list');
    }
  }
);

export const deleteList = createAsyncThunk(
  'boards/deleteList',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteList(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete list');
    }
  }
);

// Task thunks
export const createTask = createAsyncThunk(
  'boards/createTask',
  async (data: { title: string; listId: string; description?: string }, { rejectWithValue }) => {
    try {
      return await api.createTask(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'boards/updateTask',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await api.updateTask(id, data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update task');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'boards/deleteTask',
  async ({ id, listId }: { id: string; listId: string }, { rejectWithValue }) => {
    try {
      await api.deleteTask(id);
      return { id, listId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete task');
    }
  }
);

export const moveTask = createAsyncThunk(
  'boards/moveTask',
  async (
    { id, sourceListId, targetListId, position }: { 
      id: string; 
      sourceListId: string; 
      targetListId: string; 
      position: number 
    },
    { rejectWithValue }
  ) => {
    try {
      const task = await api.moveTask(id, { listId: targetListId, position });
      return { task, sourceListId, targetListId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to move task');
    }
  }
);

const boardSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    clearCurrentBoard: (state) => {
      if (state.currentBoard) {
        socketService.leaveBoard(state.currentBoard.id);
      }
      state.currentBoard = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Socket update handlers
    updateBoardFromSocket: (state, action: PayloadAction<Board>) => {
      if (state.currentBoard?.id === action.payload.id) {
        state.currentBoard = { ...state.currentBoard, ...action.payload };
      }
      const index = state.boards.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) {
        state.boards[index] = { ...state.boards[index], ...action.payload };
      }
    },
    updateListFromSocket: (
      state,
      action: PayloadAction<{ type: string; data: any }>
    ) => {
      if (!state.currentBoard?.lists) return;
      
      const { type, data } = action.payload;
      
      switch (type) {
        case 'create':
          state.currentBoard.lists.push({ ...data, tasks: data.tasks || [] });
          break;
        case 'update': {
          const listIndex = state.currentBoard.lists.findIndex((l) => l.id === data.id);
          if (listIndex !== -1) {
            state.currentBoard.lists[listIndex] = {
              ...state.currentBoard.lists[listIndex],
              ...data,
            };
          }
          break;
        }
        case 'delete':
          state.currentBoard.lists = state.currentBoard.lists.filter(
            (l) => l.id !== data.id
          );
          break;
        case 'reorder':
          if (data.lists) {
            state.currentBoard.lists = data.lists;
          }
          break;
      }
    },
    updateTaskFromSocket: (
      state,
      action: PayloadAction<{ type: string; data: any }>
    ) => {
      if (!state.currentBoard?.lists) return;
      
      const { type, data } = action.payload;
      
      switch (type) {
        case 'create': {
          const listIndex = state.currentBoard.lists.findIndex(
            (l) => l.id === data.listId
          );
          if (listIndex !== -1) {
            state.currentBoard.lists[listIndex].tasks.push(data);
          }
          break;
        }
        case 'update': {
          for (const list of state.currentBoard.lists) {
            const taskIndex = list.tasks.findIndex((t) => t.id === data.id);
            if (taskIndex !== -1) {
              list.tasks[taskIndex] = { ...list.tasks[taskIndex], ...data };
              break;
            }
          }
          break;
        }
        case 'delete': {
          const listIndex = state.currentBoard.lists.findIndex(
            (l) => l.id === data.listId
          );
          if (listIndex !== -1) {
            state.currentBoard.lists[listIndex].tasks = state.currentBoard.lists[
              listIndex
            ].tasks.filter((t) => t.id !== data.id);
          }
          break;
        }
        case 'move': {
          const { task, sourceListId, targetListId } = data;
          // Remove from source list
          const sourceList = state.currentBoard.lists.find(
            (l) => l.id === sourceListId
          );
          if (sourceList) {
            sourceList.tasks = sourceList.tasks.filter((t) => t.id !== task.id);
          }
          // Add to target list
          const targetList = state.currentBoard.lists.find(
            (l) => l.id === targetListId
          );
          if (targetList) {
            targetList.tasks.splice(task.position, 0, task);
          }
          break;
        }
      }
    },
    // Optimistic update for drag and drop
    optimisticMoveTask: (
      state,
      action: PayloadAction<{
        taskId: string;
        sourceListId: string;
        targetListId: string;
        sourceIndex: number;
        targetIndex: number;
      }>
    ) => {
      if (!state.currentBoard?.lists) return;
      
      const { taskId, sourceListId, targetListId, targetIndex } = action.payload;
      
      const sourceList = state.currentBoard.lists.find((l) => l.id === sourceListId);
      const targetList = state.currentBoard.lists.find((l) => l.id === targetListId);
      
      if (!sourceList || !targetList) return;
      
      const taskIndex = sourceList.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return;
      
      const [task] = sourceList.tasks.splice(taskIndex, 1);
      task.listId = targetListId;
      targetList.tasks.splice(targetIndex, 0, task);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch boards
      .addCase(fetchBoards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch single board
      .addCase(fetchBoard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBoard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBoard = action.payload;
      })
      .addCase(fetchBoard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create board
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards.unshift(action.payload);
      })
      // Update board
      .addCase(updateBoard.fulfilled, (state, action) => {
        const index = state.boards.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.boards[index] = { ...state.boards[index], ...action.payload };
        }
        if (state.currentBoard?.id === action.payload.id) {
          state.currentBoard = { ...state.currentBoard, ...action.payload };
        }
      })
      // Delete board
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter((b) => b.id !== action.payload);
        if (state.currentBoard?.id === action.payload) {
          state.currentBoard = null;
        }
      })
      // Add board member
      .addCase(addBoardMember.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addBoardMember.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addBoardMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create list
      .addCase(createList.fulfilled, (state, action) => {
        if (state.currentBoard) {
          state.currentBoard.lists = state.currentBoard.lists || [];
          state.currentBoard.lists.push({ ...action.payload, tasks: [] });
        }
      })
      // Update list
      .addCase(updateList.fulfilled, (state, action) => {
        if (state.currentBoard?.lists) {
          const index = state.currentBoard.lists.findIndex(
            (l) => l.id === action.payload.id
          );
          if (index !== -1) {
            state.currentBoard.lists[index] = {
              ...state.currentBoard.lists[index],
              ...action.payload,
            };
          }
        }
      })
      // Delete list
      .addCase(deleteList.fulfilled, (state, action) => {
        if (state.currentBoard?.lists) {
          state.currentBoard.lists = state.currentBoard.lists.filter(
            (l) => l.id !== action.payload
          );
        }
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        if (state.currentBoard?.lists) {
          const listIndex = state.currentBoard.lists.findIndex(
            (l) => l.id === action.payload.listId
          );
          if (listIndex !== -1) {
            state.currentBoard.lists[listIndex].tasks.push(action.payload);
          }
        }
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        if (state.currentBoard?.lists) {
          for (const list of state.currentBoard.lists) {
            const taskIndex = list.tasks.findIndex((t) => t.id === action.payload.id);
            if (taskIndex !== -1) {
              list.tasks[taskIndex] = { ...list.tasks[taskIndex], ...action.payload };
              break;
            }
          }
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        if (state.currentBoard?.lists) {
          const listIndex = state.currentBoard.lists.findIndex(
            (l) => l.id === action.payload.listId
          );
          if (listIndex !== -1) {
            state.currentBoard.lists[listIndex].tasks = state.currentBoard.lists[
              listIndex
            ].tasks.filter((t) => t.id !== action.payload.id);
          }
        }
      })
      // Move task
      .addCase(moveTask.fulfilled, (state, action) => {
        // The optimistic update already handled the UI change
        // This just confirms the server update succeeded
      })
      .addCase(moveTask.rejected, (state, action) => {
        // Refresh board to get correct state on failure
        state.error = action.payload as string;
      });
  },
});

export const {
  clearCurrentBoard,
  clearError,
  updateBoardFromSocket,
  updateListFromSocket,
  updateTaskFromSocket,
  optimisticMoveTask,
} = boardSlice.actions;

export default boardSlice.reducer;
