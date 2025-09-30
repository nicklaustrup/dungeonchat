// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import './tests/jest.setup';

// Set universal test timeout to prevent hanging tests
jest.setTimeout(30000); // 30 seconds timeout for all tests

// Basic matchMedia polyfill for tests (jsdom lacks implementation)
if (typeof window !== 'undefined' && !window.matchMedia) {
	window.matchMedia = (query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {}, // deprecated
		removeListener: () => {}, // deprecated
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false
	});
}
