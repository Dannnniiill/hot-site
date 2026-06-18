import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../Components/Header/Header';
import Footer from '../Components/Footer/Footer';
import { BASE_URL } from '../constats';
import { useAuth } from './AuthProvider';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

const DEFAULT_FILTERS = {
	type: 'all',
	price: 'all',
	sort: 'default',
	amenities: [],
};

function normalizeText(value) {
	if (value === undefined || value === null) return '';
	const safeValue = String(value).trim();
	if (['undefined', 'null', 'none'].includes(safeValue.toLowerCase())) return '';
	return safeValue;
}

function formatDate(value) {
	const safeValue = normalizeText(value);
	if (!safeValue) return '—';

	const date = new Date(safeValue);
	if (Number.isNaN(date.getTime())) return safeValue;

	return date.toLocaleDateString('ru-RU');
}

function formatDateTime(value) {
	const safeValue = normalizeText(value);
	if (!safeValue) return '—';

	const date = new Date(safeValue);
	if (Number.isNaN(date.getTime())) return safeValue;

	return date.toLocaleString('ru-RU');
}

function normalizeBookingStatus(status) {
	const value = normalizeText(status).toLowerCase();

	if (['отменена', 'cancelled', 'canceled', 'cancel'].includes(value)) return 'Отменена';
	if (['подтверждена', 'confirmed', 'approved', 'accepted'].includes(value)) return 'Подтверждена';

	return 'Новая заявка';
}

function isCancelledStatus(status) {
	return normalizeBookingStatus(status) === 'Отменена';
}

function getRoomTypeRoute(type) {
	const value = normalizeText(type).toLowerCase();

	if (value === 'standard') return 'standard';
	if (value === 'luxe') return 'luxe';
	if (value === 'luxe plus' || value === 'luxe-plus' || value === 'luxe_plus') return 'luxe plus';
	if (value === 'luxe premium' || value === 'luxe-premium' || value === 'luxe_premium') return 'luxe premium';

	return 'standard';
}

function createDateFromValue(value, fallbackDays = 0) {
	const safeValue = normalizeText(value);
	const date = safeValue ? new Date(safeValue) : new Date();

	if (Number.isNaN(date.getTime())) {
		const fallback = new Date();
		fallback.setDate(fallback.getDate() + fallbackDays);
		fallback.setHours(0, 0, 0, 0);
		return fallback;
	}

	date.setHours(0, 0, 0, 0);
	return date;
}

async function requestWithFallback(method, paths, config = {}) {
	let lastError = null;

	for (const path of paths) {
		try {
			if (method === 'get') {
				return await axios.get(`${API_BASE}${path}`, config);
			}

			if (method === 'post') {
				return await axios.post(`${API_BASE}${path}`, config.data || {}, config.config || {});
			}
		} catch (error) {
			lastError = error;
		}
	}

	throw lastError || new Error('Request failed');
}

