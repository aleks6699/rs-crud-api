const path = require('path');
module.exports = {
    entry: './src/index.ts',

    target: 'node', 
    mode: 'production',

    module: {
        rules: [
            {
                test: /\.ts$/, 
                use: ['ts-loader'],
                exclude: /node_modules/
            }
        ]
    },
    output: {
      filename: 'index.js',
      path: require('path').resolve(__dirname, 'dist'), 
      clean: true 
  },
  resolve: {
      extensions: ['.ts', '.js'] 
  },
};
