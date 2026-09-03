/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        gold: {
          50: '#FBF7E8',
          100: '#F5EDC7',
          200: '#EBD98A',
          300: '#E0C44D',
          400: '#D4AF37',
          500: '#B8902A',
          600: '#96701F',
          700: '#73521A',
          800: '#503916',
          900: '#2E2010',
        },
        navy: {
          50: '#F1F5F9',
          100: '#E2E8F0',
          200: '#CBD5E1',
          300: '#94A3B8',
          400: '#64748B',
          500: '#475569',
          600: '#334155',
          700: '#1E293B',
          800: '#0F172A',
          900: '#020617',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        danger: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          500: '#F43F5E',
          600: '#E11D48',
          700: '#BE123C',
        },
        info: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        neutral: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      borderRadius: {
        card: '1rem',
        modal: '1.5rem',
        input: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)',
        cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
        glow: '0 0 0 1px rgb(212 175 55 / 0.2), 0 8px 24px -8px rgb(212 175 55 / 0.35)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(15 23 42 / 0.05)',
        focus: '0 0 0 3px rgb(212 175 55 / 0.35)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #E0C44D 0%, #D4AF37 50%, #B8902A 100%)',
        'gold-shine': 'linear-gradient(110deg, transparent 33%, rgb(255 255 255 / 0.25) 50%, transparent 67%)',
        'navy-gradient': 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        'navy-radial': 'radial-gradient(ellipse at top, #1E293B 0%, #020617 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-mobile': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'mesh-1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, -3%) scale(1.05)' },
        },
        'mesh-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-3%, 2%) scale(1.08)' },
        },
        'mesh-3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(1%, 1%) scale(1.03)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up-mobile': 'slide-up-mobile 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'mesh-1': 'mesh-1 18s ease-in-out infinite',
        'mesh-2': 'mesh-2 22s ease-in-out infinite',
        'mesh-3': 'mesh-3 26s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      ringColor: {
        DEFAULT: 'rgb(212 175 55 / 0.6)',
      },
      ringOffsetColor: {
        DEFAULT: '#FFFFFF',
      },
    },
  },
  plugins: [],
};
