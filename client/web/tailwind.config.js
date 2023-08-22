// tailwind.config.js
const {nextui} = require("@nextui-org/theme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // single component styles
    "./node_modules/@nextui-org/theme/dist/components/navbar.js", 
    "./node_modules/@nextui-org/theme/dist/components/button.js", 
    "./node_modules/@nextui-org/theme/dist/components/dropdown.js", 

    "./node_modules/@nextui-org/theme/dist/components/avatar.js", 

    // instead of installing all of nextui we install only the components we need, and every time you install a new component simply copy the previous line and replace with the name of component you installed"
    
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui()],
};