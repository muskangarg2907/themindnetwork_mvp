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
        primary: '#0d9488', // Teal-600
        primaryHover: '#0f766e', // Teal-700
        secondary: '#f1f5f9', // Slate-100
        accent: '#f0f9ff', // Sky-50
        textMain: '#1e293b', // Slate-800
        textMuted: '#64748b', // Slate-500
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
