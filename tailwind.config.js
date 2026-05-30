/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FEF5EE',
          100: '#FDEBD8',
          200: '#FCD4B1',
          300: '#FFB27D',
          400: '#F0875A',
          500: '#C85D3D',   // terracotta — cor principal
          600: '#A84832',   // terracotta escuro — sidebar, header
          700: '#8A3727',
          800: '#6E2B1E',
          900: '#521F16',
          950: '#3D1710',
        },
        warm: {
          50:  '#EAF4F6',
          100: '#C8E5EB',
          200: '#90CBD5',
          300: '#52ACBC',
          400: '#2A8FA3',
          500: '#1A7A8C',   // teal — sotaque de ação
          600: '#0F4C5C',
          700: '#0A3A47',
          800: '#072D38',
        },
        sage: {
          50:  '#F2F7F2',
          100: '#E0EDE1',
          200: '#C0D4C2',
          300: '#98B89A',
          400: '#7AA07C',
          500: '#5F8A62',
        },
        cream: {
          50:  '#FFFDF7',
          100: '#FFF8ED',
          200: '#FFE6A7',
          300: '#FFD56B',
        },
        steel: {
          300: '#8AACBE',
          400: '#5D7A8C',
          500: '#4A6475',
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
        'card':       '0 1px 3px 0 rgba(168,72,50,0.05), 0 4px 16px 0 rgba(168,72,50,0.07)',
        'card-hover': '0 4px 8px -1px rgba(168,72,50,0.08), 0 12px 28px -3px rgba(168,72,50,0.12)',
        'nav':        '0 -1px 0 0 rgba(168,72,50,0.08), 0 -4px 16px 0 rgba(168,72,50,0.04)',
        'modal':      '0 24px 64px -12px rgba(168,72,50,0.20)',
      },
      borderRadius: {
        '2.5xl': '20px',
        '4xl':   '2rem',
      },
    },
  },
  plugins: [],
}
