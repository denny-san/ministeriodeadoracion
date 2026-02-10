module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1754cf',
        'accent-gold': '#D4AF37',
        'church-navy': '#0a1f44',
        'navy-dark': '#0f172a',
        'background-light': '#f6f6f8',
        'background-dark': '#111621',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
