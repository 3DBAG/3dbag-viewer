import {
	getArchivedVersions,
	getAuxiliaryFiles,
	getDefaultLod,
	getGpkgDump,
	getLodOptions,
	getTileFormats,
	getTilesetSources,
	getWebServiceRows,
	isDefinedUrl,
	normalizeMenu
} from '@/utils/manifest';

describe( 'manifest configuration', () => {
	it( 'uses backwards-compatible menu defaults and accepts explicit flags', () => {

		expect( normalizeMenu() ).toEqual( {
			documentation: true,
			dashboard: false,
			feedback: true,
		} );
		expect( normalizeMenu( {
			menu: {
				documentation: false,
				dashboard: true,
				feedback: false,
			},
		} ) ).toEqual( {
			documentation: false,
			dashboard: true,
			feedback: false,
		} );

	} );

	it( 'supports a minimal experimental-only manifest', () => {

		const manifest = {
			menu: {
				documentation: false,
				dashboard: false,
				feedback: false,
			},
			latest: 'experiment',
			versions: {
				experiment: {
					Cesium3DTilesets: {
						lod22: 'https://example.test/experiment/tileset.json',
					},
				},
			},
		};
		const version = manifest.versions[ manifest.latest ];

		expect( normalizeMenu( manifest ) ).toEqual( {
			documentation: false,
			dashboard: false,
			feedback: false,
		} );
		expect( getDefaultLod( version ) ).toBe( 'lod22' );
		expect( getWebServiceRows( version ).map( row => row.key ) ).toEqual( [ '3dtiles-lod22' ] );
		expect( getTileFormats( version ) ).toEqual( [] );

	} );

	it( 'ignores invalid menu values instead of disabling features accidentally', () => {

		expect( normalizeMenu( {
			menu: {
				documentation: 'false',
				dashboard: null,
			},
		} ) ).toEqual( {
			documentation: true,
			dashboard: false,
			feedback: true,
		} );
		expect( normalizeMenu( { menu: null } ) ).toEqual( {
			documentation: true,
			dashboard: false,
			feedback: true,
		} );

	} );

	it( 'prefers Cesium tilesets and filters missing LoDs', () => {

		const version = {
			Cesium3DTilesets: {
				lod22: 'https://example.test/cesium/tileset.json',
				lod13: '',
			},
			'3DTilesets': {
				lod12: 'https://example.test/legacy/tileset.json',
			},
		};

		expect( getTilesetSources( version ) ).toEqual( {
			lod22: 'https://example.test/cesium/tileset.json',
		} );
		expect( getLodOptions( version ) ).toEqual( {
			lod22: { name: 'LoD 2.2', icon: 'home' },
		} );
		expect( getDefaultLod( version ) ).toBe( 'lod22' );

	} );

	it( 'falls back to legacy tilesets and selects the first available LoD', () => {

		const version = {
			'3DTilesets': {
				lod13: 'https://example.test/lod13/tileset.json',
				custom: 'https://example.test/custom/tileset.json',
			},
		};

		expect( getTilesetSources( version ) ).toEqual( version[ '3DTilesets' ] );
		expect( Object.keys( getLodOptions( version ) ) ).toEqual( [ 'lod13' ] );
		expect( getDefaultLod( version ) ).toBe( 'lod13' );

	} );

	it( 'derives only defined per-tile formats from a partial version', () => {

		const formats = getTileFormats( {
			CityJSON: 'https://example.test/{TID_X}.json',
			OBJ: '   ',
			IFC: null,
		} );

		expect( formats ).toEqual( [
			{ key: 'CityJSON', hashProperty: 'cj_sha256' },
		] );
		expect( isDefinedUrl( 'https://example.test/data' ) ).toBe( true );
		expect( isDefinedUrl( undefined ) ).toBe( false );

	} );

	it( 'handles a version without any supported sources', () => {

		expect( getTilesetSources( {} ) ).toEqual( {} );
		expect( getLodOptions( {} ) ).toEqual( {} );
		expect( getDefaultLod( {} ) ).toBeNull();
		expect( getTileFormats( {} ) ).toEqual( [] );
		expect( getWebServiceRows( {} ) ).toEqual( [] );
		expect( getAuxiliaryFiles( {} ) ).toEqual( [] );
		expect( getGpkgDump( {} ) ).toBeNull();

	} );

	it( 'derives only web services and auxiliary files that are defined', () => {

		const version = {
			WMS: 'https://example.test/wms?service=WMS',
			WFS: '',
			metadata: 'https://example.test/metadata.json',
			missing_buildings: 'https://example.test/missing.txt',
			GPKG_DUMP: {
				url: 'https://example.test/all.gpkg.zip',
			},
			Cesium3DTilesets: {
				lod22: 'https://example.test/tileset.json',
			},
		};

		expect( getWebServiceRows( version ).map( row => row.key ) ).toEqual( [ 'WMS', '3dtiles-lod22' ] );
		expect( getWebServiceRows( version )[ 0 ].href ).toBe( 'https://example.test/wms?service=WMS&request=getcapabilities' );
		expect( getAuxiliaryFiles( version ).map( file => file.key ) ).toEqual( [ 'metadata', 'missing_buildings' ] );
		expect( getGpkgDump( version ) ).toEqual( version.GPKG_DUMP );

	} );

	it( 'normalizes partial archived records without dereferencing missing fields', () => {

		expect( getArchivedVersions( {
			withMetadata: {
				metadata: 'https://example.test/metadata.json',
			},
			withTileIndex: {
				TILE_INDEX: 'https://example.test/index.fgb',
			},
			empty: {},
			invalid: null,
		} ) ).toEqual( [
			{
				version: 'withMetadata',
				metadata: 'https://example.test/metadata.json',
				gpkgDump: null,
				tileIndex: null,
			},
			{
				version: 'withTileIndex',
				metadata: null,
				gpkgDump: null,
				tileIndex: 'https://example.test/index.fgb',
			},
		] );

	} );
} );
