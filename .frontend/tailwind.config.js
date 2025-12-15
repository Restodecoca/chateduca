/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f4f8',
          100: '#d1e9f1',
          200: '#a3d3e3',
          300: '#75bdd5',
          400: '#4a90e2',
          500: '#3a7bc8',
          600: '#2e62a0',
          700: '#224a78',
          800: '#163150',
          900: '#0a1928',
        },
      },
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
