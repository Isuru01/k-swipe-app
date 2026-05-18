/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#1A1A1A',
        success: '#00FFC2', // Carbon Mint
        error: '#EF5777', // Cyber Rose
        accent: '#00E5E5', // Iridescent Cyan
      },
      fontFamily: {
        'jakarta': ['PlusJakartaSans-Regular', 'sans-serif'],
        'jakarta-bold': ['PlusJakartaSans-Bold', 'sans-serif'],
        'tenada': ['Tenada', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
