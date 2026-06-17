import { useEffect, useRef } from 'react';

export const QUESTIONS = 'questions';
export const GALLERY = 'gallery';
export const ROOMS = 'rooms';
export const ABOUT = 'about';
export const SERVICES = 'services';
export const CONTACTS = 'contacts';
export const PROMOTIONS = 'promotions';
export const BASE_URL = 'https://hotel-backend-6tq0.onrender.com';

export const cyrillicPattern = /^[\u0400-\u04FF]+$/;
export const telPattern = /^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){10,14}(\s*)?$/;

export const setClassNameByValid = (valid) => {
	return valid ? 'input input__error' : 'input';
};

export const scrollById = (id) => {
	const element = document.getElementById(`${id}`);
	const y = element.offsetTop;
	window.scrollTo({
		top: y,
		left: 0,
		behavior: 'smooth',
	});
};

export const useComponentDidMount = () => {
	const ref = useRef();
	useEffect(() => {
		ref.current = true;
	}, []);
	return ref.current;
};

export const normalize_count_form = (number, words_arr) => {
	number = Math.abs(number);
	if (Number.isInteger(number)) {
		let options = [2, 0, 1, 1, 1, 2];
		return words_arr[number % 100 > 4 && number % 100 < 20 ? 2 : options[number % 10 < 5 ? number % 10 : 5]];
	}
	return words_arr[1];
};

const normalizeDateOnly = (date) => {
	const safeDate = new Date(date);
	safeDate.setHours(0, 0, 0, 0);
	return safeDate;
};

export const getNightsCount = (toDate, fromDate) => {
	const start = normalizeDateOnly(toDate);
	const end = normalizeDateOnly(fromDate);
	const msDay = 60 * 60 * 24 * 1000;
	const diff = Math.floor((end.getTime() - start.getTime()) / msDay);

	return diff > 0 ? diff : 1;
};

export const getDateToString = (date) => {
	const safeDate = new Date(date);
	const year = safeDate.getFullYear();
	const month = String(safeDate.getMonth() + 1).padStart(2, '0');
	const day = String(safeDate.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
};