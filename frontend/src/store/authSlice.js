import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Load user from localStorage
const user = JSON.parse(localStorage.getItem('user') || 'null');
const token = localStorage.getItem('token') || null;

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      const message = error.response?.data?.message?.[0] || error.response?.data?.message || 'Login failed';
      // toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      const message = error.response?.data?.message?.[0] || error.response?.data?.message || 'Registration failed';
      // toast.error(message);
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  toast.success('Logged out successfully');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user,
    token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.user = payload.user;
        state.token = payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
