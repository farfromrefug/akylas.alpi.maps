const path = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TsConfigPathsPlugin = require('tsconfig-paths-webpack-plugin');


function titaniumTarget(compiler) {
    var options = this;
    var webpackLib = 'webpack/lib';

    var JsonpTemplatePlugin = require(webpackLib + '/web/JsonpTemplatePlugin');
    var FunctionModulePlugin = require(webpackLib + '/FunctionModulePlugin');
    var LoaderTargetPlugin = require(webpackLib + '/LoaderTargetPlugin');

    compiler.apply(new JsonpTemplatePlugin(options.output), new FunctionModulePlugin(options.output), new LoaderTargetPlugin('web'));
}

function IgnoreUnresolvedPlugin() {}

IgnoreUnresolvedPlugin.prototype.apply = function(compiler) {
    compiler.plugin('compilation', function(compilation, data) {
        data.normalModuleFactory.plugin('parser', function(parser) {
            parser.plugin('call require', function(params) {
                if (params.arguments.length !== 1) {
                    return;
                }

                const param = this.evaluateExpression(params.arguments[0]);

                if (!param.isString() && !param.isConditional()) {
                    return true;
                }
            });
        });
    });
};

module.exports = env => {
    const Resources = path.resolve(__dirname, 'Resources');
    const platform = env.platform;
    const platformBuildDir = platform.replace('ios', 'iphone');
    const target = env.target;
    const deployType = env.deployType;
    const nodejs = path.join(__dirname, 'plugins/akylas.nodejs/1.0.0/Resources');
    const tsConfigFile = path.join(__dirname, 'tsconfig.json');
    const config = {
        mode: 'none',
        stats: 'minimal',
        performance: {
            hints: false
        },
        entry: './app.ts',
        context: Resources,
        output: {
            libraryTarget: 'commonjs',
            libraryExport: 'default',
            pathinfo: true,
            filename: 'app.js',
            path: __dirname + '/dist'
        },
        // devtool: 'sourcemap',
        resolve: {
            extensions: ['.ts', '.js', '.json'],
            plugins:[new TsConfigPathsPlugin({ configFile: tsConfigFile })],
            modules: [Resources, nodejs, path.join(Resources, 'node_modules'), path.join(__dirname, 'build', platformBuildDir, 'rjss')]
        },
        target: titaniumTarget,
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    loader: 'ts-loader',
                    options: {
                        configFile: tsConfigFile,
                        transpileOnly: true
                    }
                }
            ]
        },
        // externals: ['akylas.statusbarnotification', 'akylas.zoomableimage'],
        plugins: [
            new IgnoreUnresolvedPlugin(),
            new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /fr/),
           
            // new BundleAnalyzerPlugin({
            //     analyzerMode: 'static',
            //     openAnalyzer: false,
            //     generateStatsFile: true,
            //     reportFilename: path.join(__dirname, 'report', `report.html`),
            //     statsFilename: path.join(__dirname, 'report', `stats.json`)
            // })
        ]
    };
    if (deployType === 'development') {
        config.plugins.unshift(
            new webpack.IgnorePlugin(/rjss\.compiled/)
        );
    } else {
        config.plugins.push( new UglifyJsPlugin({
            uglifyOptions: {
                mangle:true,
                output: {
                    beautify: false
                },
                keep_classnames: true
            }
        }));
    }
    return config;
};
