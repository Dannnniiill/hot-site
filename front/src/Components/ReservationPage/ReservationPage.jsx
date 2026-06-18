import React from 'react';
import axios from 'axios';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useAuth } from '../../auth/AuthProvider';
import { BASE_URL } from '../../constats';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

const BOOKING_TIMEOUT_MS = 65000;
const BOOKING_POLL_TIMEOUT_MS = 20000;
const BOOKING_POLL_STEP_MS = 2000;

const ROOM_CATALOG = {
	standard: {
		id: 1,
		type: 'standard',
		name: 'Номер Standard',
		price: 2200,
		maxPerson: 2,
	},
	luxe: {
		id: 2,
		type: 'luxe',
		name: 'Номер Luxe',
		price: 3400,
		maxPerson: 3,
	},
	'luxe plus': {
		id: 3,
		type: 'luxe plus',
		name: 'Номер Luxe Plus',
		price: 3700,
		maxPerson: 3,
	},
	'luxe premium': {
		id: 4,
		type: 'luxe premium',
		name: 'Номер Luxe Premium',
		price: 4200,
		maxPerson: 4,
	},
};

function normalizeText(value) {
	if (value === undefined || value === null) return '';
	const normalized = String(value).trim();
	if (['undefined', 'null', 'none'].includes(normalized.toLowerCase())) return '';
	return normalized;
}

function normalizeRoomType(roomType) {
	const value = normalizeText(roomType).toLowerCase();

	const mapping = {
		standard: 'standard',
		luxe: 'luxe',
		luxeplus: 'luxe plus',
		'luxe plus': 'luxe plus',
		'luxe-plus': 'luxe plus',
		luxe_plus: 'luxe plus',
		luxepremium: 'luxe premium',
		'luxe premium': 'luxe premium',
		'luxe-premium': 'luxe premium',
		luxe_premium: 'luxe premium',
	};

	return mapping[value] || value;
}

function splitUserName(fullName) {
	const safeName = normalizeText(fullName);
	if (!safeName) return { firstName: '', lastName: '' };

	const parts = safeName.split(/\s+/).filter(Boolean);

	return {
		firstName: parts[0] || '',
		lastName: parts.slice(1).join(' ') || '',
	};
}

function createDefaultStartDate() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);
	return start;
}

function createDefaultEndDate(startDate) {
	const end = new Date(startDate);
	end.setDate(end.getDate() + 1);
	end.setHours(0, 0, 0, 0);
	return end;
}

