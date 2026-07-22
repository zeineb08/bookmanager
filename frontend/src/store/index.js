import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookReducer from './bookSlice';
import borrowingReducer from './borrowingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: bookReducer,
    borrowings: borrowingReducer,
  },
});
