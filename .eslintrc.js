module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint'],
  env: {
    es2022: true,
    node: true,
    browser: true,
  },
  globals: {
    __DEV__: 'readonly',
    process: 'readonly',
    fetch: 'readonly',
  },
  rules: {
    // Downgrade no-explicit-any to warning — shim files need it
    '@typescript-eslint/no-explicit-any': 'warn',
    // Allow unused vars prefixed with _ (conventional ignore)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Consistent type imports
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    // No console.log in production code (warn so CI can report but not fail)
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    // General style
    'eqeqeq': ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error',
  },
  overrides: [
    {
      // Relax rules in test files
      files: ['__tests__/**/*.{ts,tsx}', '*.test.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      // Relax rules in type shim files
      files: ['types/**/*.d.ts', 'global.d.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-var': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules/', 'functions/', '.expo/', 'dist/', 'coverage/'],
};
