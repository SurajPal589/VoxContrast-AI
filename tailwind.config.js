/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          bg: '#030712',      // Deep slate-950 / pitch black
          surface: '#0B0F19', // Slightly lighter panel surface
          card: '#111827',    // Card background
          border: '#1F2937',  // Crisp border
          subtle: '#374151',  // Subtle accent
        },
        ideal: {
          light: '#34d399',   // emerald-400
          DEFAULT: '#10b981', // emerald-500
          dark: '#064e3b',    // deep emerald
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        flaw: {
          filler: '#f59e0b',  // amber-500
          pacing: '#f43f5e',  // rose-500
          monotony: '#a855f7',// purple-500
          hesitation: '#ef4444', // red-500
          rhetoric: '#ec4899', // pink-500
        },
        telemetry: {
          cyan: '#22d3ee',    // cyan-400
          blue: '#38bdf8',    // sky-400
          glow: 'rgba(34, 211, 238, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        scanline: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanline': 'scanline 2s linear infinite',
      }
    },
  },
  plugins: [],
}
