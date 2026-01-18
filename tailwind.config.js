/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './App.tsx'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)', // Forest Green
        primaryHover: 'var(--color-primary-hover)', // Forest Green Hover
        secondary: 'var(--color-secondary)', // Warm Stone
        accent: 'var(--color-accent)', // Olive Sage
        textMain: 'var(--color-text-primary)', // Dark Gray
        textMuted: 'var(--color-text-muted)', // Medium Gray
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: []
}
