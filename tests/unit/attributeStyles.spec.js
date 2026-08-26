import {
	DEFAULT_OTHER_COLOR,
	getAttributeLegend,
	getAttributeStyle,
	normalizeHexColor,
	normalizeLocalizedText,
	resolveColormapTitle,
	resolveLocalizedText
} from '@/utils/attributeStyles';

const colormap = {
	attribute: 'b3_pw_bron',
	title: { en: 'Point cloud source', nl: 'Puntwolkbron' },
	other: '#c4c8cf',
	values: [
		{ value: 'ahn3', color: '#0072B2', label: 'AHN3' },
		{ value: 'ahn4', color: '#E69F00', label: 'AHN4' },
		{ value: 'ahn5', color: '#009E73', label: 'AHN5' }
	]
};

describe( 'attribute colormap styles', () => {

	it( 'expands shorthand hex colors', () => {

		expect( normalizeHexColor( '#abc' ) ).toBe( '#aabbcc' );
		expect( normalizeHexColor( 'red' ) ).toBe( null );

	} );

	it( 'emits Cesium color conditions from a value map', () => {

		const { conditions } = getAttributeStyle( colormap ).color;

		expect( conditions.map( entry => entry[ 0 ] ) ).toEqual( [
			"${feature['b3_pw_bron']} === 'ahn3'",
			"${feature['b3_pw_bron']} === 'ahn4'",
			"${feature['b3_pw_bron']} === 'ahn5'",
			'true'
		] );
		expect( conditions[ 0 ][ 1 ] ).toBe( "color('#0072B2')" );
		expect( conditions[ 3 ][ 1 ] ).toBe( `color('${ DEFAULT_OTHER_COLOR }')` );

	} );

	it( 'returns an empty style when no colormap is configured', () => {

		expect( getAttributeStyle( null ) ).toEqual( {} );

	} );

	it( 'emits unquoted conditions for typed Boolean and INT32 values', () => {

		const { conditions } = getAttributeStyle( {
			attribute: 'add_underpass_success',
			values: [
				{ value: true, color: '#0072B2' },
				{ value: false, color: '#009E73' },
				{ value: 1, color: '#E69F00' },
				{ value: 0, color: '#CC79A7' }
			]
		} ).color;

		expect( conditions.map( entry => entry[ 0 ] ) ).toEqual( [
			"${feature['add_underpass_success']} === true",
			"${feature['add_underpass_success']} === false",
			"${feature['add_underpass_success']} === 1",
			"${feature['add_underpass_success']} === 0",
			'true'
		] );

	} );

	it( 'exposes a legend including the fallback color', () => {

		expect( getAttributeLegend( colormap ) ).toEqual( [
			{ value: 'ahn3', color: '#0072B2', label: 'AHN3' },
			{ value: 'ahn4', color: '#E69F00', label: 'AHN4' },
			{ value: 'ahn5', color: '#009E73', label: 'AHN5' },
			{ value: 'other', color: DEFAULT_OTHER_COLOR, label: 'other' }
		] );

	} );

	it( 'uses a configured label for the fallback legend entry', () => {

		expect( getAttributeLegend( { ...colormap, otherLabel: 'missing' } )[ 3 ] ).toEqual( {
			value: 'other',
			color: DEFAULT_OTHER_COLOR,
			label: 'missing'
		} );

	} );

	it( 'normalizes and resolves localized names and legend labels', () => {

		expect( normalizeLocalizedText( { en: ' Underpasses ', nl: ' Onderdoorgangen ' } ) ).toEqual( {
			en: 'Underpasses',
			nl: 'Onderdoorgangen'
		} );
		expect( resolveLocalizedText( { en: 'Underpasses', nl: 'Onderdoorgangen' }, 'nl' ) )
			.toBe( 'Onderdoorgangen' );
		expect( getAttributeLegend( {
			...colormap,
			otherLabel: { en: 'Missing', nl: 'Ontbreekt' }
		}, 'nl' )[ 3 ].label ).toBe( 'Ontbreekt' );

	} );

	it( 'resolves a localized colormap title', () => {

		expect( resolveColormapTitle( colormap, 'nl' ) ).toBe( 'Puntwolkbron' );
		expect( resolveColormapTitle( colormap, 'en' ) ).toBe( 'Point cloud source' );
		expect( resolveColormapTitle( { attribute: 'height', title: 'Height' }, 'nl' ) ).toBe( 'Height' );

	} );

} );
