import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Spinner from '../../UI/Spinner/Spinner';
import Rooms from '../../DefaultPage/Rooms/Rooms';
import Services from '../../DefaultPage/ServicesBlock/Services';
import styles from './LoaderData.module.css';

import { ReactComponent as Calendar } from './../../../Svg/calendar.svg';
import { ReactComponent as Persons } from './../../../Svg/persons.svg';
import { ReactComponent as Bed } from './../../../Svg/Bed.svg';
import { getNightsCount, normalize_count_form } from '../../../constats';
import Form from '../../UI/Form/Form';

function LoaderData({
	toDate,
	fromDate,
	formState,
	setFormState,
	validationState,
	setValidationState,
	bookSubmit,
	persons,
	filters,
	promoCode,
	setPromoCode,
	applyPromo,
	removePromo,
	promoStatus,
	promoMessage,
	appliedPromo,
	promoDiscount,
	baseTotal,
	finalTotal,
	selectedRoomData,
	isDirectRoomBooking,
}) {
	const { data, isLoading, isError } = useSelector((state) => state.userSlice);

	const getPersonsCount = () => {
		if (typeof persons?.count === 'number') return persons.count;

		const adults = Number(persons?.adults || 0);
		const child = Number(persons?.child || 0);
		const total = adults + child;

		return total > 0 ? total : 1;
	};

	const personsCount = getPersonsCount();
	const nightsCount = Math.max(getNightsCount(toDate, fromDate), 1);

	const canFitAnyRoomType = useMemo(() => {
		const roomCapacities = [2, 3, 3, 4];
		return roomCapacities.some((capacity) => capacity >= personsCount);
	}, [personsCount]);

	const shouldShowRoomsList = useMemo(() => {
		if (isDirectRoomBooking) return false;
		return data !== null && canFitAnyRoomType;
	}, [data, canFitAnyRoomType, isDirectRoomBooking]);

	const isPromoApplied = promoStatus === 'success' && !!appliedPromo;

	const promoStyles = {
		card: {
			width: '100%',
			borderRadius: '1rem',
			padding: '0.95rem',
			background: 'linear-gradient(180deg, rgba(248,239,232,0.98) 0%, rgba(244,232,223,0.98) 100%)',
			border: '1px solid rgba(135, 91, 82, 0.14)',
			boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
			display: 'flex',
			flexDirection: 'column',
			gap: '0.75rem',
		},
		top: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: '0.75rem',
			flexWrap: 'wrap',
		},
		title: {
			color: '#6e493a',
			fontFamily: 'Noto Sans',
			fontSize: '0.96rem',
			fontWeight: 700,
		},
		badge: {
			padding: '0.32rem 0.68rem',
			borderRadius: '999px',
			background: 'rgba(135, 91, 82, 0.08)',
			color: '#875b52',
			fontFamily: 'Noto Sans',
			fontSize: '0.72rem',
			fontWeight: 700,
		},
		row: {
			display: 'grid',
			gridTemplateColumns: '1fr auto auto',
			gap: '0.65rem',
			alignItems: 'center',
		},
		input: {
			width: '100%',
			height: '44px',
			borderRadius: '14px',
			border: isPromoApplied
				? '1px solid rgba(86, 153, 104, 0.45)'
				: '1px solid rgba(135, 91, 82, 0.18)',
			background: isPromoApplied ? 'rgba(104, 183, 127, 0.08)' : '#fffaf7',
			color: '#5a3f36',
			padding: '0 14px',
			outline: 'none',
			fontSize: '15px',
			fontWeight: 600,
		},
		applyButton: {
			height: '44px',
			padding: '0 18px',
			borderRadius: '14px',
			border: isPromoApplied ? '1px solid rgba(86, 153, 104, 0.24)' : 'none',
			background: isPromoApplied
				? 'linear-gradient(135deg, #73b787 0%, #4d9a65 100%)'
				: 'linear-gradient(135deg, #8a5d48 0%, #6e493a 100%)',
			color: '#fff',
			fontWeight: 700,
			cursor: 'pointer',
			boxShadow: isPromoApplied
				? '0 10px 20px rgba(86, 153, 104, 0.18)'
				: '0 10px 20px rgba(111, 73, 57, 0.16)',
			whiteSpace: 'nowrap',
		},
		removeButton: {
			height: '44px',
			padding: '0 16px',
			borderRadius: '14px',
			border: '1px solid rgba(135, 91, 82, 0.16)',
			background: '#fffaf7',
			color: '#875b52',
			fontWeight: 700,
			cursor: 'pointer',
			whiteSpace: 'nowrap',
		},
		message: {
			padding: '11px 13px',
			borderRadius: '14px',
			fontFamily: 'Noto Sans',
			fontSize: '13.5px',
			lineHeight: '145%',
		},
		success: {
			background: 'rgba(104, 183, 127, 0.12)',
			color: '#356847',
			border: '1px solid rgba(104, 183, 127, 0.18)',
		},
		error: {
			background: 'rgba(200, 92, 92, 0.10)',
			color: '#9b4747',
			border: '1px solid rgba(200, 92, 92, 0.16)',
		},
		pending: {
			background: 'rgba(244, 196, 132, 0.14)',
			color: '#8d633d',
			border: '1px solid rgba(244, 196, 132, 0.18)',
		},
		summary: {
			display: 'grid',
			gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
			gap: '0.6rem',
		},
		box: {
			padding: '0.75rem 0.85rem',
			borderRadius: '14px',
			background: '#fffaf7',
			border: '1px solid rgba(135, 91, 82, 0.10)',
			display: 'flex',
			flexDirection: 'column',
			gap: '0.18rem',
		},
		boxLabel: {
			color: 'rgba(110, 73, 58, 0.62)',
			fontFamily: 'Noto Sans',
			fontSize: '12px',
			fontWeight: 600,
		},
		boxValue: {
			color: '#5a3f36',
			fontFamily: 'Noto Sans',
			fontSize: '14px',
			fontWeight: 800,
		},
		totalBox: {
			padding: '0.9rem 1rem',
			borderRadius: '16px',
			background: 'linear-gradient(135deg, rgba(138,93,72,0.08), rgba(110,73,58,0.04))',
			border: '1px solid rgba(135, 91, 82, 0.14)',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			gap: '1rem',
		},
		totalLabel: {
			color: '#6e493a',
			fontFamily: 'Noto Sans',
			fontSize: '14px',
			fontWeight: 700,
		},
		totalValue: {
			color: '#553a32',
			fontFamily: 'Noto Sans',
			fontSize: '20px',
			fontWeight: 800,
			whiteSpace: 'nowrap',
		},
	};

	const renderPromoSection = () => (
		<div style={promoStyles.card}>
			<div style={promoStyles.top}>
				<div style={promoStyles.title}>Промокод</div>
				<div style={promoStyles.badge}>Скидка к бронированию</div>
			</div>

			<div style={promoStyles.row}>
				<input
					type="text"
					placeholder="Введите промокод"
					value={promoCode}
					onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
					style={promoStyles.input}
				/>

				<button type="button" onClick={applyPromo} style={promoStyles.applyButton}>
					{isPromoApplied ? '✓ Применён' : 'Применить'}
				</button>

				{promoCode ? (
					<button type="button" onClick={removePromo} style={promoStyles.removeButton}>
						Убрать
					</button>
				) : null}
			</div>

			{promoMessage ? (
				<div
					style={{
						...promoStyles.message,
						...(promoStatus === 'success'
							? promoStyles.success
							: promoStatus === 'error'
							? promoStyles.error
							: promoStyles.pending),
					}}
				>
					{promoMessage}
				</div>
			) : null}

			{isPromoApplied ? (
				<>
					<div style={promoStyles.summary}>
						<div style={promoStyles.box}>
							<span style={promoStyles.boxLabel}>Акция</span>
							<strong style={promoStyles.boxValue}>{appliedPromo.title}</strong>
						</div>

						<div style={promoStyles.box}>
							<span style={promoStyles.boxLabel}>Промокод</span>
							<strong style={promoStyles.boxValue}>{appliedPromo.code}</strong>
						</div>

						<div style={promoStyles.box}>
							<span style={promoStyles.boxLabel}>Стоимость без скидки</span>
							<strong style={promoStyles.boxValue}>{baseTotal} ₽</strong>
						</div>

						<div style={promoStyles.box}>
							<span style={promoStyles.boxLabel}>Скидка</span>
							<strong style={promoStyles.boxValue}>-{promoDiscount} ₽</strong>
						</div>
					</div>

					<div style={promoStyles.totalBox}>
						<span style={promoStyles.totalLabel}>Итого с учетом промокода</span>
						<strong style={promoStyles.totalValue}>{finalTotal} ₽</strong>
					</div>
				</>
			) : null}
		</div>
	);

	if (isLoading) return <Spinner />;

	if (isError) return <div className="error__text">Произошла ошибка, попробуйте позднее</div>;

	if (data === null) return null;

	if (isDirectRoomBooking && selectedRoomData?.type) {
		if ((data?.[selectedRoomData.type] ?? 0) <= 0) {
			return <div className="text__center">К сожалению, в указанный Вами период этот номер недоступен</div>;
		}

		return (
			<div className={styles.page__data}>
				<div className={styles.data__block}>
					<div className={styles.data__title}>Данные бронирования</div>

					<div className={styles.reservation__data}>
						<div className={styles.reservation__data__block}>
							<div className={styles.reservation__data__block__title}>
								<Calendar />
								Дата заезда
							</div>
							<div className={styles.reservation__data__block__text}>
								{toDate.toLocaleString('ru-RU', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</div>
							<div className={styles.reservation__data__block__text}>с 14:00</div>
						</div>

						<svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M17.5 5.83325V29.1666M17.5 29.1666L26.25 20.4166M17.5 29.1666L8.75 20.4166"
								stroke="#875B52"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>

						<div className={styles.reservation__data__block}>
							<div className={styles.reservation__data__block__title}>
								<Calendar />
								Дата выезда
							</div>
							<div className={styles.reservation__data__block__text}>
								{fromDate.toLocaleString('ru-RU', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
								})}
							</div>
							<div className={styles.reservation__data__block__text}>до 12:00</div>
						</div>

						<div className={styles.reservation__data__block}>
							<div className={styles.reservation__data__block__title}>
								<Persons />
								Количество гостей
							</div>
							<div className={styles.reservation__data__block__text}>
								{personsCount} {normalize_count_form(personsCount, ['человек', 'человека', 'человек'])}
							</div>
						</div>

						<div className={styles.reservation__data__block}>
							<div className={styles.reservation__data__block__title}>
								<Bed />
								Бронирование
							</div>
							<div className={styles.reservation__data__block__text}>{selectedRoomData.name}</div>
							<div className={styles.reservation__data__block__info}>
								<span>Стоимость</span>
								<span>{selectedRoomData.price} ₽</span>
							</div>
							<div className={styles.reservation__data__block__info}>
								<span>Количество ночей</span>
								<span>{`${nightsCount} ${normalize_count_form(nightsCount, ['ночь', 'ночи', 'ночей'])}`}</span>
							</div>

							{isPromoApplied ? (
								<>
									<div className={styles.reservation__data__block__info}>
										<span>Промокод</span>
										<span>{appliedPromo.code}</span>
									</div>
									<div className={styles.reservation__data__block__info}>
										<span>Скидка</span>
										<span>-{promoDiscount} ₽</span>
									</div>
								</>
							) : null}
						</div>

						<div className={styles.reservation__data__result}>
							<span>Итого</span>
							<span>{finalTotal} ₽</span>
						</div>
					</div>
				</div>

				<div className={styles.data__block}>
					<div className={styles.data__title}>Данные о госте</div>

					<Form
						formState={formState}
						setFormState={setFormState}
						validationState={validationState}
						setValidationState={setValidationState}
						send={bookSubmit}
					>
						{renderPromoSection()}
					</Form>
				</div>
			</div>
		);
	}

	if (shouldShowRoomsList) {
		return (
			<>
				<Rooms
					data={data}
					filters={filters}
					personsCount={personsCount}
					toDate={toDate}
					fromDate={fromDate}
					persons={persons}
				/>
				<Services isBook={true} />
			</>
		);
	}

	if (!canFitAnyRoomType) {
		return (
			<div className="text__center">
				К сожалению, у нас нет номеров, рассчитанных на {personsCount}{' '}
				{normalize_count_form(personsCount, ['человека', 'человек', 'человек'])}.
			</div>
		);
	}

	return <div className="text__center">К сожалению, в указанный Вами период нет свободных номеров</div>;
}

export default LoaderData;