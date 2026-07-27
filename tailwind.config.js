/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Display lúdica — UserInterface.md §3.2: só títulos, timer, placar.
        display: ['"Fredoka Variable"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
