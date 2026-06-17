import React from 'react';
import styles from './Header.module.css';
import { NavLink } from 'react-router-dom';
import { ABOUT, GALLERY, QUESTIONS, ROOMS, CONTACTS, scrollById } from '../../constats';

function Header({ main, isOpen, setIsOpen }) {
	return (
		<header className={styles.header}>
			<NavLink to="/" className={styles.logo__link}></NavLink>

			<div className={main ? styles.header__links : styles.header__links__single}>
				{main ? (
					<>
						<NavLink
							to="/"
							onClick={(e) => {
								e.preventDefault();
								scrollById(ABOUT);
							}}
							className={styles.header__link}
						>
							О нас
						</NavLink>

						<NavLink to="/promotions" className={styles.header__link}>
							Акции
						</NavLink>

						<NavLink
							to="/"
							onClick={(e) => {
								e.preventDefault();
								scrollById(ROOMS);
							}}
							className={styles.header__link}
						>
							Номера
						</NavLink>

						<NavLink
							to="/"
							onClick={(e) => {
								e.preventDefault();
								scrollById(GALLERY);
							}}
							className={styles.header__link}
						>
							Галерея
						</NavLink>

						<NavLink
							to="/"
							onClick={(e) => {
								e.preventDefault();
								scrollById(QUESTIONS);
							}}
							className={styles.header__link}
						>
							Частые вопросы
						</NavLink>

						<NavLink
							to="/"
							onClick={(e) => {
								e.preventDefault();
								scrollById(CONTACTS);
							}}
							className={styles.header__link}
						>
							Контакты
						</NavLink>

						<NavLink to="/profile" className={styles.header__link}>
							Личный кабинет
						</NavLink>
					</>
				) : (
					<NavLink to="/" className={styles.header__link__single}>
						На главную
					</NavLink>
				)}
			</div>

			<button type="button" className={styles.burger__menu} onClick={() => setIsOpen(true)}>
				<svg width="34" height="34" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M5 9H29" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
					<path d="M5 17H29" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
					<path d="M5 25H29" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
				</svg>
			</button>

			<div className={isOpen ? styles.burger__show : styles.burger__hide}>
				<button type="button" className={styles.burger__btn} onClick={() => setIsOpen(false)}>
					<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M7 7L23 23" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
						<path d="M23 7L7 23" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
					</svg>
				</button>

				<div className={styles.burger__links}>
					{main ? (
						<>
							<NavLink
								to="/"
								className={styles.burger__link}
								onClick={(e) => {
									e.preventDefault();
									scrollById(ABOUT);
									setIsOpen(false);
								}}
							>
								О нас
							</NavLink>

							<NavLink to="/promotions" className={styles.burger__link} onClick={() => setIsOpen(false)}>
								Акции
							</NavLink>

							<NavLink
								to="/"
								className={styles.burger__link}
								onClick={(e) => {
									e.preventDefault();
									scrollById(ROOMS);
									setIsOpen(false);
								}}
							>
								Номера
							</NavLink>

							<NavLink
								to="/"
								className={styles.burger__link}
								onClick={(e) => {
									e.preventDefault();
									scrollById(GALLERY);
									setIsOpen(false);
								}}
							>
								Галерея
							</NavLink>

							<NavLink
								to="/"
								className={styles.burger__link}
								onClick={(e) => {
									e.preventDefault();
									scrollById(QUESTIONS);
									setIsOpen(false);
								}}
							>
								Частые вопросы
							</NavLink>

							<NavLink
								to="/"
								className={styles.burger__link}
								onClick={(e) => {
									e.preventDefault();
									scrollById(CONTACTS);
									setIsOpen(false);
								}}
							>
								Контакты
							</NavLink>

							<NavLink to="/profile" className={styles.burger__link} onClick={() => setIsOpen(false)}>
								Личный кабинет
							</NavLink>
						</>
					) : (
						<NavLink to="/" className={styles.burger__link} onClick={() => setIsOpen(false)}>
							На главную
						</NavLink>
					)}
				</div>
			</div>
		</header>
	);
}

export default Header;