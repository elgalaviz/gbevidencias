/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#d6e0fd',
          300: '#afc4fb',
          400: '#7f9ef8',
          500: '#667eea',
          600: '#5568d3',
          700: '#4451b8',
          800: '#39429d',
          900: '#2e3682',
        },
        secondary: {
          500: '#764ba2',
          600: '#663d8f',
        },
      },
    },
  },
  plugins: [],
}
