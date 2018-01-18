var path = require('path');

module.exports = {
    entry: './script.js',
    output: {
        filename: './bundle.js' 
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