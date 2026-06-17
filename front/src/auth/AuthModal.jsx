import React, { useState } from 'react';
import { useAuth } from './AuthProvider';

function AuthModal() {
	const { login, register, verifyRegisterCode } = useAuth();

	const [mode, setMode] = useState('register');
	const [registerStep, setRegisterStep] = useState('form');
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [verificationEmail, setVerificationEmail] = useState('');

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

	const [verifyForm, setVerifyForm] = useState({
		code: '',
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

	const handleVerifyChange = (e) => {
		const { value } = e.target;
		setVerifyForm({ code: value.replace(/\D/g, '').slice(0, 6) });
	};

	const getFullName = () => {
		return `${registerForm.name.trim()} ${registerForm.lastName.trim()}`.trim();
	};

	const handleNextStep = (e) => {
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

		setVerificationEmail(registerForm.email.trim());
		setRegisterStep('confirm');
	};

	const handleSendCode = async () => {
		setError('');
		setSuccessMessage('');

		const result = await register({
			name: getFullName(),
			email: registerForm.email.trim(),
			password: registerForm.password,
		});

		if (!result.success) {
			setError(result.message);
			return;
		}

		setSuccessMessage('Код подтверждения отправлен на вашу электронную почту');
		setRegisterStep('verify');
	};

	const handleVerifySubmit = async (e) => {
		e.preventDefault();
		setError('');
		setSuccessMessage('');

		if (!verifyForm.code.trim() || verifyForm.code.trim().length !== 6) {
			setError('Введите 6-значный код');
			return;
		}

		const result = await verifyRegisterCode({
			email: verificationEmail,
			code: verifyForm.code.trim(),
		});

		if (!result.success) {
			setError(result.message);
			return;
		}

		setSuccessMessage('Регистрация подтверждена. Вход выполнен автоматически.');
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

	const resetRegisterFlow = () => {
		setError('');
		setSuccessMessage('');
		setRegisterStep('form');
		setVerifyForm({ code: '' });
	};

	return (
		<div style={styles.overlay}>
			<div style={styles.modal}>
				<h2 style={styles.title}>{mode === 'register' ? 'Регистрация' : 'Вход'}</h2>

				<p style={styles.subtitle}>
					{mode === 'register'
						? registerStep === 'form'
							? 'Зарегистрируйтесь, чтобы войти на сайт'
							: registerStep === 'confirm'
							? `Сейчас код подтверждения будет отправлен на почту ${verificationEmail}`
							: `Введите код, отправленный на ${verificationEmail}`
						: 'Войдите в свой аккаунт'}
				</p>

				{error ? <div style={styles.error}>{error}</div> : null}
				{successMessage ? <div style={styles.success}>{successMessage}</div> : null}

				{mode === 'register' && registerStep === 'form' ? (
					<form onSubmit={handleNextStep} style={styles.form}>
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
							Далее
						</button>
					</form>
				) : null}

				{mode === 'register' && registerStep === 'confirm' ? (
					<div style={styles.form}>
						<div style={styles.infoBox}>
							После нажатия на кнопку ниже мы отправим 6-значный код подтверждения на указанную электронную почту.
						</div>

						<button type="button" style={styles.button} onClick={handleSendCode}>
							Получить код
						</button>

						<button type="button" onClick={resetRegisterFlow} style={styles.secondaryButton}>
							Назад
						</button>
					</div>
				) : null}

				{mode === 'register' && registerStep === 'verify' ? (
					<form onSubmit={handleVerifySubmit} style={styles.form}>
						<input
							type="text"
							placeholder="6-значный код"
							value={verifyForm.code}
							onChange={handleVerifyChange}
							style={styles.input}
						/>

						<button type="submit" style={styles.button}>
							Подтвердить регистрацию
						</button>

						<button
							type="button"
							onClick={() => {
								setError('');
								setSuccessMessage('');
								setRegisterStep('confirm');
							}}
							style={styles.secondaryButton}
						>
							Назад
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
							setRegisterStep('form');
							setVerifyForm({ code: '' });
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