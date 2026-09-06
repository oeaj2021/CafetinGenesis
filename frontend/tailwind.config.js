/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        genesis: {
          50: '#fbf7ee',
          100: '#f5ecd6',
          200: '#ebd6ad',
          300: '#dfbc7d',
          400: '#d4a253',
          500: '#c58735',
          600: '#aa6c2b',
          700: '#895025',
          800: '#714124',
          900: '#5e3721',
          950: '#341c10',
        }
      }
    },
  },
  plugins: [],
}
