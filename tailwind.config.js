/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Marca (fixas, do brand book)
        nevoa:    '#ECEEFF',
        aurora:   '#FFE8EE',
        profundo: '#1E1B4B',
        penumbra: '#9896B0',

        // Bússola (marca, ação, acento)
        bussola: {
          DEFAULT: '#6B5CE7',
          50:  '#F1EFFE',
          100: '#E7E4FC',
          200: '#D4CDF9',
          300: '#B7ACF3',
          400: '#9384EE',
          500: '#6B5CE7',
          600: '#5A4BD6',
          700: '#4F43C4',
          800: '#3E349A',
          900: '#2A226D',
          hover:  '#5A4BD6',
          press:  '#4F43C4',
          wash:   '#F1EFFE',
          select: '#F4F2FE',
        },

        // Retrocompatibilidade — `brand.*` aponta para o mesmo espectro da Bússola
        // para que classes existentes (`bg-brand-600`, `text-brand-700` etc.) continuem
        // funcionando enquanto migramos.
        brand: {
          DEFAULT: '#6B5CE7',
          50:  '#F1EFFE',
          100: '#E7E4FC',
          200: '#D4CDF9',
          300: '#B7ACF3',
          400: '#9384EE',
          500: '#6B5CE7',
          600: '#5A4BD6',
          700: '#4F43C4',
          800: '#3E349A',
          900: '#2A226D',
          950: '#1E1B4B',
        },

        // Guardião — só interface (período, autoria, filtro)
        guardiaoA: { DEFAULT: '#5B8FF9', tint: 'rgba(91,143,249,0.16)' },
        guardiaoB: { DEFAULT: '#4DC9B8', tint: 'rgba(77,201,184,0.16)' },

        // Retrocompatibilidade — mom/dad apontando para os novos guardiões
        mom: { light: 'rgba(91,143,249,0.16)', DEFAULT: '#5B8FF9', dark: '#3D6FE0' },
        dad: { light: 'rgba(77,201,184,0.16)', DEFAULT: '#4DC9B8', dark: '#2FA895' },

        // Interface derivada
        ink: {
          DEFAULT: '#1E1B4B',
          body:    '#3C3966',
          soft:    '#5A5780',
          mute:    '#9896B0',
        },
        page: '#F7F8FF',
        linha: {
          DEFAULT: '#E9EBFB',
          suave:   '#F1F2FB',
        },
        alerta: '#C2536E',
      },

      fontFamily: {
        display: ['Newsreader', 'Georgia', 'serif'],
        sans:    ['Lexend', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },

      borderRadius: {
        card:  '16px',
        btn:   '12px',
        faixa: '20px',
      },

      boxShadow: {
        modal: '0 24px 64px -12px rgba(30,27,75,0.18)',
      },

      backgroundImage: {
        marca:       'linear-gradient(145deg,#ECEEFF 0%,#F4EDF6 55%,#FFE8EE 100%)',
        placeholder: 'repeating-linear-gradient(135deg,#ECEEFF 0 6px,#F7F8FF 6px 12px)',
      },

      spacing: { 18: '4.5rem' },
    },
  },
  plugins: [],
}
