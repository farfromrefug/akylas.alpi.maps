const path = require("path");
const webpack = require("webpack");
const glob = require("glob");
const _ = require('lodash');
const {
    TsConfigPathsPlugin,
    CheckerPlugin
} = require('awesome-typescript-loader');
const Resources = path.resolve(__dirname, "Resources");
const nodejs = "/Volumes/data/dev/titanium/modules/akylas_modules/nodejs/Resources";
const test  = Object.assign({},
    _.reduce(glob.sync(path.join(Resources, "ui", "*.ts")),
        (obj, val) => {
            val = path.relative(Resources, val);
            obj[val.split('.').slice(0, -1).join('.')] = "./" + val;
            return obj;
        }, {}), {
        app: "./app.ts",
        // vendor: [
            // 'lodash'
        // ]
    }
)
console.log('test', test);
module.exports = {
    // entry: "./app.ts",
    entry: test,
    context: Resources,
    output: {
        libraryTarget: "commonjs",
        pathinfo: true,
        filename: "bundle.js",
        path: __dirname + "/dist"
    },
    devtool: "sourcemap",
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".js", ".json"],
        modules: [
            "/Volumes/data/dev/titanium/modules/akylas_modules/nodejs/Resources",
            path.join(Resources, "node_modules")
          ],
          alias:{
              "process": path.resolve(nodejs, "process.js"),
              "buffer": path.resolve(nodejs, "buffer.ts"),
              "events": path.resolve(nodejs, "events.js"),
              "path": path.resolve(nodejs, "path.js"),
              "os": path.resolve(nodejs, "os.ts"),
              "fs": path.resolve(nodejs, "fs.ts"),
              "inherits": path.resolve(nodejs, "inherits.js"),
              "utils": path.resolve(nodejs, "utils.ts"),
          }
    },
    externals: [
        /^akylas\.commonjs.*$/
    ],
    target:() => undefined,
    // Add the loader for .ts files.
    module: {
        rules: [{
            test: /\.(ts)$/,
            loader: 'awesome-typescript-loader',
             exclude: [/locale/],
            include: [
                path.resolve(__dirname, "Resources")
            ]
        // }, {
        //     test: /\.(ts)$/,
        //     loader: 'awesome-typescript-loader',
        //     include: [
        //         "/Volumes/data/dev/titanium/modules/akylas_modules/nodejs/Resources"
        //     ]
        }],
    },
    plugins: [
        new TsConfigPathsPlugin( /* { configFileName, compiler } */ ),
        new CheckerPlugin(),
        // new webpack.LoaderOptionsPlugin({
        //     debug: true
        // }),
        // new webpack.DefinePlugin({
        //     DEBUG: true,
        //     PRODUCTION: false
        // })
    ]
};