import React, { useState, useEffect } from 'react';
import styles from './Feedback.module.css';
import { cyrillicPattern, setClassNameByValid, telPattern } from '../../../constats';
import { Input } from './../../UI/Input/Input';
import CheckBoxArea from './../../UI/CheckBoxArea/CheckBoxArea';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sendFeedback } from '../../../Redux/slices/userSlice';
import { useDisclosure } from '@chakra-ui/react';
import ModalStatus from '../../UI/ModalStatus/ModalStatus';

function Feedback() {
	const dispatch = useDispatch();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { isError, isSuccess } = useSelector((state) => state.userSlice);
	const [formState, setFormState] = useState({
		nameValue: '',
		lastNameValue: '',
		telValue: '',
		checked: false,
	});
	const [validationState, setValidationState] = useState({
		validName: false,
		validLastName: false,
		validTel: false,
		validChecked: false,
	});

	const { nameValue, lastNameValue, telValue, checked } = formState;
	const { validName, validLastName, validTel, validChecked } = validationState;

	const handleSubmit = () => {
		const isNameValid = cyrillicPattern.test(nameValue.trim().replace(/\s/g, ''));
		const isLastNameValid = cyrillicPattern.test(lastNameValue.trim().replace(/\s/g, ''));
		const isTelValid = telPattern.test(telValue);
		const isCheckedValid = checked;

		setValidationState({
			validName: !isNameValid,
			validLastName: !isLastNameValid,
			validTel: !isTelValid,
			validChecked: !isCheckedValid,
		});

		if (isNameValid && isLastNameValid && isTelValid && isCheckedValid) {
			dispatch(sendFeedback({ first_name: nameValue, last_name: lastNameValue, phone_number: telValue }));

			onOpen();
			setFormState({ nameValue: '', lastNameValue: '', telValue: '', checked: false });
		}
	};

	function changeCheckbox() {
		setFormState({ ...formState, checked: !checked });
	}
	const handleChange = (name, value) => {
		setFormState({ ...formState, [name]: value });
	};

	const checkSpace = (e) => {
		if (e.which === 32) {
			e.preventDefault();
			return false;
		}
	};

	return (
		<section className={styles.feedback}>
			<div className={styles.left__side}>
				<div className="block__title">
					<div className="title__line"></div>Остались вопросы?
					<div className="title__line"></div>
				</div>

				<div className={styles.form}>
					<div className={styles.block__title}>
						Оставьте заяку и мы свяжемся с вами и ответим на любые вопросы
					</div>
					<Input
						title="Имя*"
						value={nameValue}
						name="nameValue"
						className={setClassNameByValid(validName)}
						placeholder=""
						type="text"
						onKeyDown={checkSpace}
						onChange={handleChange}
						error={validName}
						errorText="Введите имя на кириллице"
					/>
					<Input
						title="Фамилия*"
						value={lastNameValue}
						name="lastNameValue"
						className={setClassNameByValid(validLastName)}
						placeholder=""
						type="text"
						onKeyDown={checkSpace}
						onChange={handleChange}
						error={validLastName}
						errorText="Введите фамилию на кириллице"
					/>
					<Input
						title="Телефон*"
						value={telValue}
						name="telValue"
						className={setClassNameByValid(validTel)}
						placeholder=""
						type="text"
						onKeyDown={checkSpace}
						onChange={handleChange}
						error={validTel}
						errorText="Неверный формат номера"
					/>
					<CheckBoxArea
						className={styles.checkbox}
						checked={checked}
						onChange={changeCheckbox}
						error={validChecked}
						errorText="Пожалуйста, подтвердите Ваше согласие">
						<span>
							Я согласен с{' '}
							<NavLink
								to="/privacy"
								className={styles.underline__text}>
								политикой конфидециальности
							</NavLink>
						</span>
					</CheckBoxArea>
					<button
						className={styles.primary__btn}
						onClick={handleSubmit}>
						Оставить заявку
					</button>
				</div>
			</div>
			<img
				src={require('./../../../Img/questions.png')}
				alt=""
			/>
			<ModalStatus
				isOpen={isOpen}
				onClose={onClose}
				goMain={false}
				isError={isError}
				isSuccess={isSuccess}
			/>
		</section>
	);
}

export default Feedback;
