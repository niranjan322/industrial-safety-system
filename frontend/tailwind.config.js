/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0f172a',
        darkPanel: '#1e293b',
        safeGreen: '#10b981',
        dangerRed: '#ef4444',
        warningYellow: '#f59e0b',
        primaryBlue: '#3b82f6',
      }
    },
  },
  plugins: [],
}
