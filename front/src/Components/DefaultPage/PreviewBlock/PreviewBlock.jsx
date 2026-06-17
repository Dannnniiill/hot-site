import React from 'react';
import styles from './PreviewBlock.module.css';
import DateFrame from '../../UI/DateFrame/DateFrame';
import { useDispatch } from 'react-redux';
import { getRooms } from '../../../Redux/slices/userSlice';
import { useToast } from '@chakra-ui/react';
import { getDateToString } from '../../../constats';

function PreviewBlock({ filters, setFilters }) {
	const dispatch = useDispatch();
	const toast = useToast();
	const [toDate, setToDate] = React.useState(new Date());
	const [fromDate, setFromDate] = React.useState(new Date());
	const [persons, setPersons] = React.useState({ count: 1 });

	const getPersonsCount = () => {
		if (typeof persons?.count === 'number') return persons.count;
		const adults = Number(persons?.adults || 0);
		const child = Number(persons?.child || 0);
		const total = adults + child;
		return total > 0 ? total : 1;
	};

	const handleSubmit = () => {
		const personsCount = getPersonsCount();

		if (fromDate > toDate) {
			if (personsCount > 0) {
				dispatch(
					getRooms({
						start_date: getDateToString(toDate),
						end_date: getDateToString(fromDate),
						persons: personsCount,
					}),
				);
			} else {
				toast({
					title: 'Внимание',
					description: 'В заявке должен быть как минимум 1 человек',
					status: 'error',
					duration: 4000,
					isClosable: true,
					variant: 'customError',
				});
			}
		} else {
			toast({
				title: 'Внимание',
				description: 'Дата заезда должна быть раньше даты выезда',
				status: 'error',
				duration: 4000,
				isClosable: true,
				variant: 'customError',
			});
		}
	};

	return (
		<section className={styles.preview__block}>
			<div className={styles.preview__text}>
				<h1 className={styles.preview__title}>Добро пожаловать!</h1>
				<h3 className={styles.preview__subtitle}>
					В отеле «Комфорт» каждый гость для нас особенный! Мы гарантируем вам приятное пребывание, радушный
					приём и заботу о каждой вашей потребности.
				</h3>
			</div>

			<DateFrame
				main={true}
				toDate={toDate}
				setToDate={setToDate}
				fromDate={fromDate}
				setFromDate={setFromDate}
				persons={persons}
				setPersons={setPersons}
				handleSubmit={handleSubmit}
				filters={filters}
				setFilters={setFilters}
			/>
		</section>
	);
}

export default PreviewBlock;