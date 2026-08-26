jest.mock( '@bertt/3dtilesrenderer-styling-plugin', () => ( {
	CesiumStylingPlugin: class {

		_substituteProperties( expression, props ) {

			const substitute = ( token, property ) => {

				const value = props && props[ property ];
				return value === null || value === undefined ? '0' : String( value );

			};
			return expression
				.replace( /\$\{feature\['([^']+)'\]\}/g, substitute )
				.replace( /\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g, substitute );

		}

	}
} ) );

import {
	getFeatureInfoForAttribute,
	SemanticStylingPlugin
} from '@/utils/SemanticStylingPlugin';

describe( 'semantic styling adapter', () => {

	it( 'keeps INT32 zero distinct from missing metadata', () => {

		const plugin = new SemanticStylingPlugin();
		const condition = "${feature['add_underpass_success']} === 0";

		expect( plugin._substituteProperties( condition, { add_underpass_success: 0 } ) )
			.toBe( '0 === 0' );
		expect( plugin._substituteProperties( condition, { add_underpass_success: null } ) )
			.toBe( 'null === 0' );
		expect( plugin._substituteProperties( condition, {} ) )
			.toBe( 'null === 0' );

	} );

	it( 'selects only the feature table that declares the styled attribute', () => {

		const surfaceFeature = { attribute: 0, propertyTable: 0 };
		const cityFeature = { attribute: 1, propertyTable: 1 };
		const meshFeatures = { getFeatureInfo: () => [ surfaceFeature, cityFeature ] };
		const structuralMetadata = {
			schema: {
				classes: {
					surface: { properties: { type: {} } },
					citymodel: { properties: { add_underpass_success: {} } }
				}
			},
			getPropertyTableInfo: index => ( {
				className: index === 0 ? 'surface' : 'citymodel'
			} )
		};

		expect( getFeatureInfoForAttribute(
			meshFeatures,
			structuralMetadata,
			'add_underpass_success'
		) ).toBe( cityFeature );
		expect( getFeatureInfoForAttribute(
			meshFeatures,
			structuralMetadata,
			'unknown'
		) ).toBeNull();

	} );

} );
