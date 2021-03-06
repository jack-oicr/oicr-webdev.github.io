require('babel-polyfill');
const webpack = require('webpack');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const entries = require('../../configs/entries');

// Load custome webpack config
var webpackConfig = (env, config) => config
try {
    webpackConfig = require('../site/webpack.config.js');
} catch (e) {}

module.exports = env => {

    /**
     * Augument entries with 'whatwg-fetch' and 'babel-polyfill'
     */
    const _entries = {}
    Object.keys(entries).forEach((key, i) => {
        if(i == 0){
            _entries[key] = ['babel-polyfill', 'whatwg-fetch'].concat(entries[key]);
        } else {
            _entries[key] = ['whatwg-fetch'].concat(entries[key]);
        }
    });

    // 
    const entriesOrder = { core: 0 };
    Object.keys(entries).forEach((key, i) => {
        entriesOrder[key] = i+1;
    });

    /**
     * Plugin setting
     */
    var plugins = [
        new ExtractTextPlugin('../css/core.bundle.css'),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'core',
            minChunks: Infinity,
        }),
        new HtmlWebpackPlugin({
            excludeChunks: ['base_styles'],
            minify: false,
            chunksSortMode: (e1, e2) => (entriesOrder[e1.names[0]] - entriesOrder[e2.names[0]]),
            filename: path.resolve('../_includes/dist/footer_scripts.inc'),
            template: 'src/core/.empty',
        }),
    ];
    // Production
    if (env.prod) {
        plugins = plugins.concat([
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false,
            }),
            new webpack.DefinePlugin(
                Object.assign({},
                    {},
                    {
                        'process.env': {
                            NODE_ENV: JSON.stringify('production'),
                        }
                    }
                )
            ),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    screw_ie8: true,
                    warnings: false,
                }
            }),
        ])
    }
    // Dev
    else if (env.dev) {
        plugins = plugins.concat([
            new webpack.DefinePlugin({})
        ])
    }

    return webpackConfig(env, {
        entry: _entries,
        output: {
            filename: env.prod ? '[name].[chunkhash].bundle.js' : '[name].[chunkhash].dev.bundle.js',
            path: path.resolve('../assets/dist/js/'),
            publicPath: '/assets/dist/js/',
        },
        resolve: {
            extensions: ['.js', '.jsx', '.yaml'],
        },
        devtool: env.dev ? 'source-map': '',
        module: {
            loaders: [
                {
                    exclude: /(node_modules|bower_components)/,
                    test: /(\.js$|\.jsx$)/,
                    loader: 'babel-loader',
                    query: {
                    plugins: ['transform-decorators-legacy'],
                    presets: ['react', 'es2015-webpack', 'stage-2'],
                    },
                },
                {
                    exclude: /(node_modules|bower_components)/,
                    test: /\.yaml$/,
                    loader: 'yaml-loader',
                },
                {
                    test: /\.json$/,
                    loader: 'json-loader',
                },
                {
                    test: /\.scss$|\.css$/,
                    loader: ExtractTextPlugin.extract('css-loader!sass-loader'),
                },
            ],
        },
        plugins: plugins,
    });
};