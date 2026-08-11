import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));

function replaceNodeGlobals(): Plugin {
  return {
    name: 'replace-node-globals',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk.type === 'chunk') {
          chunk.code = chunk.code.replace(/\b__dirname\b/g, '"[renderer]"');
          chunk.code = chunk.code.replace(/\b__filename\b/g, '"[renderer]"');
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), replaceNodeGlobals()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_TAG__: JSON.stringify(`v${pkg.version}`),
  },
});
