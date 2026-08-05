import { resolveConfiguredUrl, resolveVersionManifest } from '@/config';

describe( 'viewer URL configuration', () => {
	it( 'rewrites application service origins', () => {
		const config = {
			dataUrl: 'http://data.example.test:9080',
			apiUrl: 'http://api.example.test:9080',
			docsUrl: 'http://docs.example.test:9080',
			webUrl: 'http://web.example.test:9080',
		};

		expect( resolveConfiguredUrl( 'https://data.3dbag.nl/v20250903/metadata.json', config ) )
			.toBe( 'http://data.example.test:9080/v20250903/metadata.json' );
	} );

	it( 'preserves release paths and tile placeholders while resolving origins', () => {
		const manifest = {
			metadata: 'https://data.3dbag.nl/v20250903/metadata.json',
			CityJSON: 'https://data.3dbag.nl/v20250903/tiles/{TID_X}/{TID_Y}/{TID_Z}/tile.city.json',
			OGCAPI: 'https://api.3dbag.nl/',
		};
		const resolved = resolveVersionManifest( manifest, {
			dataUrl: 'http://data.example.test:9080',
			apiUrl: 'http://api.example.test:9080',
			docsUrl: 'http://docs.example.test:9080',
			webUrl: 'http://web.example.test:9080',
		} );

		expect( resolved.metadata ).toBe( 'http://data.example.test:9080/v20250903/metadata.json' );
		expect( resolved.CityJSON ).toContain( '{TID_X}/{TID_Y}/{TID_Z}' );
		expect( resolved.OGCAPI ).toBe( 'http://api.example.test:9080/' );
	} );

	it( 'recursively resolves nested arrays and objects', () => {
		const manifest = {
			versions: [
				{ WFS: 'https://data.3dbag.nl/api/BAG3D/wfs' },
			],
		};

		expect( resolveVersionManifest( manifest ) ).toEqual( manifest );
	} );
} );
