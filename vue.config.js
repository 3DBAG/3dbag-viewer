module.exports = {
	publicPath: '/',
	css: {
		loaderOptions: {
			scss: {
				api: 'modern',
				sassOptions: loaderContext => {

					const options = { quietDeps: true };
					// Bulma 0.9 and Buefy 0.9 still use Sass's legacy import
					// system. Limit this exception to the compatibility entrypoint
					// so new application styles still report import deprecations.
					if ( /[\\/]src[\\/]styles[\\/]bulma\.scss$/.test( loaderContext.resourcePath ) ) {

						options.silenceDeprecations = [ 'import' ];

					}
					return options;

				}
			}
		}
	},
	configureWebpack: {
		devtool: 'source-map'
	},
	runtimeCompiler: true
};
