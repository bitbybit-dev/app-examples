module.exports = {
    module: {
        rules: [
            {
                test: /\.wasm$/,
                type: "javascript/auto",
                loader: "file-loader",
            }
        ]
    },
    resolve: {
        fallback: {
            fs: false,
            path: false,
            crypto: false
        }
    }
};
