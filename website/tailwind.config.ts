import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        cool: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        surface: {
          DEFAULT: '#0D0E13',
          raised: '#12141C',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(16, 185, 129, 0.35)',
        'glow-lg': '0 0 80px -12px rgba(6, 182, 212, 0.4)',
      },
    },
  },
  plugins: [],
} satisfies Config;
