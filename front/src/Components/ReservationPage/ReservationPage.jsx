import React from 'react';
import axios from 'axios';
import styles from './ReservationPage.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useDisclosure, useToast } from '@chakra-ui/react';
import { getRooms, sendBook, selectRoom } from '../../Redux/slices/userSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { BASE_URL, cyrillicPattern, getDateToString, telPattern, getNightsCount } from '../../constats';
import LoaderData from './LoaderData/LoaderData';
import ModalStatus from '../UI/ModalStatus/ModalStatus';
import { useAuth } from '../../auth/AuthProvider';
import { promotionsData } from '../../data/promotionsData';

const ACTIVE_PROMO_KEY = 'hotel_active_promo';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

const ROOM_CATALOG = {
	standard: {
		id: 1,
		type: 'standard',
		name: 'Номер Стандарт',
		price: 2200,
		maxPerson: 2,
	},
	luxe: {
		id: 2,
		type: 'luxe',
		name: 'Номер Люкс',
		price: 3400,
		maxPerson: 3,
	},
	'luxe plus': {
		id: 3,
		type: 'luxe plus',
		name: 'Номер Люкс +',
		price: 3700,
		maxPerson: 3,
	},
	'luxe premium': {
		id: 4,
		type: 'luxe premium',
		name: 'Номер Люкс Премиум',
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

function splitUserName(fullName) {
	const safeName = normalizeText(fullName);

	if (!safeName) {
		return { firstName: '', lastName: '' };
	}

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

function getRoomTypeFromPath(pathname) {
	const cleanPath = String(pathname || '').split('?')[0].replace(/\/+$/, '');
	const segments = cleanPath.split('/').filter(Boolean);

	if (segments.length < 2) return '';
	if (segments[0] !== 'reservation') return '';

	const encodedType = segments.slice(1).join('/');

	try {
		return decodeURIComponent(encodedType).toLowerCase();
	} catch {
		return encodedType.toLowerCase();
	}
}

function formatInputDate(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function ReservationPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const { isError, isSuccess, selectedRoomData, errorMessage } = useSelector((state) => state.userSlice);
	const params = useParams();
	const location = useLocation();
	const { state, pathname } = location;
	const { user } = useAuth();

	const initialUserName = splitUserName(user?.name);

	const defaultStartDate = React.useMemo(() => createDefaultStartDate(), []);
	const defaultEndDate = React.useMemo(() => createDefaultEndDate(defaultStartDate), [defaultStartDate]);

	const [toDate, setToDate] = React.useState(state?.toDate ? new Date(state.toDate) : defaultStartDate);
	const [fromDate, setFromDate] = React.useState(
		state?.fromDate ? new Date(state.fromDate) : defaultEndDate,
	);
	const [persons, setPersons] = React.useState(state?.persons ? state.persons : { count: 1 });
	const [filters, setFilters] = React.useState(
		state?.filters
			? state.filters
			: {
					type: 'all',
					price: 'all',
					sort: 'default',
					amenities: [],
			  },
	);

	const [formState, setFormState] = React.useState({
		nameValue: initialUserName.firstName,
		lastNameValue: initialUserName.lastName,
		telValue: user?.phone || '',
		emailValue: user?.email || '',
		commentsValue: '',
		checked: false,
	});

	const [availabilityChecked, setAvailabilityChecked] = React.useState(false);
	const [isRoomAvailable, setIsRoomAvailable] = React.useState(true);
	const [availabilityMessage, setAvailabilityMessage] = React.useState('');
	const [isCheckingAvailability, setIsCheckingAvailability] = React.useState(false);
	const [appliedPromo, setAppliedPromo] = React.useState(null);

	const directRoomType = React.useMemo(() => {
		const routeType = normalizeText(params.type || getRoomTypeFromPath(pathname));
		return routeType ? routeType.toLowerCase() : '';
	}, [params.type, pathname]);

	const routeRoom = React.useMemo(() => {
		if (!directRoomType) return null;
		return ROOM_CATALOG[directRoomType] || null;
	}, [directRoomType]);

	const isMainSearchRoom = Boolean(state?.searchMode === 'main-search-room');
	const isMainSearchList = Boolean(state?.searchMode === 'main-search-list');
	const isDirectRoomState = Boolean(state?.searchMode === 'direct-room');

	const hasStateData = Boolean(state);
	const hasDirectRoomRoute = Boolean(routeRoom);
	const isDirectRoomBooking = isDirectRoomState || hasDirectRoomRoute;
	const shouldShowTopBookingBar = isDirectRoomBooking;

	React.useEffect(() => {
		if (!hasStateData && !hasDirectRoomRoute) {
			navigate('/', { replace: true });
		}
	}, [hasStateData, hasDirectRoomRoute, navigate]);

	const effectiveSelectedRoom = React.useMemo(() => {
		if (isMainSearchRoom || isDirectRoomBooking) {
			if (selectedRoomData?.id) return selectedRoomData;
			if (routeRoom) return routeRoom;
		}
		return {};
	}, [isMainSearchRoom, isDirectRoomBooking, selectedRoomData, routeRoom]);

	React.useEffect(() => {
		if ((isMainSearchRoom || isDirectRoomBooking) && routeRoom && !selectedRoomData?.id) {
			dispatch(
				selectRoom({
					id: routeRoom.id,
					name: routeRoom.name,
					type: routeRoom.type,
					price: routeRoom.price,
				}),
			);
		}

		if (isMainSearchList && selectedRoomData?.id) {
			dispatch(getRooms({ start_date: getDateToString(toDate), end_date: getDateToString(fromDate), persons: persons.count, type: filters.type }));
		}
	}, [
		dispatch,
		fromDate,
		filters.type,
		isDirectRoomBooking,
		isMainSearchList,
		isMainSearchRoom,
		persons.count,
		routeRoom,
		selectedRoomData?.id,
		toDate,
	]);

	React.useEffect(() => {
		if (!availabilityChecked) {
			setIsRoomAvailable(true);
			setAvailabilityMessage('');
		}
	}, [effectiveSelectedRoom, toDate, fromDate, persons.count, availabilityChecked]);

	React.useEffect(() => {
		try {
			const savedPromo = localStorage.getItem(ACTIVE_PROMO_KEY);
			if (!savedPromo) return;
			const parsed = JSON.parse(savedPromo);
			if (!parsed?.code) return;
			setAppliedPromo(parsed);
		} catch (error) {
			console.error('Ошибка чтения промокода:', error);
		}
	}, []);

	const getPersonsCount = () => {
		const value = Number(persons?.count);
		return Number.isFinite(value) && value > 0 ? value : 1;
	};

	const getNightsValue = () => {
		return getNightsCount(toDate, fromDate);
	};

	const getBasePrice = () => {
		return Number(effectiveSelectedRoom?.price || routeRoom?.price || 0);
	};

	const getBaseTotal = () => {
		return getBasePrice() * getNightsValue();
	};

	const promoDiscount = React.useMemo(() => {
		if (!appliedPromo?.code) return 0;

		const promo = promotionsData.find(
			(item) => String(item.code || '').toLowerCase() === String(appliedPromo.code || '').toLowerCase(),
		);

		if (!promo) return 0;

		const percent = Number(promo.discount || 0);
		if (!percent) return 0;

		return Math.round((getBaseTotal() * percent) / 100);
	}, [appliedPromo, effectiveSelectedRoom, fromDate, toDate]);

	const finalTotal = Math.max(getBaseTotal() - promoDiscount, 0);

	const removePromo = () => {
		localStorage.removeItem(ACTIVE_PROMO_KEY);
		setAppliedPromo(null);
	};

	const handleChangeInput = ({ target }) => {
		const { name, value, checked, type } = target;

		setFormState((prev) => ({
			...prev,
			[name]: type === 'checkbox' ? checked : value,
		}));
	};

	const validateBookingForm = () => {
		if (!normalizeText(formState.nameValue) || !normalizeText(formState.lastNameValue)) {
			return 'Введите имя и фамилию';
		}

		if (!cyrillicPattern.test(normalizeText(formState.nameValue))) {
			return 'Имя должно содержать только кириллицу';
		}

		if (!cyrillicPattern.test(normalizeText(formState.lastNameValue))) {
			return 'Фамилия должна содержать только кириллицу';
		}

		if (!normalizeText(formState.telValue) || !telPattern.test(formState.telValue)) {
			return 'Введите корректный номер телефона';
		}

		if (!normalizeText(formState.emailValue)) {
			return 'Введите email';
		}

		if (!formState.checked) {
			return 'Подтвердите согласие на обработку данных';
		}

		if (!effectiveSelectedRoom?.type && !directRoomType) {
			return 'Выберите номер для бронирования';
		}

		if (!isRoomAvailable) {
			return 'Этот номер недоступен на выбранные даты';
		}

		return '';
	};

	const checkAvailability = async () => {
		const roomType = effectiveSelectedRoom?.type || directRoomType;

		if (!roomType) {
			setIsRoomAvailable(false);
			setAvailabilityMessage('Номер не выбран');
			return false;
		}

		setIsCheckingAvailability(true);

		try {
			const response = await axios.post(`${API_BASE}/rooms/`, {
				start_date: getDateToString(toDate),
				end_date: getDateToString(fromDate),
				persons: getPersonsCount(),
				type: roomType,
			});

			const rooms = Array.isArray(response.data)
				? response.data
				: Array.isArray(response.data?.results)
				? response.data.results
				: Array.isArray(response.data?.data)
				? response.data.data
				: [];

			const available = rooms.some((room) => String(room.type || '').toLowerCase() === String(roomType).toLowerCase());

			setAvailabilityChecked(true);
			setIsRoomAvailable(available);
			setAvailabilityMessage(
				available
					? 'Номер доступен на выбранные даты'
					: 'К сожалению, в указанный Вами период этот номер недоступен',
			);

			return available;
		} catch (error) {
			console.error('Ошибка проверки доступности:', error);
			setAvailabilityChecked(true);
			setIsRoomAvailable(false);
			setAvailabilityMessage('Не удалось проверить доступность номера');
			return false;
		} finally {
			setIsCheckingAvailability(false);
		}
	};

	const clickBook = async () => {
		const validationError = validateBookingForm();

		if (validationError) {
			toast({
				title: 'Ошибка бронирования',
				description: validationError,
				status: 'error',
				duration: 4000,
				isClosable: true,
				position: 'top',
			});
			return;
		}

		const available = availabilityChecked ? isRoomAvailable : await checkAvailability();

		if (!available) {
			toast({
				title: 'Ошибка бронирования',
				description: availabilityMessage || 'Номер недоступен на выбранные даты',
				status: 'error',
				duration: 4000,
				isClosable: true,
				position: 'top',
			});
			return;
		}

		const bookingPayload = {
			first_name: normalizeText(formState.nameValue),
			last_name: normalizeText(formState.lastNameValue),
			phone_number: normalizeText(formState.telValue),
			email: normalizeText(formState.emailValue).toLowerCase(),
			comment: normalizeText(formState.commentsValue),
			start_date: getDateToString(toDate),
			end_date: getDateToString(fromDate),
			amount: getPersonsCount(),
			type: effectiveSelectedRoom?.type || directRoomType || '',
			nights: getNightsValue(),
			promo_code: appliedPromo?.code || '',
			promo_discount: promoDiscount || 0,
			total_price: finalTotal || getBaseTotal(),
		};

		try {
			await dispatch(sendBook(bookingPayload)).unwrap();
			onOpen();

			toast({
				title: 'Бронирование успешно оформлено',
				status: 'success',
				duration: 3000,
				isClosable: true,
				position: 'top',
			});

			setFormState((prev) => ({
				...prev,
				nameValue: '',
				lastNameValue: '',
				telValue: '',
				emailValue: user?.email || '',
				commentsValue: '',
				checked: false,
			}));

			removePromo();
		} catch (error) {
			toast({
				title: 'Ошибка бронирования',
				description: error?.message || errorMessage || 'Попробуйте ещё раз',
				status: 'error',
				duration: 4000,
				isClosable: true,
				position: 'top',
			});
		}
	};

	React.useEffect(() => {
		if (state?.promoCode) {
			const matchedPromo = promotionsData.find(
				(item) => String(item.code || '').toLowerCase() === String(state.promoCode || '').toLowerCase(),
			);

			if (matchedPromo) {
				const preparedPromo = {
					code: matchedPromo.code,
					discount: matchedPromo.discount,
					title: matchedPromo.title,
				};
				setAppliedPromo(preparedPromo);
				localStorage.setItem(ACTIVE_PROMO_KEY, JSON.stringify(preparedPromo));
			}
		}
	}, [state?.promoCode]);

	const roomTitle = effectiveSelectedRoom?.name || routeRoom?.name || 'Номер';
	const roomPrice = Number(effectiveSelectedRoom?.price || routeRoom?.price || 0);
	const roomTypeText = String(effectiveSelectedRoom?.type || directRoomType || '').toLowerCase();

	return (
		<div>
			<Header bg={false} />
			<div className={styles.main}>
				<div className={styles.container}>
					{shouldShowTopBookingBar ? (
						<div className={styles.directBookingBlock}>
							<button className={styles.toMainButton} onClick={() => navigate('/')}>
								На главную
							</button>

							<div className={styles.directBookingControls}>
								<div className={styles.directDateItem}>
									<span className={styles.directLabel}>Заезд</span>
									<input
										type="date"
										value={formatInputDate(toDate)}
										onChange={(e) => {
											const nextDate = new Date(e.target.value);
											nextDate.setHours(0, 0, 0, 0);
											setToDate(nextDate);

											if (nextDate >= fromDate) {
												const nextEnd = createDefaultEndDate(nextDate);
												setFromDate(nextEnd);
											}

											setAvailabilityChecked(false);
										}}
									/>
								</div>

								<div className={styles.directDateItem}>
									<span className={styles.directLabel}>Выезд</span>
									<input
										type="date"
										value={formatInputDate(fromDate)}
										min={formatInputDate(createDefaultEndDate(toDate))}
										onChange={(e) => {
											const nextDate = new Date(e.target.value);
											nextDate.setHours(0, 0, 0, 0);
											setFromDate(nextDate);
											setAvailabilityChecked(false);
										}}
									/>
								</div>

								<div className={styles.directPersonItem}>
									<span className={styles.directLabel}>Количество гостей</span>
									<div className={styles.personCounter}>
										<button
											type="button"
											onClick={() => {
												setPersons((prev) => ({
													count: Math.max(1, Number(prev?.count || 1) - 1),
												}));
												setAvailabilityChecked(false);
											}}
										>
											-
										</button>
										<span>{getPersonsCount()}</span>
										<button
											type="button"
											onClick={() => {
												const maxPerson = Number(routeRoom?.maxPerson || effectiveSelectedRoom?.maxPerson || 4);
												setPersons((prev) => ({
													count: Math.min(maxPerson, Number(prev?.count || 1) + 1),
												}));
												setAvailabilityChecked(false);
											}}
										>
											+
										</button>
									</div>
								</div>

								<button
									type="button"
									className={styles.checkButton}
									onClick={checkAvailability}
									disabled={isCheckingAvailability}
								>
									{isCheckingAvailability ? 'Проверяем...' : 'Проверить доступность'}
								</button>
							</div>

							{availabilityChecked ? (
								<div
									className={
										isRoomAvailable ? styles.availabilitySuccess : styles.availabilityError
									}
								>
									{availabilityMessage}
								</div>
							) : null}
						</div>
					) : null}

					{(isMainSearchRoom || isDirectRoomBooking) && effectiveSelectedRoom?.id ? (
						<div className={styles.oneRoom}>
							<LoaderData
								type={roomTypeText}
								name={roomTitle}
								price={roomPrice}
								toDate={toDate}
								fromDate={fromDate}
								persons={persons}
								promoData={appliedPromo}
								promoDiscount={promoDiscount}
								finalTotal={finalTotal}
							/>

							<div className={styles.formBlock}>
								<h2>Оформление бронирования</h2>

								<div className={styles.fieldRow}>
									<input
										type="text"
										name="nameValue"
										value={formState.nameValue}
										onChange={handleChangeInput}
										placeholder="Имя"
									/>

									<input
										type="text"
										name="lastNameValue"
										value={formState.lastNameValue}
										onChange={handleChangeInput}
										placeholder="Фамилия"
									/>
								</div>

								<div className={styles.fieldRow}>
									<input
										type="tel"
										name="telValue"
										value={formState.telValue}
										onChange={handleChangeInput}
										placeholder="Телефон"
									/>

									<input
										type="email"
										name="emailValue"
										value={formState.emailValue}
										onChange={handleChangeInput}
										placeholder="Email"
									/>
								</div>

								<textarea
									name="commentsValue"
									value={formState.commentsValue}
									onChange={handleChangeInput}
									placeholder="Комментарий к бронированию"
								/>

								{appliedPromo?.code ? (
									<div className={styles.promoInfo}>
										<div>
											Промокод: <strong>{appliedPromo.code}</strong>
										</div>
										<div>Скидка: {promoDiscount} ₽</div>
										<button type="button" onClick={removePromo}>
											Убрать
										</button>
									</div>
								) : null}

								<label className={styles.checkboxLabel}>
									<input
										type="checkbox"
										name="checked"
										checked={formState.checked}
										onChange={handleChangeInput}
									/>
									<span>Согласен на обработку персональных данных</span>
								</label>

								<button type="button" className={styles.bookButton} onClick={clickBook}>
									Забронировать
								</button>
							</div>
						</div>
					) : (
						<div className={styles.fallbackBlock}>
							<h2>Не удалось открыть страницу бронирования</h2>
							<p>Вернитесь на главную и выберите номер ещё раз.</p>
							<button type="button" className={styles.toMainButton} onClick={() => navigate('/')}>
								На главную
							</button>
						</div>
					)}

					<ModalStatus
						isOpen={isOpen}
						onClose={onClose}
						isError={isError}
						isSuccess={isSuccess}
						title={isSuccess ? 'Бронирование успешно оформлено' : 'Ошибка бронирования'}
						text={
							isSuccess
								? 'Ваша заявка отправлена. Она появится в личном кабинете.'
								: errorMessage || 'Попробуйте ещё раз'
						}
					/>
				</div>
			</div>

			<Footer main={false} />
		</div>
	);
}

export default ReservationPage;