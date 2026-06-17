import { Textarea } from '@chakra-ui/react';
import styles from './Input.module.css';
import React from 'react';

function formatPhoneMask(value) {
	const digits = String(value || '').replace(/\D/g, '');

	let normalized = digits;

	if (normalized.startsWith('8')) {
		normalized = '7' + normalized.slice(1);
	}

	if (!normalized.startsWith('7')) {
		normalized = '7' + normalized;
	}

	normalized = normalized.slice(0, 11);

	let result = '+7';

	if (normalized.length > 1) {
		result += ' (' + normalized.slice(1, 4);
	}

	if (normalized.length >= 5) {
		result += ') ' + normalized.slice(4, 7);
	} else if (normalized.length >= 4) {
		result += ')';
	}

	if (normalized.length >= 8) {
		result += '-' + normalized.slice(7, 9);
	}

	if (normalized.length >= 10) {
		result += '-' + normalized.slice(9, 11);
	}

	return result;
}

export const Input = ({
	value,
	name,
	onChange,
	className,
	placeholder,
	type,
	errorText,
	error,
	onKeyDown,
	title,
	pattern,
	isTextArea,
}) => {
	const handleChange = (e) => {
		const rawValue = e.target.value;
		const nextValue = name === 'telValue' ? formatPhoneMask(rawValue) : rawValue;
		onChange(name, nextValue);
	};

	return (
		<div className={styles.input__form}>
			<div className={styles.title}>{title}</div>

			{isTextArea ? (
				<div className={styles.input__area}>
					<Textarea
						value={value}
						onChange={handleChange}
						placeholder={placeholder}
						onKeyDown={onKeyDown}
						border="none"
						borderRadius="0"
						background="transparent"
						focusBorderColor="transparent"
						resize="none"
						padding="0.95rem 0 0.8rem"
						minHeight="8.5rem"
						fontSize="1.08rem"
						fontWeight="400"
						lineHeight="160%"
						color="var(--accent-color)"
						borderBottom="1px solid rgba(135, 91, 82, 0.35)"
						_placeholder={{
							color: 'rgba(85, 58, 50, 0.45)',
						}}
						_focus={{
							border: 'none',
							boxShadow: 'none',
							borderBottom: '1px solid var(--accent-color)',
						}}
						_hover={{
							borderBottom: '1px solid rgba(135, 91, 82, 0.55)',
						}}
					/>
				</div>
			) : (
				<div className={styles.input__area}>
					<div className="input__group">
						<input
							pattern={pattern}
							value={value}
							onChange={handleChange}
							className={className}
							placeholder={name === 'telValue' ? '+7 (___) ___-__-__' : placeholder}
							type={name === 'telValue' ? 'tel' : type}
							onKeyDown={onKeyDown}
							maxLength={name === 'telValue' ? 18 : undefined}
							autoComplete={name === 'telValue' ? 'tel' : undefined}
						/>
					</div>

					{error && (
						<svg
							width="25"
							height="25"
							viewBox="0 0 25 25"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M12.5 0C5.625 0 0 5.625 0 12.5C0 19.375 5.625 25 12.5 25C19.375 25 25 19.375 25 12.5C25 5.625 19.375 0 12.5 0ZM12.5 18.75C11.75 18.75 11.25 18.25 11.25 17.5C11.25 16.75 11.75 16.25 12.5 16.25C13.25 16.25 13.75 16.75 13.75 17.5C13.75 18.25 13.25 18.75 12.5 18.75ZM13.75 12.5C13.75 13.25 13.25 13.75 12.5 13.75C11.75 13.75 11.25 13.25 11.25 12.5V7.5C11.25 6.75 11.75 6.25 12.5 6.25C13.25 6.25 13.75 6.75 13.75 7.5V12.5Z"
								fill="#B3261E"
							/>
						</svg>
					)}

					{error && <div className={styles.error__text}>{errorText}</div>}
				</div>
			)}
		</div>
	);
};