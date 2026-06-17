import React from 'react';
import styles from './FAQ.module.css';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box } from '@chakra-ui/react';

function FAQ() {
	return (
		<section id="questions" className={styles.block}>
			<div className="block__title">
				<div className="title__line"></div>Частые вопросы
				<div className="title__line"></div>
			</div>

			<Accordion allowToggle>
				<AccordionItem borderColor={'#956446'} borderTopWidth={'0.0625rem'}>
					<h2>
						<AccordionButton className={styles.accordion__item}>
							<Box className={styles.accordion__item}>Какие поблизости есть достопримечательности?</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>

					<AccordionPanel pb={'6'} className={styles.accordion__text} display="flex" gap="2rem">
						<Box className={styles.text__box}>
							<div className={styles.text__block}>
								<div className={styles.block__title}>Лестница на Торгашинский хребет:</div>
								<div className={styles.block__text}>
									Одна из самых известных прогулочных точек Красноярска. Здесь оборудован длинный
									маршрут со ступенями, видовыми площадками и красивыми панорамами города и природы.
								</div>
							</div>

							<div className={styles.text__block}>
								<div className={styles.block__title}>Национальный парк «Красноярские Столбы»:</div>
								<div className={styles.block__text}>
									Знаменитая природная достопримечательность Красноярска с живописными скалами,
									лесными маршрутами и местами для прогулок на свежем воздухе.
								</div>
							</div>

							<div className={styles.text__block}>
								<div className={styles.block__title}>Фанпарк «Бобровый лог»:</div>
								<div className={styles.block__text}>
									Популярное место для активного отдыха. Зимой здесь работают горнолыжные трассы,
									а в тёплое время года можно гулять, подниматься на канатной дороге и любоваться видами.
								</div>
							</div>

							<div className={styles.text__block}>
								<div className={styles.block__title}>Смотровые площадки Свердловского района:</div>
								<div className={styles.block__text}>
									Рядом с районом Базаихи и Торгашинского хребта есть красивые природные точки,
									откуда открываются виды на Енисей, сопки и городские кварталы.
								</div>
							</div>
						</Box>

						<Box className={styles.text__box}>
							<div className={styles.text__block}>
								<div className={styles.block__title}>Свято-Успенский мужской монастырь:</div>
								<div className={styles.block__text}>
									Красивый исторический храмовый комплекс на берегу Енисея. Подходит для спокойной
									прогулки, знакомства с архитектурой и атмосферой старого Красноярска.
								</div>
							</div>

							<div className={styles.text__block}>
								<div className={styles.block__title}>Набережная Енисея:</div>
								<div className={styles.block__text}>
									Одно из лучших мест для прогулок в Красноярске. Здесь можно пройтись вдоль реки,
									посмотреть на мосты, городские виды и сделать красивые фотографии.
								</div>
							</div>

							<div className={styles.text__block}>
								<div className={styles.block__title}>Коммунальный мост:</div>
								<div className={styles.block__text}>
									Один из главных символов Красноярска. Его часто узнают по изображению на старой
									десятирублёвой купюре, а рядом находятся популярные прогулочные зоны.
								</div>
							</div>

							<div className={styles.text__block}>
								<div className={styles.block__title}>Часовня Параскевы Пятницы:</div>
								<div className={styles.block__text}>
									Известная достопримечательность на Караульной горе и одна из визитных карточек
									города. С площадки рядом открывается панорамный вид на Красноярск.
								</div>
							</div>
						</Box>
					</AccordionPanel>
				</AccordionItem>

				<AccordionItem borderColor={'#956446'} borderTopWidth={'0.0625rem'}>
					<h2>
						<AccordionButton className={styles.accordion__item}>
							<Box className={styles.accordion__item}>В какое время заезд и выезд в отель?</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>
					<AccordionPanel pb={'6'} className={styles.accordion__text}>
						Обычно заселение в отель происходит после 14:00. Выезд — до 12:00 по местному времени.
					</AccordionPanel>
				</AccordionItem>

				<AccordionItem borderColor={'#956446'} borderTopWidth={'0.0625rem'}>
					<h2>
						<AccordionButton className={styles.accordion__item}>
							<Box className={styles.accordion__item}>Есть ли поблизости магазины?</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>
					<AccordionPanel pb={'6'} className={styles.accordion__text}>
						Рядом с отелем есть продуктовые магазины и торговые точки, где можно купить всё необходимое.
					</AccordionPanel>
				</AccordionItem>

				<AccordionItem borderColor={'#956446'} borderTopWidth={'0.0625rem'}>
					<h2>
						<AccordionButton className={styles.accordion__item}>
							<Box className={styles.accordion__item}>
								Разрешено ли проживание с домашними животными в отеле?
							</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>
					<AccordionPanel pb={'6'} className={styles.accordion__text}>
						Проживание с домашними животными возможно по предварительному согласованию с администрацией.
					</AccordionPanel>
				</AccordionItem>

				<AccordionItem borderColor={'#956446'} borderTopWidth={'0.0625rem'}>
					<h2>
						<AccordionButton className={styles.accordion__item}>
							<Box className={styles.accordion__item}>Есть ли услуги доставки еды и напитков в номер?</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>
					<AccordionPanel pb={'6'} className={styles.accordion__text}>
						Да, гости могут заказать еду и напитки в номер. Подробности можно уточнить у администратора.
					</AccordionPanel>
				</AccordionItem>

				<AccordionItem
					borderColor={'#956446'}
					borderTopWidth={'0.0625rem'}
					borderBottomWidth={'0.0625rem'}
					_last={false}
				>
					<h2>
						<AccordionButton className={styles.accordion__item}>
							<Box className={styles.accordion__item}>На каких языках говорит персонал отеля?</Box>
							<AccordionIcon />
						</AccordionButton>
					</h2>
					<AccordionPanel pb={'6'} className={styles.accordion__text}>
						Наш персонал говорит на русском языке.
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
		</section>
	);
}

export default FAQ;