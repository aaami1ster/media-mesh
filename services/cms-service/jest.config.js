module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/*.entity.ts',
    '!**/main.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@mediamesh/shared$': '<rootDir>/../../../shared',
    '^@mediamesh/shared/(.*)$': '<rootDir>/../../../shared/$1',
    '^@shared/(.*)$': '<rootDir>/../../../shared/$1',
  },
  moduleDirectories: [
    'node_modules',
    '<rootDir>/../node_modules',
    '<rootDir>/../../node_modules',
    '<rootDir>/../../../node_modules',
    '<rootDir>/../../../shared/node_modules',
  ],
  setupFilesAfterEnv: [],
  testTimeout: 10000,
};
