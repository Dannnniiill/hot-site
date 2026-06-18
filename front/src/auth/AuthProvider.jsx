import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { BASE_URL, REQUEST_TIMEOUT_MS } from '../constats';

const AuthContext = createContext(null);
const CURRENT_USER_KEY = 'hotel_current_user';
const ADMIN_EMAIL = 'sokolnikovdanil85@gmail.com';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

const requestConfig = {
	headers: { 'Content-Type': 'application/json' },
	timeout: REQUEST_TIMEOUT_MS,
};

function normalizeText(value) {
	if (value === undefined || value === null) return '';
	return String(value).trim();
}

function normalizeEmail(value) {
	return normalizeText(value).toLowerCase();
}

function normalizePhone(value) {
	return normalizeText(value);
}

function extractUserFromResponse(data) {
	if (!data) return null;
	if (data.user) return data.user;
	if (data.data?.user) return data.data.user;
	if (data.result?.user) return data.result.user;
	return null;
}

function extractMessageFromError(error, fallbackMessage) {
	return (
		error?.response?.data?.message ||
		error?.response?.data?.error ||
		error?.response?.data?.detail ||
		fallbackMessage
	);
}

function normalizeUserRole(user) {
	if (!user) return null;

	const normalizedEmail = normalizeEmail(user.email);

	return {
		...user,
		id: user.id ?? user.user_id ?? null,
		name: normalizeText(user.name),
		email: normalizedEmail,
		phone: normalizePhone(user.phone),
		createdAt: user.createdAt || user.created_at || '',
		role: normalizedEmail === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
	};
}

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [authReady, setAuthReady] = useState(false);

	useEffect(() => {
		try {
			const savedUser = localStorage.getItem(CURRENT_USER_KEY);

			if (!savedUser) {
				setAuthReady(true);
				return;
			}

			const parsedUser = JSON.parse(savedUser);
			const normalizedUser = normalizeUserRole(parsedUser);

			if (normalizedUser) {
				localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
				setUser(normalizedUser);
			} else {
				localStorage.removeItem(CURRENT_USER_KEY);
				setUser(null);
			}
		} catch (error) {
			console.error('Ошибка чтения пользователя из localStorage:', error);
			localStorage.removeItem(CURRENT_USER_KEY);
			setUser(null);
		} finally {
			setAuthReady(true);
		}
	}, []);

	const saveUserToStorage = (rawUser) => {
		const normalizedUser = normalizeUserRole(rawUser);

		if (!normalizedUser) {
			localStorage.removeItem(CURRENT_USER_KEY);
			setUser(null);
			return null;
		}

		localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(normalizedUser));
		setUser(normalizedUser);
		return normalizedUser;
	};

	const register = async ({ name, email, password, phone = '' }) => {
		try {
			const response = await axios.post(
				`${API_BASE}/auth/register/`,
				{
					name: normalizeText(name),
					email: normalizeEmail(email),
					password,
					phone: normalizePhone(phone),
				},
				requestConfig,
			);

			return {
				success: true,
				message: response.data?.message || 'Код подтверждения отправлен',
			};
		} catch (error) {
			return {
				success: false,
				message: extractMessageFromError(error, 'Не удалось отправить код подтверждения'),
			};
		}
	};

	const verifyRegisterCode = async ({ email, code }) => {
		try {
			const response = await axios.post(
				`${API_BASE}/auth/register/verify/`,
				{
					email: normalizeEmail(email),
					code: normalizeText(code),
				},
				requestConfig,
			);

			const responseUser = extractUserFromResponse(response.data);
			const savedUser = saveUserToStorage(responseUser);

			if (!savedUser) {
				return {
					success: false,
					message: 'Сервер не вернул данные пользователя',
				};
			}

			return {
				success: true,
				message: response.data?.message || 'Регистрация подтверждена',
				user: savedUser,
			};
		} catch (error) {
			return {
				success: false,
				message: extractMessageFromError(error, 'Не удалось подтвердить код'),
			};
		}
	};

	const login = async ({ email, password }) => {
		try {
			const response = await axios.post(
				`${API_BASE}/auth/login/`,
				{
					email: normalizeEmail(email),
					password,
				},
				requestConfig,
			);

			const responseUser = extractUserFromResponse(response.data);
			const savedUser = saveUserToStorage(responseUser);

			if (!savedUser) {
				return {
					success: false,
					message: 'Сервер не вернул данные пользователя',
				};
			}

			return {
				success: true,
				message: response.data?.message || 'Вход выполнен успешно',
				user: savedUser,
			};
		} catch (error) {
			return {
				success: false,
				message: extractMessageFromError(error, 'Неверный email или пароль'),
			};
		}
	};

	const updateProfile = async ({ name, email, phone }) => {
		if (!user?.id) {
			return {
				success: false,
				message: 'Пользователь не найден',
			};
		}

		try {
			const response = await axios.post(
				`${API_BASE}/auth/profile/update/`,
				{
					user_id: user.id,
					name: normalizeText(name),
					email: normalizeEmail(email),
					phone: normalizePhone(phone),
				},
				requestConfig,
			);

			const responseUser = extractUserFromResponse(response.data);
			const savedUser = saveUserToStorage(responseUser);

			if (!savedUser) {
				return {
					success: false,
					message: 'Сервер не вернул обновленные данные пользователя',
				};
			}

			return {
				success: true,
				message: response.data?.message || 'Профиль обновлён',
				user: savedUser,
			};
		} catch (error) {
			return {
				success: false,
				message: extractMessageFromError(error, 'Не удалось обновить профиль'),
			};
		}
	};

	const logout = () => {
		localStorage.removeItem(CURRENT_USER_KEY);
		setUser(null);
	};

	const value = useMemo(
		() => ({
			user,
			authReady,
			isAuthenticated: !!user,
			isAdmin: user?.role === 'admin',
			register,
			verifyRegisterCode,
			login,
			updateProfile,
			logout,
		}),
		[user, authReady],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}