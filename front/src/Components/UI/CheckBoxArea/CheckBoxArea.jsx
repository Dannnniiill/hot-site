import React from 'react';
import styles from './CheckBoxArea.module.css';

export default function CheckBoxArea({ className, checked, onChange, children, error, errorText }) {
	return (
		<div className={styles.block}>
			<div className={className}>
				<label className={styles.control + ' ' + styles.control_checkbox}>
					<input
						checked={checked}
						onChange={onChange}
						type="checkbox"
					/>
					<div className={styles.control_indicator}></div>
				</label>
				{children}
			</div>
			{error && <div className={styles.error__text}>{errorText}</div>}
		</div>
	);
}
