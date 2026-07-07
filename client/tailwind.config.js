/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        glassBg: 'rgba(15, 23, 42, 0.45)',
        neonCyan: '#00f0ff',
        neonPink: '#ff007f',
        neonBlue: '#2563eb',
        neonPurple: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neonCyan: '0 0 15px rgba(0, 240, 255, 0.25)',
        neonPink: '0 0 15px rgba(255, 0, 127, 0.25)',
        neonPurple: '0 0 15px rgba(139, 92, 246, 0.25)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
}
