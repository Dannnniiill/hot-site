import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

import userSlice from './slices/userSlice';

export const store = configureStore({
	reducer: { userSlice: userSlice },
	devTools: false,
	middleware: getDefaultMiddleware({
		serializableCheck: false,
	}),
});
