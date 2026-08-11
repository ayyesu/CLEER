module.exports = [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    rules: {
      ...require('@typescript-eslint/eslint-plugin').configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Property[key.name="nodeIntegration"][value.value=true]',
          message: 'nodeIntegration must never be true. Use contextBridge.',
        },
        {
          selector: 'Property[key.name="contextIsolation"][value.value=false]',
          message: 'contextIsolation must always be true.',
        },
        {
          selector: 'Property[key.name="sandbox"][value.value=false]',
          message: 'BrowserWindow sandbox must always be true.',
        },
      ],
    },
  },
];
