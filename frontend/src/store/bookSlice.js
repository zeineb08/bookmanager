import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const fetchBooks = createAsyncThunk(
  'books/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/books', { params });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch books');
    }
  },
);

export const fetchBookById = createAsyncThunk(
  'books/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/books/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch book');
    }
  },
);

export const createBook = createAsyncThunk(
  'books/create',
  async (bookData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/books', bookData);
      toast.success('Book created successfully');
      return data;
    } catch (error) {
      const message = error.response?.data?.message?.[0] || error.response?.data?.message || 'Failed to create book';
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const updateBook = createAsyncThunk(
  'books/update',
  async ({ id, ...bookData }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/books/${id}`, bookData);
      toast.success('Book updated successfully');
      return data;
    } catch (error) {
      const message = error.response?.data?.message?.[0] || error.response?.data?.message || 'Failed to update book';
      toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const deleteBook = createAsyncThunk(
  'books/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/books/${id}`);
      toast.success('Book deleted successfully');
      return id;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete book');
      return rejectWithValue(error.response?.data?.message);
    }
  },
);

export const fetchCategories = createAsyncThunk(
  'books/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/books/categories');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  },
);

const bookSlice = createSlice({
  name: 'books',
  initialState: {
    items: [],
    currentBook: null,
    categories: [],
    total: 0,
    page: 1,
    totalPages: 1,
    hasMore: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentBook: (state) => {
      state.currentBook = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBooks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBooks.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.books;
        state.total = payload.total;
        state.page = payload.page;
        state.totalPages = payload.totalPages;
        state.hasMore = payload.hasMore;
      })
      .addCase(fetchBooks.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(fetchBookById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookById.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentBook = payload;
      })
      .addCase(fetchBookById.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      .addCase(createBook.fulfilled, (state, { payload }) => {
        state.items.unshift(payload);
      })
      .addCase(updateBook.fulfilled, (state, { payload }) => {
        const index = state.items.findIndex((b) => b._id === payload._id);
        if (index !== -1) state.items[index] = payload;
        if (state.currentBook?._id === payload._id) state.currentBook = payload;
      })
      .addCase(deleteBook.fulfilled, (state, { payload }) => {
        state.items = state.items.filter((b) => b._id !== payload);
      })
      .addCase(fetchCategories.fulfilled, (state, { payload }) => {
        state.categories = payload;
      });
  },
});

export const { clearCurrentBook } = bookSlice.actions;
export default bookSlice.reducer;
