const { default: theme } = require("@material-tailwind/react/theme");
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    colors: {
      'primary': '#0d1117'
    },
    extend: {
      borderWidth: {
        '1': '1px', // Configure 1px border width
      },
    },
  },
  plugins: [],
});