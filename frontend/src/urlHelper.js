export const getBaseUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (process.env.NODE_ENV === 'production') return '/api';
    return `http://${window.location.hostname}:5000/api`;
};
