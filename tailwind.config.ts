import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(220 14% 90%)',
        muted: 'hsl(220 14% 96%)',
        bg: 'hsl(0 0% 100%)',
        fg: 'hsl(222 47% 11%)',
        accent: 'hsl(217 91% 60%)',
        // 暗色
        'bg-dark': 'hsl(222 47% 7%)',
        'fg-dark': 'hsl(210 40% 98%)',
        'border-dark': 'hsl(220 14% 25%)',
        'muted-dark': 'hsl(220 14% 18%)',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0,0,0,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace','SFMono-Regular','Menlo','monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;




