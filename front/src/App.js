import { Route, Routes, Navigate } from 'react-router-dom';
import './App.css';
import DefaultPage from './Components/DefaultPage/DefaultPage';
import RulesPage from './Components/RulesPage/RulesPage';
import PrivacyPage from './Components/PrivacyPage/PrivacyPage';
import ReservationPage from './Components/ReservationPage/ReservationPage';
import ErrorPage from './Components/ErrorPage/ErrorPage';
import ProfilePage from './auth/ProfilePage';
import AnalyticsPage from './analytics/AnalyticsPage';
import { useAuth } from './auth/AuthProvider';

function ProtectedRoute({ children }) {
	const { isAuthenticated, authReady } = useAuth();

	if (!authReady) {
		return <div style={{ padding: '40px', color: '#fff' }}>Проверка авторизации...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return children;
}

function AdminRoute({ children }) {
	const { isAuthenticated, isAdmin, authReady } = useAuth();

	if (!authReady) {
		return <div style={{ padding: '40px', color: '#fff' }}>Проверка прав доступа...</div>;
	}

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	if (!isAdmin) {
		return <Navigate to="/profile" replace />;
	}

	return children;
}

function App() {
	return (
		<div className="App">
			<Routes>
				<Route path="/" element={<DefaultPage />} />
				<Route path="/rules" element={<RulesPage />} />
				<Route path="/privacy" element={<PrivacyPage />} />
				<Route path="/reservation" element={<ReservationPage />} />
				<Route path="/reservation/:type" element={<ReservationPage />} />

				<Route
					path="/profile"
					element={
						<ProtectedRoute>
							<ProfilePage />
						</ProtectedRoute>
					}
				/>

				<Route
					path="/analytics"
					element={
						<AdminRoute>
							<AnalyticsPage />
						</AdminRoute>
					}
				/>

				<Route path="/*" element={<ErrorPage />} />
			</Routes>
		</div>
	);
}

export default App;