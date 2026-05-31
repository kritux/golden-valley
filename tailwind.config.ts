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
          DEFAULT: '#D4AF37',
          light: '#E8CC7A',
          dark: '#A68B28',
        },
        green: {
          DEFAULT: '#82BF35',
          neon: '#8FFF3A',
        },
        black: {
          DEFAULT: '#0B0B0B',
          surface: '#111111',
          card: '#171717',
          border: '#222222',
        },
        white: {
          DEFAULT: '#FFFFFF',
          muted: '#A0A0A0',
        },
        success: '#82BF35',
        error: '#DC2626',
      },
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #A68B28, #D4AF37, #E8CC7A)',
        'neon-gradient': 'linear-gradient(135deg, #82BF35, #8FFF3A)',
        'gold-shimmer': 'linear-gradient(105deg, transparent 40%, rgba(212,175,55,0.3) 50%, transparent 60%)',
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
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(143,255,58,0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(143,255,58,0.3)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(212,175,55,0.3)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'count-up': 'count-up 0.6s ease forwards',
        'fade-in': 'fade-in 0.8s ease forwards',
        'pulse-neon': 'pulse-neon 2s infinite',
        'pulse-gold': 'pulse-gold 2s infinite',
      },
    },
  },
  plugins: [],
}

export default config
