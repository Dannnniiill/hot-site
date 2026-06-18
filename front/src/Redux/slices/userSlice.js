import { createAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL, REQUEST_TIMEOUT_MS } from '../../constats';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

const getErrorMessage = (err, fallbackText) => {
	if (err?.response?.data?.message) return err.response.data.message;
	if (typeof err?.response?.data === 'string') return err.response.data;
	if (err?.message) return err.message;
	return fallbackText;
};

const jsonConfig = {
	headers: { 'Content-Type': 'application/json' },
	timeout: REQUEST_TIMEOUT_MS,
};

export const sendFeedback = createAsyncThunk('user/sendFeedback', async (data, thunkAPI) => {
	try {
		const res = await axios.post(
			`${API_BASE}/feedback/`,
			{
				first_name: data.first_name,
				last_name: data.last_name,
				phone_number: data.phone_number,
			},
			jsonConfig,
		);
		return res.data;
	} catch (err) {
		return thunkAPI.rejectWithValue({
			message: getErrorMessage(err, 'Не удалось отправить обратную связь'),
			status: err?.response?.status || 500,
			data: err?.response?.data || null,
		});
	}
});

export const getRooms = createAsyncThunk('user/getRooms', async (data, thunkAPI) => {
	try {
		const res = await axios.post(
			`${API_BASE}/rooms/`,
			{
				start_date: data.start_date,
				end_date: data.end_date,
				persons: data.persons,
				type: data.type,
			},
			jsonConfig,
		);
		return res.data;
	} catch (err) {
		return thunkAPI.rejectWithValue({
			message: getErrorMessage(err, 'Не удалось получить список номеров'),
			status: err?.response?.status || 500,
			data: err?.response?.data || null,
		});
	}
});

export const sendBook = createAsyncThunk('user/sendBook', async (data, thunkAPI) => {
	try {
		const res = await axios.post(
			`${API_BASE}/book/`,
			{
				first_name: data.first_name,
				last_name: data.last_name,
				phone_number: data.phone_number,
				email: data.email,
				comment: data.comment,
				start_date: data.start_date,
				end_date: data.end_date,
				amount: data.amount,
				type: data.type,
				nights: data.nights,
				promo_code: data.promo_code || '',
				promo_discount: data.promo_discount || 0,
				total_price: data.total_price || 0,
			},
			jsonConfig,
		);
		return res.data;
	} catch (err) {
		return thunkAPI.rejectWithValue({
			message: getErrorMessage(err, 'Не удалось отправить бронирование'),
			status: err?.response?.status || 500,
			data: err?.response?.data || null,
		});
	}
});

export const selectRoom = createAction('SELECT-ROOM');
export const clearRooms = createAction('CLEAR-ROOMS');
export const clearStatus = createAction('CLEAR-STATUS');

const userSlice = createSlice({
	name: 'user',
	initialState: {
		data: null,
		isLoading: false,
		isError: false,
		isSuccess: false,
		errorMessage: '',
		selectedRoomData: {},
	},
	extraReducers: (builder) => {
		builder.addCase(sendFeedback.pending, (state) => {
			state.isLoading = true;
			state.isError = false;
			state.isSuccess = false;
			state.errorMessage = '';
		});
		builder.addCase(sendFeedback.fulfilled, (state) => {
			state.isLoading = false;
			state.isError = false;
			state.isSuccess = true;
			state.errorMessage = '';
		});
		builder.addCase(sendFeedback.rejected, (state, action) => {
			state.isLoading = false;
			state.isError = true;
			state.isSuccess = false;
			state.errorMessage = action.payload?.message || 'Ошибка отправки обратной связи';
		});

		builder.addCase(getRooms.pending, (state) => {
			state.isLoading = true;
			state.isError = false;
			state.isSuccess = false;
			state.errorMessage = '';
		});
		builder.addCase(getRooms.fulfilled, (state, action) => {
			state.isLoading = false;
			state.data = action.payload;
			state.isError = false;
			state.isSuccess = true;
			state.errorMessage = '';
		});
		builder.addCase(getRooms.rejected, (state, action) => {
			state.isLoading = false;
			state.isError = true;
			state.isSuccess = false;
			state.errorMessage = action.payload?.message || 'Ошибка получения номеров';
		});

		builder.addCase(sendBook.pending, (state) => {
			state.isLoading = true;
			state.isError = false;
			state.isSuccess = false;
			state.errorMessage = '';
		});
		builder.addCase(sendBook.fulfilled, (state) => {
			state.isLoading = false;
			state.isError = false;
			state.isSuccess = true;
			state.errorMessage = '';
		});
		builder.addCase(sendBook.rejected, (state, action) => {
			state.isLoading = false;
			state.isError = true;
			state.isSuccess = false;
			state.errorMessage = action.payload?.message || 'Ошибка отправки бронирования';
		});

		builder.addCase(selectRoom, (state, action) => {
			state.selectedRoomData = action.payload;
		});

		builder.addCase(clearRooms, (state) => {
			state.data = null;
			state.isLoading = false;
			state.isError = false;
			state.isSuccess = false;
			state.errorMessage = '';
		});

		builder.addCase(clearStatus, (state) => {
			state.isLoading = false;
			state.isError = false;
			state.isSuccess = false;
			state.errorMessage = '';
		});
	},
});

export default userSlice.reducer;