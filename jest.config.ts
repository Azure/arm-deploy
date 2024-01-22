module.exports = {
  verbose: true,
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '**/test/**/*.test.(ts)'
  ],
  testEnvironment: 'node',
};