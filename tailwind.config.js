/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--bg-app)',
        surface2: 'var(--bg-panel)',
        edge: 'var(--border)',
        ink: 'var(--text)',
        ink2: 'var(--text-dim)',
        ink3: 'var(--text-faint)',
        field: 'var(--field-bg)',
        fieldEdge: 'var(--field-border)',
        inkOnGold: '#08201C',
        gold: {
          300: '#7DE8D8',
          400: '#2DD4BF',
          500: '#0F9C8C',
          600: '#0B7A6E',
        },
        silver: {
          300: '#D6DEE8',
          400: '#9FB0C3',
          500: '#64748B',
          600: '#47566B',
        },
      },
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        arabic: ['"Tajawal"', 'sans-serif'],
      },
      boxShadow: {
        panel: 'var(--panel-shadow)',
      },
    },
  },
  plugins: [],
}
