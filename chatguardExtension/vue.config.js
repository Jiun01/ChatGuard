const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})

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
    }
  }
}