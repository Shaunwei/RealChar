const { nextui } = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
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
      header: 'rgba(167, 191, 255, 0.05)',
      tab: 'rgba(167, 191, 255, 0.2)',
      button: 'rgba(188, 207, 254, 0.1)',
      divider: 'rgba(99, 106, 132, 0.3)',
      dropdown: '#1e2643',
      dropdownHover: 'rgba(103, 133, 211, 0.3)',
      modalBG: '#050e2e',
      modalBorder: 'rgba(194, 211, 255, 0.3)',
      'real-black': {
        DEFAULT: '#02081D',
      },
      'real-silver': {
        500: '#636A84',
      },
      'real-blue': {
        700: '#344778',
        500: '#6785D3',
        300: '#C2D3FF',
      },
      'real-contrastBlue': {
        DEFAULT: '#1F4FCC',
      },
      neutral: {
        500: '#858585',
      },
    },
  },
  darkMode: 'class',
  plugins: [
    nextui({
      defaultTheme: 'dark',
      addCommonColors: true,
      themes: {
        dark: {
          colors: {
            background: '#02081D',
            warning: '#FAAD14',
          },
        },
      },
    }),
  ],
};
