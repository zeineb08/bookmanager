import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const borrowBook = createAsyncThunk(
  'borrowings/borrow',
  async (bookId, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/borrowings', { bookId });
      toast.success('Book borrowed successfully!');
      if (window.addNotification) {
        window.addNotification('borrow', `You borrowed a book successfully`);
      }
      return data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to borrow book';
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const returnBook = createAsyncThunk(
  'borrowings/return',
  async (borrowingId, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/borrowings/${borrowingId}/return`);
      toast.success('Book returned successfully!');
      if (window.addNotification) {
        window.addNotification('return', `You returned a book successfully`);
      }
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to return book');
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const fetchUserBorrowings = createAsyncThunk(
  'borrowings/fetchUser',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/borrowings/user/${userId}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch borrowings');
    }
  },
);

export const fetchAllBorrowings = createAsyncThunk(
  'borrowings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/borrowings');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch borrowings');
    }
  },
);

const borrowingSlice = createSlice({
  name: 'borrowings',
  initialState: {
    items: [],
    allBorrowings: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(borrowBook.pending, (state) => {
        state.loading = true;
      })
      .addCase(borrowBook.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items.unshift(payload);
      })
      .addCase(borrowBook.rejected, (state) => {
        state.loading = false;
      })
      .addCase(returnBook.fulfilled, (state, { payload }) => {
        const index = state.items.findIndex((b) => b._id === payload._id);
        if (index !== -1) state.items[index] = payload;
      })
      .addCase(fetchUserBorrowings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserBorrowings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload;
      })
      .addCase(fetchUserBorrowings.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchAllBorrowings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllBorrowings.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.allBorrowings = payload;
      })
      .addCase(fetchAllBorrowings.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default borrowingSlice.reducer;
