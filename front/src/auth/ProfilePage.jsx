import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { BASE_URL } from '../constats';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

function formatPhoneMask(value) {
	const digits = String(value || '').replace(/\D/g, '');

	let normalized = digits;

	if (normalized.startsWith('8')) {
		normalized = '7' + normalized.slice(1);
	}

	if (!normalized.startsWith('7')) {
		normalized = '7' + normalized;
	}

	normalized = normalized.slice(0, 11);

	let result = '+7';

	if (normalized.length > 1) {
		result += ' (' + normalized.slice(1, 4);
	}

	if (normalized.length >= 5) {
		result += ') ' + normalized.slice(4, 7);
	} else if (normalized.length >= 4) {
		result += ')';
	}

	if (normalized.length >= 8) {
		result += '-' + normalized.slice(7, 9);
	}

	if (normalized.length >= 10) {
		result += '-' + normalized.slice(9, 11);
	}

	return result;
}

function ProfilePage() {
	const { user, logout, updateProfile, isAdmin } = useAuth();
	const navigate = useNavigate();

	const [viewportWidth, setViewportWidth] = React.useState(window.innerWidth);
	const [refreshKey, setRefreshKey] = React.useState(0);
	const [isEditing, setIsEditing] = React.useState(false);
	const [message, setMessage] = React.useState('');
	const [messageType, setMessageType] = React.useState('');
	const [activeFilter, setActiveFilter] = React.useState('all');
	const [bookingToCancel, setBookingToCancel] = React.useState(null);

	const [bookings, setBookings] = React.useState([]);
	const [notifications, setNotifications] = React.useState([]);
	const [totalNotificationsCount, setTotalNotificationsCount] = React.useState(0);
	const [bookingsLoading, setBookingsLoading] = React.useState(false);

	const [formData, setFormData] = React.useState({
		name: '',
		email: '',
		phone: '',
		password: '',
	});

	React.useEffect(() => {
		const handleResize = () => setViewportWidth(window.innerWidth);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const isTablet = viewportWidth <= 1024;
	const isMobile = viewportWidth <= 768;
	const isSmallMobile = viewportWidth <= 480;
	const styles = React.useMemo(
		() => buildStyles({ isTablet, isMobile, isSmallMobile }),
		[isTablet, isMobile, isSmallMobile],
	);

	React.useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || '',
				email: user.email || '',
				phone: user.phone || '',
				password: '',
			});
		}
	}, [user]);

	React.useEffect(() => {
		const loadData = async () => {
			if (!user?.email) return;

			const normalizedEmail = String(user.email || '').trim().toLowerCase();

			setBookingsLoading(true);

			try {
				const bookingsRes = await axios.get(`${API_BASE}/bookings/my/`, {
					params: { email: normalizedEmail },
				});

				const rawBookings = extractArrayFromResponse(bookingsRes.data);
				const normalizedBookings = rawBookings
					.map(normalizeBooking)
					.filter((item) => {
						const bookingEmail = String(item.email || '').trim().toLowerCase();
						return !bookingEmail || bookingEmail === normalizedEmail;
					});

				setBookings(normalizedBookings);
			} catch (error) {
				console.error('Ошибка загрузки бронирований:', error);
				setBookings([]);
				setMessage(error?.response?.data?.message || 'Не удалось загрузить бронирования');
				setMessageType('error');
			} finally {
				setBookingsLoading(false);
			}

			try {
				const notificationsRes = await axios.get(`${API_BASE}/notifications/`, {
					params: { email: normalizedEmail },
				});

				const rawNotifications = extractArrayFromResponse(notificationsRes.data);
				setNotifications(rawNotifications);

				if (typeof notificationsRes.data?.count === 'number') {
					setTotalNotificationsCount(notificationsRes.data.count);
				} else {
					setTotalNotificationsCount(rawNotifications.length);
				}
			} catch (error) {
				console.error('Ошибка загрузки уведомлений:', error);
				setNotifications([]);
				setTotalNotificationsCount(0);
			}
		};

		loadData();
	}, [user, refreshKey]);

	const allUserBookings = React.useMemo(() => {
		return [...bookings].sort((a, b) => {
			const aDate = new Date(a.createdAt || a.created_at || 0).getTime();
			const bDate = new Date(b.createdAt || b.created_at || 0).getTime();
			return bDate - aDate;
		});
	}, [bookings]);

	const filteredBookings = React.useMemo(() => {
		if (activeFilter === 'all') return allUserBookings;
		if (activeFilter === 'active') return allUserBookings.filter((item) => item.status !== 'Отменена');
		if (activeFilter === 'canceled') return allUserBookings.filter((item) => item.status === 'Отменена');
		return allUserBookings;
	}, [allUserBookings, activeFilter]);

	const stats = React.useMemo(() => {
		const total = allUserBookings.length;
		const active = allUserBookings.filter((item) => item.status !== 'Отменена').length;
		const canceled = allUserBookings.filter((item) => item.status === 'Отменена').length;

		return {
			total,
			active,
			canceled,
		};
	}, [allUserBookings]);

	const handleLogout = () => {
		logout();
		navigate('/');
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;

		if (name === 'phone') {
			setFormData((prev) => ({
				...prev,
				phone: formatPhoneMask(value),
			}));
			return;
		}

		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSaveProfile = async () => {
		setMessage('');
		setMessageType('');

		if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
			setMessage('Заполните все поля');
			setMessageType('error');
			return;
		}

		const phoneDigits = formData.phone.replace(/\D/g, '');
		if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
			setMessage('Введите телефон в формате +7 (999) 999-99-99');
			setMessageType('error');
			return;
		}

		const payload = {
			name: formData.name.trim(),
			email: formData.email.trim(),
			phone: formData.phone.trim(),
		};

		if (formData.password.trim()) {
			payload.password = formData.password.trim();
		}

		const result = await updateProfile(payload);

		if (!result.success) {
			setMessage(result.message);
			setMessageType('error');
			return;
		}

		setMessage('Данные профиля успешно сохранены');
		setMessageType('success');
		setIsEditing(false);
		setFormData((prev) => ({ ...prev, password: '' }));
		setRefreshKey((prev) => prev + 1);
	};

	const handleCancelEdit = () => {
		if (user) {
			setFormData({
				name: user.name || '',
				email: user.email || '',
				phone: user.phone || '',
				password: '',
			});
		}
		setMessage('');
		setMessageType('');
		setIsEditing(false);
	};

	const confirmCancelBooking = async () => {
		if (!bookingToCancel || !user?.email) return;

		try {
			await axios.post(`${API_BASE}/bookings/cancel/`, {
				booking_id: bookingToCancel.id,
				email: String(user.email || '').trim().toLowerCase(),
			});

			setBookingToCancel(null);
			setRefreshKey((prev) => prev + 1);
		} catch (error) {
			setMessage(error?.response?.data?.message || 'Не удалось отменить бронирование');
			setMessageType('error');
			setBookingToCancel(null);
		}
	};

	const handleRepeatBooking = (booking) => {
		navigate('/reservation', {
			state: {
				toDate: booking.start_date ? new Date(booking.start_date) : null,
				fromDate: booking.end_date ? new Date(booking.end_date) : null,
				persons: { count: Number(booking.amount) || 1 },
			},
		});
	};

	const markNotificationRead = async (id) => {
		const previousNotifications = notifications;

		setNotifications((prev) =>
			prev.map((item) =>
				item.id === id
					? {
							...item,
							is_read: true,
					  }
					: item,
			),
		);

		try {
			await axios.post(`${API_BASE}/notifications/read/`, {
				notification_id: id,
				email: String(user?.email || '').trim().toLowerCase(),
			});
		} catch (error) {
			console.error('Ошибка отметки уведомления:', error);
			setNotifications(previousNotifications);
			setMessage(error?.response?.data?.message || 'Не удалось отметить уведомление');
			setMessageType('error');
		}
	};

	if (!user) {
		return (
			<div style={styles.page}>
				<div style={styles.container}>
					<div style={styles.heroCard}>
						<h1 style={styles.heroTitle}>Вы не авторизованы</h1>
						<p style={styles.heroText}>Войдите в аккаунт, чтобы открыть личный кабинет.</p>
						<div style={styles.buttons}>
							<button style={styles.primaryButton} onClick={() => navigate('/')}>
								На главную
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	const avatarLetter = (user.name || 'Г').trim().charAt(0).toUpperCase();

	return (
		<div style={styles.page}>
			<div style={styles.container}>
				<div style={styles.heroCard}>
					<div style={styles.topGrid}>
						<div style={styles.profileHeroLeft}>
							<div style={styles.profileIdentity}>
								<div style={styles.avatar}>{avatarLetter}</div>

								<div style={styles.profileTextWrap}>
									<div style={styles.profileHeading}>Личный кабинет</div>
									<p style={styles.heroText}>
										Управляйте бронированиями, редактируйте профиль и отслеживайте статус
										своих заявок.
									</p>
								</div>
							</div>
						</div>

						<div style={styles.quickActionsCard}>
							<div style={styles.quickActionsTitle}>Быстрые действия</div>
							<div style={styles.quickActionsButtons}>
								<button style={styles.primaryButton} onClick={() => navigate('/')}>
									На главную
								</button>
								<button style={styles.greenButton} onClick={() => navigate('/reservation')}>
									Забронировать еще
								</button>
								{isAdmin ? (
									<button style={styles.secondaryButton} onClick={() => navigate('/analytics')}>
										Аналитика
									</button>
								) : null}
								<button style={styles.logoutButton} onClick={handleLogout}>
									Выйти
								</button>
							</div>
						</div>
					</div>

					<div style={styles.statsGrid}>
						<div style={styles.statCard}>
							<div style={styles.statLabel}>Всего заявок</div>
							<div style={styles.statValue}>{stats.total}</div>
						</div>

						<div style={styles.statCard}>
							<div style={styles.statLabel}>Активные</div>
							<div style={styles.statValue}>{stats.active}</div>
						</div>

						<div style={styles.statCard}>
							<div style={styles.statLabel}>Отмененные</div>
							<div style={styles.statValue}>{stats.canceled}</div>
						</div>

						<div style={styles.statCard}>
							<div style={styles.statLabel}>Уведомлений</div>
							<div style={styles.statValue}>{totalNotificationsCount}</div>
						</div>
					</div>

					<div style={styles.infoCard}>
						<div style={styles.cardHeader}>
							<h2 style={styles.cardTitle}>Профиль</h2>

							{!isEditing ? (
								<button
									style={styles.editButton}
									onClick={() => {
										setMessage('');
										setMessageType('');
										setIsEditing(true);
									}}
								>
									Редактировать
								</button>
							) : null}
						</div>

						{message ? (
							<div
								style={{
									...styles.messageBox,
									...(messageType === 'success' ? styles.successMessage : styles.errorMessage),
								}}
							>
								{message}
							</div>
						) : null}

						{isEditing ? (
							<div style={styles.formBlock}>
								<div style={styles.inputGroup}>
									<label style={styles.inputLabel}>Имя</label>
									<input
										type="text"
										name="name"
										value={formData.name}
										onChange={handleInputChange}
										style={styles.input}
									/>
								</div>

								<div style={styles.inputGroup}>
									<label style={styles.inputLabel}>Email</label>
									<input
										type="email"
										name="email"
										value={formData.email}
										onChange={handleInputChange}
										style={styles.input}
									/>
								</div>

								<div style={styles.inputGroup}>
									<label style={styles.inputLabel}>Телефон</label>
									<input
										type="tel"
										name="phone"
										value={formData.phone}
										onChange={handleInputChange}
										style={styles.input}
										placeholder="+7 (___) ___-__-__"
										maxLength={18}
										autoComplete="tel"
									/>
								</div>

								<div style={styles.inputGroup}>
									<label style={styles.inputLabel}>Новый пароль</label>
									<input
										type="password"
										name="password"
										value={formData.password}
										onChange={handleInputChange}
										style={styles.input}
										placeholder="Введите новый пароль"
										autoComplete="new-password"
									/>
								</div>

								<div style={styles.editButtons}>
									<button style={styles.saveButton} onClick={handleSaveProfile}>
										Сохранить
									</button>
									<button style={styles.cancelEditButton} onClick={handleCancelEdit}>
										Отмена
									</button>
								</div>
							</div>
						) : (
							<div style={styles.profileGrid}>
								<div style={styles.infoRowCard}>
									<div style={styles.infoLabel}>Имя</div>
									<div style={styles.infoValue}>{user.name}</div>
								</div>

								<div style={styles.infoRowCard}>
									<div style={styles.infoLabel}>Email</div>
									<div style={styles.infoValue}>{user.email}</div>
								</div>

								<div style={styles.infoRowCard}>
									<div style={styles.infoLabel}>Телефон</div>
									<div style={styles.infoValue}>{user.phone}</div>
								</div>

								<div style={styles.infoRowCard}>
									<div style={styles.infoLabel}>Пароль</div>
									<div style={styles.infoValue}>••••••••</div>
								</div>

								<div style={{ ...styles.infoRowCard, gridColumn: '1 / -1' }}>
									<div style={styles.infoLabel}>Дата регистрации</div>
									<div style={styles.infoValue}>{formatDateTime(user.createdAt)}</div>
								</div>
							</div>
						)}
					</div>

					<div style={styles.section}>
						<div style={styles.sectionTop}>
							<h2 style={styles.sectionTitle}>Мои бронирования</h2>

							<div style={styles.filterWrap}>
								<button
									style={{
										...styles.filterButton,
										...(activeFilter === 'all' ? styles.filterButtonActive : {}),
									}}
									onClick={() => setActiveFilter('all')}
								>
									Все
								</button>

								<button
									style={{
										...styles.filterButton,
										...(activeFilter === 'active' ? styles.filterButtonActive : {}),
									}}
									onClick={() => setActiveFilter('active')}
								>
									Активные
								</button>

								<button
									style={{
										...styles.filterButton,
										...(activeFilter === 'canceled' ? styles.filterButtonActive : {}),
									}}
									onClick={() => setActiveFilter('canceled')}
								>
									Отмененные
								</button>
							</div>
						</div>

						{bookingsLoading ? (
							<div style={styles.emptyState}>
								<div style={styles.emptyTitle}>Загрузка бронирований...</div>
							</div>
						) : filteredBookings.length === 0 ? (
							<div style={styles.emptyState}>
								<div style={styles.emptyIcon}>🏨</div>
								<div style={styles.emptyTitle}>Нет бронирований</div>
								<div style={styles.emptyText}>
									После оформления заявки она появится в этом разделе.
								</div>
								<button style={styles.primaryButton} onClick={() => navigate('/reservation')}>
									Выбрать номер
								</button>
							</div>
						) : (
							<div style={styles.bookingList}>
								{filteredBookings.map((booking) => {
									const isCanceled = booking.status === 'Отменена';

									return (
										<div
											key={booking.id}
											style={{
												...styles.bookingCard,
												...(isCanceled ? styles.bookingCardCanceled : {}),
											}}
										>
											<div style={styles.bookingHeader}>
												<div style={styles.bookingTitleLarge}>
													{booking.roomName || booking.type || 'Номер не указан'}
												</div>

												<div style={styles.bookingDate}>
													Создано: {formatDateTime(booking.createdAt)}
												</div>
											</div>

											<div style={styles.bookingGrid}>
												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Заезд</div>
													<div style={styles.bookingValue}>{booking.start_date}</div>
													<div style={styles.bookingSubValue}>
														с {booking.checkInTime || '14:00'}
													</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Выезд</div>
													<div style={styles.bookingValue}>{booking.end_date}</div>
													<div style={styles.bookingSubValue}>
														до {booking.checkOutTime || '12:00'}
													</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Количество гостей</div>
													<div style={styles.bookingValue}>{booking.amount}</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Количество ночей</div>
													<div style={styles.bookingValue}>{booking.nights || 1}</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Цена за ночь</div>
													<div style={styles.bookingValue}>
														{booking.pricePerNight ? `${booking.pricePerNight} ₽` : 'Не указана'}
													</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Итоговая стоимость</div>
													<div style={styles.bookingValue}>
														{booking.totalPrice ? `${booking.totalPrice} ₽` : 'Не указана'}
													</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Телефон</div>
													<div style={styles.bookingValue}>{booking.phone_number}</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Имя в заявке</div>
													<div style={styles.bookingValue}>
														{booking.first_name} {booking.last_name}
													</div>
												</div>

												<div style={{ ...styles.bookingField, gridColumn: '1 / -1' }}>
													<div style={styles.bookingLabel}>Комментарий</div>
													<div style={styles.bookingValue}>
														{booking.comment || 'Нет комментариев'}
													</div>
												</div>
											</div>

											<div style={styles.bookingActions}>
												<button
													style={styles.greenButton}
													onClick={() => handleRepeatBooking(booking)}
												>
													Повторить бронирование
												</button>

												{!isCanceled ? (
													<button
														style={styles.cancelButton}
														onClick={() => setBookingToCancel(booking)}
													>
														Отменить заявку
													</button>
												) : (
													<div style={styles.canceledText}>Эта заявка уже отменена</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div style={styles.infoCard}>
						<div style={styles.cardHeader}>
							<div style={styles.notificationsHeaderLeft}>
								<h2 style={styles.cardTitle}>Уведомления</h2>
								<div style={styles.notificationsCount}>{totalNotificationsCount}</div>
							</div>
						</div>

						{notifications.length === 0 ? (
							<div style={styles.emptyText}>Уведомлений пока нет</div>
						) : (
							<div style={styles.notificationsList}>
								{notifications.map((item) => (
									<div
										key={item.id}
										style={{
											...styles.notificationItem,
											...(item.is_read ? styles.notificationRead : styles.notificationUnread),
										}}
									>
										<div style={styles.notificationContent}>
											<div style={styles.notificationTitle}>{item.title}</div>
											<div style={styles.notificationText}>{item.message}</div>
											<div style={styles.notificationDate}>{formatDateTime(item.created_at)}</div>
										</div>

										<button
											style={{
												...styles.markReadButton,
												...(item.is_read ? styles.markReadButtonDone : {}),
											}}
											onClick={() => {
												if (!item.is_read) {
													markNotificationRead(item.id);
												}
											}}
										>
											Прочитано
										</button>
									</div>
								))}
							</div>
						)}
					</div>

					<div style={styles.contactsCard}>
						<h3 style={styles.contactsTitle}>Контакты отеля</h3>
						<div style={styles.contactsGrid}>
							<div style={styles.contactItem}>
								<div style={styles.contactLabel}>Телефон</div>
								<div style={styles.contactValue}>+79029794016</div>
							</div>

							<div style={styles.contactItem}>
								<div style={styles.contactLabel}>Email</div>
								<div style={styles.contactValue}>hotel@example.com</div>
							</div>

							<div style={styles.contactItem}>
								<div style={styles.contactLabel}>Время заезда</div>
								<div style={styles.contactValue}>с 14:00</div>
							</div>

							<div style={styles.contactItem}>
								<div style={styles.contactLabel}>Время выезда</div>
								<div style={styles.contactValue}>до 12:00</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{bookingToCancel ? (
				<div style={styles.modalOverlay}>
					<div style={styles.modalCard}>
						<div style={styles.modalBadge}>Подтверждение</div>
						<h3 style={styles.modalTitle}>Отменить заявку?</h3>
						<p style={styles.modalText}>
							Вы действительно хотите отменить это бронирование?
						</p>
						<div style={styles.modalButtons}>
							<button style={styles.cancelEditButton} onClick={() => setBookingToCancel(null)}>
								Нет
							</button>
							<button style={styles.cancelButton} onClick={confirmCancelBooking}>
								Да, отменить
							</button>
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}

function extractArrayFromResponse(data) {
	if (Array.isArray(data)) return data;
	if (Array.isArray(data?.results)) return data.results;
	if (Array.isArray(data?.data)) return data.data;
	return [];
}

function normalizeBooking(item) {
	const totalPrice = Number(item.totalPrice ?? item.total_price ?? item.price ?? 0);
	const nights = Number(item.nights ?? 1);
	const amount = Number(item.amount ?? 1);

	return {
		id: item.id,
		first_name: item.first_name || '',
		last_name: item.last_name || '',
		phone_number: item.phone_number || '',
		email: item.email || '',
		comment: item.comment || '',
		amount,
		nights,
		type: item.roomName || item.type || '',
		roomName: item.roomName || item.type || '',
		number: item.number || '',
		start_date: item.start_date || '',
		end_date: item.end_date || '',
		status: item.status || 'Новая заявка',
		totalPrice,
		pricePerNight:
			item.pricePerNight ||
			(item.price_per_night ?? (nights > 0 ? Math.round(totalPrice / nights) : 0)),
		promoCode: item.promoCode || item.promo_code || '',
		promoDiscount: Number(item.promoDiscount ?? item.promo_discount ?? 0),
		createdAt: item.createdAt || item.created_at || '',
		checkInTime: item.checkInTime || item.check_in_time || '14:00',
		checkOutTime: item.checkOutTime || item.check_out_time || '12:00',
	};
}

function formatDateTime(value) {
	if (!value) return 'Нет данных';
	try {
		return new Date(value).toLocaleString('ru-RU');
	} catch {
		return value;
	}
}

function buildStyles({ isTablet, isMobile, isSmallMobile }) {
	return {
		page: {
			minHeight: '100vh',
			position: 'relative',
			background: '#221815',
			padding: isMobile ? '20px 12px 36px' : isTablet ? '26px 16px 40px' : '32px 20px 48px',
			fontFamily: "'Noto Sans', sans-serif",
		},
		container: {
			position: 'relative',
			zIndex: 1,
			maxWidth: '1180px',
			margin: '0 auto',
		},
		heroCard: {
			background: '#2b1f1b',
			border: '1px solid rgba(255,255,255,0.05)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px' : isTablet ? '18px' : '24px',
			boxShadow: '0 4px 14px rgba(0,0,0,0.14)',
			color: '#f3ece7',
		},
		topGrid: {
			display: 'grid',
			gridTemplateColumns: isTablet ? '1fr' : '1.6fr 1fr',
			gap: isMobile ? '12px' : '16px',
			marginBottom: isMobile ? '14px' : '18px',
		},
		profileHeroLeft: {
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px' : '20px',
		},
		profileIdentity: {
			display: 'flex',
			flexDirection: isSmallMobile ? 'column' : 'row',
			alignItems: isSmallMobile ? 'flex-start' : 'center',
			gap: isMobile ? '12px' : '16px',
		},
		profileTextWrap: {
			display: 'flex',
			flexDirection: 'column',
		},
		avatar: {
			width: isMobile ? '52px' : '60px',
			height: isMobile ? '52px' : '60px',
			borderRadius: '50%',
			background: '#b48a70',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: isMobile ? '20px' : '24px',
			fontWeight: 600,
			color: '#fff7ef',
			flexShrink: 0,
		},
		profileHeading: {
			color: '#ffffff',
			fontFamily: "'Cormorant'",
			fontSize: isSmallMobile ? '1.9rem' : isMobile ? '2.05rem' : '2.25rem',
			fontWeight: 600,
			lineHeight: '1.05',
			marginBottom: '6px',
		},
		heroTitle: {
			margin: 0,
			fontSize: isMobile ? '18px' : '21px',
			lineHeight: 1.2,
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#fff7ef',
			letterSpacing: '-0.01em',
		},
		heroText: {
			marginTop: '10px',
			marginBottom: 0,
			fontSize: isMobile ? '14px' : '15px',
			lineHeight: 1.55,
			color: 'rgba(243, 236, 231, 0.72)',
			maxWidth: '680px',
		},
		quickActionsCard: {
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px' : '20px',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'space-between',
		},
		quickActionsTitle: {
			fontSize: isMobile ? '15px' : '16px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#f3ece7',
			marginBottom: '14px',
			letterSpacing: '-0.01em',
		},
		quickActionsButtons: {
			display: 'flex',
			flexDirection: 'column',
			gap: isMobile ? '8px' : '10px',
		},
		statsGrid: {
			display: 'grid',
			gridTemplateColumns: isSmallMobile
				? '1fr 1fr'
				: isTablet
				? 'repeat(2, minmax(0, 1fr))'
				: 'repeat(4, minmax(0, 1fr))',
			gap: isMobile ? '10px' : '12px',
			marginBottom: isMobile ? '16px' : '20px',
		},
		statCard: {
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px 12px' : '16px',
			minWidth: 0,
		},
		statLabel: {
			fontSize: isMobile ? '11px' : '12px',
			color: 'rgba(243, 236, 231, 0.56)',
			marginBottom: '8px',
			lineHeight: 1.35,
			wordBreak: 'break-word',
		},
		statValue: {
			fontSize: isMobile ? '22px' : '24px',
			fontWeight: 500,
			color: '#fff9f2',
			letterSpacing: '-0.02em',
			wordBreak: 'break-word',
		},
		infoCard: {
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px' : '20px',
			marginBottom: isMobile ? '16px' : '20px',
		},
		cardHeader: {
			display: 'flex',
			flexDirection: isSmallMobile ? 'column' : 'row',
			justifyContent: 'space-between',
			alignItems: isSmallMobile ? 'flex-start' : 'center',
			gap: '12px',
			marginBottom: '16px',
		},
		notificationsHeaderLeft: {
			display: 'flex',
			alignItems: 'center',
			gap: '10px',
			flexWrap: 'wrap',
		},
		notificationsCount: {
			minWidth: '28px',
			height: '28px',
			padding: '0 8px',
			borderRadius: '999px',
			background: '#3a2a25',
			border: '1px solid rgba(255,255,255,0.05)',
			color: '#d7c0aa',
			fontSize: '12px',
			fontWeight: 500,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
		},
		cardTitle: {
			margin: 0,
			fontSize: isMobile ? '17px' : '18px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#f3ece7',
		},
		editButton: {
			height: isMobile ? '36px' : '38px',
			padding: '0 14px',
			border: '1px solid rgba(255,255,255,0.08)',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#3a2a25',
			color: '#f3ece7',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: isMobile ? '13px' : '14px',
			width: isSmallMobile ? '100%' : 'auto',
		},
		messageBox: {
			padding: '12px 14px',
			borderRadius: isMobile ? '8px' : '6px',
			marginBottom: '16px',
			fontSize: '14px',
			fontWeight: 500,
		},
		successMessage: {
			background: 'rgba(90, 160, 110, 0.14)',
			border: '1px solid rgba(120, 210, 150, 0.16)',
			color: '#cdeed7',
		},
		errorMessage: {
			background: 'rgba(179, 38, 30, 0.14)',
			border: '1px solid rgba(255, 120, 120, 0.14)',
			color: '#ffd8d8',
		},
		formBlock: {
			display: 'flex',
			flexDirection: 'column',
			gap: '14px',
		},
		inputGroup: {
			display: 'flex',
			flexDirection: 'column',
			gap: '8px',
		},
		inputLabel: {
			fontSize: '14px',
			fontWeight: 500,
			color: 'rgba(243, 236, 231, 0.74)',
		},
		input: {
			height: isMobile ? '42px' : '44px',
			padding: '0 12px',
			borderRadius: isMobile ? '8px' : '6px',
			border: '1px solid rgba(255,255,255,0.07)',
			background: '#2a1e1a',
			color: '#fff',
			fontSize: isMobile ? '14px' : '15px',
			outline: 'none',
		},
		editButtons: {
			display: 'flex',
			flexDirection: isSmallMobile ? 'column' : 'row',
			gap: '10px',
			marginTop: '6px',
			flexWrap: 'wrap',
		},
		saveButton: {
			height: '42px',
			padding: '0 16px',
			borderRadius: isMobile ? '8px' : '6px',
			border: 'none',
			background: '#8f5d47',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: '14px',
			width: isSmallMobile ? '100%' : 'auto',
		},
		cancelEditButton: {
			height: '42px',
			padding: '0 16px',
			borderRadius: isMobile ? '8px' : '6px',
			border: '1px solid rgba(255,255,255,0.08)',
			background: '#342621',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: '14px',
			width: isSmallMobile ? '100%' : 'auto',
		},
		profileGrid: {
			display: 'grid',
			gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
			gap: isMobile ? '10px' : '12px',
		},
		infoRowCard: {
			padding: isMobile ? '13px 14px' : '15px 16px',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#2a1e1a',
			border: '1px solid rgba(255,255,255,0.04)',
			minWidth: 0,
		},
		infoLabel: {
			fontSize: '12px',
			color: 'rgba(243, 236, 231, 0.56)',
			marginBottom: '8px',
		},
		infoValue: {
			color: '#ffffff',
			fontSize: isMobile ? '14px' : '15px',
			fontWeight: 500,
			wordBreak: 'break-word',
		},
		section: {
			marginTop: '8px',
			marginBottom: isMobile ? '16px' : '20px',
		},
		sectionTop: {
			display: 'flex',
			flexDirection: isMobile ? 'column' : 'row',
			justifyContent: 'space-between',
			alignItems: isMobile ? 'stretch' : 'center',
			gap: '12px',
			marginBottom: '16px',
			flexWrap: 'wrap',
		},
		sectionTitle: {
			marginTop: 0,
			marginBottom: 0,
			fontSize: isMobile ? '17px' : '18px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#f3ece7',
		},
		filterWrap: {
			display: 'flex',
			gap: '8px',
			flexWrap: 'wrap',
			width: isMobile ? '100%' : 'auto',
		},
		filterButton: {
			height: isMobile ? '34px' : '36px',
			padding: '0 14px',
			borderRadius: isMobile ? '8px' : '6px',
			border: '1px solid rgba(255,255,255,0.07)',
			background: '#342621',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: isMobile ? '12px' : '13px',
			flex: isSmallMobile ? '1 1 calc(33.333% - 6px)' : '0 0 auto',
		},
		filterButtonActive: {
			background: '#b68463',
			border: '1px solid #b68463',
			color: '#fff',
		},
		emptyState: {
			padding: isMobile ? '24px 14px' : '28px 20px',
			borderRadius: isMobile ? '10px' : '6px',
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			textAlign: 'center',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			gap: '12px',
		},
		emptyIcon: {
			fontSize: '34px',
		},
		emptyTitle: {
			fontSize: isMobile ? '17px' : '18px',
			fontWeight: 500,
			color: '#fff5e8',
			fontFamily: "'Noto Sans', sans-serif",
		},
		emptyText: {
			color: 'rgba(243, 236, 231, 0.7)',
			fontSize: isMobile ? '13px' : '14px',
			maxWidth: '460px',
			lineHeight: 1.5,
		},
		bookingList: {
			display: 'flex',
			flexDirection: 'column',
			gap: isMobile ? '10px' : '12px',
		},
		bookingCard: {
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px' : '18px',
		},
		bookingCardCanceled: {
			opacity: 0.84,
			border: '1px solid rgba(255, 120, 120, 0.1)',
		},
		bookingHeader: {
			marginBottom: '14px',
			paddingBottom: '12px',
			borderBottom: '1px solid rgba(255,255,255,0.05)',
		},
		bookingTitleLarge: {
			fontSize: isSmallMobile ? '19px' : isMobile ? '20px' : '22px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#fff6ea',
			textTransform: 'capitalize',
			lineHeight: 1.2,
			wordBreak: 'break-word',
		},
		bookingDate: {
			marginTop: '6px',
			fontSize: '12px',
			color: 'rgba(243, 236, 231, 0.56)',
			lineHeight: 1.4,
		},
		bookingGrid: {
			display: 'grid',
			gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
			gap: isMobile ? '10px' : '12px',
		},
		bookingField: {
			padding: isMobile ? '12px 13px' : '12px 14px',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#2a1e1a',
			border: '1px solid rgba(255,255,255,0.04)',
			minWidth: 0,
		},
		bookingLabel: {
			fontSize: '12px',
			color: 'rgba(243, 236, 231, 0.56)',
			marginBottom: '8px',
		},
		bookingValue: {
			fontSize: isMobile ? '14px' : '15px',
			fontWeight: 500,
			color: '#fffdf9',
			wordBreak: 'break-word',
			lineHeight: 1.45,
		},
		bookingSubValue: {
			fontSize: '12px',
			color: 'rgba(243, 236, 231, 0.54)',
			marginTop: '6px',
		},
		bookingActions: {
			marginTop: '14px',
			display: 'flex',
			flexDirection: isMobile ? 'column' : 'row',
			justifyContent: 'space-between',
			gap: '10px',
			flexWrap: 'wrap',
		},
		buttons: {
			display: 'flex',
			gap: '12px',
			marginTop: '24px',
			flexWrap: 'wrap',
		},
		primaryButton: {
			height: isMobile ? '40px' : '42px',
			padding: '0 18px',
			border: 'none',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#b68463',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: isMobile ? '13px' : '14px',
			boxShadow: 'none',
			width: isMobile ? '100%' : 'auto',
		},
		greenButton: {
			height: isMobile ? '40px' : '42px',
			padding: '0 18px',
			border: '1px solid rgba(88, 150, 99, 0.16)',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#3e7c4a',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: isMobile ? '13px' : '14px',
			boxShadow: 'none',
			width: isMobile ? '100%' : 'auto',
		},
		secondaryButton: {
			height: isMobile ? '40px' : '42px',
			padding: '0 18px',
			border: '1px solid rgba(255,255,255,0.08)',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#342621',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: isMobile ? '13px' : '14px',
			width: isMobile ? '100%' : 'auto',
		},
		logoutButton: {
			height: isMobile ? '40px' : '42px',
			padding: '0 18px',
			border: '1px solid rgba(255,255,255,0.06)',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#c0392b',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: isMobile ? '13px' : '14px',
			width: isMobile ? '100%' : 'auto',
		},
		cancelButton: {
			height: '42px',
			padding: '0 16px',
			borderRadius: isMobile ? '8px' : '6px',
			border: '1px solid rgba(255, 120, 120, 0.12)',
			background: '#c0392b',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: '14px',
			boxShadow: 'none',
			width: isMobile ? '100%' : 'auto',
		},
		canceledText: {
			color: 'rgba(255, 220, 220, 0.82)',
			fontSize: '14px',
			fontWeight: 500,
			display: 'flex',
			alignItems: 'center',
		},
		notificationsList: {
			display: 'flex',
			flexDirection: 'column',
			gap: '8px',
			maxHeight: isMobile ? '300px' : '340px',
			overflowY: 'auto',
			paddingRight: '4px',
		},
		notificationItem: {
			padding: isMobile ? '10px' : '10px 12px',
			borderRadius: isMobile ? '8px' : '6px',
			display: 'flex',
			flexDirection: isSmallMobile ? 'column' : 'row',
			justifyContent: 'space-between',
			gap: '12px',
			alignItems: isSmallMobile ? 'stretch' : 'center',
			minHeight: isMobile ? 'unset' : '74px',
		},
		notificationContent: {
			flex: 1,
			minWidth: 0,
		},
		notificationUnread: {
			background: '#352722',
			border: '1px solid rgba(217, 193, 168, 0.14)',
		},
		notificationRead: {
			background: '#2a1e1a',
			border: '1px solid rgba(255,255,255,0.04)',
		},
		notificationTitle: {
			fontSize: isMobile ? '13px' : '14px',
			fontWeight: 500,
			color: '#fff4e6',
			marginBottom: '4px',
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.3,
		},
		notificationText: {
			fontSize: isMobile ? '12px' : '13px',
			color: 'rgba(243,236,231,0.72)',
			lineHeight: 1.4,
			marginBottom: '6px',
			display: '-webkit-box',
			WebkitLineClamp: isMobile ? 3 : 2,
			WebkitBoxOrient: 'vertical',
			overflow: 'hidden',
		},
		notificationDate: {
			fontSize: '11px',
			color: 'rgba(243,236,231,0.5)',
		},
		markReadButton: {
			height: isSmallMobile ? '36px' : '34px',
			padding: '0 12px',
			borderRadius: isMobile ? '8px' : '6px',
			border: '1px solid rgba(255,255,255,0.08)',
			background: '#6f4c3e',
			color: '#fff',
			cursor: 'pointer',
			fontWeight: 500,
			fontSize: '12px',
			whiteSpace: 'nowrap',
			flexShrink: 0,
			width: isSmallMobile ? '100%' : 'auto',
		},
		markReadButtonDone: {
			background: '#4e3a31',
			color: 'rgba(255,255,255,0.78)',
			cursor: 'default',
		},
		contactsCard: {
			marginTop: isMobile ? '16px' : '20px',
			background: '#312420',
			border: '1px solid rgba(255,255,255,0.04)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '14px' : '20px',
		},
		contactsTitle: {
			marginTop: 0,
			marginBottom: '14px',
			fontSize: isMobile ? '17px' : '18px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#f3ece7',
		},
		contactsGrid: {
			display: 'grid',
			gridTemplateColumns: isMobile
				? '1fr'
				: isTablet
				? 'repeat(2, minmax(0, 1fr))'
				: 'repeat(4, minmax(0, 1fr))',
			gap: isMobile ? '10px' : '12px',
		},
		contactItem: {
			padding: isMobile ? '13px' : '14px',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#2a1e1a',
			border: '1px solid rgba(255,255,255,0.04)',
			minWidth: 0,
		},
		contactLabel: {
			fontSize: '12px',
			color: 'rgba(243, 236, 231, 0.56)',
			marginBottom: '8px',
		},
		contactValue: {
			fontSize: isMobile ? '14px' : '15px',
			fontWeight: 500,
			color: '#fffdf9',
			wordBreak: 'break-word',
			lineHeight: 1.45,
		},
		modalOverlay: {
			position: 'fixed',
			inset: 0,
			background: 'rgba(0,0,0,0.55)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: isMobile ? '14px' : '20px',
			zIndex: 9999,
		},
		modalCard: {
			width: '100%',
			maxWidth: '420px',
			background: '#2b1f1b',
			border: '1px solid rgba(255,255,255,0.08)',
			borderRadius: isMobile ? '10px' : '6px',
			padding: isMobile ? '18px 16px' : '22px',
			boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
			color: '#fff',
		},
		modalBadge: {
			display: 'inline-flex',
			alignItems: 'center',
			height: '32px',
			padding: '0 10px',
			borderRadius: isMobile ? '8px' : '6px',
			background: '#352722',
			border: '1px solid rgba(255,255,255,0.05)',
			color: '#d7c0aa',
			fontSize: '12px',
			fontWeight: 500,
			marginBottom: '14px',
		},
		modalTitle: {
			marginTop: 0,
			marginBottom: '10px',
			fontSize: isMobile ? '18px' : '20px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			color: '#fff6ea',
		},
		modalText: {
			marginTop: 0,
			marginBottom: '18px',
			color: 'rgba(243,236,231,0.78)',
			lineHeight: 1.55,
			fontSize: isMobile ? '14px' : '15px',
		},
		modalButtons: {
			display: 'flex',
			flexDirection: isSmallMobile ? 'column' : 'row',
			gap: '10px',
			flexWrap: 'wrap',
		},
	};
}

export default ProfilePage;