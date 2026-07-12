import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    'grid',
    'grid-cols-2',
    'grid-cols-4',
    'md:grid-cols-4',
    'gap-2',
    'mb-2',
    'mb-6',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config