import type { AxiosError } from 'axios';
import axios, { isCancel } from 'axios';
import {
	createContext,
	useContext,
	useMemo,
	useState,
} from 'react';
import type { ChangeEvent, Dispatch, ReactNode, SetStateAction } from 'react';

type AuthState = {
	id: number;
	name: string;
	username: string;
	avatar: string;
	accountType: string;
	propertyIds: number[];
	assignedPropertyIds: number[];
	subscriptionByPropertyIds: number[];
	permissions: string[];
};

type FormError = {
	field: string;
	message: string[];
};

type PageState = {
	name: string;
	path: string[];
};

type ListMeta = {
	per_page: number;
	current_page: number;
};

type PaginatedList = {
	meta: ListMeta;
};

type ErrorResponse = {
	errors?: Record<string, string[] | string>;
	message?: string;
};

type RequestController = {
	signal?: AbortSignal;
};

type AppContextValue = {
	messages: string[];
	setMessages: Dispatch<SetStateAction<string[]>>;
	errors: string[];
	setErrors: Dispatch<SetStateAction<string[]>>;
	formErrors: FormError[];
	setFormErrors: Dispatch<SetStateAction<FormError[]>>;
	login: string | null;
	setLogin: Dispatch<SetStateAction<string | null>>;
	auth: AuthState;
	setAuth: Dispatch<SetStateAction<AuthState>>;
	headerMenu: string | null;
	setHeaderMenu: Dispatch<SetStateAction<string | null>>;
	adminMenu: string;
	setAdminMenu: Dispatch<SetStateAction<string>>;
	properties: unknown[];
	setProperties: Dispatch<SetStateAction<unknown[]>>;
	selectedPropertyId: number[];
	setSelectedPropertyId: Dispatch<SetStateAction<number[]>>;
	page: PageState;
	setPage: Dispatch<SetStateAction<PageState>>;
	loadingItems: number;
	setLoadingItems: Dispatch<SetStateAction<number>>;
	showPayMenu: string;
	setShowPayMenu: Dispatch<SetStateAction<string>>;
	paymentTitle: string | null;
	setPaymentTitle: Dispatch<SetStateAction<string | null>>;
	paymentDescription: string | null;
	setPaymentDescription: Dispatch<SetStateAction<string | null>>;
	paymentAmount: number | null;
	setPaymentAmount: Dispatch<SetStateAction<number | null>>;
	downloadLink: string | null;
	setDownloadLink: Dispatch<SetStateAction<string | null>>;
	downloadLinkText: string;
	setDownloadLinkText: Dispatch<SetStateAction<string>>;
	get: <T>(
		endpoint: string,
		setState: Dispatch<SetStateAction<T>>,
		storage?: string | null,
		shouldSetErrors?: boolean,
		controller?: RequestController,
	) => Promise<void>;
	getPaginated: <T>(
		endpoint: string,
		setState: Dispatch<SetStateAction<T>>,
		storage?: string | null,
		shouldSetErrors?: boolean,
		controller?: RequestController,
	) => Promise<void>;
	getLocalStorage: <T>(key: string, fallback: T) => T;
	getNormalLocalStorage: (key: string) => string | null;
	getLocalStorageAuth: (key?: string) => AuthState;
	setLocalStorage: (key: string, value: unknown) => void;
	iterator: (key: number, list: PaginatedList) => number;
	getErrors: (err: AxiosError<ErrorResponse>, includeMessage?: boolean) => void;
	formatToCommas: (event: ChangeEvent<HTMLInputElement>) => string;
	currentDate: Date;
	currentYear: number;
	currentMonth: number;
	months: string[];
	years: number[];
};

const DEFAULT_AUTH: AuthState = {
	id: 0,
	name: 'Guest',
	username: '@guest',
	avatar: '/storage/avatars/male-avatar.png',
	accountType: 'normal',
	propertyIds: [],
	assignedPropertyIds: [],
	subscriptionByPropertyIds: [],
	permissions: [],
};

