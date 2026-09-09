/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"M PLUS Rounded 1c"', '"Zen Kaku Gothic New"', 'system-ui', 'sans-serif'],
        sans: ['"Zen Kaku Gothic New"', '"Hiragino Kaku Gothic ProN"', '"Yu Gothic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: 'var(--color-cream)',
        paper: 'var(--color-paper)',
        sand: {
          DEFAULT: 'var(--color-sand)',
          deep: 'var(--color-sand-deep)',
        },
        bark: 'var(--color-bark)',
        espresso: 'var(--color-espresso)',
        cocoa: 'var(--color-cocoa)',
        latte: 'var(--color-latte)',
        caramel: {
          DEFAULT: 'var(--color-caramel)',
          deep: 'var(--color-caramel-deep)',
        },
        clay: 'var(--color-clay)',
        moss: {
          DEFAULT: 'var(--color-moss)',
          deep: 'var(--color-moss-deep)',
        },
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
      },
    },
  },
  plugins: [],
}