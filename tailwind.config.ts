import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8CC7A',
          dark: '#8B6914',
        },
        black: {
          DEFAULT: '#0A0A0A',
          surface: '#111111',
          card: '#1A1A1A',
          border: '#2A2A2A',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          muted: '#A89F8F',
        },
        success: '#2D6A4F',
        error: '#7B2D2D',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #8B6914, #C9A84C, #E8CC7A)',
        'gold-shimmer': 'linear-gradient(105deg, transparent 40%, rgba(201,168,76,0.3) 50%, transparent 60%)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(201,168,76,0.3)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'count-up': 'count-up 0.6s ease forwards',
        'fade-in': 'fade-in 0.8s ease forwards',
        'pulse-gold': 'pulse-gold 2s infinite',
      },
    },
  },
  plugins: [],
}

export default config
