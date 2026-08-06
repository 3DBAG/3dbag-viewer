const env = typeof process !== 'undefined' && process.env ? process.env : {};

function withoutTrailingSlash( value ) {

	return value.replace( /\/+$/, '' );

}

function envUrl( name, fallback ) {

	return withoutTrailingSlash( env[ name ] || fallback );

}

export const appConfig = {
	webUrl: envUrl( 'VUE_APP_WEB_URL', 'https://3dbag.nl' ),
	docsUrl: envUrl( 'VUE_APP_DOCS_URL', 'https://docs.3dbag.nl' ),
	apiUrl: envUrl( 'VUE_APP_API_URL', 'https://api.3dbag.nl' ),
	dataUrl: envUrl( 'VUE_APP_DATA_URL', 'https://data.3dbag.nl' ),
	terrainUrl: envUrl( 'VUE_APP_TERRAIN_URL', 'https://roofer-online.nl/pdok-qm-ahn6' ),
	dashboardUrl: envUrl( 'VUE_APP_DASHBOARD_URL', 'https://dashboard.3dbag.nl' ),
	feedbackUrlEn: env[ 'VUE_APP_FEEDBACK_URL_EN' ] || 'https://forms.gle/NZg83heXM75pAmfVA',
	feedbackUrlNl: env[ 'VUE_APP_FEEDBACK_URL_NL' ] || 'https://forms.gle/N1FPRp3RG45EaBjUA',
	geoinfoUrl: env[ 'VUE_APP_GEOINFO_URL' ] || 'https://3d.bk.tudelft.nl',
	threeDgiUrl: env[ 'VUE_APP_3DGI_URL' ] || 'https://3dgi.xyz',
	pdokUrl: env[ 'VUE_APP_PDOK_URL' ] || 'https://www.pdok.nl',
	top10nlUrl: env[ 'VUE_APP_PDOK_TOP10NL_URL' ] || 'https://geodata.nationaalgeoregister.nl/top10nlv2/ows?',
	luchtfoto2018Url: env[ 'VUE_APP_PDOK_LUCHTFOTO_2018_URL' ] || 'https://geodata.nationaalgeoregister.nl/luchtfoto/rgb/wmts?',
	brtUrl: env[ 'VUE_APP_PDOK_BRT_URL' ] || 'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0?',
	luchtfotoUrl: env[ 'VUE_APP_PDOK_LUCHTFOTO_URL' ] || 'https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0?',
	nominatimUrl: env[ 'VUE_APP_NOMINATIM_URL' ] || 'https://nominatim.openstreetmap.org/search',
	creativecommonsUrl: env[ 'VUE_APP_CREATIVE_COMMONS_URL' ] || 'http://creativecommons.org/licenses/by/4.0/?ref=chooser-v1',
	creativeCommonsIconUrl: env[ 'VUE_APP_CREATIVE_COMMONS_ICON_URL' ] || 'https://mirrors.creativecommons.org/presskit/icons',
};

export function resolveConfiguredUrl( value, config = appConfig ) {

	if ( typeof value !== 'string' ) return value;
	const productionOrigins = [
		[ 'https://data.3dbag.nl', config.dataUrl ],
		[ 'https://api.3dbag.nl', config.apiUrl ],
		[ 'https://docs.3dbag.nl', config.docsUrl ],
		[ 'https://3dbag.nl', config.webUrl ],
	];

	return productionOrigins.reduce( ( resolved, [ origin, configuredOrigin ] ) => {

		return resolved.split( origin ).join( configuredOrigin );

	}, value );

}

export function resolveVersionManifest( manifest, config = appConfig ) {

	if ( Array.isArray( manifest ) ) return manifest.map( value => resolveVersionManifest( value, config ) );
	if ( manifest && typeof manifest === 'object' ) {

		return Object.keys( manifest ).reduce( ( resolved, key ) => {

			resolved[ key ] = resolveVersionManifest( manifest[ key ], config );
			return resolved;

		}, {} );

	}

	return resolveConfiguredUrl( manifest, config );

}
