import React from 'react';
import styles from './Form.module.css';

import { setClassNameByValid } from '../../../constats';
import CheckBoxArea from '../CheckBoxArea/CheckBoxArea';
import { NavLink } from 'react-router-dom';
import { Input } from '../Input/Input';

function Form({
	formState,
	setFormState,
	validationState,
	setValidationState,
	send,
	children,
}) {
	const { nameValue, lastNameValue, telValue, emailValue, commentsValue, checked } = formState;
	const { validName, validLastName, validTel, validEmail, validChecked } = validationState;

	function changeCheckbox() {
		setFormState({ ...formState, checked: !checked });
	}

	const handleChange = (name, value) => {
		setFormState({ ...formState, [name]: value });
	};

	return (
		<div className={styles.form}>
			<Input
				title="Имя*"
				value={nameValue}
				name="nameValue"
				className={setClassNameByValid(validName)}
				placeholder=""
				type="text"
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
				onChange={handleChange}
				error={validTel}
				errorText="Неверный формат номера"
			/>

			<Input
				title="Email*"
				value={emailValue}
				name="emailValue"
				className={setClassNameByValid(validEmail)}
				placeholder=""
				type="email"
				onChange={handleChange}
				error={validEmail}
				errorText="Введите корректный email"
			/>

			<Input
				title="Комментарий"
				value={commentsValue}
				name="commentsValue"
				className={setClassNameByValid(false)}
				placeholder=""
				onChange={handleChange}
				isTextArea={true}
			/>

			{children ? <div className={styles.form__extra}>{children}</div> : null}

			<CheckBoxArea
				className={styles.checkbox}
				checked={checked}
				onChange={changeCheckbox}
				error={validChecked}
				errorText="Пожалуйста, подтвердите Ваше согласие"
			>
				<span>
					Я согласен с{' '}
					<NavLink to="/privacy" className={styles.underline__text}>
						политикой конфидециальности
					</NavLink>{' '}
					и
					<br />
					<NavLink to="/rules" className={styles.underline__text}>
						правилами бронирования
					</NavLink>
				</span>
			</CheckBoxArea>

			<button className={styles.primary__btn} onClick={send}>
				Забронировать
			</button>
		</div>
	);
}

export default Form;