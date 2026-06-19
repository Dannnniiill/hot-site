import React, { useState } from 'react';
import styles from './RoomItem.module.css';
import { ReactComponent as Persons } from './../../../../Svg/persons.svg';
import { useDisclosure } from '@chakra-ui/react';
import ModalImages from '../../../UI/ModalImages/ModalImages';
import { useNavigate } from 'react-router-dom';
import { selectRoom } from '../../../../Redux/slices/userSlice';
import { useDispatch } from 'react-redux';

function normalizePersonsPayload(persons, fallbackCount = 1) {
	if (typeof persons?.count === 'number' && persons.count > 0) {
		return { count: persons.count };
	}

	const adults = Number(persons?.adults || 0);
	const child = Number(persons?.child || 0);
	const total = adults + child;

	if (total > 0) {
		return { count: total };
	}

	return { count: fallbackCount };
}

function RoomItem({
	id,
	name,
	type,
	text,
	maxPerson,
	img,
	price,
	modalImages,
	isBook,
	availableCount,
	bookingState,
}) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [currentImage, setCurrentImage] = useState(0);
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const isUnavailable = isBook && Number(availableCount) <= 0;

	const handleSelectRoom = () => {
		dispatch(selectRoom({ id, name, type, price }));
	};

	const handleBookClick = () => {
		if (isUnavailable) return;

		handleSelectRoom();

		const normalizedPersons = normalizePersonsPayload(
			bookingState?.persons,
			1,
		);

		navigate(`/reservation/${encodeURIComponent(type)}`, {
			state: {
				...(bookingState || {}),
				searchMode: isBook ? 'main-search-room' : 'direct-room',
				roomType: type,
				roomId: id,
				persons: normalizedPersons,
			},
		});
	};

	const roomMeta = {
		standard: {
			features: ['Уютная атмосфера', 'Практичный формат', 'Комфортное размещение'],
		},
		luxe: {
			features: ['Больше пространства', 'Комфортная обстановка', 'Продуманный отдых'],
		},
		'luxe plus': {
			features: ['Современный интерьер', 'Повышенный комфорт', 'Более выразительная атмосфера'],
		},
		'luxe premium': {
			features: ['Просторное размещение', 'Максимум удобства', 'Выразительный интерьер'],
		},
	};

	const meta = roomMeta[type] || {
		features: ['Уютная атмосфера', 'Комфортное пространство'],
	};

	return (
		<div className={isBook ? styles.room__item__column : styles.room__item}>
			<div className={styles.image__wrap} onClick={onOpen}>
				<img src={img} alt={name} />
			</div>

			<div className={styles.info__block}>
				<div className={styles.info__top}>
					<div className={styles.info__header}>
						<div className={styles.room__name}>{name}</div>

						<div className={styles.room__persons}>
							<Persons />
							{`до ${maxPerson}-х мест`}
						</div>
					</div>

					<div className={styles.info__text}>{text}</div>

					<div className={styles.meta__card}>
						<div className={styles.meta__title}>Особенности номера</div>

						<div className={styles.meta__features}>
							{meta.features.map((item) => (
								<div key={item} className={styles.meta__feature}>
									<span className={styles.meta__dot}></span>
									<span>{item}</span>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className={styles.info__footer}>
					<div className={styles.info__price}>
						<span className={styles.price__label}>Стоимость</span>
						<span className={styles.price__value}>{`${price} ₽ / сутки`}</span>
					</div>

					<div className={styles.footer__buttons}>
						<button
							type="button"
							onClick={handleBookClick}
							className={styles.primary__btn}
							disabled={isUnavailable}
						>
							{isUnavailable ? 'Нет мест' : 'Забронировать'}
						</button>

						<button
							type="button"
							onClick={() => {
								setCurrentImage(0);
								onOpen();
							}}
							className={styles.secondary__btn}
						>
							Смотреть фото
						</button>
					</div>
				</div>
			</div>

			<ModalImages
				isOpen={isOpen}
				onClose={onClose}
				currentImage={currentImage}
				setCurrentImage={setCurrentImage}
				images={modalImages}
			/>
		</div>
	);
}

export default RoomItem;