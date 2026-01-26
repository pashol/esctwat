/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'twitter-blue': '#1DA1F2',
        'twitter-dark': '#14171A',
        'twitter-gray': '#657786',
        'twitter-light': '#F5F8FA',
      },
    },
  },
  plugins: [],
}