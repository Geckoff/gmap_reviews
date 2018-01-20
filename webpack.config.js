var path = require('path');

module.exports = {
    entry: './src/js/script.js',
    output: {
        filename: './src/js/bundle.js' 
    },
    watch: true,
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    }
};