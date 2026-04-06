import 'whatwg-fetch';

import '@testing-library/jest-dom';
require('dotenv').config({ path: '.env.local' });

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
