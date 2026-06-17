import React from 'react';
import styles from './InputDate.module.css';
import { formatDate } from '../../../../utils/helpers/date';
import { ReactComponent as Calendar } from './../../../../Svg/calendar.svg';
import { DatePicker } from '../../DatePicker/DatePicker';

function InputDate({ value, setValue, from, show, setShow }) {
	return (
		<div className={styles.form}>
			<div
				className={styles.input__date}
				onClick={() => {
					setShow();
				}}>
				<div className={styles.input__text_side}>
					<span className={styles.input__title}>{from ? 'Выезд' : 'Заезд'}</span>
					<span className={styles.input__text}>{formatDate(value, 'DDD DD MMM YYYY')}</span>
				</div>
				<Calendar />
			</div>
			{show ? (
				<DatePicker
					className={styles.date__picker}
					selectedDate={value}
					selectDate={(date) => {
						setValue(date);
					}}
				/>
			) : null}
		</div>
	);
}

export default InputDate;
