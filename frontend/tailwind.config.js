/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          navy: '#0F172A',
          maroon: '#800000',
          blue: '#1E40AF',
          amber: '#F59E0B',
          emerald: '#10B981',
          crimson: '#DC2626',
        }
      }
    },
  },
  plugins: [],
}
