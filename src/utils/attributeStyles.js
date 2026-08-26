const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const DEFAULT_OTHER_COLOR = '#c4c8cf';

export function normalizeHexColor( value ) {

	if ( typeof value !== 'string' ) return null;
	const hex = value.trim();
	if ( ! HEX_COLOR.test( hex ) ) return null;
	if ( hex.length === 4 ) {

		return `#${ hex[ 1 ] }${ hex[ 1 ] }${ hex[ 2 ] }${ hex[ 2 ] }${ hex[ 3 ] }${ hex[ 3 ] }`;

	}
	return hex;

}

function escapeStyleValue( value ) {

	return String( value ).replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" );

}

export function getAttributeStyle( colormap ) {

	if ( ! colormap || ! colormap.attribute || ! Array.isArray( colormap.values ) ) return {};

	const conditions = colormap.values.map( entry => {

		return [
			`\${feature['${ colormap.attribute }']} === '${ escapeStyleValue( entry.value ) }'`,
			`color('${ entry.color }')`
		];

	} );
	conditions.push( [ 'true', `color('${ colormap.other || DEFAULT_OTHER_COLOR }')` ] );

	return {
		color: { conditions }
	};

}

export function getAttributeLegend( colormap ) {

	if ( ! colormap || ! Array.isArray( colormap.values ) ) return [];

	return colormap.values.concat( {
		value: 'other',
		color: colormap.other || DEFAULT_OTHER_COLOR,
		label: 'other'
	} );

}

export function resolveColormapTitle( colormap, locale = 'en' ) {

	if ( ! colormap ) return '';
	if ( typeof colormap.title === 'string' ) return colormap.title;
	if ( colormap.title && typeof colormap.title === 'object' ) {

		return colormap.title[ locale ] || colormap.title.en || colormap.attribute;

	}
	return colormap.attribute || '';

}
