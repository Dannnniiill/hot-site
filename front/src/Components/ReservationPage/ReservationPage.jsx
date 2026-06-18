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
		telValue: normalizeText(user?.phone),
		emailValue: normalizeText(user?.email),
		commentsValue: '',
		checked: false,
		type: '',
	});

	const [validationState, setValidationState] = React.useState({
		validName: false,
		validLastName: false,
		validTel: false,
		validEmail: false,
		validChecked: false,
	});

	const [promoCode, setPromoCode] = React.useState(
		state?.promoCode || localStorage.getItem(ACTIVE_PROMO_KEY) || '',
	);
	const [appliedPromo, setAppliedPromo] = React.useState(null);
	const [promoStatus, setPromoStatus] = React.useState('idle');
	const [promoMessage, setPromoMessage] = React.useState('');
	const [promoDiscount, setPromoDiscount] = React.useState(0);

	const { nameValue, lastNameValue, telValue, emailValue, commentsValue, checked } = formState;

	const routeTypeFromParams = normalizeText(params?.type).toLowerCase();
	const routeTypeFromPath = getRoomTypeFromPath(pathname);
	const directRoomType = routeTypeFromParams || routeTypeFromPath;

	const routeRoom = React.useMemo(() => ROOM_CATALOG[directRoomType] || null, [directRoomType]);

	const searchMode = state?.searchMode || '';

	const isMainSearchList = searchMode === 'main-search-list';
	const isMainSearchRoom = searchMode === 'main-search-room';
	const isDirectRoomState = searchMode === 'direct-room';

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
			dispatch(
				selectRoom({
					id: null,
					name: '',
					type: '',
					price: 0,
				}),
			);
		}
	}, [
		dispatch,
		isMainSearchList,
		isMainSearchRoom,
		isDirectRoomBooking,
		routeRoom,
		selectedRoomData?.id,
	]);

	React.useEffect(() => {
		const parsed = splitUserName(user?.name);

		setFormState((prev) => ({
			...prev,
			nameValue: prev.nameValue || parsed.firstName,
			lastNameValue: prev.lastNameValue || parsed.lastName,
			telValue: prev.telValue || normalizeText(user?.phone),
			emailValue: prev.emailValue || normalizeText(user?.email),
		}));
	}, [user]);

	const getPersonsCount = React.useCallback(() => {
		if (typeof persons?.count === 'number') return persons.count;

		const adults = Number(persons?.adults || 0);
		const child = Number(persons?.child || 0);
		const total = adults + child;

		return total > 0 ? total : 1;
	}, [persons]);

	const getNightsValue = () => {
		return getNightsCount(toDate, fromDate);
	};

	const getBaseTotal = () => {
		const roomPrice = Number(effectiveSelectedRoom?.price || 0);
		return roomPrice * getNightsValue();
	};

	const finalTotal = Math.max(getBaseTotal() - promoDiscount, 0);

	const handleSubmit = React.useCallback(() => {
		dispatch(
			getRooms({
				start_date: getDateToString(toDate),
				end_date: getDateToString(fromDate),
				persons: getPersonsCount(),
				type: isDirectRoomBooking ? effectiveSelectedRoom?.type || directRoomType || '' : '',
			}),
		);
	}, [dispatch, toDate, fromDate, getPersonsCount, isDirectRoomBooking, effectiveSelectedRoom, directRoomType]);

	React.useEffect(() => {
		handleSubmit();
	}, [handleSubmit]);

	const applyPromo = async () => {
		const code = normalizeText(promoCode).toUpperCase();

		if (!code) {
			setAppliedPromo(null);
			setPromoDiscount(0);
			setPromoStatus('error');
			setPromoMessage('Введите промокод');
			return;
		}

		const foundPromo = promotionsData.find((item) => item.code.toUpperCase() === code);

		if (!foundPromo) {
			setAppliedPromo(null);
			setPromoDiscount(0);
			setPromoStatus('error');
			setPromoMessage('Промокод не найден');
			return;
		}

		const nights = getNightsValue();
		const selectedType = normalizeText(effectiveSelectedRoom?.type).toLowerCase();
		const allowedTypes = (foundPromo.roomTypes || []).map((item) => normalizeText(item).toLowerCase());

		if (allowedTypes.length && selectedType && !allowedTypes.includes(selectedType)) {
			setAppliedPromo(null);
			setPromoDiscount(0);
			setPromoStatus('error');
			setPromoMessage('Этот промокод не подходит для выбранного номера');
			return;
		}

		if (Number(foundPromo.minNights || 0) > nights) {
			setAppliedPromo(null);
			setPromoDiscount(0);
			setPromoStatus('error');
			setPromoMessage(`Промокод действует при бронировании от ${foundPromo.minNights} ночей`);
			return;
		}

		const baseTotal = getBaseTotal();
		let discount = 0;

		if (foundPromo.discountType === 'percent') {
			discount = Math.round((baseTotal * Number(foundPromo.discountValue || 0)) / 100);
		} else {
			discount = Number(foundPromo.discountValue || 0);
		}

		setAppliedPromo(foundPromo);
		setPromoDiscount(discount);
		setPromoStatus('success');
		setPromoMessage(`Промокод ${foundPromo.code} успешно применён`);
		localStorage.setItem(ACTIVE_PROMO_KEY, foundPromo.code);

		try {
			const currentUserRaw = localStorage.getItem('hotel_current_user');
			const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

			await axios.post(`${API_BASE}/promotions/track/`, {
				user_id: currentUser?.id || null,
				email: currentUser?.email || normalizeText(emailValue),
				promo_code: foundPromo.code,
				promo_title: foundPromo.title,
				discount_label: foundPromo.discountLabel,
				event_type: 'apply',
				page: 'reservation',
			});
		} catch (error) {
			console.error('Ошибка сохранения события акции:', error);
		}
	};

	const removePromo = () => {
		setPromoCode('');
		setAppliedPromo(null);
		setPromoDiscount(0);
		setPromoStatus('idle');
		setPromoMessage('');
		localStorage.removeItem(ACTIVE_PROMO_KEY);
	};

	const validateForm = () => {
		const safeName = normalizeText(nameValue);
		const safeLastName = normalizeText(lastNameValue);
		const safePhone = normalizeText(telValue);
		const safeEmail = normalizeText(emailValue);

		const nextValidation = {
			validName: !cyrillicPattern.test(safeName),
			validLastName: !cyrillicPattern.test(safeLastName),
			validTel: !telPattern.test(safePhone),
			validEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail),
			validChecked: !checked,
		};

		setValidationState(nextValidation);

		return !Object.values(nextValidation).some(Boolean);
	};

	const bookSubmit = async () => {
		if (!validateForm()) return;

		const safeName = normalizeText(nameValue);
		const safeLastName = normalizeText(lastNameValue);
		const safePhone = normalizeText(telValue);
		const safeEmail = normalizeText(emailValue);
		const safeComment = normalizeText(commentsValue);

		const bookingPayload = {
			first_name: safeName,
			last_name: safeLastName,
			phone_number: safePhone,
			email: safeEmail,
			comment: safeComment,
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
			setPromoCode(state.promoCode);
		}
	}, [state]);

	const directPanelStyles = {
		wrap: {
			width: '100%',
			maxWidth: '1120px',
			margin: '110px auto 32px',
			padding: '18px',
			borderRadius: '24px',
			background: 'rgba(242, 233, 225, 0.95)',
			backdropFilter: 'blur(8px)',
			boxShadow: '0 14px 32px rgba(86, 58, 46, 0.08)',
			border: '1px solid rgba(135, 91, 82, 0.12)',
			boxSizing: 'border-box',
			position: 'relative',
			zIndex: 2,
		},
		grid: {
			display: 'grid',
			gridTemplateColumns: '1fr 1fr 1fr 240px',
			gap: '16px',
			alignItems: 'end',
		},
		field: {
			display: 'flex',
			flexDirection: 'column',
			gap: '8px',
		},
		label: {
			fontSize: '13px',
			fontWeight: 700,
			color: '#9b7a69',
			textTransform: 'uppercase',
			letterSpacing: '0.03em',
		},
		input: {
			width: '100%',
			height: '62px',
			borderRadius: '16px',
			border: '1px solid rgba(135, 91, 82, 0.18)',
			background: '#fff',
			padding: '0 16px',
			fontSize: '22px',
			color: '#6e493a',
			boxSizing: 'border-box',
		},
		guestBox: {
			height: '62px',
			borderRadius: '16px',
			border: '1px solid rgba(135, 91, 82, 0.18)',
			background: '#fff',
			padding: '0 16px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			boxSizing: 'border-box',
		},
		guestCount: {
			fontSize: '24px',
			fontWeight: 700,
			color: '#6e493a',
			minWidth: '36px',
			textAlign: 'center',
		},
		guestBtn: {
			width: '36px',
			height: '36px',
			borderRadius: '50%',
			border: '1px solid rgba(135, 91, 82, 0.18)',
			background: '#fff8f4',
			color: '#6e493a',
			fontSize: '24px',
			cursor: 'pointer',
			lineHeight: 1,
		},
		submit: {
			width: '100%',
			height: '62px',
			border: 'none',
			borderRadius: '16px',
			background: 'linear-gradient(135deg, #8a5d48 0%, #6e493a 100%)',
			color: '#fff',
			fontSize: '20px',
			fontWeight: 700,
			cursor: 'pointer',
			boxShadow: '0 12px 24px rgba(111, 73, 57, 0.18)',
		},
	};

	if (!hasStateData && !hasDirectRoomRoute) {
		return null;
	}

	const contentSpacingStyle = shouldShowTopBookingBar
		? {}
		: {
				paddingTop: '110px',
		  };

	return (
		<div className={styles.page}>
			<Header main={false} />

			<div className={styles.container}>
				<div className={styles.content} style={contentSpacingStyle}>
					{shouldShowTopBookingBar ? (
						<div style={directPanelStyles.wrap}>
							<div style={directPanelStyles.grid}>
								<div style={directPanelStyles.field}>
									<span style={directPanelStyles.label}>Заезд</span>
									<input
										type="date"
										value={formatInputDate(toDate)}
										onChange={(e) => {
											const nextDate = new Date(e.target.value);
											nextDate.setHours(0, 0, 0, 0);
											setToDate(nextDate);

											if (fromDate <= nextDate) {
												const nextFrom = new Date(nextDate);
												nextFrom.setDate(nextFrom.getDate() + 1);
												nextFrom.setHours(0, 0, 0, 0);
												setFromDate(nextFrom);
											}
										}}
										style={directPanelStyles.input}
									/>
								</div>

								<div style={directPanelStyles.field}>
									<span style={directPanelStyles.label}>Выезд</span>
									<input
										type="date"
										value={formatInputDate(fromDate)}
										min={formatInputDate(new Date(toDate.getTime() + 24 * 60 * 60 * 1000))}
										onChange={(e) => {
											const nextDate = new Date(e.target.value);
											nextDate.setHours(0, 0, 0, 0);
											setFromDate(nextDate);
										}}
										style={directPanelStyles.input}
									/>
								</div>

								<div style={directPanelStyles.field}>
									<span style={directPanelStyles.label}>Количество гостей</span>
									<div style={directPanelStyles.guestBox}>
										<button
											type="button"
											style={directPanelStyles.guestBtn}
											onClick={() => {
												const current = getPersonsCount();
												if (current > 1) {
													setPersons({ count: current - 1 });
												}
											}}
										>
											−
										</button>

										<div style={directPanelStyles.guestCount}>{getPersonsCount()}</div>

										<button
											type="button"
											style={directPanelStyles.guestBtn}
											onClick={() => {
												const current = getPersonsCount();
												const maxGuests = Number(effectiveSelectedRoom?.maxPerson || 10);

												if (current < maxGuests) {
													setPersons({ count: current + 1 });
												}
											}}
										>
											+
										</button>
									</div>
								</div>

								<button type="button" style={directPanelStyles.submit} onClick={handleSubmit}>
									Проверить доступность
								</button>
							</div>
						</div>
					) : null}

					<LoaderData
						toDate={toDate}
						fromDate={fromDate}
						formState={formState}
						setFormState={setFormState}
						validationState={validationState}
						setValidationState={setValidationState}
						bookSubmit={bookSubmit}
						persons={persons}
						filters={filters}
						promoCode={promoCode}
						setPromoCode={setPromoCode}
						applyPromo={applyPromo}
						removePromo={removePromo}
						promoStatus={promoStatus}
						promoMessage={promoMessage}
						appliedPromo={appliedPromo}
						promoDiscount={promoDiscount}
						baseTotal={getBaseTotal()}
						finalTotal={finalTotal}
						selectedRoomData={effectiveSelectedRoom}
						isDirectRoomBooking={isDirectRoomBooking || isMainSearchRoom}
					/>

					<ModalStatus
						isOpen={isOpen}
						onClose={onClose}
						goMain={true}
						isError={isError}
						isSuccess={isSuccess}
					/>
				</div>
			</div>

			<Footer main={false} />
		</div>
	);
}

export default ReservationPage;