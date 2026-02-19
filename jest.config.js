module.exports = {
  testEnvironment: 'jsdom',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  moduleDirectories: ['node_modules', 'src'],
  transform: {},
};
