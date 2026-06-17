import React from 'react';
import styles from './Spinner.module.css';
import { BeatLoader } from 'react-spinners';

function Spinner() {
	return (
		<div className={styles.spinner}>
			<BeatLoader
				color="#875B52"
				size={40}
				margin={6}
			/>
		</div>
	);
}

export default Spinner;
