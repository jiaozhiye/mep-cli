/**
 * @Author: 焦质晔
 * @Date: 2019-06-20 10:00:00
 * @Last Modified by: 焦质晔
 * @Last Modified time: 2021-06-05 14:15:44
 */
'use strict';

const path = require('path');
const utils = require('./utils');
const webpack = require('webpack');
const config = require('../config');
const merge = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssnanoPlugin = require('@intervolga/optimize-cssnano-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

process.env.NODE_ENV = 'production';

const webpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  performance: {
    hints: false
  },
  module: {
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      usePostCSS: true,
      extract: true
    })
  },
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
    filename: utils.assetsPath('js/[name].[contenthash:8].js'),
    chunkFilename: utils.assetsPath('js/[name].[contenthash:8].js')
  },
  optimization: {
    minimize: true,
    runtimeChunk: true,
    minimizer: [
      new TerserPlugin({
        // cache: true,
        parallel: true,
        // sourceMap: config.build.productionSourceMap,
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      })
    ],
    splitChunks: {
      chunks: 'all', // 默认值`async`，只处理异步模块；`all`对所有模块生效；`initial`只处理同步模块，对于异步导入的文件不处理
      cacheGroups: {
        vendors: {
          name: 'app.vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: -10
        },
        common: {
          name: 'app.common',
          minChunks: 2, // 最小被引用的次数
          priority: -20, // 优先级，多个分组冲突时决定把代码放在哪块
          reuseExistingChunk: true // 是否重用已经存在的模块
        },
        libs: {
          name: 'app.libs',
          test: module => {
            return /echarts|exceljs|xlsx/.test(module.context);
          },
          priority: 10
        }
      }
    }
  },
  plugins: [
    // extract css into its own file
    new MiniCssExtractPlugin({
      filename: utils.assetsPath('css/[name].[contenthash:8].css'),
      chunkFilename: utils.assetsPath('css/[name].[contenthash:8].css')
    }),
    // css build and minimize
    new OptimizeCssnanoPlugin({
      sourceMap: config.build.productionSourceMap,
      cssnanoOptions: {
        preset: [
          'default',
          {
            mergeLonghand: false,
            cssDeclarationSorter: false
          }
        ]
      }
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    new HtmlWebpackPlugin({
      filename: config.build.index,
      template: 'public/index.html',
      favicon: 'public/favicon.ico',
      inject: true,
      minify: {
        removeComments: true
      },
      templateParameters: {
        BASE_URL: config.build.assetsPublicPath + config.build.assetsSubDirectory,
        THEME_COLOR: config.primaryColor
      }
    }),
    new Dotenv({
      path: utils.resolve('.env.prod')
    }),
    // keep module.id stable when vendor modules does not change
    new webpack.HashedModuleIdsPlugin({
      hashDigest: 'hex'
    }),
    // copy custom static assets
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ]),
    new CleanWebpackPlugin()
  ]
});

if (config.build.productionGzip) {
  const CompressionWebpackPlugin = require('compression-webpack-plugin');
  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      algorithm: 'gzip',
      test: new RegExp('\\.(' + config.build.productionGzipExtensions.join('|') + ')$'),
      threshold: 10240,
      minRatio: 0.8
    })
  );
}

module.exports = webpackConfig;
