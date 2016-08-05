var ExtractTextPlugin = require('extract-text-webpack-plugin');
var autoprefixer = require('autoprefixer');

module.exports = {
	entry: "./js/app.js",

	resolve: {
		modulesDirectories: [
			"./node_modules/"
		]
	},

	output: {
		filename: "dist/script.js"
	},

	module: {
		loaders: [
			{
				test: /\.js$/,
				loader: "babel-loader",
				query: {
					presets: ['es2015'],
					compact: false
				}
			},
			{
				test: /\.css$/,
				loader: ExtractTextPlugin.extract('style-loader', 'css')
			},
			{
				test: /\.less$/,
				loader: ExtractTextPlugin.extract('style-loader', 'css!postcss!less')
			},
			{ 
				test: /\.(eot|woff|woff2|ttf|svg|png|jpe?g|gif)(\?\S*)?$/,
				loader: 'url?limit=100000&name=dist/fonts/[name].[ext]'
			}
		]
	},
	postcss: function () {
		return [autoprefixer];
	},
	plugins: [
		new ExtractTextPlugin('dist/style.css')
	]
};