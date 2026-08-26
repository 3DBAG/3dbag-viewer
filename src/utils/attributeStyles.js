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

export function normalizeLocalizedText( value ) {

	if ( typeof value === 'string' && value.trim() ) return value.trim();
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) return null;
	const localized = Object.keys( value ).reduce( ( result, locale ) => {

		if ( typeof value[ locale ] === 'string' && value[ locale ].trim() ) {

			result[ locale ] = value[ locale ].trim();

		}
		return result;

	}, {} );
	return Object.keys( localized ).length > 0 ? localized : null;

}

export function resolveLocalizedText( value, locale = 'en', fallback = '' ) {

	if ( typeof value === 'string' ) return value;
	if ( value && typeof value === 'object' ) return value[ locale ] || value.en || fallback;
	return fallback;

}

function escapeStyleValue( value ) {

	return String( value ).replace( /\\/g, '\\\\' ).replace( /'/g, "\\'" );

}

function formatStyleValue( value ) {

	if ( typeof value === 'string' ) return `'${ escapeStyleValue( value ) }'`;
	return String( value );

}

export function getAttributeStyle( colormap ) {

	if ( ! colormap || ! colormap.attribute || ! Array.isArray( colormap.values ) ) return {};

	const conditions = colormap.values.map( entry => {

		return [
			`\${feature['${ colormap.attribute }']} === ${ formatStyleValue( entry.value ) }`,
			`color('${ entry.color }')`
		];

	} );
	conditions.push( [ 'true', `color('${ colormap.other || DEFAULT_OTHER_COLOR }')` ] );

	return {
		color: { conditions }
	};

}

export function getAttributeLegend( colormap, locale = 'en' ) {

	if ( ! colormap || ! Array.isArray( colormap.values ) ) return [];

	return colormap.values.concat( {
		value: 'other',
		color: colormap.other || DEFAULT_OTHER_COLOR,
		label: colormap.otherLabel || 'other'
	} ).map( entry => ( {
		...entry,
		label: resolveLocalizedText( entry.label, locale, String( entry.value ) )
	} ) );

}

export function resolveColormapTitle( colormap, locale = 'en' ) {

	if ( ! colormap ) return '';
	return resolveLocalizedText( colormap.title, locale, colormap.attribute || '' );

}
