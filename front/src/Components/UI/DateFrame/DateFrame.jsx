import { useMemo, useState } from 'react';
import styles from './DateFrame.module.css';
import { ReactComponent as Arrow } from './../../../Svg/chevron-down.svg';
import InputDate from './InputDate/InputDate';
import { ReactComponent as Minus } from './../../../Svg/minus.svg';
import { ReactComponent as Plus } from './../../../Svg/plus.svg';
import { normalize_count_form } from '../../../constats';
import { Link } from 'react-router-dom';

function DateFrame({
	main,
	toDate,
	setToDate,
	fromDate,
	setFromDate,
	persons,
	setPersons,
	handleSubmit,
	filters,
	setFilters,
	showFilters = true,
	submitLabel = 'Найти номер',
}) {
	const [toShow, setToShow] = useState(false);
	const [fromShow, setFromShow] = useState(false);
	const [personsShow, setPersonsShow] = useState(false);
	const [filtersShow, setFiltersShow] = useState(false);

	const canUseFilters = showFilters && typeof setFilters === 'function';

	const currentFilters = useMemo(
		() =>
			filters || {
				type: 'all',
				price: 'all',
				sort: 'default',
				amenities: [],
			},
		[filters],
	);

	const getPersonsCount = () => {
		if (typeof persons?.count === 'number') return persons.count;
		const adults = Number(persons?.adults || 0);
		const child = Number(persons?.child || 0);
		const total = adults + child;
		return total > 0 ? total : 1;
	};

	const currentCount = getPersonsCount();

	const activeFiltersCount = useMemo(() => {
		let count = 0;
		if (currentFilters.type !== 'all') count += 1;
		if (currentFilters.price !== 'all') count += 1;
		if (currentFilters.sort !== 'default') count += 1;
		if (currentFilters.amenities.length > 0) count += 1;
		return count;
	}, [currentFilters]);

	const filtersLabel = activeFiltersCount > 0 ? `${activeFiltersCount} выбрано` : 'Без фильтров';

	const updateFilterField = (key, value) => {
		if (!setFilters) return;
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	const toggleAmenity = (amenity) => {
		if (!setFilters) return;
		setFilters((prev) => ({
			...prev,
			amenities: prev.amenities.includes(amenity)
				? prev.amenities.filter((item) => item !== amenity)
				: [...prev.amenities, amenity],
		}));
	};

	const resetFilters = () => {
		if (!setFilters) return;
		setFilters({
			type: 'all',
			price: 'all',
			sort: 'default',
			amenities: [],
		});
	};

	const personsModalClass = main
		? `${styles.persons__modal} ${styles.persons__modal__top}`
		: `${styles.persons__modal} ${styles.persons__modal__bottom}`;

	const filtersModalClass = main
		? `${styles.filters__modal} ${styles.filters__modal__top}`
		: `${styles.filters__modal} ${styles.filters__modal__bottom}`;

	const canNavigateToReservation =
		fromDate > toDate && window.location.pathname === '/' && currentCount > 0 && canUseFilters;

	return (
		<div className={!main ? `${styles.date__frame} ${styles.without__bg}` : styles.date__frame}>
			<InputDate
				from={false}
				value={toDate}
				setValue={setToDate}
				show={toShow}
				setShow={() => {
					setToShow(!toShow);
					setFromShow(false);
					setPersonsShow(false);
					setFiltersShow(false);
				}}
			/>

			<InputDate
				from={true}
				value={fromDate}
				setValue={setFromDate}
				show={fromShow}
				setShow={() => {
					setToShow(false);
					setFromShow(!fromShow);
					setPersonsShow(false);
					setFiltersShow(false);
				}}
			/>

			<div className={`${styles.input__date} ${styles.input__date__guests}`}>
				<div
					className={styles.click__side}
					onClick={() => {
						setToShow(false);
						setFromShow(false);
						setPersonsShow(!personsShow);
						setFiltersShow(false);
					}}
				>
					<div className={styles.input__text_side}>
						<span className={styles.input__title}>Количество гостей</span>
						<span className={styles.input__text}>
							{`${currentCount} ${normalize_count_form(currentCount, ['человек', 'человека', 'человек'])}`}
						</span>
					</div>
					<Arrow />
				</div>

				{personsShow ? (
					<div className={personsModalClass}>
						<div className={styles.modal__item}>
							<div className={styles.item__title}>Человек</div>
							<div className={styles.item__input__side}>
								<Minus
									onClick={() => {
										if (currentCount > 1) {
											setPersons({ count: currentCount - 1 });
										}
									}}
								/>
								<span className={styles.item__count}>{currentCount}</span>
								<Plus
									onClick={() => {
										setPersons({ count: currentCount + 1 });
									}}
								/>
							</div>
						</div>

						<div className={styles.modal__item}>
							<div className={styles.item__title}>Заезд</div>
							<div className={styles.item__input__side}>
								<span className={styles.item__count}>с 14:00</span>
							</div>
						</div>

						<div className={styles.modal__item}>
							<div className={styles.item__title}>Выезд</div>
							<div className={styles.item__input__side}>
								<span className={styles.item__count}>до 12:00</span>
							</div>
						</div>
					</div>
				) : null}
			</div>

			{canUseFilters ? (
				<div className={`${styles.input__date} ${styles.input__date__filters}`}>
					<div
						className={styles.click__side}
						onClick={() => {
							setToShow(false);
							setFromShow(false);
							setPersonsShow(false);
							setFiltersShow(!filtersShow);
						}}
					>
						<div className={styles.input__text_side}>
							<span className={styles.input__title}>Фильтры</span>
							<span className={styles.input__text}>{filtersLabel}</span>
						</div>
						<Arrow />
					</div>

					{filtersShow ? (
						<div className={filtersModalClass}>
							<div className={styles.filter__section}>
								<div className={styles.filter__section__title}>Во всех номерах</div>
								<div className={styles.included__chips}>
									<span className={styles.included__chip}>Wi-Fi</span>
									<span className={styles.included__chip}>Телевизор</span>
									<span className={styles.included__chip}>Кондиционер</span>
									<span className={styles.included__chip}>Парковка</span>
									<span className={styles.included__chip}>Душ</span>
								</div>
							</div>

							<div className={styles.filter__section}>
								<label className={styles.filter__label}>Тип номера</label>
								<select
									className={styles.filter__select}
									value={currentFilters.type}
									onChange={(e) => updateFilterField('type', e.target.value)}
								>
									<option value="all">Все типы</option>
									<option value="standard">Стандарт</option>
									<option value="luxe">Люкс</option>
									<option value="luxe plus">Люкс +</option>
									<option value="luxe premium">Люкс Премиум</option>
								</select>
							</div>

							<div className={styles.filter__section}>
								<label className={styles.filter__label}>Цена</label>
								<select
									className={styles.filter__select}
									value={currentFilters.price}
									onChange={(e) => updateFilterField('price', e.target.value)}
								>
									<option value="all">Любая цена</option>
									<option value="low">До 3000 ₽</option>
									<option value="middle">3001–4000 ₽</option>
									<option value="high">От 4001 ₽</option>
								</select>
							</div>

							<div className={styles.filter__section}>
								<div className={styles.filter__label}>Отдельно можно выбрать</div>
								<div className={styles.checkbox__list}>
									<button
										type="button"
										className={
											currentFilters.amenities.includes('breakfast')
												? styles.amenity__chip__active
												: styles.amenity__chip
										}
										onClick={() => toggleAmenity('breakfast')}
									>
										Завтрак
									</button>

									<button
										type="button"
										className={
											currentFilters.amenities.includes('balcony')
												? styles.amenity__chip__active
												: styles.amenity__chip
										}
										onClick={() => toggleAmenity('balcony')}
									>
										Балкон
									</button>
								</div>
							</div>

							<div className={styles.filter__section}>
								<label className={styles.filter__label}>Сортировка</label>
								<select
									className={styles.filter__select}
									value={currentFilters.sort}
									onChange={(e) => updateFilterField('sort', e.target.value)}
								>
									<option value="default">По умолчанию</option>
									<option value="price-asc">Сначала дешевле</option>
									<option value="price-desc">Сначала дороже</option>
									<option value="name-asc">По названию</option>
								</select>
							</div>

							<div className={styles.filter__footer}>
								<button type="button" className={styles.reset__filters__btn} onClick={resetFilters}>
									Сбросить
								</button>
							</div>
						</div>
					) : null}
				</div>
			) : null}

			{canNavigateToReservation ? (
				<Link
					to="/reservation"
					className={styles.search__btn}
					state={{
						searchMode: 'main-search-list',
						toDate,
						fromDate,
						persons: { count: currentCount },
						filters: currentFilters,
					}}
				>
					{submitLabel}
				</Link>
			) : (
				<button className={styles.search__btn} onClick={handleSubmit}>
					{submitLabel}
				</button>
			)}
		</div>
	);
}

export default DateFrame;