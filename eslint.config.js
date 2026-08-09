export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Property[key.name="nodeIntegration"][value.value=true]',
          message:
            'nodeIntegration must never be true. Use contextBridge for Main↔Renderer communication.',
        },
        {
          selector:
            'Property[key.name="contextIsolation"][value.value=false]',
          message:
            'contextIsolation must always be true. Disabling it exposes Node APIs to renderer.',
        },
        {
          selector:
            'Property[key.name="sandbox"][value.value=false]',
          message:
            'BrowserWindow sandbox must always be true.',
        },
      ],
    },
  },
];
