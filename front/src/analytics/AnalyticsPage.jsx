import React from 'react';
import axios from 'axios';
import { BASE_URL } from '../constats';
import {
	ResponsiveContainer,
	ComposedChart,
	Line,
	Bar,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend,
	PieChart,
	Pie,
	Cell,
} from 'recharts';

const API_BASE =
	window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
		? 'http://127.0.0.1:8000'
		: BASE_URL;

const PIE_COLORS = ['#d07a4b', '#e0a35c', '#8f5b45', '#b86a58', '#c9925e', '#a86a52'];

function normalizeText(value) {
	if (value === undefined || value === null) return '';
	const safeValue = String(value).trim();
	if (['undefined', 'null', 'none'].includes(safeValue.toLowerCase())) return '';
	return safeValue;
}

function getClientLabel(item) {
	const client = normalizeText(item?.client);
	if (client) return client;

	const firstName = normalizeText(item?.first_name);
	const lastName = normalizeText(item?.last_name);
	const fullName = `${firstName} ${lastName}`.trim();
	if (fullName) return fullName;

	const email = normalizeText(item?.email);
	if (email.includes('@')) return email.split('@')[0];
	if (email) return email;

	return 'Без имени';
}

function AnalyticsPage() {
	const today = new Date();
	const monthAgo = new Date();
	monthAgo.setDate(today.getDate() - 30);

	const [viewportWidth, setViewportWidth] = React.useState(window.innerWidth);
	const [dateFrom, setDateFrom] = React.useState(formatDateForInput(monthAgo));
	const [dateTo, setDateTo] = React.useState(formatDateForInput(today));
	const [periodMode, setPeriodMode] = React.useState('day');
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [dashboard, setDashboard] = React.useState(null);

	React.useEffect(() => {
		const handleResize = () => setViewportWidth(window.innerWidth);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const isTablet = viewportWidth <= 1024;
	const isMobile = viewportWidth <= 768;
	const isSmallMobile = viewportWidth <= 480;
	const styles = React.useMemo(
		() => buildStyles({ isTablet, isMobile, isSmallMobile }),
		[isTablet, isMobile, isSmallMobile],
	);

	const loadDashboard = React.useCallback(async () => {
		try {
			setLoading(true);
			setError('');

			const response = await axios.get(`${API_BASE}/analytics/dashboard/`, {
				params: {
					date_from: dateFrom,
					date_to: dateTo,
					group_by: periodMode,
				},
			});

			setDashboard(response.data);
		} catch (err) {
			console.error(err);
			setError('Не удалось загрузить аналитику');
		} finally {
			setLoading(false);
		}
	}, [dateFrom, dateTo, periodMode]);

	React.useEffect(() => {
		loadDashboard();
	}, [loadDashboard]);

	const downloadExcel = React.useCallback(() => {
		const params = new URLSearchParams({
			date_from: dateFrom,
			date_to: dateTo,
			group_by: periodMode,
		});

		window.open(`${API_BASE}/analytics/export/excel/?${params.toString()}`, '_blank');
	}, [dateFrom, dateTo, periodMode]);

	const downloadPdf = React.useCallback(() => {
		const params = new URLSearchParams({
			date_from: dateFrom,
			date_to: dateTo,
			group_by: periodMode,
		});

		window.open(`${API_BASE}/analytics/export/pdf/?${params.toString()}`, '_blank');
	}, [dateFrom, dateTo, periodMode]);

	if (loading) {
		return (
			<div style={styles.page}>
				<div style={styles.container}>Загрузка аналитики...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div style={styles.page}>
				<div style={styles.container}>{error}</div>
			</div>
		);
	}

	const summary = dashboard?.summary || {};
	const charts = dashboard?.charts || {};
	const tables = dashboard?.tables || {};

	const bookingsChartData = normalizeBookingsChart(charts.bookings_chart || []);
	const roomTypeData = Array.isArray(charts.room_type_distribution)
		? charts.room_type_distribution
		: [];

	return (
		<div style={styles.page}>
			<div style={styles.container}>
				<div style={styles.headerBlock}>
					<h1 style={styles.title}>Дашборд аналитики</h1>
					<p style={styles.subtitle}>Отчёты по бронированиям, клиентам, выручке и акциям</p>
				</div>

				<div style={styles.filtersCard}>
					<div style={styles.filtersRow}>
						<div style={styles.inputGroup}>
							<label style={styles.label}>Дата от</label>
							<input
								type="date"
								value={dateFrom}
								onChange={(e) => setDateFrom(e.target.value)}
								style={styles.input}
							/>
						</div>

						<div style={styles.inputGroup}>
							<label style={styles.label}>Дата до</label>
							<input
								type="date"
								value={dateTo}
								onChange={(e) => setDateTo(e.target.value)}
								style={styles.input}
							/>
						</div>

						<div style={styles.inputGroup}>
							<label style={styles.label}>Группировка</label>
							<select
								value={periodMode}
								onChange={(e) => setPeriodMode(e.target.value)}
								style={styles.input}
							>
								<option value="day">По дням</option>
								<option value="month">По месяцам</option>
								<option value="year">По годам</option>
							</select>
						</div>

						<button style={styles.secondaryButton} onClick={downloadExcel}>
							Скачать Excel
						</button>

						<button style={styles.secondaryButton} onClick={downloadPdf}>
							Скачать PDF
						</button>

						<button style={styles.button} onClick={loadDashboard}>
							Обновить
						</button>
					</div>
				</div>

				<div style={styles.cardsGrid}>
					<MetricCard title="Всего бронирований" value={summary.total_bookings || 0} styles={styles} />
					<MetricCard title="Активные" value={summary.active_bookings || 0} styles={styles} />
					<MetricCard title="Отменённые" value={summary.canceled_bookings || 0} styles={styles} />
					<MetricCard title="Выручка" value={formatMoney(summary.total_revenue || 0)} styles={styles} />
					<MetricCard
						title="Средний чек (активные)"
						value={formatMoney(summary.average_booking_amount || 0)}
						styles={styles}
					/>
					<MetricCard title="С промокодом" value={summary.promo_bookings_count || 0} styles={styles} />
				</div>

				<div style={styles.chartsGrid}>
					<div style={styles.chartCard}>
						<h3 style={styles.chartTitle}>Бронирования по периодам</h3>
						<p style={styles.chartDescription}>
							Столбцы показывают общее число бронирований, линия — число отмен.
						</p>

						<div style={styles.chartWrap}>
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart
									data={bookingsChartData}
									margin={{
										top: 10,
										right: isMobile ? 6 : 20,
										left: isMobile ? -18 : 0,
										bottom: isMobile ? 22 : 10,
									}}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" />
									<XAxis
										dataKey="label"
										interval={0}
										angle={isMobile ? -22 : 0}
										textAnchor={isMobile ? 'end' : 'middle'}
										height={isMobile ? 56 : 30}
										stroke="rgba(243,236,231,0.65)"
										tick={{ fill: 'rgba(243,236,231,0.75)', fontSize: isMobile ? 11 : 13 }}
									/>
									<YAxis
										allowDecimals={false}
										width={isMobile ? 34 : 50}
										stroke="rgba(243,236,231,0.65)"
										tick={{ fill: 'rgba(243,236,231,0.75)', fontSize: isMobile ? 11 : 13 }}
									/>
									<Tooltip content={<BookingsTooltip />} />
									<Legend
										wrapperStyle={{
											color: '#f3ece7',
											fontSize: isMobile ? 12 : 14,
											paddingTop: isMobile ? 6 : 0,
										}}
									/>
									<Bar
										dataKey="bookings"
										name="Бронирования"
										fill="#b66b4b"
										radius={[6, 6, 0, 0]}
										maxBarSize={isMobile ? 24 : 64}
									/>
									<Line
										type="monotone"
										dataKey="canceled"
										name="Отмены"
										stroke="#e05a47"
										strokeWidth={isMobile ? 2 : 3}
										dot={{ r: isMobile ? 3 : 5 }}
										activeDot={{ r: isMobile ? 4 : 7 }}
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div style={styles.chartCard}>
						<h3 style={styles.chartTitle}>Выручка по периодам</h3>
						<p style={styles.chartDescription}>
							Показывает, сколько дохода получено в каждом выбранном периоде.
						</p>

						<div style={styles.chartWrap}>
							<ResponsiveContainer width="100%" height="100%">
								<ComposedChart
									data={bookingsChartData}
									margin={{
										top: 10,
										right: isMobile ? 6 : 20,
										left: isMobile ? -14 : 10,
										bottom: isMobile ? 22 : 10,
									}}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.10)" />
									<XAxis
										dataKey="label"
										interval={0}
										angle={isMobile ? -22 : 0}
										textAnchor={isMobile ? 'end' : 'middle'}
										height={isMobile ? 56 : 30}
										stroke="rgba(243,236,231,0.65)"
										tick={{ fill: 'rgba(243,236,231,0.75)', fontSize: isMobile ? 11 : 13 }}
									/>
									<YAxis
										width={isMobile ? 44 : 60}
										stroke="rgba(243,236,231,0.65)"
										tick={{ fill: 'rgba(243,236,231,0.75)', fontSize: isMobile ? 11 : 13 }}
										tickFormatter={(value) => compactMoney(value)}
									/>
									<Tooltip content={<RevenueTooltip />} />
									<Legend
										wrapperStyle={{
											color: '#f3ece7',
											fontSize: isMobile ? 12 : 14,
											paddingTop: isMobile ? 6 : 0,
										}}
									/>
									<Bar
										dataKey="revenue"
										name="Выручка"
										fill="#c5794f"
										radius={[6, 6, 0, 0]}
										maxBarSize={isMobile ? 24 : 72}
									/>
								</ComposedChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div style={styles.chartCardWide}>
						<h3 style={styles.chartTitle}>Популярность типов номеров</h3>
						<p style={styles.chartDescription}>
							Распределение бронирований по категориям номеров.
						</p>

						<div style={styles.chartWrapPie}>
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={roomTypeData}
										dataKey="value"
										nameKey="name"
										cx="50%"
										cy="50%"
										outerRadius={isMobile ? 84 : 135}
										innerRadius={0}
										paddingAngle={0}
										stroke="#2b1f1b"
										strokeWidth={2}
										label={isMobile ? false : ({ name, value }) => `${name}: ${value}`}
										labelLine={!isMobile}
									>
										{roomTypeData.map((entry, index) => (
											<Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={1} />
										))}
									</Pie>
									<Tooltip content={<PieTooltip />} />
									<Legend
										layout={isMobile ? 'horizontal' : 'horizontal'}
										verticalAlign="bottom"
										align="center"
										wrapperStyle={{
											color: '#f3ece7',
											fontSize: isMobile ? 12 : 14,
											paddingTop: 6,
										}}
									/>
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>

				<div style={styles.tableCard}>
					<h3 style={styles.chartTitle}>Отчёт по акциям</h3>
					<Table
						headers={['Промокод', 'Использований', 'Сумма скидок', 'Доход']}
						rows={(tables.promotions_report || []).map((item) => [
							normalizeText(item.promo_code),
							item.usages || item.bookings_count || 0,
							formatMoney(item.total_discount || 0),
							formatMoney(item.total_revenue || 0),
						])}
						styles={styles}
					/>
				</div>

				<div style={styles.tableCard}>
					<h3 style={styles.chartTitle}>Топ клиентов</h3>
					<Table
						headers={['Клиент', 'Email', 'Бронирований', 'Отмен', 'Средний чек', 'Потрачено']}
						rows={(tables.top_clients || []).map((item) => [
							getClientLabel(item),
							normalizeText(item.email),
							item.bookings_count || 0,
							item.cancellations || 0,
							formatMoney(item.average_check || 0),
							formatMoney(item.total_spent || 0),
						])}
						styles={styles}
					/>
				</div>

				<div style={styles.tableCard}>
					<h3 style={styles.chartTitle}>Последние бронирования</h3>
					<Table
						headers={['№ брони', 'Клиент', 'Email', 'Тип', 'Сумма', 'Статус', 'Заезд', 'Выезд']}
						rows={(tables.bookings_table || []).map((item) => [
							item.booking_number || `HTL-${item.id || ''}`,
							getClientLabel(item),
							normalizeText(item.email),
							normalizeText(item.type),
							formatMoney(item.total_price || 0),
							normalizeText(item.status),
							normalizeText(item.start_date),
							normalizeText(item.end_date),
						])}
						styles={styles}
					/>
				</div>
			</div>
		</div>
	);
}

function MetricCard({ title, value, styles }) {
	return (
		<div style={styles.metricCard}>
			<div style={styles.metricTitle}>{title}</div>
			<div style={styles.metricValue}>{value ?? 0}</div>
		</div>
	);
}

function Table({ headers, rows, styles }) {
	return (
		<div style={styles.tableWrap}>
			<table style={styles.table}>
				<thead>
					<tr>
						{headers.map((header) => (
							<th key={header} style={styles.th}>
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.length === 0 ? (
						<tr>
							<td colSpan={headers.length} style={styles.emptyTd}>
								Нет данных
							</td>
						</tr>
					) : (
						rows.map((row, rowIndex) => (
							<tr key={rowIndex}>
								{row.map((cell, cellIndex) => (
									<td key={cellIndex} style={styles.td}>
										{cell}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}

function BookingsTooltip({ active, payload, label }) {
	if (!active || !payload || !payload.length) return null;

	const bookings = payload.find((item) => item.dataKey === 'bookings')?.value ?? 0;
	const canceled = payload.find((item) => item.dataKey === 'canceled')?.value ?? 0;

	return (
		<div style={tooltipStyles.box}>
			<div style={tooltipStyles.title}>{label}</div>
			<div style={tooltipStyles.row}>Бронирований: {bookings}</div>
			<div style={tooltipStyles.row}>Отмен: {canceled}</div>
		</div>
	);
}

function RevenueTooltip({ active, payload, label }) {
	if (!active || !payload || !payload.length) return null;

	const revenue = payload.find((item) => item.dataKey === 'revenue')?.value ?? 0;

	return (
		<div style={tooltipStyles.box}>
			<div style={tooltipStyles.title}>{label}</div>
			<div style={tooltipStyles.row}>Выручка: {formatMoney(revenue)}</div>
		</div>
	);
}

function PieTooltip({ active, payload }) {
	if (!active || !payload || !payload.length) return null;

	const item = payload[0]?.payload;
	if (!item) return null;

	return (
		<div style={tooltipStyles.box}>
			<div style={tooltipStyles.title}>{item.name}</div>
			<div style={tooltipStyles.row}>Бронирований: {item.value}</div>
		</div>
	);
}

function normalizeBookingsChart(data) {
	if (!Array.isArray(data)) return [];

	return data.map((item) => ({
		label: item.label,
		bookings: Number(item.bookings || 0),
		canceled: Number(item.canceled || 0),
		revenue: Number(item.revenue || 0),
	}));
}

function formatMoney(value) {
	const number = Number(value || 0);
	return `${number.toLocaleString('ru-RU', {
		minimumFractionDigits: number % 1 ? 2 : 0,
		maximumFractionDigits: 2,
	})} ₽`;
}

function compactMoney(value) {
	const number = Number(value || 0);

	if (number >= 1000000) return `${(number / 1000000).toFixed(1)} млн`;
	if (number >= 1000) return `${Math.round(number / 1000)} тыс`;
	return `${number}`;
}

function formatDateForInput(date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

const tooltipStyles = {
	box: {
		background: '#2b1f1b',
		border: '1px solid rgba(255,255,255,0.08)',
		borderRadius: '10px',
		padding: '12px 14px',
		color: '#fff',
		boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
		fontFamily: "'Noto Sans', sans-serif",
	},
	title: {
		fontSize: '14px',
		fontWeight: 500,
		marginBottom: '8px',
		color: '#fff6ea',
	},
	row: {
		fontSize: '14px',
		color: 'rgba(243,236,231,0.88)',
		marginBottom: '4px',
	},
};

function buildStyles({ isTablet, isMobile, isSmallMobile }) {
	return {
		page: {
			minHeight: '100vh',
			background: '#221815',
			padding: isMobile ? '18px 12px 32px' : isTablet ? '24px 16px 40px' : '32px 20px 48px',
			color: '#f3ece7',
			fontFamily: "'Noto Sans', sans-serif",
		},
		container: {
			maxWidth: '1280px',
			margin: '0 auto',
		},
		headerBlock: {
			marginBottom: isMobile ? '18px' : '24px',
		},
		title: {
			fontSize: isSmallMobile ? '26px' : isMobile ? '28px' : '34px',
			fontWeight: 500,
			letterSpacing: '-0.02em',
			margin: 0,
			marginBottom: '10px',
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.15,
		},
		subtitle: {
			margin: 0,
			color: 'rgba(243,236,231,0.72)',
			fontSize: isMobile ? '14px' : '16px',
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.5,
		},
		filtersCard: {
			background: '#2b1f1b',
			padding: isMobile ? '14px' : '20px',
			borderRadius: isMobile ? '10px' : '12px',
			marginBottom: isMobile ? '16px' : '20px',
			border: '1px solid rgba(255,255,255,0.06)',
		},
		filtersRow: {
			display: 'grid',
			gridTemplateColumns: isSmallMobile ? '1fr' : isMobile ? '1fr 1fr' : 'repeat(6, minmax(0, 1fr))',
			gap: isMobile ? '10px' : '16px',
			alignItems: 'end',
		},
		inputGroup: {
			display: 'flex',
			flexDirection: 'column',
			gap: '8px',
			minWidth: 0,
			gridColumn: isMobile ? 'auto' : 'auto',
		},
		label: {
			fontSize: isMobile ? '13px' : '14px',
			fontWeight: 500,
			color: 'rgba(243,236,231,0.78)',
			fontFamily: "'Noto Sans', sans-serif",
		},
		input: {
			height: isMobile ? '40px' : '44px',
			borderRadius: isMobile ? '8px' : '8px',
			border: '1px solid rgba(255,255,255,0.08)',
			background: '#2a1e1a',
			color: '#fff',
			padding: '0 12px',
			fontSize: isMobile ? '14px' : '15px',
			fontFamily: "'Noto Sans', sans-serif",
			width: '100%',
			minWidth: 0,
			boxSizing: 'border-box',
		},
		button: {
			height: isMobile ? '40px' : '44px',
			padding: '0 16px',
			border: 'none',
			borderRadius: isMobile ? '8px' : '8px',
			background: '#92634c',
			color: '#fff',
			fontWeight: 500,
			fontSize: isMobile ? '14px' : '15px',
			fontFamily: "'Noto Sans', sans-serif",
			cursor: 'pointer',
			width: '100%',
		},
		secondaryButton: {
			height: isMobile ? '40px' : '44px',
			padding: '0 16px',
			borderRadius: isMobile ? '8px' : '8px',
			border: '1px solid rgba(217, 193, 168, 0.28)',
			background: '#3a2822',
			color: '#f3ece7',
			fontWeight: 500,
			fontSize: isMobile ? '14px' : '15px',
			fontFamily: "'Noto Sans', sans-serif",
			cursor: 'pointer',
			width: '100%',
		},
		cardsGrid: {
			display: 'grid',
			gridTemplateColumns: isSmallMobile ? '1fr 1fr' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))',
			gap: isMobile ? '10px' : '12px',
			marginBottom: isMobile ? '16px' : '20px',
		},
		metricCard: {
			background: '#2b1f1b',
			borderRadius: isMobile ? '10px' : '12px',
			padding: isSmallMobile ? '12px 10px' : isMobile ? '14px 12px' : '18px',
			border: '1px solid rgba(255,255,255,0.06)',
			minWidth: 0,
		},
		metricTitle: {
			fontSize: isSmallMobile ? '11px' : isMobile ? '12px' : '13px',
			fontWeight: 500,
			color: 'rgba(243,236,231,0.62)',
			marginBottom: '8px',
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.35,
			wordBreak: 'break-word',
		},
		metricValue: {
			fontSize: isSmallMobile ? '18px' : isMobile ? '20px' : '24px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.3,
			wordBreak: 'break-word',
		},
		chartsGrid: {
			display: 'grid',
			gridTemplateColumns: isTablet ? '1fr' : 'repeat(2, minmax(0, 1fr))',
			gap: isMobile ? '12px' : '16px',
			marginBottom: isMobile ? '16px' : '20px',
		},
		chartCard: {
			background: '#2b1f1b',
			borderRadius: isMobile ? '10px' : '12px',
			padding: isMobile ? '14px' : '20px',
			border: '1px solid rgba(255,255,255,0.06)',
			minWidth: 0,
		},
		chartCardWide: {
			background: '#2b1f1b',
			borderRadius: isMobile ? '10px' : '12px',
			padding: isMobile ? '14px' : '20px',
			border: '1px solid rgba(255,255,255,0.06)',
			gridColumn: isTablet ? 'auto' : '1 / -1',
			minWidth: 0,
		},
		chartTitle: {
			marginTop: 0,
			marginBottom: '8px',
			fontSize: isMobile ? '17px' : '20px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.3,
		},
		chartDescription: {
			marginTop: 0,
			marginBottom: '12px',
			fontSize: isMobile ? '13px' : '14px',
			color: 'rgba(243,236,231,0.68)',
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.5,
		},
		chartWrap: {
			width: '100%',
			height: isMobile ? '250px' : '400px',
		},
		chartWrapPie: {
			width: '100%',
			height: isMobile ? '290px' : '400px',
		},
		tableCard: {
			background: '#2b1f1b',
			borderRadius: isMobile ? '10px' : '12px',
			padding: isMobile ? '14px' : '20px',
			border: '1px solid rgba(255,255,255,0.06)',
			marginBottom: isMobile ? '16px' : '20px',
		},
		tableWrap: {
			overflowX: 'auto',
			WebkitOverflowScrolling: 'touch',
		},
		table: {
			width: '100%',
			minWidth: isMobile ? '760px' : '100%',
			borderCollapse: 'collapse',
			fontFamily: "'Noto Sans', sans-serif",
		},
		th: {
			textAlign: 'left',
			padding: isMobile ? '10px' : '12px',
			borderBottom: '1px solid rgba(255,255,255,0.08)',
			color: '#d9c1a8',
			fontSize: isMobile ? '12px' : '14px',
			fontWeight: 500,
			fontFamily: "'Noto Sans', sans-serif",
			whiteSpace: 'nowrap',
		},
		td: {
			padding: isMobile ? '10px' : '12px',
			borderBottom: '1px solid rgba(255,255,255,0.06)',
			fontSize: isMobile ? '12px' : '14px',
			color: '#fff',
			fontFamily: "'Noto Sans', sans-serif",
			lineHeight: 1.45,
			whiteSpace: 'nowrap',
		},
		emptyTd: {
			padding: '18px',
			textAlign: 'center',
			color: 'rgba(243,236,231,0.66)',
			fontFamily: "'Noto Sans', sans-serif",
		},
	};
}

export default AnalyticsPage;