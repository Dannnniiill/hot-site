import React from 'react';
import styles from './ModalImages.module.css';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from '@chakra-ui/react';

function ModalImages({ isOpen, onClose, currentImage, setCurrentImage, images }) {
	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}>
			<ModalOverlay />
			<ModalContent
				width={'100vw'}
				height={'100vh'}
				margin={'none'}
				maxWidth={'none'}
				marginBottom={'none'}
				marginTop={'none'}>
				<ModalCloseButton className={styles.close__button} />
				<ModalBody
					paddingInlineEnd="none"
					paddingInlineStart="none"
					className={styles.modal__body}>
					<svg
						onClick={() => {
							if (currentImage !== 0) {
								setCurrentImage(currentImage - 1);
							} else {
								setCurrentImage(images.length - 1);
							}
						}}
						className={styles.modal__arrow}
						width="25"
						height="25"
						viewBox="0 0 25 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M11.7606 12.5L15.4481 8.81252C15.6421 8.61735 15.751 8.35334 15.751 8.07814C15.751 7.80295 15.6421 7.53894 15.4481 7.34377C15.3513 7.24613 15.2361 7.16864 15.1091 7.11576C14.9822 7.06287 14.846 7.03564 14.7085 7.03564C14.571 7.03564 14.4348 7.06287 14.3079 7.11576C14.181 7.16864 14.0658 7.24613 13.9689 7.34377L9.55226 11.7604C9.45463 11.8573 9.37714 11.9725 9.32425 12.0994C9.27137 12.2264 9.24414 12.3625 9.24414 12.5C9.24414 12.6375 9.27137 12.7737 9.32425 12.9006C9.37714 13.0276 9.45463 13.1428 9.55226 13.2396L13.9689 17.7084C14.0663 17.8049 14.1817 17.8813 14.3086 17.9331C14.4355 17.985 14.5714 18.0112 14.7085 18.0104C14.8456 18.0112 14.9815 17.985 15.1084 17.9331C15.2353 17.8813 15.3508 17.8049 15.4481 17.7084C15.6421 17.5132 15.751 17.2492 15.751 16.974C15.751 16.6988 15.6421 16.4348 15.4481 16.2396L11.7606 12.5Z"
							fill="#875B52"
						/>
					</svg>
					<div className={styles.modal__img}>
						{' '}
						<img
							src={images[currentImage]}
							alt=""
						/>
					</div>

					<svg
						onClick={() => {
							if (currentImage + 1 <= images.length - 1) {
								setCurrentImage(currentImage + 1);
							} else {
								setCurrentImage(0);
							}
						}}
						className={styles.modal__arrow}
						width="25"
						height="25"
						viewBox="0 0 25 25"
						fill="none"
						xmlns="http://www.w3.org/2000/svg">
						<path
							d="M15.448 11.7604L11.0313 7.34377C10.9345 7.24613 10.8193 7.16864 10.6924 7.11576C10.5654 7.06287 10.4293 7.03564 10.2918 7.03564C10.1542 7.03564 10.0181 7.06287 9.89116 7.11576C9.76422 7.16864 9.64901 7.24613 9.55218 7.34377C9.35817 7.53894 9.24927 7.80295 9.24927 8.07814C9.24927 8.35334 9.35817 8.61735 9.55218 8.81252L13.2397 12.5L9.55218 16.1875C9.35817 16.3827 9.24927 16.6467 9.24927 16.9219C9.24927 17.1971 9.35817 17.4611 9.55218 17.6563C9.64951 17.7528 9.76494 17.8292 9.89186 17.881C10.0188 17.9329 10.1547 17.9591 10.2918 17.9584C10.4289 17.9591 10.5647 17.9329 10.6917 17.881C10.8186 17.8292 10.934 17.7528 11.0313 17.6563L15.448 13.2396C15.5456 13.1428 15.6231 13.0276 15.676 12.9006C15.7289 12.7737 15.7561 12.6375 15.7561 12.5C15.7561 12.3625 15.7289 12.2264 15.676 12.0994C15.6231 11.9725 15.5456 11.8573 15.448 11.7604Z"
							fill="#875B52"
						/>
					</svg>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}

export default ModalImages;