function ProfilePage() {
	const navigate = useNavigate();
	const { user, authReady, updateProfile, logout } = useAuth();

	const [bookings, setBookings] = React.useState([]);
	const [notifications, setNotifications] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [filter, setFilter] = React.useState('all');

	const [isEditing, setIsEditing] = React.useState(false);
	const [savingProfile, setSavingProfile] = React.useState(false);
	const [profileMessage, setProfileMessage] = React.useState('');

	const [profileForm, setProfileForm] = React.useState({
		name: '',
		email: '',
		phone: '',
		password: '',
	});

	const applyUserToForm = React.useCallback(() => {
		setProfileForm({
			name: normalizeText(user?.name),
			email: normalizeText(user?.email),
			phone: normalizeText(user?.phone),
			password: '',
		});
	}, [user]);

	React.useEffect(() => {
		if (user) {
			applyUserToForm();
		}
	}, [user, applyUserToForm]);

	const loadCabinetData = React.useCallback(async () => {
		if (!user?.email) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError('');

		try {
			const [bookingsResponse, notificationsResponse] = await Promise.all([
				requestWithFallback('get', ['/bookings/my/', '/my-bookings/', '/bookings/', '/user/bookings/'], {
					params: { email: user.email },
				}),
				requestWithFallback('get', ['/notifications/', '/user/notifications/', '/notifications/user/'], {
					params: { email: user.email },
				}).catch(() => ({ data: [] })),
			]);

			setBookings(Array.isArray(bookingsResponse?.data) ? bookingsResponse.data : []);
			setNotifications(Array.isArray(notificationsResponse?.data) ? notificationsResponse.data : []);
		} catch (err) {
			setError(
				err?.response?.data?.message ||
					'Не удалось загрузить данные личного кабинета. Попробуйте обновить страницу.',
			);
		} finally {
			setLoading(false);
		}
	}, [user?.email]);

	React.useEffect(() => {
		if (!authReady) return;

		if (!user) {
			navigate('/', { replace: true });
			return;
		}

		loadCabinetData();
	}, [authReady, user, navigate, loadCabinetData]);

	const handleProfileChange = (field, value) => {
		setProfileForm((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleSaveProfile = async () => {
		setSavingProfile(true);
		setProfileMessage('');

		try {
			const result = await updateProfile({
				name: normalizeText(profileForm.name),
				email: normalizeText(profileForm.email),
				phone: normalizeText(profileForm.phone),
				password: normalizeText(profileForm.password),
			});

			if (!result?.success) {
				setProfileMessage(result?.message || 'Не удалось обновить профиль');
				setSavingProfile(false);
				return;
			}

			setProfileMessage('Профиль успешно обновлён');
			setIsEditing(false);
			setProfileForm((prev) => ({ ...prev, password: '' }));
			await loadCabinetData();
		} catch (err) {
			setProfileMessage(err?.message || 'Не удалось обновить профиль');
		} finally {
			setSavingProfile(false);
		}
	};

	const handleCancelBooking = async (bookingId) => {
		if (!bookingId) return;

		const isConfirmed = window.confirm('Отменить это бронирование?');
		if (!isConfirmed) return;

		try {
			await requestWithFallback('post', ['/bookings/cancel/', '/cancel-booking/', '/booking/cancel/'], {
				data: {
					booking_id: bookingId,
					email: normalizeText(user?.email),
				},
			});

			await loadCabinetData();
		} catch (err) {
			window.alert(err?.response?.data?.message || 'Не удалось отменить бронирование');
		}
	};

	const handleRepeatBooking = (booking) => {
		const roomType = getRoomTypeRoute(booking?.type);
		const startDate = createDateFromValue(booking?.start_date, 0);
		const endDate = createDateFromValue(booking?.end_date, 1);

		navigate(`/reservation/${encodeURIComponent(roomType)}`, {
			state: {
				searchMode: 'direct-room',
				roomType,
				toDate: startDate.toISOString(),
				fromDate: endDate.toISOString(),
				persons: { count: Number(booking?.amount || 1) || 1 },
				filters: DEFAULT_FILTERS,
			},
		});
	};

	const handleGoHome = () => {
		window.location.href = '/';
	};

	const handleBookMore = () => {
		window.location.href = '/';
	};

	const handleLogout = () => {
		logout();
		window.location.href = '/';
	};

	const handleMarkNotificationRead = async (notificationId) => {
		try {
			await requestWithFallback('post', ['/notifications/read/', '/notification/read/', '/mark-notification-read/'], {
				data: {
					notification_id: notificationId,
				},
			});

			setNotifications((prev) =>
				prev.map((item) =>
					item.id === notificationId
						? {
								...item,
								is_read: true,
						  }
						: item,
				),
			);
		} catch (err) {
			console.error(err);
		}
	};

	const filteredBookings = bookings.filter((booking) => {
		if (filter === 'all') return true;
		if (filter === 'active') return !isCancelledStatus(booking?.status);
		if (filter === 'cancelled') return isCancelledStatus(booking?.status);
		return true;
	});

	const totalBookings = bookings.length;
	const activeBookings = bookings.filter((item) => !isCancelledStatus(item?.status)).length;
	const cancelledBookings = bookings.filter((item) => isCancelledStatus(item?.status)).length;
	const unreadNotifications = notifications.filter((item) => !item?.is_read).length;

	if (!authReady || loading) {
		return (
			<div style={pageStyle}>
				<Header main={false} />
				<div style={containerStyle}>
					<div style={loadingBoxStyle}>Загрузка личного кабинета...</div>
				</div>
				<Footer main={false} />
			</div>
		);
	}

	return (
		<div style={pageStyle}>
			<Header main={false} />

			<div style={containerStyle}>
				<div style={contentStyle}>
					<div style={heroGridStyle}>
						<div style={heroLeftStyle}>
							<div style={avatarStyle}>
								{normalizeText(user?.name).charAt(0).toUpperCase() || 'U'}
							</div>

							<div>
								<h1 style={heroTitleStyle}>Личный кабинет</h1>
								<p style={heroTextStyle}>
									Управляйте бронированиями, редактируйте профиль и отслеживайте статус заявок.
								</p>
							</div>
						</div>

						<div style={actionsCardStyle}>
							<div style={actionsTitleStyle}>Быстрые действия</div>

							<button type="button" style={secondaryButtonStyle} onClick={handleGoHome}>
								На главную
							</button>

							<button type="button" style={successButtonStyle} onClick={handleBookMore}>
								Забронировать еще
							</button>

							<button type="button" style={dangerButtonStyle} onClick={handleLogout}>
								Выйти
							</button>
						</div>
					</div>

					<div style={statsGridStyle}>
						<div style={statCardStyle}>
							<div style={statLabelStyle}>Всего заявок</div>
							<div style={statValueStyle}>{totalBookings}</div>
						</div>

						<div style={statCardStyle}>
							<div style={statLabelStyle}>Активные</div>
							<div style={statValueStyle}>{activeBookings}</div>
						</div>

						<div style={statCardStyle}>
							<div style={statLabelStyle}>Отмененные</div>
							<div style={statValueStyle}>{cancelledBookings}</div>
						</div>

						<div style={statCardStyle}>
							<div style={statLabelStyle}>Уведомлений</div>
							<div style={statValueStyle}>{unreadNotifications}</div>
						</div>
					</div>

					<div style={sectionCardStyle}>
						<div style={sectionHeaderStyle}>
							<h2 style={sectionTitleStyle}>Профиль</h2>

							<button
								type="button"
								style={smallButtonStyle}
								onClick={() => {
									if (isEditing) {
										applyUserToForm();
										setProfileMessage('');
									}
									setIsEditing((prev) => !prev);
								}}
							>
								{isEditing ? 'Отмена' : 'Редактировать'}
							</button>
						</div>

						{profileMessage ? <div style={infoMessageStyle}>{profileMessage}</div> : null}

						<div style={profileGridStyle}>
							<div style={fieldCardStyle}>
								<div style={fieldLabelStyle}>Имя</div>
								{isEditing ? (
									<input
										style={inputStyle}
										value={profileForm.name}
										onChange={(e) => handleProfileChange('name', e.target.value)}
									/>
								) : (
									<div style={fieldValueStyle}>{normalizeText(user?.name) || '—'}</div>
								)}
							</div>

							<div style={fieldCardStyle}>
								<div style={fieldLabelStyle}>Email</div>
								{isEditing ? (
									<input
										style={inputStyle}
										value={profileForm.email}
										onChange={(e) => handleProfileChange('email', e.target.value)}
									/>
								) : (
									<div style={fieldValueStyle}>{normalizeText(user?.email) || '—'}</div>
								)}
							</div>

							<div style={fieldCardStyle}>
								<div style={fieldLabelStyle}>Телефон</div>
								{isEditing ? (
									<input
										style={inputStyle}
										value={profileForm.phone}
										onChange={(e) => handleProfileChange('phone', e.target.value)}
									/>
								) : (
									<div style={fieldValueStyle}>{normalizeText(user?.phone) || '—'}</div>
								)}
							</div>

							<div style={fieldCardStyle}>
								<div style={fieldLabelStyle}>Пароль</div>
								{isEditing ? (
									<input
										type="password"
										placeholder="Оставьте пустым, если не меняете"
										style={inputStyle}
										value={profileForm.password}
										onChange={(e) => handleProfileChange('password', e.target.value)}
									/>
								) : (
									<div style={fieldValueStyle}>••••••••</div>
								)}
							</div>

							<div style={{ ...fieldCardStyle, gridColumn: '1 / -1' }}>
								<div style={fieldLabelStyle}>Дата регистрации</div>
								<div style={fieldValueStyle}>{formatDateTime(user?.createdAt)}</div>
							</div>
						</div>

						{isEditing ? (
							<div style={profileActionsStyle}>
								<button type="button" style={successButtonStyle} onClick={handleSaveProfile} disabled={savingProfile}>
									{savingProfile ? 'Сохранение...' : 'Сохранить изменения'}
								</button>
							</div>
						) : null}
					</div>

					<div style={sectionCardStyle}>
						<div style={sectionHeaderStyle}>
							<h2 style={sectionTitleStyle}>Мои бронирования</h2>

							<div style={tabsStyle}>
								<button
									type="button"
									style={filter === 'all' ? activeTabStyle : tabStyle}
									onClick={() => setFilter('all')}
								>
									Все
								</button>

								<button
									type="button"
									style={filter === 'active' ? activeTabStyle : tabStyle}
									onClick={() => setFilter('active')}
								>
									Активные
								</button>

								<button
									type="button"
									style={filter === 'cancelled' ? activeTabStyle : tabStyle}
									onClick={() => setFilter('cancelled')}
								>
									Отмененные
								</button>
							</div>
						</div>

						{error ? <div style={errorBoxStyle}>{error}</div> : null}

						{filteredBookings.length === 0 ? (
							<div style={emptyBoxStyle}>Бронирований пока нет</div>
						) : (
							filteredBookings.map((booking) => {
								const cancelled = isCancelledStatus(booking?.status);

								return (
									<div key={booking.id} style={bookingCardStyle}>
										<div style={bookingHeaderStyle}>
											<div>
												<div style={bookingRoomTitleStyle}>
													{normalizeText(booking?.roomName) || normalizeText(booking?.type) || 'Номер'}
												</div>
												<div style={bookingMetaStyle}>
													Создано: {formatDateTime(booking?.createdAt)}
												</div>
												<div style={bookingMetaStyle}>
													Статус: {normalizeBookingStatus(booking?.status)}
												</div>
											</div>

											<div style={bookingNumberStyle}>
												№ {normalizeText(booking?.bookingNumber) || booking?.id}
											</div>
										</div>

										<div style={bookingGridStyle}>
											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Заезд</div>
												<div style={fieldValueStyle}>
													{formatDate(booking?.start_date)}
													<div style={miniMetaStyle}>с {normalizeText(booking?.checkInTime) || '14:00'}</div>
												</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Выезд</div>
												<div style={fieldValueStyle}>
													{formatDate(booking?.end_date)}
													<div style={miniMetaStyle}>до {normalizeText(booking?.checkOutTime) || '12:00'}</div>
												</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Количество гостей</div>
												<div style={fieldValueStyle}>{booking?.amount || 1}</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Количество ночей</div>
												<div style={fieldValueStyle}>{booking?.nights || 1}</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Цена за ночь</div>
												<div style={fieldValueStyle}>{booking?.pricePerNight || 0} ₽</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Итоговая стоимость</div>
												<div style={fieldValueStyle}>{booking?.totalPrice || 0} ₽</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Телефон</div>
												<div style={fieldValueStyle}>{normalizeText(booking?.phone_number) || '—'}</div>
											</div>

											<div style={bookingFieldStyle}>
												<div style={fieldLabelStyle}>Имя в заявке</div>
												<div style={fieldValueStyle}>
													{`${normalizeText(booking?.first_name)} ${normalizeText(booking?.last_name)}`.trim() || '—'}
												</div>
											</div>
										</div>

										<div style={commentCardStyle}>
											<div style={fieldLabelStyle}>Комментарий</div>
											<div style={fieldValueStyle}>{normalizeText(booking?.comment) || 'Нет комментариев'}</div>
										</div>

										<div style={bookingActionsStyle}>
											<button
												type="button"
												style={successButtonStyle}
												onClick={() => handleRepeatBooking(booking)}
											>
												Выбрать номер
											</button>

											<button
												type="button"
												style={cancelled ? disabledButtonStyle : dangerButtonStyle}
												onClick={() => handleCancelBooking(booking?.id)}
												disabled={cancelled}
											>
												{cancelled ? 'Заявка отменена' : 'Отменить заявку'}
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>

					<div style={sectionCardStyle}>
						<div style={sectionHeaderStyle}>
							<h2 style={sectionTitleStyle}>Уведомления</h2>
						</div>

						{notifications.length === 0 ? (
							<div style={emptyBoxStyle}>Уведомлений пока нет</div>
						) : (
							<div style={notificationsListStyle}>
								{notifications.map((item) => (
									<div
										key={item.id}
										style={{
											...notificationItemStyle,
											opacity: item?.is_read ? 0.7 : 1,
											borderColor: item?.is_read ? 'rgba(255,255,255,0.06)' : 'rgba(208,158,114,0.35)',
										}}
									>
										<div>
											<div style={notificationTitleStyle}>{normalizeText(item?.title) || 'Уведомление'}</div>
											<div style={notificationTextStyle}>{normalizeText(item?.message) || '—'}</div>
											<div style={miniMetaStyle}>{formatDateTime(item?.created_at || item?.createdAt)}</div>
										</div>

										{item?.is_read ? null : (
											<button
												type="button"
												style={smallButtonStyle}
												onClick={() => handleMarkNotificationRead(item.id)}
											>
												Прочитано
											</button>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>

			<Footer main={false} />
		</div>
	);
}

const pageStyle = {
	minHeight: '100vh',
	background: 'linear-gradient(180deg, #23130f 0%, #1a0f0c 100%)',
};

const containerStyle = {
	maxWidth: '1200px',
	margin: '0 auto',
	padding: '32px 16px 56px',
};

const contentStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '20px',
};

const heroGridStyle = {
	display: 'grid',
	gridTemplateColumns: '2fr 1.2fr',
	gap: '16px',
};

const heroLeftStyle = {
	background: 'rgba(255,255,255,0.04)',
	border: '1px solid rgba(255,255,255,0.08)',
	borderRadius: '20px',
	padding: '28px',
	display: 'flex',
	gap: '18px',
	alignItems: 'flex-start',
	color: '#fff',
};

const avatarStyle = {
	width: '62px',
	height: '62px',
	borderRadius: '50%',
	background: '#c9986c',
	color: '#fff',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: '30px',
	fontWeight: '700',
	flexShrink: 0,
};

const heroTitleStyle = {
	margin: 0,
	fontSize: '42px',
	lineHeight: 1.1,
	fontWeight: 700,
	color: '#fff',
};

const heroTextStyle = {
	margin: '12px 0 0',
	color: 'rgba(255,255,255,0.75)',
	fontSize: '18px',
	lineHeight: 1.5,
};

const actionsCardStyle = {
	background: 'rgba(255,255,255,0.04)',
	border: '1px solid rgba(255,255,255,0.08)',
	borderRadius: '20px',
	padding: '20px',
	display: 'flex',
	flexDirection: 'column',
	gap: '12px',
};

const actionsTitleStyle = {
	color: '#fff',
	fontSize: '24px',
	fontWeight: 700,
	marginBottom: '2px',
};

const statsGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(4, 1fr)',
	gap: '16px',
};

const statCardStyle = {
	background: 'rgba(255,255,255,0.04)',
	border: '1px solid rgba(255,255,255,0.08)',
	borderRadius: '18px',
	padding: '18px',
	color: '#fff',
};

const statLabelStyle = {
	color: 'rgba(255,255,255,0.68)',
	fontSize: '15px',
	marginBottom: '10px',
};

const statValueStyle = {
	fontSize: '44px',
	fontWeight: 700,
	lineHeight: 1,
};

const sectionCardStyle = {
	background: 'rgba(255,255,255,0.04)',
	border: '1px solid rgba(255,255,255,0.08)',
	borderRadius: '20px',
	padding: '20px',
	color: '#fff',
};

const sectionHeaderStyle = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: '12px',
	marginBottom: '18px',
	flexWrap: 'wrap',
};

const sectionTitleStyle = {
	margin: 0,
	fontSize: '32px',
	fontWeight: 700,
	color: '#fff',
};

const smallButtonStyle = {
	border: '1px solid rgba(255,255,255,0.12)',
	background: 'rgba(255,255,255,0.04)',
	color: '#fff',
	borderRadius: '12px',
	padding: '10px 16px',
	cursor: 'pointer',
	fontSize: '15px',
};

const secondaryButtonStyle = {
	border: 'none',
	background: '#d09e72',
	color: '#fff',
	borderRadius: '12px',
	padding: '14px 18px',
	cursor: 'pointer',
	fontSize: '16px',
	fontWeight: 700,
};

const successButtonStyle = {
	border: 'none',
	background: '#4b9151',
	color: '#fff',
	borderRadius: '12px',
	padding: '14px 18px',
	cursor: 'pointer',
	fontSize: '16px',
	fontWeight: 700,
};

const dangerButtonStyle = {
	border: 'none',
	background: '#d74835',
	color: '#fff',
	borderRadius: '12px',
	padding: '14px 18px',
	cursor: 'pointer',
	fontSize: '16px',
	fontWeight: 700,
};

const disabledButtonStyle = {
	...dangerButtonStyle,
	background: '#7b5b58',
	cursor: 'not-allowed',
	opacity: 0.7,
};

const profileGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: '14px',
};

const fieldCardStyle = {
	background: 'rgba(255,255,255,0.03)',
	border: '1px solid rgba(255,255,255,0.06)',
	borderRadius: '14px',
	padding: '16px',
	minHeight: '92px',
};

const bookingFieldStyle = {
	...fieldCardStyle,
	minHeight: '108px',
};

const fieldLabelStyle = {
	color: 'rgba(255,255,255,0.62)',
	fontSize: '14px',
	marginBottom: '10px',
};

const fieldValueStyle = {
	color: '#fff',
	fontSize: '18px',
	fontWeight: 600,
	lineHeight: 1.4,
	wordBreak: 'break-word',
};

const inputStyle = {
	width: '100%',
	height: '46px',
	borderRadius: '10px',
	border: '1px solid rgba(255,255,255,0.12)',
	background: 'rgba(255,255,255,0.06)',
	color: '#fff',
	padding: '0 14px',
	outline: 'none',
	fontSize: '16px',
	boxSizing: 'border-box',
};

const profileActionsStyle = {
	marginTop: '16px',
	display: 'flex',
	justifyContent: 'flex-end',
};

const tabsStyle = {
	display: 'flex',
	gap: '8px',
	flexWrap: 'wrap',
};

const tabStyle = {
	border: '1px solid rgba(255,255,255,0.1)',
	background: 'rgba(255,255,255,0.04)',
	color: '#fff',
	borderRadius: '12px',
	padding: '10px 16px',
	cursor: 'pointer',
	fontSize: '15px',
};

const activeTabStyle = {
	...tabStyle,
	background: '#d09e72',
	borderColor: '#d09e72',
};

const bookingCardStyle = {
	background: 'rgba(255,255,255,0.03)',
	border: '1px solid rgba(255,255,255,0.06)',
	borderRadius: '18px',
	padding: '20px',
	display: 'flex',
	flexDirection: 'column',
	gap: '16px',
	marginBottom: '16px',
};

const bookingHeaderStyle = {
	display: 'flex',
	justifyContent: 'space-between',
	gap: '16px',
	flexWrap: 'wrap',
};

const bookingRoomTitleStyle = {
	fontSize: '22px',
	fontWeight: 700,
	color: '#fff',
	marginBottom: '6px',
};

const bookingMetaStyle = {
	color: 'rgba(255,255,255,0.68)',
	fontSize: '14px',
};

const bookingNumberStyle = {
	color: '#d09e72',
	fontWeight: 700,
	fontSize: '18px',
};

const bookingGridStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(2, 1fr)',
	gap: '14px',
};

const commentCardStyle = {
	background: 'rgba(255,255,255,0.03)',
	border: '1px solid rgba(255,255,255,0.06)',
	borderRadius: '14px',
	padding: '16px',
};

const bookingActionsStyle = {
	display: 'flex',
	justifyContent: 'space-between',
	gap: '12px',
	flexWrap: 'wrap',
};

const notificationsListStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '12px',
};

const notificationItemStyle = {
	display: 'flex',
	justifyContent: 'space-between',
	gap: '16px',
	alignItems: 'flex-start',
	background: 'rgba(255,255,255,0.03)',
	border: '1px solid rgba(255,255,255,0.06)',
	borderRadius: '14px',
	padding: '16px',
};

const notificationTitleStyle = {
	color: '#fff',
	fontSize: '18px',
	fontWeight: 700,
	marginBottom: '6px',
};

const notificationTextStyle = {
	color: 'rgba(255,255,255,0.82)',
	fontSize: '15px',
	lineHeight: 1.45,
	marginBottom: '8px',
};

const miniMetaStyle = {
	color: 'rgba(255,255,255,0.55)',
	fontSize: '13px',
	marginTop: '6px',
};

const errorBoxStyle = {
	background: 'rgba(215,72,53,0.18)',
	border: '1px solid rgba(215,72,53,0.35)',
	color: '#ffd9d3',
	borderRadius: '14px',
	padding: '14px 16px',
	marginBottom: '16px',
};

const infoMessageStyle = {
	background: 'rgba(75,145,81,0.16)',
	border: '1px solid rgba(75,145,81,0.32)',
	color: '#d8f3db',
	borderRadius: '14px',
	padding: '14px 16px',
	marginBottom: '16px',
};

const emptyBoxStyle = {
	background: 'rgba(255,255,255,0.03)',
	border: '1px solid rgba(255,255,255,0.06)',
	borderRadius: '14px',
	padding: '24px',
	color: 'rgba(255,255,255,0.75)',
	fontSize: '17px',
};

const loadingBoxStyle = {
	background: 'rgba(255,255,255,0.05)',
	border: '1px solid rgba(255,255,255,0.08)',
	borderRadius: '18px',
	padding: '28px',
	color: '#fff',
	fontSize: '22px',
	textAlign: 'center',
	marginTop: '20px',
};

export default ProfilePage;