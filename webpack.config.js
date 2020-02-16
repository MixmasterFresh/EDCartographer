const path = require('path');

module.exports = {
    entry: './js/index.js',
    module: {
        rules: [
            {
                test: /\.vert$/i,
                use: 'raw-loader',
            },
            {
                test: /\.frag$/i,
                use: 'raw-loader',
            },
        ],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        three: 'THREE'
    }
};
