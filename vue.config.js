const path = require( 'path' );

const manifestPath = path.resolve( __dirname, process.env.MANIFEST_PATH || 'src/assets/manifest.json' );

module.exports = {
	publicPath: '/',
	transpileDependencies: [
		'@bertt/3dtilesrenderer-styling-plugin'
	],
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
		devtool: 'source-map',
		resolve: {
			// Resolve peer dependencies from this app for the linked 3dtoml package.
			symlinks: false,
			alias: {
				'@manifest': manifestPath
			}
		}
	},
	runtimeCompiler: true
};
