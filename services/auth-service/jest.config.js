module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'd.ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@mediamesh/shared)/)',
  ],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@mediamesh/shared$': '<rootDir>/../../../shared',
    '^@mediamesh/shared/(.*)$': '<rootDir>/../../../shared/$1',
    '^@shared/(.*)$': '<rootDir>/../../../shared/$1',
  },
};
