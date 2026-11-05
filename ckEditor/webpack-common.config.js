/**
 * Webpack config for ForumMagnum compiling CkEditor.
 *
 * @license Copyright (c) 2003-2019, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */
'use strict';

/* eslint-env node */

const path = require( 'path' );
const UglifyJsWebpackPlugin = require( 'uglifyjs-webpack-plugin' );

/**
 * Get a webpack config. We compile twice, once for browser clients and once for
 * CkEditor's cloud infrastructure; these correspond to values of the "mode"
 * argument, which should be the string "client" or the string "cloud".
 */
function getWebpackConfig(mode) {
	const entryPoint = (mode==="client") ? "ckeditor-client.js" : "ckeditor-cloud.js";
	return {
		devtool: 'source-map',
		performance: { hints: false },
	
		entry: path.resolve(__dirname, 'src', entryPoint),
	
		output: {
			// The name under which the editor will be exported.
			library: (mode==="cloud") ? 'CKEditorCS' : 'CKEditor',
	
			path: path.resolve( __dirname, 'build' ),
			filename: (mode==="cloud") ? 'ckeditor-cloud.js' : 'ckeditor.js',
			libraryTarget: 'umd',
			libraryExport: (mode==="cloud") ? 'default' : 'Editors'
		},

		resolve: {
			extensions: [ '.ts', '.js', '.json' ],
			extensionAlias: {
				'.js': [ '.js', '.ts' ]
			}
		},
		module: {
			rules: [
				{
					test: /\.ts/,
					use: [ 'ts-loader' ]
				},
				{
					test: /\.svg$/,
					use: [ 'raw-loader' ]
				},
				{
					test: /\.css$/,
					use: [
						{
							loader: 'style-loader',
							options: {
								injectType: 'styleTag'
							}
						},
						'css-loader',
					]
				}
			]
		}
	}
}

module.exports = { getWebpackConfig };
