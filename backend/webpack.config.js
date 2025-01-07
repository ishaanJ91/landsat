module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
        exclude: [
          /node_modules\/d3-geo-voronoi/,
          /node_modules\/d3-scale/,
          /node_modules\/d3-time/,
          /node_modules\/three-globe/,
        ],
      },
    ],
  },
};
