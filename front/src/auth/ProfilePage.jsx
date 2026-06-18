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
		const canceled = allUserBookings.filter((item) => item.status === 'Отменена').length;
		const active = total - canceled;
		const lastBooking = allUserBookings[0] || null;

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

		try {
			const result = await updateProfile({
				name: formData.name.trim(),
				email: formData.email.trim(),
				phone: formData.phone.trim(),
			});

			if (!result.success) {
				setMessage(result.message || 'Не удалось обновить профиль');
				setMessageType('error');
				return;
			}

			setMessage(result.message || 'Профиль успешно обновлен');
			setMessageType('success');
			setIsEditing(false);
			setRefreshKey((prev) => prev + 1);
		} catch (error) {
			console.error('Ошибка обновления профиля:', error);
			setMessage('Не удалось обновить профиль');
			setMessageType('error');
		}
	};

	const handleCancelEdit = () => {
		setFormData({
			name: user?.name || '',
			email: user?.email || '',
			phone: user?.phone || '',
		});
		setIsEditing(false);
		setMessage('');
		setMessageType('');
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

	const handleCancelBooking = async () => {
		if (!bookingToCancel?.id) return;

		try {
			await axios.post(`${API_BASE}/bookings/cancel/`, {
				id: bookingToCancel.id,
				email: user?.email || '',
			});

			setBookingToCancel(null);
			setMessage('Бронирование успешно отменено');
			setMessageType('success');
			setRefreshKey((prev) => prev + 1);
		} catch (error) {
			console.error('Ошибка отмены бронирования:', error);
			setMessage(error?.response?.data?.message || 'Не удалось отменить бронирование');
			setMessageType('error');
			setBookingToCancel(null);
		}
	};

	return (
		<div style={styles.page}>
			<div style={styles.container}>
				<div style={styles.headerCard}>
					<div style={styles.userInfoBlock}>
						<div style={styles.avatar}>{(user?.name || 'U').charAt(0).toUpperCase()}</div>
						<div style={styles.headerTextBlock}>
							<h1 style={styles.pageTitle}>Личный кабинет</h1>
							<div style={styles.pageSubtitle}>
								Управляйте бронированиями, редактируйте профиль и отслеживайте статус своих заявок.
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
						<div style={styles.statLabel}>Уведомлений</div>
						<div style={styles.statValue}>{unreadNotificationsCount}</div>
					</div>
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

				<div style={styles.profileCard}>
					<div style={styles.sectionHeader}>
						<h2 style={styles.sectionTitle}>Профиль</h2>

						{!isEditing ? (
							<button style={styles.editButton} onClick={() => setIsEditing(true)}>
								Редактировать
							</button>
						) : null}
					</div>

					<div style={styles.profileGrid}>
						<div style={styles.fieldCard}>
							<div style={styles.fieldLabel}>Имя</div>
							{isEditing ? (
								<input
									style={styles.input}
									name="name"
									value={formData.name}
									onChange={handleInputChange}
									placeholder="Введите имя"
								/>
							) : (
								<div style={styles.fieldValue}>{user?.name || 'Не указано'}</div>
							)}
						</div>

						<div style={styles.fieldCard}>
							<div style={styles.fieldLabel}>Email</div>
							{isEditing ? (
								<input
									style={styles.input}
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									placeholder="Введите email"
								/>
							) : (
								<div style={styles.fieldValue}>{user?.email || 'Не указано'}</div>
							)}
						</div>

						<div style={styles.fieldCard}>
							<div style={styles.fieldLabel}>Телефон</div>
							{isEditing ? (
								<input
									style={styles.input}
									name="phone"
									value={formData.phone}
									onChange={handleInputChange}
									placeholder="+7 (999) 999-99-99"
								/>
							) : (
								<div style={styles.fieldValue}>{user?.phone || 'Не указано'}</div>
							)}
						</div>

						<div style={styles.fieldCard}>
							<div style={styles.fieldLabel}>Пароль</div>
							<div style={styles.fieldValue}>••••••••</div>
						</div>

						<div style={{ ...styles.fieldCard, gridColumn: '1 / -1' }}>
							<div style={styles.fieldLabel}>Дата регистрации</div>
							<div style={styles.fieldValue}>
								{user?.createdAt ? formatDateTime(user.createdAt) : 'Не указана'}
							</div>
						</div>
					</div>

					{isEditing ? (
						<div style={styles.formButtons}>
							<button style={styles.saveButton} onClick={handleSaveProfile}>
								Сохранить
							</button>
							<button style={styles.cancelEditButton} onClick={handleCancelEdit}>
								Отмена
							</button>
						</div>
					) : null}
				</div>

				<div style={styles.bookingsCard}>
					<div style={styles.sectionHeader}>
						<h2 style={styles.sectionTitle}>Мои бронирования</h2>

						<div style={styles.filtersRow}>
							<button
								style={activeFilter === 'all' ? styles.activeFilterButton : styles.filterButton}
								onClick={() => setActiveFilter('all')}
							>
								Все
							</button>
							<button
								style={activeFilter === 'active' ? styles.activeFilterButton : styles.filterButton}
								onClick={() => setActiveFilter('active')}
							>
								Активные
							</button>
							<button
								style={activeFilter === 'canceled' ? styles.activeFilterButton : styles.filterButton}
								onClick={() => setActiveFilter('canceled')}
							>
								Отмененные
							</button>
						</div>
					</div>

					{bookingsLoading ? (
						<div style={styles.emptyState}>Загрузка бронирований...</div>
					) : filteredBookings.length === 0 ? (
						<div style={styles.emptyState}>
							<div style={styles.emptyStateIcon}>🏨</div>
							<div style={styles.emptyStateTitle}>Нет бронирований</div>
							<div style={styles.emptyStateText}>
								После оформления заявки она появится в этом разделе.
							</div>
							<button style={styles.emptyStateButton} onClick={() => navigate('/')}>
								Выбрать номер
							</button>
						</div>
					) : (
						<div style={styles.bookingList}>
							{filteredBookings.map((booking) => {
								const isCanceled = booking.status === 'Отменена';

								return (
									<div key={booking.id} style={styles.bookingCard}>
										<div style={styles.bookingHeader}>
											<div>
												<h3 style={styles.bookingTitle}>{booking.roomTitle || booking.type || 'Номер'}</h3>
												<div style={styles.bookingMeta}>
													Создано: {booking.createdAt ? formatDateTime(booking.createdAt) : 'Неизвестно'}
												</div>
											</div>

											<div
												style={{
													...styles.statusBadge,
													...(isCanceled ? styles.statusCanceled : styles.statusActive),
												}}
											>
												{booking.status || 'Активна'}
											</div>
										</div>

										<div style={styles.bookingGrid}>
											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Заезд</div>
												<div style={styles.bookingValue}>{formatDate(booking.start_date)}</div>
												<div style={styles.bookingSubValue}>с 14:00</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Выезд</div>
												<div style={styles.bookingValue}>{formatDate(booking.end_date)}</div>
												<div style={styles.bookingSubValue}>до 12:00</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Количество гостей</div>
												<div style={styles.bookingValue}>{booking.amount || 1}</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Количество ночей</div>
												<div style={styles.bookingValue}>{booking.nights || 1}</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Цена за ночь</div>
												<div style={styles.bookingValue}>{formatPrice(booking.pricePerNight)}</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Итоговая стоимость</div>
												<div style={styles.bookingValue}>{formatPrice(booking.totalPrice)}</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Телефон</div>
												<div style={styles.bookingValue}>{booking.phone || 'Не указан'}</div>
											</div>

											<div style={styles.bookingField}>
												<div style={styles.bookingLabel}>Имя в заявке</div>
												<div style={styles.bookingValue}>{booking.fullName || 'Не указано'}</div>
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

				<div style={styles.notificationsCard}>
					<div style={styles.sectionHeader}>
						<h2 style={styles.sectionTitle}>Уведомления</h2>
						<div style={styles.notificationCounter}>{notifications.length}</div>
					</div>

					{notifications.length === 0 ? (
						<div style={styles.notificationEmpty}>Уведомлений пока нет</div>
					) : (
						<div style={styles.notificationList}>
							{notifications.map((notification) => (
								<div key={notification.id} style={styles.notificationCard}>
									<div style={styles.notificationTitle}>
										{notification.title || 'Уведомление'}
									</div>
									<div style={styles.notificationText}>
										{notification.message || notification.text || ''}
									</div>
									<div style={styles.notificationDate}>
										{notification.created_at
											? formatDateTime(notification.created_at)
											: 'Дата неизвестна'}
									</div>
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

			{bookingToCancel ? (
				<div style={styles.modalOverlay}>
					<div style={styles.modalCard}>
						<div style={styles.modalTitle}>Подтвердите отмену</div>
						<div style={styles.modalText}>
							Вы действительно хотите отменить бронирование{' '}
							<strong>{bookingToCancel.roomTitle || bookingToCancel.type || 'номера'}</strong>?
						</div>

						<div style={styles.modalButtons}>
							<button style={styles.confirmCancelButton} onClick={handleCancelBooking}>
								Да, отменить
							</button>
							<button style={styles.modalCloseButton} onClick={() => setBookingToCancel(null)}>
								Нет, оставить
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
	if (Array.isArray(data?.bookings)) return data.bookings;
	if (Array.isArray(data?.notifications)) return data.notifications;
	return [];
}

function normalizeBooking(item) {
	const typeRaw = String(item?.type || '').trim().toLowerCase();

	const roomTitleMap = {
		standard: 'Standard',
		luxe: 'Luxe',
		'luxe plus': 'Luxe Plus',
		'luxe premium': 'Luxe Premium',
	};

	const createdAt = item.created_at || item.createdAt || '';

	return {
		id: item.id,
		type: typeRaw || 'standard',
		roomTitle: roomTitleMap[typeRaw] || item.roomTitle || item.type || 'Номер',
		start_date: item.start_date,
		end_date: item.end_date,
		amount: Number(item.amount) || 1,
		nights: Number(item.nights) || countNights(item.start_date, item.end_date),
		status: item.status || 'Активна',
		comment: item.comment || '',
		email: item.email || '',
		phone: item.phone_number || item.phone || '',
		fullName: [item.first_name, item.last_name].filter(Boolean).join(' ').trim(),
		pricePerNight: Number(item.price_per_night || inferPriceByType(typeRaw)),
		totalPrice: Number(item.total_price || item.totalPrice || 0) || inferTotalPrice(item, typeRaw),
		createdAt,
	};
}

function inferPriceByType(type) {
	if (type === 'luxe') return 3400;
	if (type === 'luxe plus') return 3700;
	if (type === 'luxe premium') return 4200;
	return 2200;
}

function inferTotalPrice(item, type) {
	const nights = Number(item.nights) || countNights(item.start_date, item.end_date);
	return inferPriceByType(type) * nights;
}

function countNights(startDate, endDate) {
	if (!startDate || !endDate) return 1;

	const start = new Date(startDate);
	const end = new Date(endDate);
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);

	const diff = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
	return diff > 0 ? diff : 1;
}

function formatDate(value) {
	if (!value) return 'Не указана';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Не указана';

	return date.toLocaleDateString('ru-RU');
}

function formatDateTime(value) {
	if (!value) return 'Не указана';

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Не указана';

	return date.toLocaleString('ru-RU');
}

function formatPrice(value) {
	return `${Number(value || 0).toLocaleString('ru-RU')} ₽`;
}

const styles = {
	page: {
		minHeight: '100vh',
		background:
			'linear-gradient(180deg, rgba(25, 18, 15, 0.96) 0%, rgba(34, 22, 18, 0.98) 100%)',
		color: '#f5ede7',
		padding: '32px 16px 48px',
	},
	container: {
		maxWidth: '1120px',
		margin: '0 auto',
		display: 'grid',
		gap: '20px',
	},
	headerCard: {
		display: 'grid',
		gridTemplateColumns: '2fr 1.2fr',
		gap: '20px',
		background: 'rgba(62, 38, 31, 0.88)',
		border: '1px solid rgba(201, 161, 122, 0.14)',
		borderRadius: '24px',
		padding: '24px',
		boxShadow: '0 18px 40px rgba(0, 0, 0, 0.22)',
	},
	userInfoBlock: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '18px',
	},
	avatar: {
		width: '62px',
		height: '62px',
		borderRadius: '50%',
		background: '#cfa17d',
		color: '#fff',
		fontSize: '32px',
		fontWeight: 700,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	},
	headerTextBlock: {
		display: 'grid',
		gap: '10px',
	},
	pageTitle: {
		fontSize: '48px',
		lineHeight: 1.05,
		margin: 0,
		color: '#fff3ea',
		fontFamily: 'Cormorant Garamond, serif',
		fontWeight: 700,
	},
	pageSubtitle: {
		fontSize: '18px',
		lineHeight: 1.45,
		color: 'rgba(255, 243, 234, 0.85)',
		maxWidth: '560px',
	},
	quickActionsCard: {
		borderRadius: '20px',
		border: '1px solid rgba(201, 161, 122, 0.12)',
		background: 'rgba(84, 51, 40, 0.28)',
		padding: '18px',
		display: 'grid',
		gap: '14px',
		alignContent: 'start',
	},
	quickActionsTitle: {
		fontSize: '28px',
		fontWeight: 700,
		fontFamily: 'Cormorant Garamond, serif',
		color: '#fff0e3',
	},
	quickActionsButtons: {
		display: 'grid',
		gap: '10px',
	},
	primaryButton: {
		border: 'none',
		borderRadius: '14px',
		padding: '14px 18px',
		fontSize: '17px',
		fontWeight: 700,
		cursor: 'pointer',
		background: '#cfa17d',
		color: '#2b1a13',
		transition: '0.2s ease',
	},
	secondaryButton: {
		border: '1px solid rgba(201, 161, 122, 0.2)',
		borderRadius: '14px',
		padding: '14px 18px',
		fontSize: '17px',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'transparent',
		color: '#fff0e3',
	},
	logoutButton: {
		border: 'none',
		borderRadius: '14px',
		padding: '14px 18px',
		fontSize: '17px',
		fontWeight: 700,
		cursor: 'pointer',
		background: '#cf4a38',
		color: '#fff',
	},
	statsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		gap: '14px',
	},
	statCard: {
		background: 'rgba(62, 38, 31, 0.88)',
		border: '1px solid rgba(201, 161, 122, 0.12)',
		borderRadius: '18px',
		padding: '20px',
		display: 'grid',
		gap: '10px',
	},
	statLabel: {
		color: 'rgba(255, 243, 234, 0.75)',
		fontSize: '15px',
	},
	statValue: {
		fontSize: '44px',
		fontWeight: 700,
		lineHeight: 1,
		color: '#fff4ea',
	},
	messageBox: {
		borderRadius: '16px',
		padding: '14px 18px',
		fontSize: '16px',
		fontWeight: 600,
	},
	successMessage: {
		background: 'rgba(51, 129, 81, 0.18)',
		border: '1px solid rgba(84, 197, 120, 0.32)',
		color: '#d7ffe4',
	},
	errorMessage: {
		background: 'rgba(201, 74, 74, 0.16)',
		border: '1px solid rgba(255, 116, 116, 0.28)',
		color: '#ffd9d9',
	},
	profileCard: {
		background: 'rgba(62, 38, 31, 0.88)',
		border: '1px solid rgba(201, 161, 122, 0.12)',
		borderRadius: '24px',
		padding: '22px',
		display: 'grid',
		gap: '18px',
	},
	sectionHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '14px',
		flexWrap: 'wrap',
	},
	sectionTitle: {
		margin: 0,
		fontSize: '24px',
		fontWeight: 700,
		color: '#fff0e3',
	},
	editButton: {
		border: '1px solid rgba(201, 161, 122, 0.2)',
		borderRadius: '12px',
		background: 'transparent',
		color: '#fff0e3',
		padding: '10px 16px',
		fontSize: '15px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	profileGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		gap: '14px',
	},
	fieldCard: {
		background: 'rgba(43, 27, 22, 0.72)',
		borderRadius: '16px',
		padding: '14px 16px',
		display: 'grid',
		gap: '10px',
		border: '1px solid rgba(201, 161, 122, 0.08)',
	},
	fieldLabel: {
		fontSize: '14px',
		color: 'rgba(255, 243, 234, 0.68)',
	},
	fieldValue: {
		fontSize: '18px',
		fontWeight: 600,
		color: '#fff7f0',
		wordBreak: 'break-word',
	},
	input: {
		width: '100%',
		borderRadius: '12px',
		border: '1px solid rgba(201, 161, 122, 0.2)',
		background: '#2c1b15',
		color: '#fff4ea',
		padding: '13px 14px',
		fontSize: '16px',
		outline: 'none',
	},
	formButtons: {
		display: 'flex',
		gap: '12px',
		flexWrap: 'wrap',
	},
	saveButton: {
		border: 'none',
		borderRadius: '12px',
		background: '#338151',
		color: '#fff',
		padding: '12px 20px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	cancelEditButton: {
		border: '1px solid rgba(201, 161, 122, 0.18)',
		borderRadius: '12px',
		background: 'transparent',
		color: '#fff0e3',
		padding: '12px 20px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	bookingsCard: {
		background: 'rgba(62, 38, 31, 0.88)',
		border: '1px solid rgba(201, 161, 122, 0.12)',
		borderRadius: '24px',
		padding: '22px',
		display: 'grid',
		gap: '18px',
	},
	filtersRow: {
		display: 'flex',
		gap: '10px',
		flexWrap: 'wrap',
	},
	filterButton: {
		border: '1px solid rgba(201, 161, 122, 0.2)',
		borderRadius: '12px',
		background: 'transparent',
		color: '#fff0e3',
		padding: '10px 16px',
		fontSize: '15px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	activeFilterButton: {
		border: 'none',
		borderRadius: '12px',
		background: '#cfa17d',
		color: '#2b1a13',
		padding: '10px 16px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	emptyState: {
		borderRadius: '20px',
		padding: '30px 18px',
		border: '1px dashed rgba(201, 161, 122, 0.2)',
		background: 'rgba(44, 27, 21, 0.5)',
		textAlign: 'center',
		display: 'grid',
		gap: '10px',
		justifyItems: 'center',
	},
	emptyStateIcon: {
		fontSize: '36px',
	},
	emptyStateTitle: {
		fontSize: '32px',
		fontWeight: 700,
		fontFamily: 'Cormorant Garamond, serif',
		color: '#fff1e5',
	},
	emptyStateText: {
		fontSize: '16px',
		color: 'rgba(255, 243, 234, 0.78)',
		maxWidth: '480px',
		lineHeight: 1.5,
	},
	emptyStateButton: {
		border: 'none',
		borderRadius: '14px',
		background: '#cfa17d',
		color: '#2b1a13',
		padding: '12px 20px',
		fontSize: '16px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	bookingList: {
		display: 'grid',
		gap: '18px',
	},
	bookingCard: {
		borderRadius: '20px',
		background: 'rgba(44, 27, 21, 0.72)',
		border: '1px solid rgba(201, 161, 122, 0.1)',
		padding: '18px',
		display: 'grid',
		gap: '16px',
	},
	bookingHeader: {
		display: 'flex',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: '14px',
		flexWrap: 'wrap',
	},
	bookingTitle: {
		margin: 0,
		fontSize: '24px',
		fontWeight: 700,
		color: '#fff4ea',
	},
	bookingMeta: {
		fontSize: '14px',
		color: 'rgba(255, 243, 234, 0.72)',
		marginTop: '6px',
	},
	statusBadge: {
		padding: '8px 12px',
		borderRadius: '999px',
		fontSize: '13px',
		fontWeight: 700,
	},
	statusActive: {
		background: 'rgba(51, 129, 81, 0.18)',
		color: '#d7ffe4',
		border: '1px solid rgba(84, 197, 120, 0.2)',
	},
	statusCanceled: {
		background: 'rgba(201, 74, 74, 0.18)',
		color: '#ffd9d9',
		border: '1px solid rgba(255, 116, 116, 0.2)',
	},
	bookingGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
		gap: '14px',
	},
	bookingField: {
		borderRadius: '16px',
		background: 'rgba(54, 33, 27, 0.82)',
		border: '1px solid rgba(201, 161, 122, 0.08)',
		padding: '14px',
		display: 'grid',
		gap: '8px',
	},
	bookingLabel: {
		fontSize: '14px',
		color: 'rgba(255, 243, 234, 0.68)',
	},
	bookingValue: {
		fontSize: '18px',
		fontWeight: 700,
		color: '#fff7f0',
		wordBreak: 'break-word',
	},
	bookingSubValue: {
		fontSize: '14px',
		color: 'rgba(255, 243, 234, 0.72)',
	},
	bookingActions: {
		display: 'flex',
		justifyContent: 'space-between',
		gap: '12px',
		flexWrap: 'wrap',
	},
	repeatButton: {
		border: 'none',
		borderRadius: '12px',
		background: '#4b9d58',
		color: '#fff',
		padding: '12px 18px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	cancelButton: {
		border: 'none',
		borderRadius: '12px',
		background: '#cf4a38',
		color: '#fff',
		padding: '12px 18px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	canceledText: {
		fontSize: '15px',
		fontWeight: 600,
		color: '#ffd7d7',
	},
	notificationsCard: {
		background: 'rgba(62, 38, 31, 0.88)',
		border: '1px solid rgba(201, 161, 122, 0.12)',
		borderRadius: '24px',
		padding: '22px',
		display: 'grid',
		gap: '16px',
	},
	notificationCounter: {
		minWidth: '28px',
		height: '28px',
		borderRadius: '999px',
		background: 'rgba(201, 161, 122, 0.16)',
		color: '#fff1e5',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '14px',
		fontWeight: 700,
	},
	notificationEmpty: {
		fontSize: '15px',
		color: 'rgba(255, 243, 234, 0.72)',
	},
	notificationList: {
		display: 'grid',
		gap: '12px',
	},
	notificationCard: {
		borderRadius: '16px',
		background: 'rgba(44, 27, 21, 0.72)',
		border: '1px solid rgba(201, 161, 122, 0.08)',
		padding: '14px',
		display: 'grid',
		gap: '8px',
	},
	notificationTitle: {
		fontSize: '16px',
		fontWeight: 700,
		color: '#fff6ef',
	},
	notificationText: {
		fontSize: '15px',
		lineHeight: 1.45,
		color: 'rgba(255, 243, 234, 0.82)',
	},
	notificationDate: {
		fontSize: '13px',
		color: 'rgba(255, 243, 234, 0.6)',
	},
	contactsCard: {
		background: 'rgba(62, 38, 31, 0.88)',
		border: '1px solid rgba(201, 161, 122, 0.12)',
		borderRadius: '24px',
		padding: '22px',
		display: 'grid',
		gap: '18px',
	},
	contactsTitle: {
		margin: 0,
		fontSize: '24px',
		fontWeight: 700,
		color: '#fff0e3',
	},
	contactsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
		gap: '14px',
	},
	contactItem: {
		borderRadius: '16px',
		background: 'rgba(44, 27, 21, 0.72)',
		border: '1px solid rgba(201, 161, 122, 0.08)',
		padding: '14px',
		display: 'grid',
		gap: '8px',
	},
	contactLabel: {
		fontSize: '14px',
		color: 'rgba(255, 243, 234, 0.68)',
	},
	contactValue: {
		fontSize: '18px',
		fontWeight: 700,
		color: '#fff7f0',
		wordBreak: 'break-word',
	},
	modalOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0, 0, 0, 0.55)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '18px',
		zIndex: 999,
	},
	modalCard: {
		width: '100%',
		maxWidth: '460px',
		background: '#241611',
		borderRadius: '22px',
		border: '1px solid rgba(201, 161, 122, 0.14)',
		padding: '22px',
		display: 'grid',
		gap: '18px',
		boxShadow: '0 18px 40px rgba(0, 0, 0, 0.22)',
	},
	modalTitle: {
		fontSize: '28px',
		fontWeight: 700,
		fontFamily: 'Cormorant Garamond, serif',
		color: '#fff1e5',
		margin: 0,
	},
	modalText: {
		fontSize: '16px',
		lineHeight: 1.55,
		color: 'rgba(255, 243, 234, 0.82)',
	},
	modalButtons: {
		display: 'flex',
		gap: '12px',
		flexWrap: 'wrap',
	},
	confirmCancelButton: {
		border: 'none',
		borderRadius: '12px',
		background: '#cf4a38',
		color: '#fff',
		padding: '12px 18px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
	modalCloseButton: {
		border: '1px solid rgba(201, 161, 122, 0.18)',
		borderRadius: '12px',
		background: 'transparent',
		color: '#fff0e3',
		padding: '12px 18px',
		fontSize: '15px',
		fontWeight: 700,
		cursor: 'pointer',
	},
};

export default ProfilePage;