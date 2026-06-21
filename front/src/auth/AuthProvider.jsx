import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../constats';

const AuthContext = createContext(null);
const CURRENT_USER_KEY = 'hotel_current_user';
const ADMIN_EMAIL = 'sokolnikovdanil85@gmail.com';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [authReady, setAuthReady] = useState(false);

	useEffect(() => {
		try {
			const savedUser = localStorage.getItem(CURRENT_USER_KEY);
			if (savedUser) {
				const parsedUser = JSON.parse(savedUser);
				const normalizedUser = normalizeUserRole(parsedUser);
				localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
				setUser(normalizedUser);
			}
		} catch (error) {
			console.error('Ошибка чтения пользователя из localStorage:', error);
		} finally {
			setAuthReady(true);
		}
	}, []);

	const register = async ({ name, email, password }) => {
		try {
			const response = await axios.post(
				`${API_BASE}/auth/register/`,
				{
					name,
					email,
					password,
					phone: '',
				},
				{
					headers: { 'Content-Type': 'application/json' },
					timeout: 10000,
				},
			);

			const normalizedUser = normalizeUserRole(response.data.user);
			localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
			setUser(normalizedUser);

			return {
				success: true,
				message: response.data?.message || 'Регистрация выполнена успешно',
				user: normalizedUser,
			};
		} catch (error) {
			return {
				success: false,
				message: error?.response?.data?.message || 'Не удалось зарегистрироваться',
			};
		}
	};

	const login = async ({ email, password }) => {
		try {
			const response = await axios.post(
				`${API_BASE}/auth/login/`,
				{
					email,
					password,
				},
				{
					headers: { 'Content-Type': 'application/json' },
					timeout: 10000,
				},
			);

			const normalizedUser = normalizeUserRole(response.data.user);
			localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
			setUser(normalizedUser);

			return {
				success: true,
				message: response.data?.message || 'Вход выполнен успешно',
				user: normalizedUser,
			};
		} catch (error) {
			return {
				success: false,
				message: error?.response?.data?.message || 'Неверный email или пароль',
			};
		}
	};

	const updateProfile = async ({ name, email, phone, password }) => {
		if (!user) {
			return { success: false, message: 'Пользователь не найден' };
		}

		try {
			const payload = {
				user_id: user.id,
				name,
				email,
				phone,
			};

			if (password) {
				payload.password = password;
			}

			const response = await axios.post(`${API_BASE}/auth/profile/update/`, payload, {
				headers: { 'Content-Type': 'application/json' },
				timeout: 10000,
			});

			const normalizedUser = normalizeUserRole(response.data.user);
			localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
			setUser(normalizedUser);

			return {
				success: true,
				message: response.data?.message || 'Профиль обновлён',
				user: normalizedUser,
			};
		} catch (error) {
			return {
				success: false,
				message: error?.response?.data?.message || 'Не удалось обновить профиль',
			};
		}
	};

	const logout = () => {
		localStorage.removeItem(CURRENT_USER_KEY);
		setUser(null);
	};

	const value = {
		user,
		authReady,
		isAuthenticated: !!user,
		isAdmin: user?.role === 'admin',
		register,
		login,
		updateProfile,
		logout,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function normalizeUserRole(user) {
	if (!user) return null;

	const isAdminEmail = String(user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

	return {
		...user,
		role: isAdminEmail ? 'admin' : 'user',
	};
}

export function useAuth() {
	return useContext(AuthContext);
}