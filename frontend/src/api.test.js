import { getBaseUrl } from './urlHelper';

describe('getBaseUrl', () => {
    const originalEnv = process.env;
    const originalLocation = window.location;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
        delete process.env.REACT_APP_API_URL;
        delete process.env.NODE_ENV;

        delete window.location;
        window.location = { hostname: 'localhost' };
    });

    afterAll(() => {
        process.env = originalEnv;
        window.location = originalLocation;
    });

    test('returns REACT_APP_API_URL if set', () => {
        process.env.REACT_APP_API_URL = 'http://custom-api.com';
        expect(getBaseUrl()).toBe('http://custom-api.com');
    });

    test('returns /api in production', () => {
        process.env.NODE_ENV = 'production';
        expect(getBaseUrl()).toBe('/api');
    });

    test('returns dynamic IP based URL in development', () => {
        window.location.hostname = '192.168.1.50';
        expect(getBaseUrl()).toBe('http://192.168.1.50:5000/api');
    });

    test('returns localhost URL if hostname is localhost', () => {
        window.location.hostname = 'localhost';
        expect(getBaseUrl()).toBe('http://localhost:5000/api');
    });
});
