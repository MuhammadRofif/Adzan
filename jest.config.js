/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/frontend/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  testMatch: [
    '<rootDir>/src/frontend/**/*.test.ts',
    '<rootDir>/src/frontend/**/*.test.tsx',
    '<rootDir>/src/frontend/**/*.spec.ts',
    '<rootDir>/src/frontend/**/*.spec.tsx',
  ],
  collectCoverageFrom: [
    'src/frontend/**/*.{ts,tsx}',
    '!src/frontend/**/*.d.ts',
  ],
};

module.exports = config;