function getDateToString(date) {
	const safeDate = new Date(date);
	const year = safeDate.getFullYear();
	const month = String(safeDate.getMonth() + 1).padStart(2, '0');
	const day = String(safeDate.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function getNightsCount(toDate, fromDate) {
	const start = new Date(toDate);
	const end = new Date(fromDate);
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);

	const msDay = 1000 * 60 * 60 * 24;
	const diff = Math.floor((end.getTime() - start.getTime()) / msDay);

	return diff > 0 ? diff : 1;
}

function getRoomTypeFromPath(pathname) {
	const cleanPath = String(pathname || '').split('?')[0].replace(/\/+$/, '');
	const segments = cleanPath.split('/').filter(Boolean);

	if (segments.length < 2) return '';
	if (segments[0] !== 'reservation') return '';

	try {
		return decodeURIComponent(segments.slice(1).join('/')).toLowerCase();
	} catch (error) {
		console.error('Ошибка декодирования типа номера:', error);
		return '';
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAxiosTimeout(error) {
	return (
		error?.code === 'ECONNABORTED' ||
		String(error?.message || '').toLowerCase().includes('timeout')
	);
}

async function findCreatedBooking({ email, roomType, startDate, endDate }) {
	const startedAt = Date.now();

	while (Date.now() - startedAt < BOOKING_POLL_TIMEOUT_MS) {
		try {
			const response = await axios.get(`${API_BASE}/bookings/my/`, {
				params: {
					email: normalizeText(email).toLowerCase(),
				},
				timeout: 15000,
			});

			const raw = Array.isArray(response.data)
				? response.data
				: Array.isArray(response.data?.results)
				? response.data.results
				: Array.isArray(response.data?.data)
				? response.data.data
				: [];

			const found = raw.find((item) => {
				const bookingType = normalizeRoomType(item?.type);
				const bookingStart = normalizeText(item?.start_date || item?.startDate);
				const bookingEnd = normalizeText(item?.end_date || item?.endDate);

				return (
					bookingType === normalizeRoomType(roomType) &&
					bookingStart === startDate &&
					bookingEnd === endDate
				);
			});

			if (found) return found;
		} catch (error) {
			console.error('Ошибка проверки созданной брони после timeout:', error);
		}

		await sleep(BOOKING_POLL_STEP_MS);
	}

	return null;
}

function ReservationPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const params = useParams();
	const { user } = useAuth();

	const state = location.state || {};
	const pathname = location.pathname;

	const routeTypeFromParams = normalizeRoomType(params?.type);
	const routeTypeFromPath = normalizeRoomType(getRoomTypeFromPath(pathname));
	const selectedType = routeTypeFromParams || routeTypeFromPath || normalizeRoomType(state?.roomType);

	const room = ROOM_CATALOG[selectedType] || null;

	const defaultStartDate = React.useMemo(() => createDefaultStartDate(), []);
	const defaultEndDate = React.useMemo(() => createDefaultEndDate(defaultStartDate), [defaultStartDate]);

	const parsedUserName = React.useMemo(() => splitUserName(user?.name), [user]);

	const [startDate, setStartDate] = React.useState(
		state?.toDate ? new Date(state.toDate) : defaultStartDate,
	);
	const [endDate, setEndDate] = React.useState(
		state?.fromDate ? new Date(state.fromDate) : defaultEndDate,
	);
	const [persons, setPersons] = React.useState(Number(state?.persons?.count || 1));

	const [firstName, setFirstName] = React.useState(parsedUserName.firstName || '');
	const [lastName, setLastName] = React.useState(parsedUserName.lastName || '');
	const [phone, setPhone] = React.useState(normalizeText(user?.phone));
	const [email, setEmail] = React.useState(normalizeText(user?.email));
	const [comment, setComment] = React.useState('');
	const [isChecking, setIsChecking] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [availabilityMessage, setAvailabilityMessage] = React.useState('');
	const [availabilityError, setAvailabilityError] = React.useState('');
	const [submitError, setSubmitError] = React.useState('');
	const [submitSuccess, setSubmitSuccess] = React.useState('');
	const [roomAvailable, setRoomAvailable] = React.useState(false);

	React.useEffect(() => {
		if (!firstName && parsedUserName.firstName) {
			setFirstName(parsedUserName.firstName);
		}
		if (!lastName && parsedUserName.lastName) {
			setLastName(parsedUserName.lastName);
		}
		if (!phone && user?.phone) {
			setPhone(normalizeText(user.phone));
		}
		if (!email && user?.email) {
			setEmail(normalizeText(user.email));
		}
	}, [parsedUserName, user, firstName, lastName, phone, email]);

	const nights = React.useMemo(() => getNightsCount(startDate, endDate), [startDate, endDate]);
	const total = React.useMemo(() => (room ? room.price * nights : 0), [room, nights]);

	const startDateString = React.useMemo(() => getDateToString(startDate), [startDate]);
	const endDateString = React.useMemo(() => getDateToString(endDate), [endDate]);

	const canIncreasePersons = persons < Number(room?.maxPerson || 1);
	const canDecreasePersons = persons > 1;

	const goHome = React.useCallback(() => {
		window.location.href = '/';
	}, []);

	const handleCheckAvailability = React.useCallback(async () => {
		setAvailabilityMessage('');
		setAvailabilityError('');
		setSubmitError('');
		setSubmitSuccess('');
		setRoomAvailable(false);

		if (!room) {
			setAvailabilityError('Сначала выберите номер на главной странице.');
			return;
		}

		if (startDate >= endDate) {
			setAvailabilityError('Дата выезда должна быть позже даты заезда.');
			return;
		}

		if (persons > room.maxPerson) {
			setAvailabilityError(`Для номера ${room.name} максимум ${room.maxPerson} гостя(ей).`);
			return;
		}

		setIsChecking(true);

		try {
			const response = await axios.get(`${API_BASE}/rooms/`, {
				params: {
					start_date: startDateString,
					end_date: endDateString,
					persons,
					type: room.type,
				},
				timeout: 30000,
			});

			const result = response.data || {};
			const freeCount = Number(result[room.type] || 0);

			if (freeCount > 0) {
				setRoomAvailable(true);
				setAvailabilityMessage(`Найдено свободных номеров: ${freeCount}. Можно бронировать.`);
				return;
			}

			setAvailabilityError('К сожалению, в указанный период этот номер недоступен.');
		} catch (error) {
			console.error('Ошибка проверки доступности:', error);
			setAvailabilityError(
				error?.response?.data?.message || 'Не удалось проверить доступность номера.',
			);
		} finally {
			setIsChecking(false);
		}
	}, [room, startDate, endDate, persons, startDateString, endDateString]);

	const handleSubmitBooking = React.useCallback(async () => {
		setSubmitError('');
		setSubmitSuccess('');

		if (!roomAvailable) {
			setSubmitError('Сначала нажмите «Проверить доступность».');
			return;
		}

		if (!normalizeText(firstName) || !normalizeText(email) || !normalizeText(phone)) {
			setSubmitError('Заполните имя, email и телефон.');
			return;
		}

		const payload = {
			first_name: normalizeText(firstName),
			last_name: normalizeText(lastName),
			phone_number: normalizeText(phone),
			email: normalizeText(email).toLowerCase(),
			comment: normalizeText(comment),
			amount: persons,
			nights,
			price: room.price,
			type: room.type,
			start_date: startDateString,
			end_date: endDateString,
			total_price: total,
			promo_code: '',
			promo_discount: 0,
		};

		setIsSubmitting(true);

		try {
			await axios.post(`${API_BASE}/book/`, payload, {
				headers: { 'Content-Type': 'application/json' },
				timeout: BOOKING_TIMEOUT_MS,
			});

			setSubmitSuccess('Бронирование успешно создано.');
			setTimeout(() => {
				window.location.href = '/profile';
			}, 1200);
		} catch (error) {
			console.error('Ошибка бронирования:', error);

			if (isAxiosTimeout(error)) {
				const createdBooking = await findCreatedBooking({
					email: payload.email,
					roomType: payload.type,
					startDate: payload.start_date,
					endDate: payload.end_date,
				});

				if (createdBooking) {
					setSubmitSuccess('Бронирование создано. Ответ сервера пришёл с задержкой.');
					setTimeout(() => {
						window.location.href = '/profile';
					}, 1200);
					setIsSubmitting(false);
					return;
				}
			}

			setSubmitError(
				error?.response?.data?.message || 'Не удалось завершить бронирование. Попробуйте ещё раз.',
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [
		roomAvailable,
		firstName,
		lastName,
		phone,
		email,
		comment,
		persons,
		nights,
		room,
		startDateString,
		endDateString,
		total,
	]);

	if (!room) {
		return (
			<div>
				<Header />
				<div style={pageWrap}>
					<div style={card}>
						<h1 style={title}>Номер не выбран</h1>
						<p style={text}>
							Страница бронирования открылась без типа номера.
						</p>
						<p style={text}>Нажмите кнопку ниже и выберите номер на главной странице.</p>
						<button type="button" style={primaryButton} onClick={goHome}>
							Выбрать номер
						</button>
					</div>
				</div>
				<Footer main={false} />
			</div>
		);
	}

	return (
		<div>
			<Header />
			<div style={pageWrap}>
				<div style={container}>
					<div style={card}>
						<h1 style={title}>{room.name}</h1>

						<div style={grid}>
							<div style={fieldBox}>
								<label style={label}>Заезд</label>
								<input
									type="date"
									value={startDateString}
									onChange={(e) => setStartDate(new Date(e.target.value))}
									style={input}
								/>
							</div>

							<div style={fieldBox}>
								<label style={label}>Выезд</label>
								<input
									type="date"
									value={endDateString}
									onChange={(e) => setEndDate(new Date(e.target.value))}
									style={input}
								/>
							</div>

							<div style={fieldBox}>
								<label style={label}>Гости</label>
								<div style={guestRow}>
									<button
										type="button"
										style={guestButton}
										onClick={() => canDecreasePersons && setPersons((prev) => prev - 1)}
									>
										−
									</button>
									<div style={guestCount}>{persons}</div>
									<button
										type="button"
										style={guestButton}
										onClick={() => canIncreasePersons && setPersons((prev) => prev + 1)}
									>
										+
									</button>
								</div>
							</div>

							<div style={fieldBox}>
								<label style={label}>Цена</label>
								<div style={summaryBox}>
									{room.price} ₽ / ночь · {nights} ноч. · {total} ₽
								</div>
							</div>
						</div>

						<div style={buttonRow}>
							<button type="button" style={secondaryButton} onClick={goHome}>
								На главную
							</button>
							<button
								type="button"
								style={primaryButton}
								onClick={handleCheckAvailability}
								disabled={isChecking}
							>
								{isChecking ? 'Проверяем...' : 'Проверить доступность'}
							</button>
						</div>

						{availabilityMessage ? <div style={successBox}>{availabilityMessage}</div> : null}
						{availabilityError ? <div style={errorBox}>{availabilityError}</div> : null}
					</div>

					<div style={card}>
						<h2 style={subtitle}>Данные для бронирования</h2>

						<div style={grid}>
							<div style={fieldBox}>
								<label style={label}>Имя</label>
								<input value={firstName} onChange={(e) => setFirstName(e.target.value)} style={input} />
							</div>

							<div style={fieldBox}>
								<label style={label}>Фамилия</label>
								<input value={lastName} onChange={(e) => setLastName(e.target.value)} style={input} />
							</div>

							<div style={fieldBox}>
								<label style={label}>Телефон</label>
								<input value={phone} onChange={(e) => setPhone(e.target.value)} style={input} />
							</div>

							<div style={fieldBox}>
								<label style={label}>Email</label>
								<input value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
							</div>
						</div>

						<div style={fieldBox}>
							<label style={label}>Комментарий</label>
							<textarea
								value={comment}
								onChange={(e) => setComment(e.target.value)}
								style={textarea}
							/>
						</div>

						<div style={buttonRow}>
							<button
								type="button"
								style={successButton}
								onClick={handleSubmitBooking}
								disabled={isSubmitting}
							>
								{isSubmitting ? 'Создаём бронирование...' : 'Забронировать'}
							</button>
						</div>

						{submitSuccess ? <div style={successBox}>{submitSuccess}</div> : null}
						{submitError ? <div style={errorBox}>{submitError}</div> : null}
					</div>
				</div>
			</div>
			<Footer main={false} />
		</div>
	);
}

const pageWrap = {
	minHeight: '70vh',
	padding: '32px 16px',
	background: '#f7f4f1',
};

const container = {
	maxWidth: '1100px',
	margin: '0 auto',
	display: 'grid',
	gap: '24px',
};

const card = {
	background: '#ffffff',
	borderRadius: '20px',
	padding: '24px',
	boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
};

const title = {
	fontSize: '32px',
	fontWeight: 700,
	marginBottom: '20px',
};

const subtitle = {
	fontSize: '24px',
	fontWeight: 700,
	marginBottom: '20px',
};

const text = {
	fontSize: '16px',
	lineHeight: 1.6,
	marginBottom: '14px',
};

const grid = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
	gap: '16px',
	marginBottom: '18px',
};

const fieldBox = {
	display: 'flex',
	flexDirection: 'column',
	gap: '8px',
};

const label = {
	fontSize: '14px',
	fontWeight: 600,
	color: '#5b4638',
};

const input = {
	width: '100%',
	height: '48px',
	padding: '0 14px',
	borderRadius: '12px',
	border: '1px solid #d8c9bd',
	fontSize: '16px',
};

const textarea = {
	width: '100%',
	minHeight: '120px',
	padding: '14px',
	borderRadius: '12px',
	border: '1px solid #d8c9bd',
	fontSize: '16px',
	resize: 'vertical',
};

const guestRow = {
	display: 'flex',
	alignItems: 'center',
	gap: '12px',
};

const guestButton = {
	width: '42px',
	height: '42px',
	borderRadius: '50%',
	border: '1px solid #c7b1a1',
	background: '#fff',
	cursor: 'pointer',
	fontSize: '22px',
};

const guestCount = {
	minWidth: '36px',
	textAlign: 'center',
	fontSize: '20px',
	fontWeight: 700,
};

const summaryBox = {
	height: '48px',
	display: 'flex',
	alignItems: 'center',
	padding: '0 14px',
	borderRadius: '12px',
	background: '#f5eee8',
	fontWeight: 600,
};

const buttonRow = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: '12px',
	marginTop: '12px',
};

const primaryButton = {
	height: '48px',
	padding: '0 20px',
	borderRadius: '12px',
	border: 'none',
	background: '#8b5b44',
	color: '#fff',
	fontSize: '16px',
	fontWeight: 700,
	cursor: 'pointer',
};

const secondaryButton = {
	height: '48px',
	padding: '0 20px',
	borderRadius: '12px',
	border: '1px solid #c7b1a1',
	background: '#fff',
	color: '#4a3529',
	fontSize: '16px',
	fontWeight: 700,
	cursor: 'pointer',
};

const successButton = {
	height: '48px',
	padding: '0 20px',
	borderRadius: '12px',
	border: 'none',
	background: '#2f9d58',
	color: '#fff',
	fontSize: '16px',
	fontWeight: 700,
	cursor: 'pointer',
};

const successBox = {
	marginTop: '16px',
	padding: '14px 16px',
	borderRadius: '12px',
	background: '#e9f8ef',
	color: '#17663a',
	fontWeight: 600,
};

const errorBox = {
	marginTop: '16px',
	padding: '14px 16px',
	borderRadius: '12px',
	background: '#fdeaea',
	color: '#a12626',
	fontWeight: 600,
};

export default ReservationPage;