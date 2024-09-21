const { default: theme } = require("@material-tailwind/react/theme");
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    colors: {
      'primary':'#0d1117'
    },
    extend: {},
  },
  plugins: [],
}); 