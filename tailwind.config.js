/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ah: {
          blue: "#00A1E4",
          blueDark: "#007bb0",
          blueLight: "#e5f6fd",
          orange: "#F26C23",
          orangeDark: "#d55410",
          gray: "#f4f6f8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      screens: {
        'print': {'raw': 'print'},
      }
    },
  },
  plugins: [],
}
