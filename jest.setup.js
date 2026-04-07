import 'whatwg-fetch';

import '@testing-library/jest-dom';
require('dotenv').config({ path: '.env.local' });

// Suppress expected console logs during tests for cleaner output
// Only show logs when tests fail
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

console.error = (...args) => {
  // Filter out expected errors during tests - be more lenient with matching
  const message = String(args[0] || '');
  if (message.includes('Auth session missing') || 
      message.includes('Org Create Auth Error') ||
      message.includes('[API/mp/') ||
      message.includes('[ARCA Error]')) {
    return; // Silently ignore expected errors in tests
  }
  originalConsoleError.apply(console, args);
};

console.log = (...args) => {
  // Filter out dotenv injection logs
  const message = String(args[0]);
  if (message.includes('injected env') || message.includes('dotenv')) {
    return;
  }
  originalConsoleLog.apply(console, args);
};

// Mock Next.js internal headers and cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(() => ({
    getAll: jest.fn().mockReturnValue([]),
    get: jest.fn(),
    set: jest.fn(),
  })),
  headers: jest.fn().mockImplementation(() => new Headers()),
}));

// Mock Next.js server response
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => {
      const res = new Response(JSON.stringify(data), init);
      // Add json method to mock response for ease of testing
      Object.defineProperty(res, 'json', {
        value: async () => data
      });
      return res;
    }),
  },
  NextRequest: jest.fn().mockImplementation((url, init) => {
    return new Request(url, init);
  }),
}));
