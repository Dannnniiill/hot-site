import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { Provider } from 'react-redux';
import { store } from './Redux/store';
import { alertAnatomy } from '@chakra-ui/anatomy';
import { extendTheme, createMultiStyleConfigHelpers } from '@chakra-ui/react';
import { AuthProvider } from './auth/AuthProvider';

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(alertAnatomy.keys);

const customSuccess = definePartsStyle({
	container: {
		border: '1px solid',
		borderColor: 'teal.200',
		background: 'teal.500',
		_dark: {
			borderColor: 'teal.600',
			background: 'teal.800',
		},
	},
	title: {
		color: 'pink.200',
		_dark: {
			color: 'pink.200',
		},
	},
});

const customError = definePartsStyle({
	container: {
		color: 'white',
		border: '1px solid',
		borderColor: '#B3261E',
		background: '#B3261E',
		_dark: {
			borderColor: 'pink.600',
			background: 'pink.800',
		},
	},
	title: {
		color: 'white',
		_dark: {
			color: 'white',
		},
	},
	description: {
		color: 'white',
		_dark: {
			color: 'white',
		},
	},
	icon: {
		color: 'white',
		fill: 'white',
	},
});

const alertTheme = defineMultiStyleConfig({
	variants: { customSuccess, customError },
});

export const theme = extendTheme({
	components: {
		Alert: alertTheme,
	},
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<ChakraProvider theme={theme}>
					<Provider store={store}>
						<App />
					</Provider>
				</ChakraProvider>
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>,
);