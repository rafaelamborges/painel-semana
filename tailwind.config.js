/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        mom: {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#1d4ed8',
        },
        dad: {
          light: '#d1fae5',
          DEFAULT: '#10b981',
          dark: '#065f46',
        },
      },
      fontFamily: {
        sans: ['Lexend', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(16,24,60,0.04), 0 4px 16px 0 rgba(16,24,60,0.05)',
        'card-hover': '0 4px 8px -1px rgba(16,24,60,0.06), 0 12px 28px -3px rgba(16,24,60,0.09)',
        'nav':        '0 -1px 0 0 rgba(16,24,60,0.06), 0 -4px 16px 0 rgba(16,24,60,0.03)',
        'modal':      '0 24px 64px -12px rgba(16,24,60,0.18)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '4xl':   '2rem',
      },
    },
  },
  plugins: [],
}
