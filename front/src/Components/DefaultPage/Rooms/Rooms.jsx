import React from 'react';
import styles from './Rooms.module.css';
import RoomItem from './RoomItem/RoomItem';

const rooms = [
	{
		id: 1,
		type: 'standard',
		name: 'Номер Стандарт',
		maxPerson: 2,
		text: 'В этом номере вы найдете удобную кровать, хорошую мебель и необходимое оборудование для проживания',
		price: 2200,
		breakfast: false,
		balcony: false,
		img: require('./../../../Img/rooms/room_standart.png'),
		modalImages: [
			require('./../../../Img/rooms/standart/standart_1.png'),
			require('./../../../Img/rooms/standart/standart_2.png'),
		],
	},
	{
		id: 2,
		type: 'luxe',
		name: 'Номер Люкс',
		maxPerson: 3,
		text: 'Люксовый номер предлагает более просторное проживание с дополнительными удобствами',
		price: 3400,
		breakfast: true,
		balcony: false,
		img: require('./../../../Img/rooms/room_lux.png'),
		modalImages: [
			require('./../../../Img/rooms/lux/lux_1.png'),
			require('./../../../Img/rooms/lux/lux_2.png'),
			require('./../../../Img/rooms/lux/lux_3.png'),
			require('./../../../Img/rooms/lux/lux_4.png'),
		],
	},
	{
		id: 3,
		type: 'luxe plus',
		name: 'Номер Люкс +',
		maxPerson: 3,
		text: 'Этот вариант для тех, кто хочет насладиться еще большим комфортом с обновленным ремонтом',
		price: 3700,
		breakfast: true,
		balcony: true,
		img: require('./../../../Img/rooms/room_lux_plus.png'),
		modalImages: [
			require('./../../../Img/rooms/lux+/lux_plus_1.png'),
			require('./../../../Img/rooms/lux+/lux_plus_2.png'),
			require('./../../../Img/rooms/lux+/lux_plus_3.png'),
		],
	},
	{
		id: 4,
		type: 'luxe premium',
		name: 'Номер Люкс Премиум',
		maxPerson: 4,
		text: 'Идеальный выбор для компании или семьи, которая ищет удобное и просторное проживание',
		price: 4200,
		breakfast: true,
		balcony: true,
		img: require('./../../../Img/rooms/room_premium.png'),
		modalImages: [
			require('./../../../Img/rooms/premium/premium_1.png'),
			require('./../../../Img/rooms/premium/premium_2.png'),
		],
	},
];

function Rooms({ data, filters, personsCount = null, toDate = null, fromDate = null, persons = { count: 1 } }) {
	const safeFilters = filters || {
		type: 'all',
		price: 'all',
		sort: 'default',
		amenities: [],
	};

	const getResolvedPersonsCount = () => {
		if (typeof personsCount === 'number' && !Number.isNaN(personsCount)) {
			return personsCount;
		}

		if (typeof persons?.count === 'number' && !Number.isNaN(persons.count)) {
			return persons.count;
		}

		const adults = Number(persons?.adults || 0);
		const child = Number(persons?.child || 0);
		const total = adults + child;

		return total > 0 ? total : 1;
	};

	const requestedPersonsCount = getResolvedPersonsCount();

	let visibleRooms = [...rooms];

	if (data !== null) {
		visibleRooms = visibleRooms.filter((room) => room.maxPerson >= requestedPersonsCount);
	}

	if (safeFilters.type !== 'all') {
		visibleRooms = visibleRooms.filter((room) => room.type === safeFilters.type);
	}

	if (safeFilters.price === 'low') {
		visibleRooms = visibleRooms.filter((room) => room.price <= 3000);
	}

	if (safeFilters.price === 'middle') {
		visibleRooms = visibleRooms.filter((room) => room.price > 3000 && room.price <= 4000);
	}

	if (safeFilters.price === 'high') {
		visibleRooms = visibleRooms.filter((room) => room.price > 4000);
	}

	if (safeFilters.amenities.includes('breakfast')) {
		visibleRooms = visibleRooms.filter((room) => room.breakfast === true);
	}

	if (safeFilters.amenities.includes('balcony')) {
		visibleRooms = visibleRooms.filter((room) => room.balcony === true);
	}

	if (safeFilters.sort === 'price-asc') {
		visibleRooms.sort((a, b) => a.price - b.price);
	}

	if (safeFilters.sort === 'price-desc') {
		visibleRooms.sort((a, b) => b.price - a.price);
	}

	if (safeFilters.sort === 'name-asc') {
		visibleRooms.sort((a, b) => a.name.localeCompare(b.name));
	}

	const sharedBookingState = {
		toDate,
		fromDate,
		persons,
		filters: safeFilters,
	};

	return (
		<section id="rooms" className={!data ? styles.rooms : styles.rooms__book}>
			{!data && (
				<div className="block__title">
					<div className="title__line"></div>
					Номера
					<div className="title__line"></div>
				</div>
			)}

			{visibleRooms.length === 0 ? (
				<div style={emptyStyles.wrapper}>
					<div style={emptyStyles.title}>Ничего не найдено</div>
					<div style={emptyStyles.text}>
						По выбранным параметрам подходящих номеров нет. Попробуйте изменить фильтры.
					</div>
				</div>
			) : !data ? (
				<div className={styles.rooms__grid}>
					{visibleRooms.map((el) => (
						<RoomItem
							key={el.id}
							{...el}
							isBook={false}
							availableCount={null}
							bookingState={{
								...sharedBookingState,
								searchMode: 'direct-room',
								roomType: el.type,
								roomId: el.id,
							}}
						/>
					))}
				</div>
			) : (
				<div className={styles.rooms__bookList}>
					{visibleRooms.map((el) => (
						<RoomItem
							key={el.id}
							{...el}
							isBook={true}
							availableCount={Number(data?.[el.type] ?? 0)}
							bookingState={{
								...sharedBookingState,
								searchMode: 'main-search-room',
								roomType: el.type,
								roomId: el.id,
							}}
						/>
					))}
				</div>
			)}
		</section>
	);
}

const emptyStyles = {
	wrapper: {
		width: '100%',
		padding: '34px 20px',
		borderRadius: '22px',
		background: 'rgba(255,255,255,0.55)',
		border: '1px dashed rgba(75, 47, 42, 0.16)',
		textAlign: 'center',
		marginTop: '8px',
	},
	title: {
		fontSize: '24px',
		fontFamily: 'Cormorant',
		fontWeight: 600,
		color: '#4b2f2a',
		marginBottom: '8px',
	},
	text: {
		fontSize: '15px',
		color: '#5f4a43',
		lineHeight: 1.6,
	},
};

export default Rooms;