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

	const [refreshKey, setRefreshKey] = React.useState(0);
	const [isEditing, setIsEditing] = React.useState(false);
	const [message, setMessage] = React.useState('');
	const [messageType, setMessageType] = React.useState('');
	const [activeFilter, setActiveFilter] = React.useState('all');
	const [bookingToCancel, setBookingToCancel] = React.useState(null);

	const [bookings, setBookings] = React.useState([]);
	const [notifications, setNotifications] = React.useState([]);
	const [bookingsLoading, setBookingsLoading] = React.useState(false);

	const [formData, setFormData] = React.useState({
		name: '',
		email: '',
		phone: '',
	});

	React.useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || '',
				email: user.email || '',
				phone: user.phone || '',
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
				setMessage(
					error?.response?.data?.message || 'Не удалось загрузить бронирования'
				);
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
			} catch (error) {
				console.error('Ошибка загрузки уведомлений:', error);
				setNotifications([]);
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
		const lastBooking = allUserBookings.length ? allUserBookings[0] : null;

		return {
			total,
			active,
			canceled,
			lastBookingDate: lastBooking ? formatDateTime(lastBooking.createdAt) : 'Нет данных',
		};
	}, [allUserBookings]);

	const unreadNotificationsCount = notifications.filter((item) => !item.is_read).length;

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

		const result = await updateProfile({
			name: formData.name.trim(),
			email: formData.email.trim(),
			phone: formData.phone.trim(),
		});

		if (!result.success) {
			setMessage(result.message);
			setMessageType('error');
			return;
		}

		setMessage('Данные профиля успешно сохранены');
		setMessageType('success');
		setIsEditing(false);
		setRefreshKey((prev) => prev + 1);
	};

	const handleCancelEdit = () => {
		if (user) {
			setFormData({
				name: user.name || '',
				email: user.email || '',
				phone: user.phone || '',
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
			setMessage(
				error?.response?.data?.message || 'Не удалось отменить бронирование'
			);
			setMessageType('error');
			setBookingToCancel(null);
		}
	};

	const handleRepeatBooking = (booking) => {
		const roomType = String(booking?.type || 'standard').trim().toLowerCase();
		const safeRoomType =
			roomType === 'luxe plus' || roomType === 'luxe premium' || roomType === 'luxe' || roomType === 'standard'
				? roomType
				: 'standard';

		navigate(`/reservation/${encodeURIComponent(safeRoomType)}`, {
			state: {
				searchMode: 'direct-room',
				toDate: booking.start_date ? new Date(booking.start_date).toISOString() : new Date().toISOString(),
				fromDate: booking.end_date
					? new Date(booking.end_date).toISOString()
					: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
				persons: { count: Number(booking.amount) || 1 },
				filters: {
					type: 'all',
					price: 'all',
					sort: 'default',
					amenities: [],
				},
			},
		});
	};

	const markNotificationRead = async (id) => {
		try {
			await axios.post(`${API_BASE}/notifications/read/`, {
				notification_id: id,
			});
			setRefreshKey((prev) => prev + 1);
		} catch (error) {
			console.error('Ошибка отметки уведомления:', error);
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
							<div style={styles.badge}>Личный кабинет</div>

							<div style={styles.profileIdentity}>
								<div style={styles.avatar}>{avatarLetter}</div>

								<div>
									<h1 style={styles.heroTitle}>Здравствуйте, {user.name}</h1>
									<p style={styles.heroText}>
										Управляйте бронированиями, редактируйте профиль и отслеживайте статус своих заявок.
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
								<button style={styles.secondaryButton} onClick={() => navigate('/')}>
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
							<div style={styles.statLabel}>Новых уведомлений</div>
							<div style={styles.statValue}>{unreadNotificationsCount}</div>
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
									<div style={styles.infoLabel}>Дата регистрации</div>
									<div style={styles.infoValue}>{formatDateTime(user.createdAt)}</div>
								</div>
							</div>
						)}
					</div>

					<div style={styles.infoCard}>
						<div style={styles.cardHeader}>
							<h2 style={styles.cardTitle}>Уведомления</h2>
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
										<div>
											<div style={styles.notificationTitle}>{item.title}</div>
											<div style={styles.notificationText}>{item.message}</div>
											<div style={styles.notificationDate}>{formatDateTime(item.created_at)}</div>
										</div>

										{!item.is_read ? (
											<button
												style={styles.markReadButton}
												onClick={() => markNotificationRead(item.id)}
											>
												Прочитано
											</button>
										) : null}
									</div>
								))}
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
								<button style={styles.primaryButton} onClick={() => navigate('/')}>
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
												<div>
													<div style={styles.bookingTopMeta}>
														<span style={styles.bookingNumber}>
															{booking.bookingNumber || `HTL-${String(booking.id).slice(-6)}`}
														</span>
														<span
															style={{
																...styles.statusBadge,
																...(isCanceled ? styles.statusBadgeCanceled : {}),
															}}
														>
															{booking.status || 'Новая заявка'}
														</span>
													</div>

													<div style={styles.bookingTitle}>
														{booking.roomName || booking.type || 'Номер не указан'}
													</div>

													<div style={styles.bookingDate}>
														Создано: {formatDateTime(booking.createdAt)}
													</div>
												</div>
											</div>

											<div style={styles.bookingGrid}>
												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Заезд</div>
													<div style={styles.bookingValue}>{booking.start_date}</div>
													<div style={styles.bookingSubValue}>с {booking.checkInTime || '14:00'}</div>
												</div>

												<div style={styles.bookingField}>
													<div style={styles.bookingLabel}>Выезд</div>
													<div style={styles.bookingValue}>{booking.end_date}</div>
													<div style={styles.bookingSubValue}>до {booking.checkOutTime || '12:00'}</div>
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
													<div style={styles.bookingValue}>{booking.comment || 'Нет комментариев'}</div>
												</div>
											</div>

											<div style={styles.bookingActions}>
												<button
													style={styles.repeatButton}
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
							Вы действительно хотите отменить бронирование{' '}
							<strong>{bookingToCancel.bookingNumber || `HTL-${String(bookingToCancel.id).slice(-6)}`}</strong>?
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
	const totalPrice = Number(
		item.totalPrice ??
		item.total_price ??
		item.price ??
		0
	);

	const nights = Number(item.nights ?? 1);
	const amount = Number(item.amount ?? 1);

	return {
		id: item.id,
		bookingNumber: item.bookingNumber || item.booking_number || null,
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

const styles = {
	page: {
		minHeight: '100vh',
		position: 'relative',
		background: '#221815',
		padding: '32px 20px 48px',
	},
	container: {
		position: 'relative',
		zIndex: 1,
		maxWidth: '1180px',
		margin: '0 auto',
	},
	heroCard: {
		background: '#2b1f1b',
		border: '1px solid rgba(255,255,255,0.06)',
		borderRadius: '12px',
		padding: '24px',
		boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
		color: '#f3ece7',
	},
	topGrid: {
		display: 'grid',
		gridTemplateColumns: '1.6fr 1fr',
		gap: '16px',
		marginBottom: '20px',
	},
	profileHeroLeft: {
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
		borderRadius: '10px',
		padding: '20px',
	},
	badge: {
		display: 'inline-block',
		padding: '6px 10px',
		borderRadius: '999px',
		background: '#3a2a25',
		border: '1px solid rgba(255,255,255,0.08)',
		color: '#d9c1a8',
		fontSize: '12px',
		fontWeight: 700,
		marginBottom: '14px',
	},
	profileIdentity: {
		display: 'flex',
		alignItems: 'center',
		gap: '16px',
	},
	avatar: {
		width: '64px',
		height: '64px',
		borderRadius: '50%',
		background: '#8f674f',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '28px',
		fontWeight: 800,
		color: '#fff7ef',
		flexShrink: 0,
	},
	heroTitle: {
		margin: 0,
		fontSize: '28px',
		lineHeight: 1.15,
		fontWeight: 700,
		color: '#fff7ef',
	},
	heroText: {
		marginTop: '10px',
		marginBottom: 0,
		fontSize: '15px',
		lineHeight: 1.55,
		color: 'rgba(243, 236, 231, 0.74)',
		maxWidth: '680px',
	},
	quickActionsCard: {
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
		borderRadius: '10px',
		padding: '20px',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	quickActionsTitle: {
		fontSize: '18px',
		fontWeight: 700,
		color: '#f3ece7',
		marginBottom: '14px',
	},
	quickActionsButtons: {
		display: 'flex',
		flexDirection: 'column',
		gap: '10px',
	},
	statsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		gap: '12px',
		marginBottom: '20px',
	},
	statCard: {
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
		borderRadius: '10px',
		padding: '16px',
	},
	statLabel: {
		fontSize: '12px',
		color: 'rgba(243, 236, 231, 0.58)',
		marginBottom: '8px',
	},
	statValue: {
		fontSize: '28px',
		fontWeight: 700,
		color: '#fff9f2',
	},
	infoCard: {
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
		borderRadius: '10px',
		padding: '20px',
		marginBottom: '24px',
	},
	cardHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '12px',
		marginBottom: '16px',
	},
	cardTitle: {
		margin: 0,
		fontSize: '22px',
		color: '#f3ece7',
	},
	editButton: {
		height: '40px',
		padding: '0 14px',
		border: '1px solid rgba(255,255,255,0.10)',
		borderRadius: '8px',
		background: '#3a2a25',
		color: '#f3ece7',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '14px',
	},
	messageBox: {
		padding: '12px 14px',
		borderRadius: '8px',
		marginBottom: '16px',
		fontSize: '14px',
		fontWeight: 600,
	},
	successMessage: {
		background: 'rgba(90, 160, 110, 0.16)',
		border: '1px solid rgba(120, 210, 150, 0.18)',
		color: '#cdeed7',
	},
	errorMessage: {
		background: 'rgba(179, 38, 30, 0.16)',
		border: '1px solid rgba(255, 120, 120, 0.16)',
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
		fontWeight: 600,
		color: 'rgba(243, 236, 231, 0.74)',
	},
	input: {
		height: '46px',
		padding: '0 12px',
		borderRadius: '8px',
		border: '1px solid rgba(255,255,255,0.08)',
		background: '#2a1e1a',
		color: '#fff',
		fontSize: '15px',
		outline: 'none',
	},
	editButtons: {
		display: 'flex',
		gap: '10px',
		marginTop: '6px',
		flexWrap: 'wrap',
	},
	saveButton: {
		height: '44px',
		padding: '0 16px',
		borderRadius: '8px',
		border: 'none',
		background: '#7b4b3a',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
	},
	cancelEditButton: {
		height: '44px',
		padding: '0 16px',
		borderRadius: '8px',
		border: '1px solid rgba(255,255,255,0.10)',
		background: '#342621',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
	},
	profileGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		gap: '12px',
	},
	infoRowCard: {
		padding: '16px',
		borderRadius: '8px',
		background: '#2a1e1a',
		border: '1px solid rgba(255,255,255,0.05)',
	},
	infoLabel: {
		fontSize: '12px',
		color: 'rgba(243, 236, 231, 0.58)',
		marginBottom: '8px',
	},
	infoValue: {
		color: '#ffffff',
		fontSize: '15px',
		fontWeight: 600,
		wordBreak: 'break-word',
	},
	notificationsList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	notificationItem: {
		padding: '14px',
		borderRadius: '8px',
		display: 'flex',
		justifyContent: 'space-between',
		gap: '12px',
		alignItems: 'flex-start',
	},
	notificationUnread: {
		background: '#3a2a25',
		border: '1px solid rgba(217, 193, 168, 0.22)',
	},
	notificationRead: {
		background: '#2a1e1a',
		border: '1px solid rgba(255,255,255,0.05)',
	},
	notificationTitle: {
		fontSize: '15px',
		fontWeight: 700,
		color: '#fff4e6',
		marginBottom: '6px',
	},
	notificationText: {
		fontSize: '14px',
		color: 'rgba(243,236,231,0.76)',
		lineHeight: 1.5,
		marginBottom: '6px',
	},
	notificationDate: {
		fontSize: '12px',
		color: 'rgba(243,236,231,0.56)',
	},
	markReadButton: {
		height: '38px',
		padding: '0 12px',
		borderRadius: '8px',
		border: '1px solid rgba(255,255,255,0.10)',
		background: '#4b332b',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '13px',
		whiteSpace: 'nowrap',
	},
	section: {
		marginTop: '8px',
	},
	sectionTop: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		marginBottom: '16px',
		flexWrap: 'wrap',
	},
	sectionTitle: {
		marginTop: 0,
		marginBottom: 0,
		fontSize: '26px',
		color: '#f3ece7',
	},
	filterWrap: {
		display: 'flex',
		gap: '8px',
		flexWrap: 'wrap',
	},
	filterButton: {
		height: '36px',
		padding: '0 14px',
		borderRadius: '8px',
		border: '1px solid rgba(255,255,255,0.08)',
		background: '#342621',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '13px',
	},
	filterButtonActive: {
		background: '#7b4b3a',
		border: '1px solid #7b4b3a',
		color: '#fff',
	},
	emptyState: {
		padding: '28px 20px',
		borderRadius: '10px',
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
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
		fontSize: '20px',
		fontWeight: 700,
		color: '#fff5e8',
	},
	emptyText: {
		color: 'rgba(243, 236, 231, 0.70)',
		fontSize: '14px',
		maxWidth: '460px',
	},
	bookingList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '14px',
	},
	bookingCard: {
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
		borderRadius: '10px',
		padding: '18px',
	},
	bookingCardCanceled: {
		opacity: 0.84,
		border: '1px solid rgba(255, 120, 120, 0.12)',
	},
	bookingHeader: {
		marginBottom: '14px',
		paddingBottom: '12px',
		borderBottom: '1px solid rgba(255,255,255,0.06)',
	},
	bookingTopMeta: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		flexWrap: 'wrap',
		marginBottom: '10px',
	},
	bookingNumber: {
		fontSize: '12px',
		fontWeight: 700,
		letterSpacing: '0.04em',
		color: '#d9c1a8',
		background: '#3a2a25',
		border: '1px solid rgba(255,255,255,0.08)',
		padding: '6px 10px',
		borderRadius: '999px',
	},
	bookingTitle: {
		fontSize: '22px',
		fontWeight: 700,
		color: '#fff6ea',
		textTransform: 'capitalize',
	},
	bookingDate: {
		marginTop: '6px',
		fontSize: '12px',
		color: 'rgba(243, 236, 231, 0.58)',
	},
	statusBadge: {
		padding: '6px 10px',
		borderRadius: '999px',
		background: 'rgba(90, 160, 110, 0.14)',
		border: '1px solid rgba(120, 210, 150, 0.16)',
		color: '#cdeed7',
		fontSize: '12px',
		fontWeight: 700,
		whiteSpace: 'nowrap',
	},
	statusBadgeCanceled: {
		background: 'rgba(179, 38, 30, 0.14)',
		border: '1px solid rgba(255, 120, 120, 0.16)',
		color: '#ffd8d8',
	},
	bookingGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		gap: '12px',
	},
	bookingField: {
		padding: '12px 14px',
		borderRadius: '8px',
		background: '#2a1e1a',
		border: '1px solid rgba(255,255,255,0.04)',
	},
	bookingLabel: {
		fontSize: '12px',
		color: 'rgba(243, 236, 231, 0.58)',
		marginBottom: '8px',
	},
	bookingValue: {
		fontSize: '15px',
		fontWeight: 600,
		color: '#fffdf9',
		wordBreak: 'break-word',
	},
	bookingSubValue: {
		fontSize: '12px',
		color: 'rgba(243, 236, 231, 0.56)',
		marginTop: '6px',
	},
	bookingActions: {
		marginTop: '14px',
		display: 'flex',
		justifyContent: 'space-between',
		gap: '10px',
		flexWrap: 'wrap',
	},
	repeatButton: {
		height: '42px',
		padding: '0 16px',
		borderRadius: '8px',
		border: '1px solid rgba(255,255,255,0.10)',
		background: '#3a2a25',
		color: '#f3ece7',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
	},
	cancelButton: {
		height: '42px',
		padding: '0 16px',
		borderRadius: '8px',
		border: '1px solid rgba(255, 120, 120, 0.14)',
		background: '#9f2d24',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
		boxShadow: 'none',
	},
	canceledText: {
		color: 'rgba(255, 220, 220, 0.82)',
		fontSize: '14px',
		fontWeight: 600,
		display: 'flex',
		alignItems: 'center',
	},
	buttons: {
		display: 'flex',
		gap: '12px',
		marginTop: '24px',
		flexWrap: 'wrap',
	},
	primaryButton: {
		height: '44px',
		padding: '0 18px',
		border: 'none',
		borderRadius: '8px',
		background: '#7b4b3a',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
		boxShadow: 'none',
	},
	secondaryButton: {
		height: '44px',
		padding: '0 18px',
		border: '1px solid rgba(255,255,255,0.10)',
		borderRadius: '8px',
		background: '#342621',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
	},
	logoutButton: {
		height: '44px',
		padding: '0 18px',
		border: '1px solid rgba(255,255,255,0.06)',
		borderRadius: '8px',
		background: '#9f2d24',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: '14px',
	},
	contactsCard: {
		marginTop: '24px',
		background: '#312420',
		border: '1px solid rgba(255,255,255,0.05)',
		borderRadius: '10px',
		padding: '20px',
	},
	contactsTitle: {
		marginTop: 0,
		marginBottom: '14px',
		fontSize: '22px',
		color: '#f3ece7',
	},
	contactsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		gap: '12px',
	},
	contactItem: {
		padding: '14px',
		borderRadius: '8px',
		background: '#2a1e1a',
		border: '1px solid rgba(255,255,255,0.04)',
	},
	contactLabel: {
		fontSize: '12px',
		color: 'rgba(243, 236, 231, 0.58)',
		marginBottom: '8px',
	},
	contactValue: {
		fontSize: '15px',
		fontWeight: 600,
		color: '#fffdf9',
		wordBreak: 'break-word',
	},
	modalOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.55)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '20px',
		zIndex: 9999,
	},
	modalCard: {
		width: '100%',
		maxWidth: '420px',
		background: '#2b1f1b',
		border: '1px solid rgba(255,255,255,0.08)',
		borderRadius: '10px',
		padding: '22px',
		boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
		color: '#fff',
	},
	modalBadge: {
		display: 'inline-block',
		padding: '6px 10px',
		borderRadius: '999px',
		background: '#3a2a25',
		border: '1px solid rgba(255,255,255,0.08)',
		color: '#d9c1a8',
		fontSize: '12px',
		fontWeight: 700,
		marginBottom: '14px',
	},
	modalTitle: {
		marginTop: 0,
		marginBottom: '10px',
		fontSize: '24px',
		color: '#fff6ea',
	},
	modalText: {
		marginTop: 0,
		marginBottom: '18px',
		color: 'rgba(243,236,231,0.78)',
		lineHeight: 1.55,
	},
	modalButtons: {
		display: 'flex',
		gap: '10px',
		flexWrap: 'wrap',
	},
};

export default ProfilePage;