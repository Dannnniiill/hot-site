import React from 'react';
import styles from './ModalStatus.module.css';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { ReactComponent as Error } from './../../../Svg/errorSmile.svg';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BeatLoader } from 'react-spinners';
import { clearStatus } from '../../../Redux/slices/userSlice';

function ModalStatus({ isOpen, onClose, goMain, isSuccess, isError }) {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { isLoading } = useSelector((state) => state.userSlice);

	return (
		<Modal
			isOpen={isOpen}
			onClose={() => {
				if (goMain) {
					navigate('/');
				}
				dispatch(clearStatus());
				onClose();
			}}>
			<ModalOverlay />
			<ModalContent
				width={'36.125rem'}
				height={'23.125rem'}
				margin={'none'}
				maxWidth={'none'}
				marginBottom={'none'}
				marginTop={'15rem'}
				className={styles.modal__content}>
				<ModalCloseButton className={styles.close__button} />
				<ModalBody
					paddingInlineEnd="none"
					paddingInlineStart="none"
					className={styles.modal__body}>
					{isLoading && (
						<BeatLoader
							color="#875B52"
							size={40}
							margin={6}
						/>
					)}
					{isSuccess && (
						<>
							{' '}
							<span className="success__text">Cпасибо!</span>
							<svg
								width="100"
								height="100"
								viewBox="0 0 100 100"
								fill="none"
								xmlns="http://www.w3.org/2000/svg">
								<path
									d="M61.333 36.6252L43.458 54.5418L36.583 47.6668C36.2095 47.2307 35.7498 46.8764 35.2329 46.6263C34.716 46.3762 34.1529 46.2357 33.5791 46.2135C33.0053 46.1913 32.433 46.288 31.8983 46.4975C31.3637 46.707 30.878 47.0247 30.472 47.4308C30.0659 47.8368 29.7482 48.3225 29.5387 48.8572C29.3292 49.3918 29.2325 49.9641 29.2547 50.5379C29.2769 51.1117 29.4174 51.6748 29.6675 52.1917C29.9176 52.7086 30.2719 53.1683 30.708 53.5418L40.4997 63.3752C40.889 63.7613 41.3508 64.0669 41.8584 64.2742C42.3661 64.4816 42.9097 64.5867 43.458 64.5835C44.5511 64.5789 45.5986 64.1449 46.3747 63.3752L67.208 42.5418C67.5986 42.1545 67.9085 41.6936 68.1201 41.1859C68.3316 40.6782 68.4405 40.1335 68.4405 39.5835C68.4405 39.0334 68.3316 38.4888 68.1201 37.9811C67.9085 37.4733 67.5986 37.0125 67.208 36.6252C66.4274 35.8491 65.3713 35.4135 64.2705 35.4135C63.1698 35.4135 62.1137 35.8491 61.333 36.6252ZM49.9997 8.3335C41.7588 8.3335 33.703 10.7772 26.8509 15.3556C19.9989 19.934 14.6584 26.4414 11.5047 34.055C8.35106 41.6686 7.52592 50.0464 9.13364 58.1289C10.7414 66.2115 14.7097 73.6358 20.5369 79.4629C26.3641 85.2901 33.7884 89.2585 41.8709 90.8662C49.9535 92.4739 58.3313 91.6488 65.9448 88.4951C73.5584 85.3415 80.0659 80.001 84.6443 73.1489C89.2227 66.2969 91.6664 58.2411 91.6664 50.0002C91.6664 44.5284 90.5886 39.1103 88.4947 34.055C86.4007 28.9998 83.3316 24.4065 79.4625 20.5374C75.5934 16.6683 71.0001 13.5991 65.9448 11.5052C60.8896 9.41124 55.4714 8.3335 49.9997 8.3335ZM49.9997 83.3335C43.407 83.3335 36.9623 81.3785 31.4807 77.7158C25.999 74.0531 21.7266 68.8471 19.2037 62.7563C16.6808 56.6654 16.0207 49.9632 17.3069 43.4972C18.593 37.0311 21.7677 31.0917 26.4295 26.4299C31.0912 21.7682 37.0307 18.5935 43.4967 17.3073C49.9627 16.0211 56.6649 16.6813 62.7558 19.2042C68.8467 21.7271 74.0526 25.9995 77.7153 31.4812C81.3781 36.9628 83.333 43.4075 83.333 50.0002C83.333 58.8407 79.8211 67.3192 73.5699 73.5704C67.3187 79.8216 58.8402 83.3335 49.9997 83.3335Z"
									fill="#875B52"
								/>
							</svg>
							<span className="success__text">Наш специалист скоро свяжется с вами</span>
						</>
					)}
					{isError && (
						<>
							<span className="error__text">Ошибка</span>
							<Error className="error__svg" />
							<span className="error__text">Попробуйте еще раз!</span>
						</>
					)}
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}

export default ModalStatus;
