import React from 'react';
import styles from './Promotions.module.css';
import { PROMOTIONS } from '../../../constats';
import { promotionsData } from '../../../data/promotionsData';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: '';

function Promotions() {
	const [openedId, setOpenedId] = React.useState(null);

	const featuredPromo = promotionsData[0];
	const otherPromos = promotionsData.slice(1);

	const getCurrentUserPayload = () => {
		try {
			const raw = localStorage.getItem('hotel_current_user');
			if (!raw) return { user_id: null, email: '' };

			const parsed = JSON.parse(raw);
			return {
				user_id: parsed?.id || null,
				email: parsed?.email || '',
			};
		} catch (error) {
			return { user_id: null, email: '' };
		}
	};

	const trackPromotionEvent = async (promo, eventType) => {
		try {
			const currentUser = getCurrentUserPayload();

			await fetch(`${API_BASE}/promotions/track/`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user_id: currentUser.user_id,
					email: currentUser.email,
					promo_code: promo.code,
					promo_title: promo.title,
					discount_label: promo.discountLabel,
					event_type: eventType,
					page: 'promotions',
				}),
			});
		} catch (error) {
			console.error('Ошибка сохранения события акции:', error);
		}
	};

	const copyPromo = async (promo) => {
		try {
			await navigator.clipboard.writeText(promo.code);
			await trackPromotionEvent(promo, 'copy');
			alert(`Промокод ${promo.code} скопирован`);
		} catch (error) {
			await trackPromotionEvent(promo, 'copy');
			alert(`Промокод: ${promo.code}`);
		}
	};

	const toggleDetails = async (promo, isOpen) => {
		if (!isOpen) {
			await trackPromotionEvent(promo, 'details');
			setOpenedId(promo.id);
			return;
		}

		setOpenedId(null);
	};

	return (
		<section id={PROMOTIONS} className={styles.promotions}>
			<div className={styles.header}>
				<div className="block__title">
					<div className="title__line"></div>
					Акции и скидки
					<div className="title__line"></div>
				</div>
				<p className={styles.subtitle}>
					Актуальные предложения с понятными условиями, промокодами и быстрой подачей в
					бронирование.
				</p>
			</div>

			<div className={styles.layout}>
				<div className={styles.featured}>
					<div className={styles.featuredGlow}></div>

					<div className={styles.featuredTop}>
						<div className={styles.featuredTag}>{featuredPromo.badge}</div>
						<div className={styles.featuredDiscount}>{featuredPromo.discountLabel}</div>
					</div>

					<div className={styles.featuredMain}>
						<div className={styles.featuredHead}>
							<h3 className={styles.featuredTitle}>{featuredPromo.title}</h3>
							<p className={styles.featuredText}>{featuredPromo.fullDescription}</p>
						</div>

						<div className={styles.featuredMeta}>
							<div className={styles.metaBox}>
								<span className={styles.metaLabel}>Промокод</span>
								<strong className={styles.metaValue}>{featuredPromo.code}</strong>
							</div>

							<div className={styles.metaBox}>
								<span className={styles.metaLabel}>Период действия</span>
								<strong className={styles.metaValue}>
									{featuredPromo.dateStart} — {featuredPromo.dateEnd}
								</strong>
							</div>
						</div>
					</div>

					<div className={styles.featuredBottom}>
						<div className={styles.featuredBlock}>
							<div className={styles.sectionLabel}>Подходит для номеров</div>
							<div className={styles.roomList}>
								{featuredPromo.roomNames.map((room) => (
									<span key={room} className={styles.roomTag}>
										{room}
									</span>
								))}
							</div>
						</div>

						<div className={styles.featuredBlock}>
							<div className={styles.sectionLabel}>Коротко об условиях</div>
							<ul className={styles.featuredList}>
								{featuredPromo.conditions.slice(0, 3).map((item) => (
									<li key={item}>{item}</li>
								))}
							</ul>
						</div>
					</div>

					<div className={styles.featuredActions}>
						<button className={styles.primaryBtn} onClick={() => copyPromo(featuredPromo)}>
							Скопировать промокод
						</button>
					</div>
				</div>

				<div className={styles.sideList}>
					{otherPromos.map((promo, index) => {
						const isOpen = openedId === promo.id;
						const accentClass =
							index % 3 === 0
								? styles.accentAmber
								: index % 3 === 1
								? styles.accentRose
								: styles.accentOlive;

						return (
							<article key={promo.id} className={`${styles.promoItem} ${accentClass}`}>
								<div className={styles.itemMain}>
									<div className={styles.itemHeader}>
										<div className={styles.itemHeaderLeft}>
											<div className={styles.itemBadge}>{promo.badge}</div>
											<div className={styles.itemCode}>{promo.code}</div>
										</div>

										<div className={styles.itemDiscountWrap}>
											<div className={styles.itemDiscount}>{promo.discountLabel}</div>
											<div className={styles.itemDate}>до {promo.dateEnd}</div>
										</div>
									</div>

									<div className={styles.itemBody}>
										<div className={styles.itemContent}>
											<h4 className={styles.itemTitle}>{promo.title}</h4>
											<p className={styles.itemText}>{promo.shortDescription}</p>
										</div>
									</div>

									<div className={styles.itemActions}>
										<button
											className={styles.smallPrimaryBtn}
											onClick={() => copyPromo(promo)}
										>
											Скопировать промокод
										</button>
										<button
											className={styles.detailsBtn}
											onClick={() => toggleDetails(promo, isOpen)}
										>
											{isOpen ? 'Скрыть' : 'Подробнее'}
										</button>
									</div>
								</div>

								{isOpen ? (
									<div className={styles.details}>
										<p className={styles.detailsText}>{promo.fullDescription}</p>

										<div className={styles.detailsGrid}>
											<div className={styles.detailsBlock}>
												<div className={styles.detailsLabel}>Номера</div>
												<div className={styles.roomListCompact}>
													{promo.roomNames.map((room) => (
														<span key={room} className={styles.roomTagCompact}>
															{room}
														</span>
													))}
												</div>
											</div>

											<div className={styles.detailsBlock}>
												<div className={styles.detailsLabel}>Условия</div>
												<ul className={styles.detailsList}>
													{promo.conditions.map((item) => (
														<li key={item}>{item}</li>
													))}
												</ul>
											</div>

											<div className={styles.detailsBlock}>
												<div className={styles.detailsLabel}>Ограничения</div>
												<ul className={styles.detailsList}>
													{promo.limits.map((item) => (
														<li key={item}>{item}</li>
													))}
												</ul>
											</div>
										</div>
									</div>
								) : null}
							</article>
						);
					})}
				</div>
			</div>
		</section>
	);
}

export default Promotions;