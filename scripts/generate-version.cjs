const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));

const versionContent = `// Auto-generated at build time - do not edit
export const VERSION = '${pkg.version}';
export const TAG = 'v${pkg.version}';
export const RELEASE_DATE = '${new Date().toISOString()}';

export interface Asset {
  name: string;
  url: string;
}

export const ASSETS: Asset[] = [
  { name: 'CLEER-Setup-${pkg.version}.exe', url: 'https://github.com/ayyesu/CLEER/releases/latest/download/CLEER-Setup-${pkg.version}.exe' },
  { name: 'CLEER-${pkg.version}-arm64.dmg', url: 'https://github.com/ayyesu/CLEER/releases/latest/download/CLEER-${pkg.version}-arm64.dmg' },
  { name: 'CLEER-${pkg.version}-x86_64.AppImage', url: 'https://github.com/ayyesu/CLEER/releases/latest/download/CLEER-${pkg.version}-x86_64.AppImage' },
];
`;

fs.writeFileSync(path.join(__dirname, '../website/src/version.ts'), versionContent);
console.log(`Generated version.ts for v${pkg.version}`);
