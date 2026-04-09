/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        roseM:      "#e8318a",
        roseMHover: "#c92878",
        roseMLight: "#f472b6",
        roseMPale:  "#fce7f3",
        roseMBg:    "#fdf2f8",
      },
      fontFamily: {
        nunito: ["Nunito", "sans-serif"],
      },
    },
  },
  plugins: [],
};
