import React from 'react';
import styles from './Preferences.module.css';

const preferencesItems = [
	{
		number: '01',
		title: 'Спокойная обстановка',
		text: 'Тихая атмосфера, приятный интерьер и пространство, в котором можно отдохнуть после дороги, работы или насыщенного дня.',
		accent: 'soft',
	},
	{
		number: '02',
		title: 'Удобное расположение',
		text: 'До отеля удобно добраться, а рядом есть всё необходимое для повседневного комфорта: магазины, удобный подъезд и нужная инфраструктура.',
		accent: 'warm',
	},
	{
		number: '03',
		title: 'Комфорт на каждый день',
		text: 'Номера подготовлены для спокойного и удобного проживания: чисто, тихо и есть всё, что нужно как на короткий срок, так и на более длительное размещение.',
		accent: 'deep',
	},
];

function Preferences() {
	return (
		<section className={styles.preferences}>
			<div className={styles.header}>
				<div className="block__title">
					<div className="title__line"></div>
					Почему гости выбирают «Комфорт»
					<div className="title__line"></div>
				</div>

				<p className={styles.subtitle}>
					Мы сосредоточились на том, что действительно важно для спокойного отдыха:
					удобстве, тишине и приятной атмосфере без лишней перегруженности.
				</p>
			</div>

			<div className={styles.preferences__items}>
				{preferencesItems.map((item) => (
					<article
						key={item.number}
						className={`${styles.card} ${styles[`card_${item.accent}`]}`}
					>
						<div className={styles.cardTop}>
							<div className={styles.card__number}>{item.number}</div>
							<div className={styles.cardLine}></div>
						</div>

						<div className={styles.card__title}>{item.title}</div>
						<div className={styles.card__text}>{item.text}</div>
					</article>
				))}
			</div>
		</section>
	);
}

export default Preferences;