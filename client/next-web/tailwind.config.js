const { nextui } = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      'header': 'rgba(167, 191, 255, 0.05)',
      'tab': 'rgba(167, 191, 255, 0.1)',
      'real-black': {
        DEFAULT: '#02081D',
      },
      'real-silver': {
        500: '#636A84',
      },
    }
  },
  darkMode: 'class',
  plugins: [nextui({
    defaultTheme: 'dark',
  })],
}