const readJsonFromLocalStorage = <T,>(key: string, fallback: T): T => {
	if (typeof window === 'undefined') {
		return fallback;
	}

	try {
		const value = window.localStorage.getItem(key);

		if (!value) {
			return fallback;
		}

		return JSON.parse(value) as T;
	} catch {
		return fallback;
	}
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const useApp = (): AppContextValue => {
	const context = useContext(AppContext);

	if (!context) {
		throw new Error('useApp must be used within AppProvider');
	}

	return context;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
	const [messages, setMessages] = useState<string[]>([]);
	const [errors, setErrors] = useState<string[]>([]);
	const [formErrors, setFormErrors] = useState<FormError[]>([]);
	const [login, setLogin] = useState<string | null>(null);
	const [auth, setAuth] = useState<AuthState>(() =>
		readJsonFromLocalStorage<AuthState>('auth', DEFAULT_AUTH),
	);
	const [headerMenu, setHeaderMenu] = useState<string | null>(null);
	const [adminMenu, setAdminMenu] = useState<string>(() => {
		if (typeof window !== 'undefined' && window.innerWidth <= 768) {
			return '';
		}

		return 'left-open';
	});
	const [properties, setProperties] = useState<unknown[]>([]);
	const [selectedPropertyId, setSelectedPropertyId] = useState<number[]>(() => {
		if (typeof window === 'undefined') {
			return [];
		}

		const storedId = window.localStorage.getItem('selectedPropertyId');

		if (storedId) {
			const numericId = Number(storedId);

			return Number.isNaN(numericId) ? [] : [numericId];
		}

		const authData = readJsonFromLocalStorage<AuthState>('auth', DEFAULT_AUTH);

		return [
			...(authData.propertyIds ?? []),
			...(authData.subscriptionByPropertyIds ?? []),
		];
	});
	const [page, setPage] = useState<PageState>({ name: '/', path: [] });
	const [loadingItems, setLoadingItems] = useState(0);
	const [showPayMenu, setShowPayMenu] = useState('');
	const [paymentTitle, setPaymentTitle] = useState<string | null>(null);
	const [paymentDescription, setPaymentDescription] = useState<string | null>(null);
	const [paymentAmount, setPaymentAmount] = useState<number | null>(null);
	const [downloadLink, setDownloadLink] = useState<string | null>(null);
	const [downloadLinkText, setDownloadLinkText] = useState('');

	const getLocalStorage = <T,>(key: string, fallback: T): T => {
		return readJsonFromLocalStorage<T>(key, fallback);
	};

	const getNormalLocalStorage = (key: string): string | null => {
		if (typeof window === 'undefined') {
			return null;
		}

		return window.localStorage.getItem(key);
	};

	const getLocalStorageAuth = (key = 'auth'): AuthState => {
		return getLocalStorage<AuthState>(key, DEFAULT_AUTH);
	};

	const setLocalStorage = (key: string, value: unknown): void => {
		if (typeof window === 'undefined') {
			return;
		}

		window.localStorage.setItem(key, JSON.stringify(value));
	};

	const withLoading = (endpoint: string, fn: () => Promise<void>): Promise<void> => {
		const shouldTrack = endpoint !== 'notifications';

		if (shouldTrack) {
			setLoadingItems((prev) => prev + 1);
		}

		return fn().finally(() => {
			if (shouldTrack) {
				setLoadingItems((prev) => Math.max(0, prev - 1));
			}
		});
	};

	const get: AppContextValue['get'] = async (
		endpoint,
		setState,
		storage = null,
		shouldSetErrors = true,
		controller,
	) => {
		await withLoading(endpoint, async () => {
			try {
				const response = await axios.get(`/api/${endpoint}`, {
					signal: controller?.signal,
				});
				const data = response.data?.data ?? [];
				setState(data);

				if (storage) {
					setLocalStorage(storage, data);
				}
			} catch (error) {
				if (isCancel(error)) {
					return;
				}

				if (shouldSetErrors) {
					setErrors([`Failed to fetch ${endpoint.split('?')[0]}`]);
				}
			}
		});
	};

	const getPaginated: AppContextValue['getPaginated'] = async (
		endpoint,
		setState,
		storage = null,
		shouldSetErrors = true,
		controller,
	) => {
		await withLoading(endpoint, async () => {
			try {
				const response = await axios.get(`/api/${endpoint}`, {
					signal: controller?.signal,
				});
				const data = response.data ?? [];
				setState(data);

				if (storage) {
					setLocalStorage(storage, data);
				}
			} catch {
				if (shouldSetErrors) {
					setErrors([`Failed to fetch ${endpoint.split('?')[0]}`]);
				}
			}
		});
	};

	const iterator = (key: number, list: PaginatedList): number => {
		return key + 1 + list.meta.per_page * (list.meta.current_page - 1);
	};

	const getErrors = (
		err: AxiosError<ErrorResponse>,
		includeMessage = false,
	): void => {
		const validationErrors = err.response?.data?.errors ?? {};

		const errorList: string[] = [];
		const keyedErrors: FormError[] = [];

		for (const [field, message] of Object.entries(validationErrors)) {
			const messages = Array.isArray(message) ? message : [message];
			errorList.push(...messages);
			keyedErrors.push({ field, message: messages });
		}

		if (includeMessage && err.response?.data?.message) {
			errorList.push(err.response.data.message);
		}

		setErrors(errorList);
		setFormErrors(keyedErrors);
	};

	const formatToCommas = (event: ChangeEvent<HTMLInputElement>): string => {
		let value = event.target.value.toString().replace(/[^0-9.]/g, '');
		value = Number(value).toString();
		event.target.value = Number(value || 0).toLocaleString('en-US');

		return event.target.value.replace(/,/g, '');
	};

	const { currentDate, currentYear, currentMonth, months, years } = useMemo(() => {
		const date = new Date();
		const year = date.getFullYear();
		const month = date.getMonth() + 1;

		const monthsList = [
			'Select Month',
			'January',
			'February',
			'March',
			'April',
			'May',
			'June',
			'July',
			'August',
			'September',
			'October',
			'November',
			'December',
		];

		const yearsList: number[] = [];

		for (let i = year; i > 2009; i--) {
			yearsList.push(i);
		}

		return {
			currentDate: date,
			currentYear: year,
			currentMonth: month,
			months: monthsList,
			years: yearsList,
		};
	}, []);

	const value: AppContextValue = {
		messages,
		setMessages,
		errors,
		setErrors,
		formErrors,
		setFormErrors,
		login,
		setLogin,
		auth,
		setAuth,
		headerMenu,
		setHeaderMenu,
		adminMenu,
		setAdminMenu,
		properties,
		setProperties,
		selectedPropertyId,
		setSelectedPropertyId,
		page,
		setPage,
		loadingItems,
		setLoadingItems,
		showPayMenu,
		setShowPayMenu,
		paymentTitle,
		setPaymentTitle,
		paymentDescription,
		setPaymentDescription,
		paymentAmount,
		setPaymentAmount,
		downloadLink,
		setDownloadLink,
		downloadLinkText,
		setDownloadLinkText,
		get,
		getPaginated,
		getLocalStorage,
		getNormalLocalStorage,
		getLocalStorageAuth,
		setLocalStorage,
		iterator,
		getErrors,
		formatToCommas,
		currentDate,
		currentYear,
		currentMonth,
		months,
		years,
	};

	return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
