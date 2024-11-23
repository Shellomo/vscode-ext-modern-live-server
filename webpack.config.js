const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode',
    fsevents: "require('fsevents')",
    bufferutil: "require('bufferutil')",
    'utf-8-validate': "require('utf-8-validate')"
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  ignoreWarnings: [
    {
      module: /express\/lib\/view\.js$/,
      message: /the request of a dependency is an expression/
    }
  ],
  optimization: {
    minimize: false
  }
};