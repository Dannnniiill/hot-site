import React from 'react';
import About from './About/About';
import Contacts from './Contacts/Contacts';
import FAQ from './FAQ/FAQ';
import Footer from '../Footer/Footer';
import Gallery from './Gallery/Gallery';
import Header from '../Header/Header';
import Preferences from './Preferences/Preferences';
import PreviewBlock from './PreviewBlock/PreviewBlock';
import Rooms from './Rooms/Rooms';
import Services from './ServicesBlock/Services';
import Feedback from './Feedback/Feedback';
import Promotions from './Promotions/Promotions';
import { useDispatch } from 'react-redux';
import { clearRooms, selectRoom } from '../../Redux/slices/userSlice';
import { useAuth } from '../../auth/AuthProvider';
import AuthModal from '../../auth/AuthModal';

function DefaultPage() {
	const dispatch = useDispatch();
	const { isAuthenticated } = useAuth();

	const [filters, setFilters] = React.useState({
		type: 'all',
		price: 'all',
		sort: 'default',
		amenities: [],
	});

	const [personsCount, setPersonsCount] = React.useState(1);

	React.useEffect(() => {
		window.scrollTo(0, 0);
		dispatch(selectRoom({}));
		dispatch(clearRooms());
	}, [dispatch]);

	return (
		<div>
			<Header main={true} />

			<PreviewBlock
				filters={filters}
				setFilters={setFilters}
				personsCount={personsCount}
				setPersonsCount={setPersonsCount}
			/>

			<About />
			<Promotions />
			<Preferences />
			<Rooms data={null} filters={filters} personsCount={personsCount} />
			<Services />
			<Gallery />
			<FAQ />
			<Feedback />
			<Contacts />
			<Footer main={true} />

			{!isAuthenticated ? <AuthModal /> : null}
		</div>
	);
}

export default DefaultPage;