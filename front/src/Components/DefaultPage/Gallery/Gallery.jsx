import React, { useState } from 'react';
import styles from './Gallery.module.css';
import { useDisclosure } from '@chakra-ui/react';
import ModalImages from '../../UI/ModalImages/ModalImages';

const images = [
	require('./../../../Img/gallery/modal/1.png'),
	require('./../../../Img/gallery/modal/2.png'),
	require('./../../../Img/gallery/modal/3.png'),
	require('./../../../Img/gallery/modal/4.png'),
	require('./../../../Img/gallery/modal/5.png'),
	require('./../../../Img/gallery/modal/6.png'),
];
function Gallery() {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [currentImage, setCurrentImage] = useState(0);
	return (
		<section
			id="gallery"
			className={styles.gallery}>
			<div className="block__title">
				<div className="title__line"></div>Галерея
				<div className="title__line"></div>
			</div>
			<div className={styles.gallery__images}>
				{images.map((el, index) => {
					return (
						<img
							onClick={() => {
								setCurrentImage(index);
								onOpen();
							}}
							className={styles.gallery__img}
							key={index}
							src={el}
							alt=""
						/>
					);
				})}
			</div>
			<div className={styles.gallery__slider}>
				<div
					className={styles.slider__button}
					onClick={() => {
						if (currentImage !== 0) {
							setCurrentImage(currentImage - 1);
						} else {
							setCurrentImage(images.length - 1);
						}
					}}>
					{' '}
					<svg
						width="25"
						height="25"
						viewBox="0 0 25 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M11.7606 12.4995L15.4481 8.81203C15.6421 8.61686 15.751 8.35285 15.751 8.07765C15.751 7.80246 15.6421 7.53845 15.4481 7.34328C15.3513 7.24565 15.2361 7.16815 15.1091 7.11527C14.9822 7.06238 14.846 7.03516 14.7085 7.03516C14.571 7.03516 14.4348 7.06238 14.3079 7.11527C14.181 7.16815 14.0658 7.24565 13.9689 7.34328L9.55226 11.7599C9.45463 11.8568 9.37714 11.972 9.32425 12.0989C9.27137 12.2259 9.24414 12.362 9.24414 12.4995C9.24414 12.637 9.27137 12.7732 9.32425 12.9001C9.37714 13.0271 9.45463 13.1423 9.55226 13.2391L13.9689 17.7079C14.0663 17.8044 14.1817 17.8808 14.3086 17.9326C14.4355 17.9845 14.5714 18.0107 14.7085 18.0099C14.8456 18.0107 14.9815 17.9845 15.1084 17.9326C15.2353 17.8808 15.3508 17.8044 15.4481 17.7079C15.6421 17.5127 15.751 17.2487 15.751 16.9735C15.751 16.6983 15.6421 16.4343 15.4481 16.2391L11.7606 12.4995Z"
							fill="#875B52"
						/>
					</svg>
				</div>

				<img
					src={images[currentImage]}
					onClick={() => {
						onOpen();
					}}
					alt=""
				/>
				<div
					className={styles.slider__button}
					onClick={() => {
						if (currentImage + 1 <= images.length - 1) {
							setCurrentImage(currentImage + 1);
						} else {
							setCurrentImage(0);
						}
					}}>
					{' '}
					<svg
						width="25"
						height="25"
						viewBox="0 0 25 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M15.4478 11.7599L11.0311 7.34328C10.9343 7.24565 10.8191 7.16815 10.6921 7.11527C10.5652 7.06238 10.429 7.03516 10.2915 7.03516C10.154 7.03516 10.0179 7.06238 9.89091 7.11527C9.76398 7.16815 9.64877 7.24565 9.55193 7.34328C9.35792 7.53845 9.24902 7.80246 9.24902 8.07765C9.24902 8.35285 9.35792 8.61686 9.55193 8.81203L13.2394 12.4995L9.55193 16.187C9.35792 16.3822 9.24902 16.6462 9.24902 16.9214C9.24902 17.1966 9.35792 17.4606 9.55193 17.6558C9.64927 17.7523 9.7647 17.8287 9.89161 17.8805C10.0185 17.9324 10.1544 17.9587 10.2915 17.9579C10.4286 17.9587 10.5645 17.9324 10.6914 17.8805C10.8183 17.8287 10.9338 17.7523 11.0311 17.6558L15.4478 13.2391C15.5454 13.1423 15.6229 13.0271 15.6758 12.9001C15.7287 12.7732 15.7559 12.637 15.7559 12.4995C15.7559 12.362 15.7287 12.2259 15.6758 12.0989C15.6229 11.972 15.5454 11.8568 15.4478 11.7599Z"
							fill="#875B52"
						/>
					</svg>
				</div>
			</div>
			<ModalImages
				isOpen={isOpen}
				onClose={onClose}
				currentImage={currentImage}
				setCurrentImage={setCurrentImage}
				images={images}
			/>
		</section>
	);
}

export default Gallery;
