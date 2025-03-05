const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  pages: {
    popup: {
      template: 'public/index.html',
      entry: './src/main.js',
      title: 'ChatGuard'
    }
  },
  filenameHashing: false,
  configureWebpack: {
    output: {
      filename: '[name].js',
      chunkFilename: '[name].js'
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: path.resolve(__dirname, 'src/contentScript.js'),
            to: path.resolve(__dirname, 'dist')
          },
          { 
            from: path.resolve(__dirname, 'src/background.js'),
            to: path.resolve(__dirname, 'dist')
          }
        ]
      })
    ]
  }
}