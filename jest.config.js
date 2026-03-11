// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/functions/'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|firebase|@firebase)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Map packages not in devDependencies to manual mocks
    '^expo-notifications$': '<rootDir>/__mocks__/expo-notifications.js',
    '^@react-native-community/netinfo$': '<rootDir>/__mocks__/@react-native-community/netinfo.js',
  },
  collectCoverageFrom: [
    'services/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}',
    '!services/firebase/firebaseConfig.ts',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
    },
  },
};
