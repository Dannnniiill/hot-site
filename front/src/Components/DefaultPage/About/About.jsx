import React from 'react';
import styles from './About.module.css';

function About() {
	return (
		<section
			id="about"
			className={styles.about}>
			<div className={styles.text__side}>
				<div className="block__title">
					<div className="title__line"></div>О нас
					<div className="title__line"></div>
				</div>
				<div className="block__text">
					Отель «Комфорт» – ваш уютный дом в Красноярске! В нашем отеле предлагается широкий выбор номеров,
					включая стандартные и улучшенные варианты. В каждом номере есть все необходимое для приятного
					отдыха, включая удобную мебель, современные удобства и чистое постельное белье, а также
					мы предлагаем услуги прачечной.
					<br />
					<br />
					Отель идеально подходит как для деловых путешественников, так и для туристов, желающих насладиться
					красотами окружающей природы. У нас есть все, чтобы ваш отдых был удобным и комфортным.
				</div>
			</div>

			<img
				src={require('./../../../Img/about_img.png')}
				alt=""
			/>
		</section>
	);
}

export default About;