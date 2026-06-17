import React from 'react';
import styles from './Contacts.module.css';
import { Map, Placemark, RoutePanel, YMaps } from '@pbe/react-yandex-maps';

function Contacts() {
	return (
		<section id="contacts" className={styles.contacts}>
			<div className={styles.contacts__block}>
				<div className="block__title">
					<div className="title__line"></div>
					Контакты
					<div className="title__line"></div>
				</div>

				<div className={styles.list}>
					<div className={styles.list__item}>
						<div className={styles.item__title}>Телефон</div>
						<a href="tel:+79029992233" className={styles.item__text}>
							+79029794016
						</a>
					</div>

					<span className={styles.item__border}></span>

					<div className={styles.list__item}>
						<div className={styles.item__title}>Почта</div>
						<a href="mailto:hotel.main@yandex.com" className={styles.item__text}>
							hotel.main@yandex.com
						</a>
					</div>

					<span className={styles.item__border}></span>

					<div className={styles.list__item}>
						<div className={styles.item__title}>Адрес</div>
						<a
							href="https://yandex.ru/maps/?text=Красноярск%20Ярыгинская%20набережная%203"
							target="_blank"
							rel="noreferrer"
							className={styles.item__text}
						>
							Красноярск,
							<br />
							улица Ярыгинская набережная, 3
						</a>
					</div>

					<span className={styles.item__border}></span>

					<div className={styles.list__item}>
						<div className={styles.item__title}>Часы работы</div>
						<div className={styles.item__text}>Круглосуточно</div>
					</div>
				</div>

				<YMaps
					enterprise
					query={{
						apikey: 'ec5316ab-5c7b-4485-87d4-c84899a47cd5',
					}}
				>
					<Map
						width={'100%'}
						height={'40rem'}
						defaultState={{
							center: [55.987916, 92.869056],
							zoom: 17,
							controls: ['fullscreenControl'],
						}}
						modules={['control.FullscreenControl']}
					>
						<Placemark
							geometry={[55.987916, 92.869056]}
							options={{
								iconLayout: 'islands#dotIcon',
								iconColor: '#875B52',
								iconImageSize: [40, 40],
							}}
						/>

						<RoutePanel
							instanceRef={(ref) => {
								if (ref) {
									ref.routePanel.state.set({
										type: 'masstransit',
										fromEnabled: true,
										toEnabled: false,
										to: [55.987916, 92.869056],
									});

									ref.routePanel.options.set({
										float: 'left',
										autofocus: false,
										allowSwitch: true,
										reverseGeocoding: true,
										types: {
											masstransit: true,
											pedestrian: true,
											taxi: true,
											auto: true,
										},
									});
								}
							}}
							defaultOptions={{
								float: 'left',
								autofocus: false,
								allowSwitch: true,
								reverseGeocoding: true,
								types: {
									masstransit: true,
									pedestrian: true,
									taxi: true,
								},
							}}
							defaultState={{
								fromEnabled: false,
								toEnabled: false,
								to: [55.987916, 92.869056],
							}}
						/>
					</Map>
				</YMaps>
			</div>
		</section>
	);
}

export default Contacts;