//path モジュールの読み込み
const path = require('path');
//cssファイルの出力用
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
//パッケージのライセンス情報をjsファイルに含める
const TerserPlugin = require('terser-webpack-plugin');
//画像のコピー用
const CopyPlugin = require('copy-webpack-plugin');
// HTMLの読み込み用
const HtmlWebpackPlugin = require('html-webpack-plugin');
//読み込むファイルを複数指定する用
const WebpackWatchedGlobEntries = require('webpack-watched-glob-entries-plugin');

const enabledSourceMap = process.env.NODE_ENV !== 'production';

const filePath = {
    js: './src/js/',
    pug: './src/pug/',
    sass: './src/scss/',
};

/* Sassファイル読み込みの定義*/
const entriesScss = WebpackWatchedGlobEntries.getEntries([path.resolve(__dirname, `${filePath.sass}**/**.scss`)], {
    ignore: path.resolve(__dirname, `${filePath.sass}**/_*.scss`),
})();

const cssGlobPlugins = (entriesScss) => {
    return Object.keys(entriesScss).map(
        (key) =>
            new MiniCssExtractPlugin({
                //出力ファイル名
                filename: `./css/${key}.css`,
            })
    );
};

/* Pug読み込みの定義 */
const entries = WebpackWatchedGlobEntries.getEntries([path.resolve(__dirname, `${filePath.pug}**/*.pug`)], {
    ignore: path.resolve(__dirname, `${filePath.pug}**/_*.pug`),
})();
const htmlGlobPlugins = (entries) => {
    return Object.keys(entries).map(
        (key) =>
            new HtmlWebpackPlugin({
                //出力ファイル名
                filename: `${key}.html`,
                template: `${filePath.pug}${key}.pug`,
                //JS・CSS自動出力と圧縮を無効化
                inject: false,
                minify: false,
            })
    );
};

//TypeScript読み込みの定義
const entriesTS = WebpackWatchedGlobEntries.getEntries([path.resolve(__dirname, `${filePath.js}*.ts`)])();

const app = {
    entry: entriesTS,
    //出力先
    output: {
        publicPath: '',
        filename: './js/[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    //仮想サーバーの設定 ※これはver4の書き方になるので注意。ver3と書き方が違う
    devServer: {
        //ルートディレクトリの指定
        static: path.resolve(__dirname, 'src'),
        hot: true,
        open: true,
        //バンドルされたファイルを出力するかどうか。お好みで。
        //writeToDisk: true
        // target: 'web', //targetは'web'にする
    },
    //パッケージのライセンス情報をjsファイルの中に含める
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.pug$/,
                use: [
                    {
                        loader: 'pug-loader',
                        options: {
                            pretty: true,
                        },
                    },
                ],
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                // 対象となるファイルの拡張子(scss)
                test: /\.(sa|sc|c)ss$/,
                // Sassファイルの読み込みとコンパイル
                use: [
                    // CSSファイルを抽出するように MiniCssExtractPlugin のローダーを指定
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    // CSSをバンドルするためのローダー
                    {
                        loader: 'css-loader',
                        options: {
                            //URL の解決を無効に
                            url: false,
                            // production モードでなければソースマップを有効に
                            sourceMap: enabledSourceMap,
                            // postcss-loader と sass-loader の場合は2を指定
                            importLoaders: 2,
                            // 0 => no loaders (default);
                            // 1 => postcss-loader;
                            // 2 => postcss-loader, sass-loader
                        },
                    },
                    // PostCSS（autoprefixer）の設定
                    {
                        loader: 'postcss-loader',
                        options: {
                            // PostCSS でもソースマップを有効に
                            sourceMap: enabledSourceMap,
                            postcssOptions: {
                                // ベンダープレフィックスを自動付与
                                plugins: [require('autoprefixer')({ grid: true })],
                            },
                        },
                    },
                    // Sass を CSS へ変換するローダー
                    {
                        loader: 'sass-loader',
                        options: {
                            //  production モードでなければソースマップを有効に
                            sourceMap: enabledSourceMap,
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name].[contenthash:7][ext]'
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                type: 'asset/resource',
                generator: {
                    filename: 'fonts/[name].[contenthash:7][ext]'
                }
            },
        ],
    },
    // import 文で .ts ファイルを解決するため
    // これを定義しないと import 文で拡張子を書く必要が生まれる。
    resolve: {
        // 拡張子を配列で指定
        extensions: ['.ts', '.js'],
    },
    target: 'web',
    //プラグインの設定
    plugins: [
        ...cssGlobPlugins(entriesScss),
        ...htmlGlobPlugins(entries),
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'src/images/'),
                    to: path.resolve(__dirname, 'dist/images'),
                },
            ],
        }),
    ],
    //source-map タイプのソースマップを出力
    devtool: 'source-map',
    // node_modules を監視（watch）対象から除外
    watchOptions: {
        ignored: /node_modules/, //正規表現で指定
    },
};

module.exports = app;
