import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

function AuthModal() {
	const { login, register } = useAuth();

	const [mode, setMode] = useState('register');
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const [registerForm, setRegisterForm] = useState({
		name: '',
		lastName: '',
		email: '',
		password: '',
	});

	const [loginForm, setLoginForm] = useState({
		email: '',
		password: '',
	});

	const handleRegisterChange = (e) => {
		const { name, value } = e.target;
		setRegisterForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleLoginChange = (e) => {
		const { name, value } = e.target;
		setLoginForm((prev) => ({ ...prev, [name]: value }));
	};

	const getFullName = () => {
		return `${registerForm.name.trim()} ${registerForm.lastName.trim()}`.trim();
	};

	const handleRegisterSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccessMessage('');

		if (
			!registerForm.name.trim() ||
			!registerForm.lastName.trim() ||
			!registerForm.email.trim() ||
			!registerForm.password.trim()
		) {
			setError('Заполните все поля');
			return;
		}

		const result = await register({
			name: getFullName(),
			email: registerForm.email.trim(),
			password: registerForm.password,
		});

		if (!result.success) {
			setError(result.message);
			return;
		}

		setSuccessMessage('Регистрация выполнена успешно');
	};

	const handleLoginSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccessMessage('');

		if (!loginForm.email.trim() || !loginForm.password.trim()) {
			setError('Введите email и пароль');
			return;
		}

		const result = await login(loginForm);

		if (!result.success) {
			setError(result.message);
			return;
		}

		setSuccessMessage('Вход выполнен успешно');
	};

	return (
		<div style={styles.overlay}>
			<div style={styles.modal}>
				<h2 style={styles.title}>{mode === 'register' ? 'Регистрация' : 'Вход'}</h2>

				<p style={styles.subtitle}>
					{mode === 'register'
						? 'Зарегистрируйтесь, чтобы войти на сайт'
						: 'Войдите в свой аккаунт'}
				</p>

				{error ? <div style={styles.error}>{error}</div> : null}
				{successMessage ? <div style={styles.success}>{successMessage}</div> : null}

				{mode === 'register' ? (
					<form onSubmit={handleRegisterSubmit} style={styles.form}>
						<input
							type="text"
							name="name"
							placeholder="Ваше имя"
							value={registerForm.name}
							onChange={handleRegisterChange}
							style={styles.input}
						/>

						<input
							type="text"
							name="lastName"
							placeholder="Ваша фамилия"
							value={registerForm.lastName}
							onChange={handleRegisterChange}
							style={styles.input}
						/>

						<input
							type="email"
							name="email"
							placeholder="Email"
							value={registerForm.email}
							onChange={handleRegisterChange}
							style={styles.input}
						/>

						<input
							type="password"
							name="password"
							placeholder="Пароль"
							value={registerForm.password}
							onChange={handleRegisterChange}
							style={styles.input}
						/>

						<button type="submit" style={styles.button}>
							Зарегистрироваться
						</button>
					</form>
				) : null}

				{mode === 'login' ? (
					<form onSubmit={handleLoginSubmit} style={styles.form}>
						<input
							type="email"
							name="email"
							placeholder="Email"
							value={loginForm.email}
							onChange={handleLoginChange}
							style={styles.input}
						/>
						<input
							type="password"
							name="password"
							placeholder="Пароль"
							value={loginForm.password}
							onChange={handleLoginChange}
							style={styles.input}
						/>

						<button type="submit" style={styles.button}>
							Войти
						</button>
					</form>
				) : null}

				<div style={styles.switchText}>
					{mode === 'register' ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}{' '}
					<button
						type="button"
						onClick={() => {
							setMode(mode === 'register' ? 'login' : 'register');
							setError('');
							setSuccessMessage('');
						}}
						style={styles.linkButton}
					>
						{mode === 'register' ? 'Войти' : 'Зарегистрироваться'}
					</button>
				</div>
			</div>
		</div>
	);
}

const styles = {
	overlay: {
		position: 'fixed',
		inset: 0,
		backgroundColor: 'rgba(0,0,0,0.75)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 9999,
		padding: '20px',
	},
	modal: {
		width: '100%',
		maxWidth: '480px',
		backgroundColor: '#ffffff',
		borderRadius: '16px',
		padding: '30px 24px',
		boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
	},
	title: {
		margin: 0,
		marginBottom: '8px',
		fontSize: '30px',
		fontWeight: 700,
		textAlign: 'center',
		color: '#1f2937',
	},
	subtitle: {
		marginTop: 0,
		marginBottom: '24px',
		textAlign: 'center',
		color: '#666',
		lineHeight: 1.5,
		fontSize: '16px',
	},
	error: {
		backgroundColor: '#ffe1e1',
		color: '#a10000',
		padding: '12px',
		borderRadius: '8px',
		marginBottom: '16px',
		fontSize: '14px',
	},
	success: {
		backgroundColor: '#e3f5e8',
		color: '#23603a',
		padding: '12px',
		borderRadius: '8px',
		marginBottom: '16px',
		fontSize: '14px',
	},
	infoBox: {
		backgroundColor: '#f8f5f2',
		color: '#5b352d',
		padding: '14px 16px',
		borderRadius: '10px',
		fontSize: '15px',
		lineHeight: 1.55,
		border: '1px solid #e6d9d3',
	},
	form: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	input: {
		height: '48px',
		padding: '0 14px',
		borderRadius: '8px',
		border: '1px solid #ccc',
		fontSize: '16px',
		outline: 'none',
	},
	button: {
		height: '50px',
		border: 'none',
		borderRadius: '8px',
		backgroundColor: '#6b3f34',
		color: '#fff',
		fontSize: '16px',
		fontWeight: 600,
		cursor: 'pointer',
		marginTop: '8px',
	},
	secondaryButton: {
		height: '46px',
		border: '1px solid #c9b6ae',
		borderRadius: '8px',
		backgroundColor: '#fff',
		color: '#5b352d',
		fontSize: '15px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	switchText: {
		marginTop: '18px',
		textAlign: 'center',
		fontSize: '14px',
	},
	linkButton: {
		border: 'none',
		background: 'transparent',
		color: '#5b352d',
		fontWeight: 700,
		cursor: 'pointer',
	},
};

export default AuthModal;