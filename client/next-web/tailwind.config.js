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
      'tab': 'rgba(167, 191, 255, 0.2)',
      'button': 'rgba(188, 207, 254, 0.1)',
      'divider': 'rgba(99, 106, 132, 0.3)',
      'dropdown': '#1e2643',
      'dropdownHover': 'rgba(103, 133, 211, 0.3)',
      'modalBG': '#050e2e',
      'real-black': {
        DEFAULT: '#02081D',
      },
      'real-silver': {
        300: '#BEC5D9',
        500: '#636A84',
      },
      'real-blue': {
        100: '#EEF3FF',
        300: '#C2D3FF',
        500: '#6785D3',
      },
      'real-contrastBlue': {
        DEFAULT: '#1F4FCC',
      },
      'real-orange': {
        500: '#F24B2A',
        700: '#D33414',
      },
      'real-dark': {
        trending: '#1c2733',
        search: '#283340',
        4: '#3A444C',
        6: '#8899A6',
      }
    }
  },
  darkMode: 'class',
  plugins: [nextui({
    defaultTheme: 'dark',
    addCommonColors: true,
    themes: {
      dark: {
        colors: {
          background: '#02081D',
          warning: '#FAAD14',
        }
      }
    }
  })],
}
