import React from 'react';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { NavLink } from 'react-router-dom';
import styles from './ErrorPage.module.css';

function ErrorPage() {
	return (
		<div>
			<Header main={false} />
			<div className="block__page">
				<div className={styles.page__title}>Страница не найдена</div>
				<div className={styles.page__text}>
					Извините, запрашиваемая страница не найдена. Пожалуйста, проверьте правильность введённого адреса
					или вернитесь
					<NavLink
						to="/"
						className={styles.underline__text}>
						{' '}
						главную страницу отеля «Комфорт».
					</NavLink>
				</div>
			</div>
			<Footer main={false} />
		</div>
	);
}

export default ErrorPage;
