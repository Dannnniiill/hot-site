import React from 'react';

import { checkDateIsEqual, checkIsToday } from './../../../utils/helpers/date';
import { useCalendar } from './hooks/useCalendar';

import './DatePicker.css';

interface CalendarProps {
	locale?: string;
	selectedDate: Date;
	selectDate: (date: Date) => void;
	className: string;
	firstWeekDayNumber?: number;
}

export const DatePicker: React.FC<CalendarProps> = ({
	locale = 'default',
	selectedDate: date,
	selectDate,
	firstWeekDayNumber = 2,
	className,
}) => {
	const { functions, state } = useCalendar({
		locale,
		selectedDate: date,
		firstWeekDayNumber,
	});

	return (
		<div className={`calendar ${className}`}>
			<div className="calendar__header">
				<div
					aria-hidden
					className="calendar__header__arrow__left"
					onClick={() => functions.onClickArrow('left')}>
					<svg
						width="25"
						height="25"
						viewBox="0 0 25 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M11.7606 12.5L15.4481 8.81252C15.6421 8.61735 15.751 8.35334 15.751 8.07814C15.751 7.80295 15.6421 7.53894 15.4481 7.34377C15.3513 7.24613 15.2361 7.16864 15.1091 7.11576C14.9822 7.06287 14.846 7.03564 14.7085 7.03564C14.571 7.03564 14.4348 7.06287 14.3079 7.11576C14.181 7.16864 14.0658 7.24613 13.9689 7.34377L9.55226 11.7604C9.45463 11.8573 9.37714 11.9725 9.32425 12.0994C9.27137 12.2264 9.24414 12.3625 9.24414 12.5C9.24414 12.6375 9.27137 12.7737 9.32425 12.9006C9.37714 13.0276 9.45463 13.1428 9.55226 13.2396L13.9689 17.7084C14.0663 17.8049 14.1817 17.8813 14.3086 17.9331C14.4355 17.985 14.5714 18.0112 14.7085 18.0104C14.8456 18.0112 14.9815 17.985 15.1084 17.9331C15.2353 17.8813 15.3508 17.8049 15.4481 17.7084C15.6421 17.5132 15.751 17.2492 15.751 16.974C15.751 16.6988 15.6421 16.4348 15.4481 16.2396L11.7606 12.5Z"
							fill="#875B52"
						/>
					</svg>{' '}
				</div>
				{state.mode === 'days' && (
					<div
						className="calendar__header__title"
						aria-hidden
						onClick={() => functions.setMode('monthes')}>
						{state.monthesNames[state.selectedMonth.monthIndex].month} {state.selectedYear}
					</div>
				)}
				{state.mode === 'monthes' && (
					<div
						aria-hidden
						onClick={() => functions.setMode('years')}>
						{state.selectedYear}
					</div>
				)}
				{state.mode === 'years' && (
					<div className="calendar__header__title">
						{state.selectedYearsInterval[0]} -{' '}
						{state.selectedYearsInterval[state.selectedYearsInterval.length - 1]}
					</div>
				)}
				<div
					aria-hidden
					className="calendar__header__arrow__right"
					onClick={() => functions.onClickArrow('right')}>
					<svg
						width="25"
						height="25"
						viewBox="0 0 25 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M11.7606 12.5L15.4481 8.81252C15.6421 8.61735 15.751 8.35334 15.751 8.07814C15.751 7.80295 15.6421 7.53894 15.4481 7.34377C15.3513 7.24613 15.2361 7.16864 15.1091 7.11576C14.9822 7.06287 14.846 7.03564 14.7085 7.03564C14.571 7.03564 14.4348 7.06287 14.3079 7.11576C14.181 7.16864 14.0658 7.24613 13.9689 7.34377L9.55226 11.7604C9.45463 11.8573 9.37714 11.9725 9.32425 12.0994C9.27137 12.2264 9.24414 12.3625 9.24414 12.5C9.24414 12.6375 9.27137 12.7737 9.32425 12.9006C9.37714 13.0276 9.45463 13.1428 9.55226 13.2396L13.9689 17.7084C14.0663 17.8049 14.1817 17.8813 14.3086 17.9331C14.4355 17.985 14.5714 18.0112 14.7085 18.0104C14.8456 18.0112 14.9815 17.985 15.1084 17.9331C15.2353 17.8813 15.3508 17.8049 15.4481 17.7084C15.6421 17.5132 15.751 17.2492 15.751 16.974C15.751 16.6988 15.6421 16.4348 15.4481 16.2396L11.7606 12.5Z"
							fill="#875B52"
						/>
					</svg>
				</div>
			</div>
			<div className="calendar__body">
				{state.mode === 'days' && (
					<>
						<div className="calendar__week__names">
							{state.weekDaysNames.map((weekDaysName) => (
								<div
									className="calendar__week_name"
									key={weekDaysName.dayShort}>
									{weekDaysName.dayShort}
								</div>
							))}
						</div>
						<div className="calendar__days">
							{state.calendarDays.map((day) => {
								let currentDate = new Date(new Date().setHours(0, 0, 0, 0));
								const isToday = checkIsToday(day.date);
								const isSelectedDay = checkDateIsEqual(day.date, state.selectedDay.date);
								const isAdditionalDay = day.monthIndex !== state.selectedMonth.monthIndex;
								const isPast = day.date < currentDate;

								return (
									<div
										key={`${day.dayNumber}-${day.monthIndex}`}
										aria-hidden
										onClick={() => {
											if (day.date > new Date() || checkIsToday(day.date)) {
												functions.setSelectedDay(day);
												selectDate(day.date);
											}
										}}
										className={[
											'calendar__day',
											isToday ? 'calendar__today__item' : '',
											isSelectedDay ? 'calendar__selected__item' : '',
											isAdditionalDay ? 'calendar__additional__day' : '',
											isPast ? 'calendar__past__day' : '',
										].join(' ')}>
										{day.dayNumber}
									</div>
								);
							})}
						</div>
					</>
				)}

				{state.mode === 'monthes' && (
					<div className="calendar__pick__items__container">
						{state.monthesNames.map((monthesName) => {
							const isCurrentMonth =
								new Date().getMonth() === monthesName.monthIndex &&
								state.selectedYear === new Date().getFullYear();
							const isSelectedMonth = monthesName.monthIndex === state.selectedMonth.monthIndex;

							return (
								<div
									key={monthesName.month}
									aria-hidden
									onClick={() => {
										functions.setSelectedMonthByIndex(monthesName.monthIndex);
										functions.setMode('days');
									}}
									className={[
										'calendar__pick__item',
										isSelectedMonth ? 'calendar__selected__item' : '',
										isCurrentMonth ? 'calendar__today__item' : '',
									].join(' ')}>
									{monthesName.monthShort}
								</div>
							);
						})}
					</div>
				)}

				{state.mode === 'years' && (
					<div className="calendar__pick__items__container">
						<div className="calendar__unchoosable__year">{state.selectedYearsInterval[0] - 1}</div>
						{state.selectedYearsInterval.map((year) => {
							const isCurrentYear = new Date().getFullYear() === year;
							const isSelectedYear = year === state.selectedYear;

							return (
								<div
									key={year}
									aria-hidden
									onClick={() => {
										functions.setSelectedYear(year);
										functions.setMode('monthes');
									}}
									className={[
										'calendar__pick__item',
										isCurrentYear ? 'calendar__today__item' : '',
										isSelectedYear ? 'calendar__selected__item' : '',
									].join(' ')}>
									{year}
								</div>
							);
						})}
						<div className="calendar__unchoosable__year">
							{state.selectedYearsInterval[state.selectedYearsInterval.length - 1] + 1}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
